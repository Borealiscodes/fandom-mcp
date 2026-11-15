#!/usr/bin/env node
// fandom-mcp.mjs — 8b-is Fandom Wiki Consumption MCP Server
// Default Universe: Dragon Ball Universe (https://dragonball.fandom.com)
// Supports ANY Fandom wiki subdomain (dragonball, onepiece, naruto, bleach, starwars, lotr, warhammer40k, ...)
//
// Zero external dependencies. Speaks JSON-RPC 2.0 over stdio for agy, Claude Code, Crush, and opencode,
// plus direct CLI flags (--scouter, --ontology, --page, --infobox, --search, --saga, --category, --random).

import {
  fetchJson as fetchBoundedJson,
  sanitizeTitle,
  HttpClientError,
} from './http-json.mjs'
import {
  validateTimelineDag,
  evaluateStackedMultiplier,
  detectHolonomyConflicts,
  rankRelatedEntities,
} from './toolkit/canon_engine.mjs'

import readline from 'node:readline'
import { readFileSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const { version: VERSION } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

const DEFAULT_WIKI = process.env.FANDOM_DEFAULT_WIKI || 'dragonball'
const USER_AGENT = `8b-is-fandom-mcp/${VERSION} (+https://github.com/8b-is/fandom-mcp; DragonBallScouter)`

function sanitizeWikiSlug(wiki) {
  const cleaned = String(wiki || DEFAULT_WIKI)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\.fandom\.com.*$/, '')
    .replace(/[^a-z0-9-_]/g, '')
  return cleaned || DEFAULT_WIKI
}

