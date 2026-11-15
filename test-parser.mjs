import test from 'node:test'
import assert from 'node:assert/strict'
import {
  decodeHtmlEntities,
  stripHtmlToText,
  normalizeInfoboxKey,
  extractPortableInfobox,
  extractRenderedQuote,
  parseRenderedWikiPage,
  lookupField,
} from './toolkit/wiki_parser.mjs'

test('decodeHtmlEntities decodes named, decimal, and hex entities safely', () => {
  assert.equal(decodeHtmlEntities('Goku &amp; Vegeta &mdash; &quot;Saiyans&quot;'), 'Goku & Vegeta — "Saiyans"')
  assert.equal(decodeHtmlEntities('&#128009; &#x26A1;'), '🐉 ⚡')
})

test('stripHtmlToText removes scripts, styles, and citation superscripts while preserving structure', () => {
  const html = `
    <p>Son Goku<sup class="reference"><a href="#cite_note-1">[1]</a></sup> is a Saiyan.</p>
    <script>alert("xss")</script>
    <ul><li>Earth</li><li>Planet Vegeta</li></ul>
  `
  const text = stripHtmlToText(html)
  assert.equal(text.includes('[1]'), false)
  assert.equal(text.includes('alert'), false)
  assert.equal(text.includes('Son Goku is a Saiyan.'), true)
  assert.equal(text.includes('Earth; Planet Vegeta'), true)
})

test('extractPortableInfobox parses Fandom <aside class="portable-infobox"> and normalizes keys', () => {
  const sampleHtml = `
    <aside class="portable-infobox pi-background pi-theme-Character">
      <div class="pi-item pi-data">
        <h3 class="pi-data-label">Race</h3>
        <div class="pi-data-value">Saiyan</div>
      </div>
      <div class="pi-item pi-data">
        <h3 class="pi-data-label">Japanese Name</h3>
        <div class="pi-data-value">孫 悟空<br/><i>Son Gokū</i></div>
      </div>
      <div class="pi-item pi-data">
        <h3 class="pi-data-label">Allegiance</h3>
        <div class="pi-data-value">Dragon Team</div>
      </div>
    </aside>
  `

  const extracted = extractPortableInfobox(sampleHtml)
  assert.equal(extracted.infoboxType, 'Character')
  assert.equal(extracted.infobox.Race, 'Saiyan')
  assert.equal(extracted.normalized.race, 'Saiyan')
  assert.equal(extracted.normalized.japanese_name, '孫 悟空, Son Gokū')
  assert.equal(lookupField(extracted.normalized, 'species', 'race'), 'Saiyan')
  assert.equal(lookupField(extracted.normalized, 'japname', 'japanese_name'), '孫 悟空, Son Gokū')
})

test('extractRenderedQuote extracts quote text and attribution without cite tags', () => {
  const quoteHtml = `
    <blockquote class="pull-quote">
      "I am the hope of the universe!"
      <cite>— Son Goku to Frieza</cite>
    </blockquote>
  `
  const quote = extractRenderedQuote(quoteHtml)
  assert.deepEqual(quote, {
    text: 'I am the hope of the universe!',
    attribution: 'Son Goku to Frieza',
  })
})

test('parseRenderedWikiPage separates infobox, quote, and clean lead prose', () => {
  const fullHtml = `
    <div class="mw-parser-output">
      <aside class="portable-infobox pi-theme-Technique">
        <div class="pi-item pi-data">
          <h3 class="pi-data-label">Creators</h3>
          <div class="pi-data-value">Master Roshi</div>
        </div>
      </aside>
      <blockquote class="pull-quote">
        "Ka-me-ha-me-HA!"
        <cite>— Goku</cite>
      </blockquote>
      <p>The <b>Kamehameha</b> is the first energy wave shown in the <i>Dragon Ball</i> series.</p>
      <p>It was invented by Master Roshi after fifty years of training.</p>
    </div>
  `

  const parsed = parseRenderedWikiPage(fullHtml)
  assert.equal(parsed.infoboxType, 'Technique')
  assert.equal(parsed.normalized.creators, 'Master Roshi')
  assert.equal(parsed.quote.text, 'Ka-me-ha-me-HA!')
  assert.equal(parsed.lead_markdown.includes('Master Roshi'), true)
  assert.equal(parsed.lead_markdown.includes('Ka-me-ha-me-HA'), false)
})
