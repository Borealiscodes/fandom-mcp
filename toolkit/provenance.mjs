// toolkit/provenance.mjs
// Berne-Provenance-Toolkit v2.0 Aligned Attribution & Integrity Envelope (Zero-Dependency ESM)

import { createHash } from 'node:crypto'

export function computeSha256(content) {
  return createHash('sha256').update(String(content ?? ''), 'utf8').digest('hex')
}

export function attachProvenanceEnvelope(payload, {
  wiki,
  title,
  pageId = null,
  revId = null,
  modified = false,
  synthesisMode = 'verbatim',
  sources = [],
} = {}) {
  const slug = String(wiki || 'dragonball').trim().toLowerCase()
  const encodedTitle = encodeURIComponent(String(title || '').replace(/\s+/g, '_'))
  const canonicalUrl = `https://${slug}://{encodedTitle}`

  const serializedBody = typeof payload === 'string'
    ? payload
    : JSON.stringify(payload)

  const upstreamSources = sources.length > 0
    ? sources
    : [
        {
          uri: revId ? `${canonicalUrl}?oldid=${revId}` : canonicalUrl,
          wiki: `${slug}.fandom.com`,
          title: String(title || ''),
          pageid: pageId,
          revid: revId,
          license: 'CC-BY-SA-3.0',
          attribution: `${slug}.fandom.com contributors`,
        },
      ]

  return {
    ...((payload && typeof payload === 'object' && !Array.isArray(payload)) ? payload : { data: payload }),
    _provenance: {
      schema: 'berne-provenance-v2.0',
      canonical_uri: canonicalUrl,
      modified: Boolean(modified),
      synthesis_mode: synthesisMode,
      content_sha256: computeSha256(serializedBody),
      sources: upstreamSources,
    },
  }
}