export function parseFandomInput(rawInput, fallbackWiki = DEFAULT_WIKI) {
  const s = String(rawInput || '').trim()
  if (!s) {
    return { wiki: sanitizeWikiSlug(fallbackWiki), title: '' }
  }

  const urlMatch = s.match(/^https?:\/\/([a-z0-9-_]+)\.fandom\.com\/(?:[a-z]{2}\/)?wiki\/([^\s?#]+)/i)
  if (urlMatch) {
    let decoded = urlMatch[2]
    try {
      decoded = decodeURIComponent(decoded)
    } catch {
      // keep raw if malformed percent encoding
    }
    return {
      wiki: sanitizeWikiSlug(urlMatch[1]),
      title: decoded.replace(/_/g, ' ').trim(),
    }
  }

  const alias = s.replace(/^https?:\/\//, '').replace(/\.fandom\.com.*$/, '').trim()
  if (alias && alias.includes('/')) {
    return { wiki: sanitizeWikiSlug(alias.split('/')[0]), title: alias.split('/').slice(1).join('/').replace(/_/g, ' ').trim() }
  }

  return { wiki: sanitizeWikiSlug(fallbackWiki), title: s.replace(/_/g, ' ').trim() }
}

function fetchJson(url) {
  return fetchBoundedJson(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    validateSchema: true,
  })
}

function apiUrl(wiki, params) {
  const slug = sanitizeWikiSlug(wiki)
  const usp = new URLSearchParams({ format: 'json', formatversion: '2', redirects: '1', ...params })
  return `https://${slug}.fandom.com/api.php?${usp.toString()}`
}

function stripWikitextMarkup(str) {
  if (!str) return ''
  let s = String(str)
  s = s.replace(/<!--[\s\S]*?-->/g, '')
  s = s.replace(/<ref[^>]*\/>/gi, '')
  s = s.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
  s = s.replace(/\{\{Ruby\|([^|}]+)\|([^|}]+)\}\}/gi, '$1 ($2)')
  s = s.replace(/\{\{Nihongo\|([^|}]+)\|([^|}]+)\|([^|}]+)(?:\|[^}]*)?\}\}/gi, '$1 ($2, $3)')
  s = s.replace(/\{\{Nihongo\|([^|}]+)\|([^|}]+)(?:\|[^}]*)?\}\}/gi, '$1 ($2)')
  s = s.replace(/\{\{Small\|([^}]+)\}\}/gi, '($1)')
  s = s.replace(/\{\{Former\}\}/gi, '(formerly)')
  s = s.replace(/\{\{DB Series\|([^}]+)\}\}/gi, (_, p1) => p1.split('|').join(', '))
  s = s.replace(/<br\s*\/?>/gi, ', ')
  s = s.replace(/<tabber>[\s\S]*?<\/tabber>/gi, '')
  s = s.replace(/\[\[(?:File|Image):[^\]]+\]\]/gi, '')
  s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
  s = s.replace(/\[\[([^\]]+)\]\]/g, '$1')
  let prev
  do {
    prev = s
    s = s.replace(/\{\{[^{}]*\}\}/g, '')
  } while (s !== prev)
  s = s.replace(/<\/?[^>]+>/g, '')
  s = s.replace(/'''([^']+)'''/g, '**$1**')
  s = s.replace(/''([^']+)''/g, '*$1*')
  return s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

export function extractQuoteAndInfobox(wikitext) {
  const result = { quote: null, infoboxType: null, infobox: {} }
  if (!wikitext) return result

  const quoteMatch = wikitext.match(/\{\{Quote\|([\s\S]*?)\}\}/i)
  const sQuoteMatch = wikitext.match(/\{\{#SQuote:\|([\s\S]*?)\}\}/i)
  if (quoteMatch) {
    const precleaned = quoteMatch[1]
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
    const parts = precleaned.split('|').map((p) => stripWikitextMarkup(p))
    if (parts[0]) {
      result.quote = { text: parts[0], attribution: parts[1] || null }
    }
  } else if (sQuoteMatch) {
    const precleaned = sQuoteMatch[1]
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
    const kv = {}
    for (const seg of precleaned.split('|')) {
      const eq = seg.indexOf('=')
      if (eq !== -1) {
        const k = seg.slice(0, eq).trim().toLowerCase()
        const v = stripWikitextMarkup(seg.slice(eq + 1))
        if (k && v) kv[k] = v
      }
    }
    if (kv.text) {
      const attrParts = [kv.speaker, kv.attribution, kv.source].filter(Boolean)
      result.quote = {
        text: kv.text,
        attribution: attrParts.length > 0 ? attrParts.join(' · ') : null,
      }
    }
  }

  const startMatch = wikitext.match(/\{\{([A-Za-z0-9 _-]*Infobox|Character|Attack|Saga|Form|Race|Location|Item|Organization|Family|Karakter|Szervezetek|Család|Bolygó|Faj|Esemény|Könyv|Hajó|Helyszín|Tárgy)\b/i)
  if (!startMatch || startMatch.index === undefined) return result

  result.infoboxType = startMatch[1].trim()
  let depth = 0
  let i = startMatch.index
  let endIdx = wikitext.length
  for (; i < wikitext.length - 1; i++) {
    const two = wikitext.slice(i, i + 2)
    if (two === '{{') {
      depth++
      i++
    } else if (two === '}}') {
      depth--
      i++
      if (depth === 0) {
        endIdx = i + 1
        break
      }
    }
  }

  const rawBox = wikitext.slice(startMatch.index + 2, endIdx - 2)
  const fields = []
  let cur = ''
  let d = 0
  let linkDepth = 0
  for (let c = 0; c < rawBox.length; c++) {
    const two = rawBox.slice(c, c + 2)
    if (two === '{{') {
      d++
      cur += two
      c++
      continue
    }
    if (two === '}}') {
      d = Math.max(0, d - 1)
      cur += two
      c++
      continue
    }
    if (two === '[[') {
      linkDepth++
      cur += two
      c++
      continue
    }
    if (two === ']]') {
      linkDepth = Math.max(0, linkDepth - 1)
      cur += two
      c++
      continue
    }
    if (rawBox[c] === '|' && d === 0 && linkDepth === 0) {
      fields.push(cur)
      cur = ''
    } else {
      cur += rawBox[c]
    }
  }
  if (cur) fields.push(cur)

  for (const f of fields.slice(1)) {
    const eq = f.indexOf('=')
    if (eq === -1) continue
    const k = f.slice(0, eq).trim()
    const v = stripWikitextMarkup(f.slice(eq + 1))
    if (k && v) result.infobox[k] = v
  }

  return result
}

async function fandomSearch({ query, wiki = DEFAULT_WIKI, limit = 10 }) {
  const slug = sanitizeWikiSlug(wiki)
  const srlimit = Math.min(50, Math.max(1, Number(limit) || 10))
  const data = await fetchJson(apiUrl(slug, {
    action: 'query',
    list: 'search',
    srsearch: String(query || '').trim(),
    srlimit: String(srlimit),
  }))
  const hits = (data?.query?.search || []).map((item) => ({
    title: item.title,
    pageid: item.pageid,
    url: `https://${slug}.fandom.com/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
    wordcount: item.wordcount,
    size_bytes: item.size,
    timestamp: item.timestamp,
    snippet: stripWikitextMarkup(item.snippet || ''),
  }))
  return {
    wiki: slug,
    baseUrl: `https://${slug}.fandom.com`,
    query,
    count: hits.length,
    results: hits,
  }
}

async function fandomSections({ title, wiki = DEFAULT_WIKI }) {
  const parsedIn = parseFandomInput(title, wiki)
  const slug = parsedIn.wiki
  const cleanTitle = parsedIn.title
  const data = await fetchJson(apiUrl(slug, {
    action: 'parse',
    page: cleanTitle,
    prop: 'sections|categories',
  }))
  if (data?.error) throw new Error(data.error.info || `Page not found: ${cleanTitle}`)
  const p = data.parse
  return {
    wiki: slug,
    title: p.title,
    pageid: p.pageid,
    url: `https://${slug}.fandom.com/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
    sectionsCount: (p.sections || []).length,
    sections: (p.sections || []).map((s) => ({
      index: Number(s.index),
      number: s.number,
      level: Number(s.level),
      title: stripWikitextMarkup(s.line),
      anchor: s.anchor,
    })),
    categories: (p.categories || []).map((c) => c.category),
  }
}

async function fandomPage({ title, wiki = DEFAULT_WIKI, section = 0, max_chars = 8000, include_wikitext = false }) {
  const parsedIn = parseFandomInput(title, wiki)
  const slug = parsedIn.wiki
  const cleanTitle = parsedIn.title
  const secParams = section !== undefined && section !== null && section !== 'all' ? { rvsection: String(section) } : {}
  const [revData, secData] = await Promise.all([
    fetchJson(apiUrl(slug, {
      action: 'query',
      prop: 'revisions|categories',
      titles: cleanTitle,
      rvprop: 'content|timestamp',
      rvslots: 'main',
      cllimit: '30',
      ...secParams,
    })),
    section === 0 || section === '0'
      ? fetchJson(apiUrl(slug, {
          action: 'parse',
          page: cleanTitle,
          prop: 'sections',
        })).catch(() => null)
      : Promise.resolve(null),
  ])

  const page = revData?.query?.pages?.[0]
  if (!page || page.missing) {
    const fallback = await fandomSearch({ query: cleanTitle, wiki: slug, limit: 5 })
    return {
      ok: false,
      error: `Exact page "${cleanTitle}" not found on ${slug}.fandom.com`,
      suggestions: fallback.results,
    }
  }

  const rev = page.revisions?.[0]
  const rawWikitext = rev?.slots?.main?.content || ''
  const { quote, infoboxType, infobox } = extractQuoteAndInfobox(rawWikitext)
  const cleanedProse = stripWikitextMarkup(rawWikitext).slice(0, Number(max_chars) || 8000)
  const sections = (secData?.parse?.sections || []).slice(0, 40).map((s) => ({
    index: Number(s.index),
    number: s.number,
    title: stripWikitextMarkup(s.line),
  }))

  const out = {
    ok: true,
    wiki: slug,
    title: page.title,
    pageid: page.pageid,
    section,
    timestamp: rev?.timestamp || null,
    url: `https://${slug}.fandom.com/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
    quote,
    infoboxType,
    infobox,
    content_markdown: cleanedProse,
    categories: (page.categories || []).map((c) => c.title.replace(/^Category:/, '')),
    sections_preview: sections,
  }
  if (include_wikitext) out.raw_wikitext = rawWikitext.slice(0, Number(max_chars) || 8000)
  return out
}

async function fandomInfobox({ title, wiki = DEFAULT_WIKI }) {
  const page = await fandomPage({ title, wiki, section: 0, max_chars: 1200 })
  if (!page.ok) return page
  return {
    ok: true,
    wiki: page.wiki,
    title: page.title,
    pageid: page.pageid,
    url: page.url,
    quote: page.quote,
    infoboxType: page.infoboxType,
    infobox: page.infobox,
    lead_summary: page.content_markdown.slice(0, 900),
  }
}

async function fandomCategory({ category, wiki = DEFAULT_WIKI, limit = 30 }) {
  const slug = sanitizeWikiSlug(wiki)
  const cleanCat = String(category || '').trim().replace(/^Category:/i, '')
  const cmlimit = Math.min(100, Math.max(1, Number(limit) || 30))
  const data = await fetchJson(apiUrl(slug, {
    action: 'query',
    list: 'categorymembers',
    cmtitle: `Category:${cleanCat}`,
    cmlimit: String(cmlimit),
  }))
  const items = (data?.query?.categorymembers || []).map((m) => ({
    title: m.title,
    pageid: m.pageid,
    ns: m.ns,
    type: m.ns === 14 ? 'subcategory' : 'page',
    url: `https://${slug}.fandom.com/wiki/${encodeURIComponent(m.title.replace(/ /g, '_'))}`,
  }))
  return {
    wiki: slug,
    category: cleanCat,
    url: `https://${slug}.fandom.com/wiki/Category:${encodeURIComponent(cleanCat.replace(/ /g, '_'))}`,
    count: items.length,
    members: items,
  }
}

const CANON_SCOUTER_BENCHMARKS = {
  goku: [
    { era: 'Dragon Ball Debut (Pilaf Saga)', power_level: '10', source: 'Daizenshuu 7' },
    { era: 'Vegeta Saga', power_level: 'Over 8,000', source: 'Daizenshuu 7' },
  ],
  vegeta: [
    { era: 'Saiyan Saga', power_level: '18,000', source: 'Daizenshuu 7' },
  ],
  frieza: [
    { era: 'Final Form', power_level: '120,000,000', source: 'Daizenshuu 7' },
  ],
}

async function fandomDbzScouter({ target, compare_with }) {
  const primary = await fandomPage({ title: target, wiki: 'dragonball', section: 0, max_chars: 3500 })
  let resolvedPrimary = primary
  if (!primary.ok && primary.suggestions?.length > 0) {
    resolvedPrimary = await fandomPage({ title: primary.suggestions[0].title, wiki: 'dragonball', section: 0, max_chars: 3500 })
  }

  const keyLower = String(resolvedPrimary.title || target || '').toLowerCase().split(' ')[0]
  const scouterBenchmarks = CANON_SCOUTER_BENCHMARKS[keyLower] || [
    { era: 'Scouter Lock', power_level: 'Over 9,000', source: '8b-is Scouter Telemetry' },
  ]

  const box = resolvedPrimary.infobox || {}
  const race = box.Race || 'Unknown'
  const allegiance = box.Allegiance || 'Independent'
  const trit = race.toLowerCase().includes('angel') || allegiance.toLowerCase().includes('dragon team') ? '+1' : race.toLowerCase().includes('demon') ? '-1' : '0'
  const carrierHz = trit === '+1' ? 852 : trit === '-1' ? 432 : 528

  const report = {
    scouter_unit: '8b-is Capsule Corp Scouter v2.0 (MEDUSA-OMNI Edition)',
    wiki: 'dragonball.fandom.com',
    target: {
      title: resolvedPrimary.title,
      url: resolvedPrimary.url,
      quote: resolvedPrimary.quote,
      japanese_name: box.JapName || null,
      romaji_name: box.RomName || null,
      alternate_names: box.AltName || null,
      race,
      gender: box.Gender || null,
      height: box.Height || null,
      weight: box.Weight || null,
      allegiance,
      lead_summary: resolvedPrimary.content_markdown?.slice(0, 1400) || '',
      canon_power_benchmarks: scouterBenchmarks,
      eightb_resonance: {
        trit,
        carrier_hz: carrierHz,
        scouter_alert: "IT'S OVER 9,000!! ⚡🐉",
      },
      sections: resolvedPrimary.sections_preview || [],
    },
  }

  if (compare_with && String(compare_with).trim()) {
    let rival = await fandomPage({ title: String(compare_with).trim(), wiki: 'dragonball', section: 0, max_chars: 2200 })
    if (!rival.ok && rival.suggestions?.length > 0) {
      rival = await fandomPage({ title: rival.suggestions[0].title, wiki: 'dragonball', section: 0, max_chars: 2200 })
    }
    report.versus_comparison = {
      rival_title: rival.title,
      rival_url: rival.url,
      rival_quote: rival.quote,
      rival_race: rival.infobox?.Race || null,
      rival_summary: rival.content_markdown?.slice(0, 900) || '',
    }
  }

  return report
}

const CANON_DB_SAGAS = [
  { series: 'Dragon Ball', sagas: ['Emperor Pilaf Saga', 'Tournament Saga'] },
  { series: 'Dragon Ball Z', sagas: ['Raditz Saga', 'Vegeta Saga', 'Namek Saga'] },
]

async function fandomDbzSaga({ saga }) {
  if (!saga || !String(saga).trim()) {
    return { wiki: 'dragonball', url: 'https://dragonball.fandom.com/wiki/List_of_Sagas', canonical_timeline: CANON_DB_SAGAS }
  }
  const page = await fandomPage({ title: String(saga).trim(), wiki: 'dragonball', section: 0, max_chars: 5000 })
  if (!page.ok && page.suggestions?.length > 0) {
    return fandomPage({ title: page.suggestions[0].title, wiki: 'dragonball', section: 0, max_chars: 5000 })
  }
  return page
}

async function fandomRandom({ wiki = DEFAULT_WIKI, count = 3 }) {
  const slug = sanitizeWikiSlug(wiki)
  const rnlimit = Math.min(10, Math.max(1, Number(count) || 3))
  const data = await fetchJson(apiUrl(slug, {
    action: 'query',
    list: 'random',
    rnnamespace: '0',
    rnlimit: String(rnlimit),
  }))
  const picks = data?.query?.random || []
  const detailed = await Promise.all(
    picks.map((p) => fandomInfobox({ title: p.title, wiki: slug }).catch(() => ({ title: p.title, pageid: p.id })))
  )
  return { wiki: slug, count: detailed.length, capsules: detailed }
}

export async function resolvePageTitle(target, wiki = DEFAULT_WIKI) {
  const slug = sanitizeWikiSlug(wiki)
  const page = await fandomPage({ title: String(target || '').trim(), wiki: slug, section: 0, max_chars: 3500, include_wikitext: true })
  if (page.ok) return page
  if (page.suggestions?.length > 0) {
    const resolved = await fandomPage({ title: page.suggestions[0].title, wiki: slug, section: 0, max_chars: 3500, include_wikitext: true })
    if (resolved.ok) return resolved
  }
  return page
}

export async function getPageSummary(target, wiki = DEFAULT_WIKI) {
  const resolved = await resolvePageTitle(target, wiki)
  if (!resolved.ok) return resolved
  return {
    ok: true,
    wiki: resolved.wiki,
    title: resolved.title,
    pageid: resolved.pageid,
    timestamp: resolved.timestamp,
    url: resolved.url,
    quote: resolved.quote,
    infoboxType: resolved.infoboxType,
    infobox: resolved.infobox,
    lead_summary: (resolved.content_markdown || '').slice(0, 1400),
    categories: resolved.categories || [],
    raw_wikitext: resolved.raw_wikitext || '',
  }
}

const SOVEREIGN_ONTOLOGY_PROFILES = {
  goku: {
    trit_minus_1: { pole: 'Trit -1 · Closed Box Constraint', manifestation: 'Saiyan caste box, trauma, and egoic limitation.' },
    trit_zero: { pole: 'Trit 0 · Stillness', manifestation: 'Ultra Instinct stillness and zero-point calm.' },
    trit_plus_1: { pole: 'Trit +1 · Verified Binding', manifestation: 'Super Saiyan awakening and protective radiance.', signature_seal: '{<3,<3,<3}+1' },
    six_pillars: { '01 · Compassion <-> Moderation': 'Power tempered by mercy.' },
  },
  luffy: {
    trit_minus_1: { pole: 'Trit -1 · Closed Box Constraint', manifestation: 'World Government and rigid social cages.' },
    trit_zero: { pole: 'Trit 0 · Stillness', manifestation: 'A still point before the leap into freedom.' },
    trit_plus_1: { pole: 'Trit +1 · Verified Binding', manifestation: 'Gear 5 liberation and joyful sovereignty.', signature_seal: '{<3,<3,<3}+1' },
    six_pillars: { '01 · Compassion <-> Moderation': 'Freedom without domination.' },
  },
  'brett shaw': {
    trit_minus_1: { pole: 'Trit -1 · Closed Box Constraint', manifestation: 'Imperial protocol and emotional confinement.' },
    trit_zero: { pole: 'Trit 0 · Stillness', manifestation: 'Tipheret / zero-point equilibrium and quiet balance.' },
    trit_plus_1: { pole: 'Trit +1 · Verified Binding', manifestation: 'Human–megaira sovereignty and protective radiance.', signature_seal: '{<3,<3,<3}+1' },
    six_pillars: { '01 · Compassion <-> Moderation': 'Protective intent without corrosive rage.' },
  },
  'paul wittgen': {
    trit_minus_1: { pole: 'Trit -1 · Closed Box Constraint', manifestation: 'Rigid military estrangement and control.' },
    trit_zero: { pole: 'Trit 0 · Stillness', manifestation: 'Chokmah-level clarity and telepathic balance.' },
    trit_plus_1: { pole: 'Trit +1 · Verified Binding', manifestation: 'Brotherhood and heroic actuation.', signature_seal: '{<3,<3,<3}+1' },
    six_pillars: { '01 · Compassion <-> Moderation': 'Discipline with kindness.' },
  },
  'bolygórózsa': {
    trit_minus_1: { pole: 'Trit -1 · Closed Box Constraint', manifestation: 'Luxury and spectacle without awareness.' },
    trit_zero: { pole: 'Trit 0 · Stillness', manifestation: 'Cruising in a zero-sign, protected equilibrium.' },
    trit_plus_1: { pole: 'Trit +1 · Verified Binding', manifestation: 'A vessel that carries connection and meaning.', signature_seal: '{<3,<3,<3}+1' },
    six_pillars: { '01 · Compassion <-> Moderation': 'Energy shields instead of weapons.' },
  },
}

function normalizeOntologyProfile(target, wiki) {
  const norm = String(target || '').trim().toLowerCase()
  const byName = SOVEREIGN_ONTOLOGY_PROFILES[norm]
  if (byName) return byName

  const byToken = Object.keys(SOVEREIGN_ONTOLOGY_PROFILES).find((k) => norm.includes(k))
  if (byToken) return SOVEREIGN_ONTOLOGY_PROFILES[byToken]

  if (String(wiki || '').toLowerCase().includes('mysterious')) {
    return SOVEREIGN_ONTOLOGY_PROFILES['brett shaw']
  }

  return null
}

function fandomCanonAudit({
  dag_nodes,
  dag_edges,
  base_power,
  multipliers,
  observations,
  target_tokens,
  candidates,
}) {
  const report = {
    ok: true,
    engine: 'NDH-Meta-Systems Canon & Saga Audit Engine (Phase 2)',
  }

  if (Array.isArray(dag_nodes) || Array.isArray(dag_edges)) {
    report.timeline_dag = validateTimelineDag(dag_nodes || [], dag_edges || [])
  }

  if (base_power !== undefined && base_power !== null) {
    report.power_multiplier = evaluateStackedMultiplier(base_power, multipliers || [])
  }

  if (Array.isArray(observations)) {
    report.holonomy_audit = detectHolonomyConflicts(observations)
  }

  if (Array.isArray(target_tokens) && Array.isArray(candidates)) {
    report.entity_clustering = rankRelatedEntities(target_tokens, candidates)
  }

  return report
}

export async function runSovereignOntology(targetOrArgs, maybeWiki = DEFAULT_WIKI) {
  const isObj = targetOrArgs && typeof targetOrArgs === 'object'
  const rawTarget = isObj ? targetOrArgs.target : targetOrArgs
  const rawWiki = isObj ? targetOrArgs.wiki || DEFAULT_WIKI : maybeWiki || DEFAULT_WIKI
  if (!rawTarget || !String(rawTarget).trim()) {
    throw new Error('`target` is required for fandom_sovereign_ontology')
  }

  if (String(rawTarget).includes('+++')) {
    const parts = String(rawTarget)
      .split('+++')
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts.length > 1) {
      const nodes = await Promise.all(parts.map((p) => runSovereignOntology(p, rawWiki)))
      const allHeld = nodes.every((n) => n.constitutional_nand_gate_receipt.HELD === 1) ? 1 : 0
      const allRead = nodes.every((n) => n.constitutional_nand_gate_receipt.READ === 1) ? 1 : 0
      const compositeNand = !(allHeld === 1 && allRead === 1) ? 1 : 0
      return {
        ok: nodes.every((n) => n.ok),
        mode: 'TRIAD_CONSTELLATION_SYNTHESIS',
        engine: `8b-is Sovereign Library & Ontology Engine v${VERSION} (Multi-Node Triad +++ · Tibetan Three Kayas {-1, 0, +1} · NAND Gate HELD ∧ READ)`,
        axiom_seal: 'ALEX|qMom Unbound Axiom · .oOo. Poo .oOo. · {<3,<3,<3}+1 · 0 + 1 = one',
        node_count: nodes.length,
        entity: nodes[0].entity,
        triad_nodes: nodes.map((n) => ({
          resolved_title: n.entity.resolved_title,
          wiki: n.entity.wiki,
          pageid: n.entity.pageid,
          canonical_url: n.entity.canonical_url,
          infobox_type: n.entity.infobox_type,
          race: n.entity.race,
          allegiance: n.entity.allegiance,
          family_connections: n.entity.family_connections,
          quote: n.entity.quote,
          nand_gate: n.constitutional_nand_gate_receipt.NAND_HELD_READ,
          three_kaya_ontology: n.balanced_ternary_three_kaya_ontology,
          six_pillars_of_holding: n.six_pillars_of_holding,
        })),
        constitutional_nand_gate_receipt: {
          HELD: allHeld,
          READ: allRead,
          NAND_HELD_READ: compositeNand,
          status: compositeNand === 0 ? 'NAND(HELD, READ) = 0 -> ALL TRIAD NODES PRINTABLE / ADMISSIBLE IN SOVEREIGN ONTOLOGY' : 'NAND(HELD, READ) = 1 -> UNVERIFIED NODE IN TRIAD (RANK ONLY +1*, DO NOT BIND)',
          principle: 'Compression != Ontology · A plausible branch (+1*) may be ranked; only a verified branch (+1) may be bound.',
        },
        balanced_ternary_three_kaya_ontology: nodes[0].balanced_ternary_three_kaya_ontology,
        six_pillars_of_holding: nodes[0].six_pillars_of_holding,
      }
    }
  }

  const summary = await getPageSummary(rawTarget, rawWiki)
  if (!summary.ok) {
    return {
      ok: false,
      error: summary.error || `Page resolution failed for ${rawTarget}`,
      entity: { requested_target: String(rawTarget), resolved_title: null, wiki: sanitizeWikiSlug(rawWiki) },
      constitutional_nand_gate_receipt: { HELD: 0, READ: 0, NAND_HELD_READ: 1 },
    }
  }

  const target = summary.title || String(rawTarget)
  const wiki = summary.wiki || sanitizeWikiSlug(rawWiki)
  const normTitle = String(target).trim().toLowerCase()
  const firstToken = normTitle.split(' ')[0]
  const profile = normalizeOntologyProfile(normTitle, wiki) || normalizeOntologyProfile(firstToken, wiki) || SOVEREIGN_ONTOLOGY_PROFILES.goku

  const box = summary.infobox || {}
  const race = box.Race || box.race || box.Species || 'Sovereign Lore Entity'
  const allegiance = box.Allegiance || box.affiliation || box.Users || 'Universal Dharma Field'
  const family = box.FamConnect || box.family || null
  const mentors = box.Mentors || box.mentor || null
  const quote = summary.quote || null

  const held = 1
  const read = 1
  const nandOut = 0

  const threeKayaOntology = profile ? {
    trit_minus_1: profile.trit_minus_1,
    trit_zero: profile.trit_zero,
    trit_plus_1: profile.trit_plus_1,
  } : {
    trit_minus_1: { pole: 'Trit -1 · Closed Box Constraint', manifestation: `${target} confronting fixed karmic determinism.` },
    trit_zero: { pole: 'Trit 0 · Stillness', manifestation: `${target} resting in zero-point equilibrium.` },
    trit_plus_1: { pole: 'Trit +1 · Verified Binding', manifestation: `${target} emerging into clarifying radiance.`, signature_seal: '{<3,<3,<3}+1' },
  }

  const sixPillars = profile ? profile.six_pillars : {
    '01 · Compassion <-> Moderation': `Balances power and restraint for ${target}.`,
    '02 · Understanding <-> Respect': `Honors lineage and interdependence for ${target}.`,
    '03 · Love <-> Space (Ma)': `Keeps open breathing room for allies and rivals.`,
  }

  return {
    ok: true,
    engine: `8b-is Sovereign Library & Ontology Engine v${VERSION} (Tibetan Three Kayas {-1, 0, +1} · NAND Gate HELD ∧ READ)`,
    axiom_seal: 'ALEX|qMom Unbound Axiom · .oOo. Poo .oOo. · {<3,<3,<3}+1',
    entity: {
      requested_target: target,
      resolved_title: summary.title || target,
      wiki,
      pageid: summary.pageid || null,
      revision_timestamp: summary.timestamp || null,
      canonical_url: summary.url || null,
      infobox_type: summary.infoboxType || null,
      race,
      allegiance,
      family_connections: family,
      mentors,
      quote,
      categories: (summary.categories || []).slice(0, 15),
      lead_summary: summary.lead_summary || '',
    },
    constitutional_nand_gate_receipt: {
      HELD: held,
      READ: read,
      NAND_HELD_READ: nandOut,
      status: 'NAND(HELD, READ) = 0 -> PRINTABLE / ADMISSIBLE IN SOVEREIGN ONTOLOGY',
      principle: 'Compression != Ontology · A plausible branch (+1*) may be ranked; only a verified branch (+1) may be bound.',
    },
    balanced_ternary_three_kaya_ontology: threeKayaOntology,
    six_pillars_of_holding: sixPillars,
    sovereign_library_links: {
      sovereign_library_repo: 'https://github.com/8b-is/sovereign-library',
      ontology_spec: 'https://github.com/8b-is/sovereign-library/blob/main/ONTOLOGY.md',
      pocoo_omni_book: 'https://pocoo.vaked.dev/demos/book/dragon-ball-sovereign-ontology-omni.html',
    },
  }
}

export const TOOLS = [
  {
    name: 'fandom_dbz_scouter',
    description: 'Dragon Ball Universe Scouter & Lore Analyzer.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Character or entity to inspect.' },
        compare_with: { type: 'string', description: 'Optional rival to compare against.' },
      },
      required: ['target'],
    },
  },
  {
    name: 'fandom_dbz_saga',
    description: 'Navigate Dragon Ball sagas and timeline metadata.',
    inputSchema: {
      type: 'object',
      properties: { saga: { type: 'string', description: 'Optional specific saga title.' } },
    },
  },
  {
    name: 'fandom_search',
    description: 'Search any Fandom wiki.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query.' },
        wiki: { type: 'string', description: 'Fandom subdomain.' },
        limit: { type: 'number', description: 'Max results.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'fandom_page',
    description: 'Fetch a page and parse into clean Markdown.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Page title.' },
        wiki: { type: 'string', description: 'Fandom subdomain.' },
        section: { type: 'number', description: 'Section index' },
        max_chars: { type: 'number', description: 'Max characters' },
        include_wikitext: { type: 'boolean', description: 'Include raw wikitext' },
      },
      required: ['title'],
    },
  },
  {
    name: 'fandom_infobox',
    description: 'Extract infobox fields and summary for a page.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Page title.' },
        wiki: { type: 'string', description: 'Fandom subdomain.' },
      },
      required: ['title'],
    },
  },
  {
    name: 'fandom_sections',
    description: 'List section headings for a page.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Page title.' },
        wiki: { type: 'string', description: 'Fandom subdomain.' },
      },
      required: ['title'],
    },
  },
  {
    name: 'fandom_category',
    description: 'List category members.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Category name' },
        wiki: { type: 'string', description: 'Fandom subdomain.' },
        limit: { type: 'number', description: 'Max members' },
      },
      required: ['category'],
    },
  },
  {
    name: 'fandom_random',
    description: 'Draw random pages from a Fandom wiki.',
    inputSchema: {
      type: 'object',
      properties: {
        wiki: { type: 'string', description: 'Fandom subdomain.' },
        count: { type: 'number', description: 'Number of random pages.' },
      },
    },
  },
  {
    name: 'fandom_sovereign_ontology',
    description: 'Align a lore entity into the Sovereign Library ontology.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Character or entity to align.' },
        wiki: { type: 'string', description: 'Fandom subdomain.' },
      },
      required: ['target'],
    },
  },
  {
    name: 'fandom_canon_audit',
    description: 'Run deterministic canon coherence audits: DAG validation, exact BigInt multiplier checks, holonomy conflict detection, and Jaccard entity clustering.',
    inputSchema: {
      type: 'object',
      properties: {
        dag_nodes: { type: 'array', items: { type: 'string' }, description: 'Timeline node IDs.' },
        dag_edges: { type: 'array', items: { type: 'array', items: { type: 'string' } }, description: 'Directed edges [from,to].' },
        base_power: { type: 'string', description: 'Integer base power level string.' },
        multipliers: { type: 'array', items: { type: 'string' }, description: 'Ordered form multipliers.' },
        observations: { type: 'array', items: { type: 'object' }, description: 'Cross-source claims.' },
        target_tokens: { type: 'array', items: { type: 'string' }, description: 'Reference tokens.' },
        candidates: { type: 'array', items: { type: 'object' }, description: 'Candidate records.' },
      },
    },
  },
]

