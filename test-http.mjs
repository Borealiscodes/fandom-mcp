import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import {
  fetchJson,
  assertAllowlistedUrl,
  sanitizeTitle,
  validateMediaWikiResponse,
  MAX_RESPONSE_BYTES,
} from './http-json.mjs'

function createMockTransport(handler) {
  return (parsedUrl, options, callback) => {
    const req = new EventEmitter()
    req.destroy = () => {}

    queueMicrotask(() => {
      const res = new EventEmitter()
      res.statusCode = 200
      res.headers = {}
      res.complete = true
      res.destroy = () => {}

      const pushBody = (buf) => {
        res.emit('data', buf)
        res.emit('end')
      }

      handler({ parsedUrl, options, req, res, pushBody })
      callback(res)
    })

    return req
  }
}

const VALID_API = ['https://', 'dragonball', '://'].join('')

test('SSRF Allowlist blocks non-HTTPS, IP literals, localhost, ports, credentials, and non-fandom domains', () => {
  assert.throws(() => assertAllowlistedUrl(['http://', 'dragonball://'].join('')), { code: 'ErrHostNotAllowed' })
  assert.throws(() => assertAllowlistedUrl(['https://', '127.0.0.1/api.php'].join('')), { code: 'ErrHostNotAllowed' })
  assert.throws(() => assertAllowlistedUrl(['https://', 'localhost/api.php'].join('')), { code: 'ErrHostNotAllowed' })
  assert.throws(() => assertAllowlistedUrl(['https://', 'example.org/api.php'].join('')), { code: 'ErrHostNotAllowed' })
  assert.throws(() => assertAllowlistedUrl(['https://', 'dragonball.fandom.com.example.org/api.php'].join('')), { code: 'ErrHostNotAllowed' })
  assert.throws(() => assertAllowlistedUrl(['https://', 'user:pass@dragonball://'].join('')), { code: 'ErrHostNotAllowed' })
  assert.throws(() => assertAllowlistedUrl(['https://', '://fandom.com'].join('')), { code: 'ErrHostNotAllowed' })

  const valid = assertAllowlistedUrl(VALID_API)
  assert.equal(valid.hostname, 'dragonball.fandom.com')
})

test('SSRF Redirect Guard blocks redirect hops to non-allowlisted hosts', async () => {
  const transport = createMockTransport(({ res }) => {
    res.statusCode = 302
    res.headers = { location: ['https://', '169.254.169.254/latest/meta-data/'].join('') }
  })

  await assert.rejects(
    () => fetchJson(VALID_API, { transport }),
    { code: 'ErrHostNotAllowed' }
  )
})

test('Bounded Stream Reader aborts when payload exceeds 2 MiB ceiling', async () => {
  const transport = createMockTransport(({ pushBody }) => {
    const oversized = Buffer.alloc(MAX_RESPONSE_BYTES + 1, 0x61)
    pushBody(oversized)
  })

  await assert.rejects(
    () => fetchJson(VALID_API, { transport }),
    { code: 'ErrPayloadTooLarge' }
  )
})

test('Deterministic Retry Envelope retries 429/503 up to maxRetries and succeeds', async () => {
  let calls = 0
  const transport = createMockTransport(({ res, pushBody }) => {
    calls += 1
    if (calls <= 2) {
      res.statusCode = 503
      res.emit('end')
      return
    }
    res.statusCode = 200
    pushBody(Buffer.from(JSON.stringify({ query: { ok: true } }), 'utf8'))
  })

  const result = await fetchJson(VALID_API, {
    transport,
    validateSchema: true,
  })
  assert.equal(calls, 3)
  assert.deepEqual(result, { query: { ok: true } })
})

test('Title sanitization strips control chars and enforces 256 UTF-8 byte ceiling', () => {
  assert.equal(sanitizeTitle('  Son\u0000   Goku\n '), 'Son Goku')
  assert.throws(() => sanitizeTitle('   '), { code: 'ErrInvalidTitle' })
  assert.throws(() => sanitizeTitle('a'.repeat(257)), { code: 'ErrInvalidTitle' })
})

test('MediaWiki schema validator enforces query or parse envelope', () => {
  assert.deepEqual(validateMediaWikiResponse({ query: {} }), { query: {} })
  assert.deepEqual(validateMediaWikiResponse({ parse: {} }), { parse: {} })
  assert.throws(() => validateMediaWikiResponse({ unexpected: true }), { code: 'ErrInvalidSchema' })
  assert.throws(
    () => validateMediaWikiResponse({ error: { code: 'missingtitle', info: 'Not found' } }),
    { code: 'ErrMediaWikiApi' }
  )
})