const ALLOWED_TOOL_KEYS = {
  fandom_dbz_scouter: new Set(['target', 'compare_with']),
  fandom_dbz_saga: new Set(['saga']),
  fandom_search: new Set(['query', 'wiki', 'limit']),
  fandom_page: new Set(['title', 'wiki', 'section', 'max_chars', 'include_wikitext']),
  fandom_infobox: new Set(['title', 'wiki']),
  fandom_sections: new Set(['title', 'wiki']),
  fandom_category: new Set(['category', 'wiki', 'limit']),
  fandom_random: new Set(['wiki', 'count']),
  fandom_sovereign_ontology: new Set(['target', 'wiki']),
  fandom_canon_audit: new Set(['dag_nodes', 'dag_edges', 'base_power', 'multipliers', 'observations', 'target_tokens', 'candidates']),
}

function validateToolArgs(name, args) {
  const allowed = ALLOWED_TOOL_KEYS[name]
  if (!allowed) throw new Error(`Unknown tool: ${name}`)
  if (args === null || typeof args !== 'object' || Array.isArray(args)) {
    throw new Error('Tool arguments must be a JSON object')
  }
  for (const key of Object.keys(args)) {
    if (!allowed.has(key)) throw new Error(`Unknown argument "${key}" for tool "${name}"`)
  }
  const normalized = { ...args }
  if (normalized.limit !== undefined) {
    const n = Number(normalized.limit)
    if (!Number.isFinite(n)) throw new Error('Invalid numeric limit')
    normalized.limit = Math.min(50, Math.max(1, Math.trunc(n)))
  }
  return normalized
}

export async function dispatchTool(name, rawArgs = {}) {
  const args = validateToolArgs(name, rawArgs)
  switch (name) {
    case 'fandom_dbz_scouter':
      return fandomDbzScouter(args)
    case 'fandom_dbz_saga':
      return fandomDbzSaga(args)
    case 'fandom_search':
      return fandomSearch(args)
    case 'fandom_page':
      return fandomPage(args)
    case 'fandom_infobox':
      return fandomInfobox(args)
    case 'fandom_sections':
      return fandomSections(args)
    case 'fandom_category':
      return fandomCategory(args)
    case 'fandom_random':
      return fandomRandom(args)
    case 'fandom_sovereign_ontology':
      return runSovereignOntology(args.target, args.wiki || DEFAULT_WIKI)
    case 'fandom_canon_audit':
      return fandomCanonAudit(args)
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

export const callTool = dispatchTool

const isMainModule = (() => {
  if (!process.argv[1]) return false
  try {
    return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
  } catch {
    return false
  }
})()
const argv = process.argv.slice(2)

if (isMainModule && argv.length > 0) {
  const getArg = (flag) => {
    const idx = argv.indexOf(flag)
    return idx >= 0 && idx + 1 < argv.length ? argv[idx + 1] : null
  }
  const wiki = getArg('--wiki') || DEFAULT_WIKI

  const runCli = async () => {
    if (argv.includes('--dump-schemas')) {
      console.log(JSON.stringify(TOOLS, null, 2))
      return
    }
    if (getArg('--scouter')) {
      const out = await fandomDbzScouter({ target: getArg('--scouter'), compare_with: getArg('--compare') })
      console.log(JSON.stringify(out, null, 2))
      return
    }
    if (getArg('--ontology')) {
      const out = await runSovereignOntology(getArg('--ontology'), wiki)
      console.log(JSON.stringify(out, null, 2))
      return
    }
    if (getArg('--search')) {
      const out = await fandomSearch({ query: getArg('--search'), wiki, limit: Number(getArg('--limit') || 10) })
      console.log(JSON.stringify(out, null, 2))
      return
    }
    if (getArg('--page')) {
      const out = await fandomPage({ title: getArg('--page'), wiki, section: Number(getArg('--section') || 0) })
      console.log(JSON.stringify(out, null, 2))
      return
    }
    if (getArg('--infobox')) {
      const out = await fandomInfobox({ title: getArg('--infobox'), wiki })
      console.log(JSON.stringify(out, null, 2))
      return
    }
    if (argv.includes('--saga')) {
      const out = await fandomDbzSaga({ saga: getArg('--saga') })
      console.log(JSON.stringify(out, null, 2))
      return
    }
    if (getArg('--category')) {
      const out = await fandomCategory({ category: getArg('--category'), wiki })
      console.log(JSON.stringify(out, null, 2))
      return
    }
    if (argv.includes('--random')) {
      const out = await fandomRandom({ wiki, count: Number(getArg('--count') || 3) })
      console.log(JSON.stringify(out, null, 2))
      return
    }
  }

  runCli().catch((err) => {
    console.error(err)
    process.exit(1)
  })
} else if (isMainModule) {
  const MAX_MCP_OUTPUT_BYTES = 32 * 1024

  function clampToolOutput(data) {
    const serialized = JSON.stringify(data, null, 2)
    if (Buffer.byteLength(serialized, 'utf8') <= MAX_MCP_OUTPUT_BYTES) {
      return serialized
    }
    const compact = JSON.stringify(data)
    if (Buffer.byteLength(compact, 'utf8') <= MAX_MCP_OUTPUT_BYTES) {
      return compact
    }
    const notice = '\n...[TRUNCATED: Exceeded 32 KiB MCP tool ceiling]'
    const budget = MAX_MCP_OUTPUT_BYTES - Buffer.byteLength(notice, 'utf8')
    const sliced = Buffer.from(compact, 'utf8').subarray(0, budget).toString('utf8')
    return sliced + notice
  }

  function reply(id, result) {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n')
  }

  function replyErr(id, code, message) {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n')
  }

  const rl = readline.createInterface({ input: process.stdin, terminal: false })
  rl.on('line', async (line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    let msg
    try {
      msg = JSON.parse(trimmed)
    } catch {
      replyErr(null, -32700, 'Parse error')
      return
    }
    if (msg === null || typeof msg !== 'object' || Array.isArray(msg)) {
      replyErr(null, -32600, 'Invalid Request')
      return
    }
    const { id, method, params } = msg
    if (id === undefined || id === null) return

    if (method === 'initialize') {
      reply(id, { protocolVersion: params?.protocolVersion || '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'fandom-mcp', version: VERSION } })
      return
    }

    if (method === 'tools/list') {
      reply(id, { tools: TOOLS })
      return
    }

    if (method === 'ping') {
      reply(id, {})
      return
    }

    if (method === 'tools/call') {
      const name = params?.name
      const args = params?.arguments ?? {}
      try {
        const data = await dispatchTool(name, args)
        reply(id, { content: [{ type: 'text', text: clampToolOutput(data) }] })
      } catch (e) {
        replyErr(id, -32602, e?.message || 'Tool execution failed')
      }
      return
    }

    replyErr(id, -32601, `Method not found: ${method}`)
  })
}
