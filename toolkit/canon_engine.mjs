// toolkit/canon_engine.mjs
// Phase 2: Deterministic Canon & Saga DAG Engine (Zero-Dependency ESM)

export class CanonEngineError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'CanonEngineError'
    this.code = code
    Object.assign(this, details)
  }
}

// 1. Exact BigInt Rational Multipliers (p / q, q > 0n)
function gcdBigInt(a, b) {
  let x = a < 0n ? -a : a
  let y = b < 0n ? -b : b
  while (y !== 0n) {
    const t = y
    y = x % y
    x = t
  }
  return x
}

export function makeRational(p, q = 1n) {
  const num = BigInt(p)
  const den = BigInt(q)
  if (den === 0n) {
    throw new CanonEngineError('ErrDivisionByZero', 'Rational denominator cannot be zero')
  }
  const sign = den < 0n ? -1n : 1n
  const sNum = num * sign
  const sDen = den * sign
  const g = gcdBigInt(sNum, sDen)
  return { p: sNum / g, q: sDen / g }
}

export function multiplyRationals(r1, r2) {
  return makeRational(r1.p * r2.p, r1.q * r2.q)
}

export function formatRational(r) {
  return r.q === 1n ? r.p.toString() : `${r.p.toString()}/${r.q.toString()}`
}

export const CANON_FORM_MULTIPLIERS = {
  base: makeRational(1n, 1n),
  ozaru: makeRational(10n, 1n),
  kaioken_x2: makeRational(2n, 1n),
  kaioken_x3: makeRational(3n, 1n),
  kaioken_x4: makeRational(4n, 1n),
  kaioken_x10: makeRational(10n, 1n),
  kaioken_x20: makeRational(20n, 1n),
  ssj: makeRational(50n, 1n),
  ssj2: makeRational(100n, 1n),
  ssj3: makeRational(400n, 1n),
  potara_rival_estimate: makeRational(1000n, 1n),
}

export function evaluateStackedMultiplier(basePower, formKeys = []) {
  let total = makeRational(BigInt(basePower), 1n)
  const applied = []
  for (const rawKey of formKeys) {
    const key = String(rawKey).trim().toLowerCase()
    const mult = CANON_FORM_MULTIPLIERS[key]
    if (!mult) {
      throw new CanonEngineError('ErrUnknownMultiplier', `Unknown transformation multiplier: ${rawKey}`)
    }
    total = multiplyRationals(total, mult)
    applied.push({ form: key, multiplier: formatRational(mult) })
  }
  return {
    base_power: String(basePower),
    applied_forms: applied,
    exact_rational: { p: total.p.toString(), q: total.q.toString() },
    formatted_power: formatRational(total),
  }
}

// 2. Cycle-Checked Saga & Timeline DAG (Kahn's Topological Sort + DFS Back-Edge Trace)
export function validateTimelineDag(nodes = [], edges = []) {
  const adj = new Map()
  const inDegree = new Map()

  for (const node of nodes) {
    adj.set(node, [])
    inDegree.set(node, 0)
  }

  for (const [from, to] of edges) {
    if (!adj.has(from)) {
      adj.set(from, [])
      inDegree.set(from, 0)
    }
    if (!adj.has(to)) {
      adj.set(to, [])
      inDegree.set(to, 0)
    }
    adj.get(from).push(to)
    inDegree.set(to, (inDegree.get(to) || 0) + 1)
  }

  // Kahn's topological sort
  const queue = []
  for (const [node, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(node)
  }
  queue.sort() // Deterministic tie-breaking

  const sorted = []
  while (queue.length > 0) {
    const curr = queue.shift()
    sorted.push(curr)
    const neighbors = [...(adj.get(curr) || [])].sort()
    for (const nxt of neighbors) {
      const nextDeg = inDegree.get(nxt) - 1
      inDegree.set(nxt, nextDeg)
      if (nextDeg === 0) {
        queue.push(nxt)
        queue.sort()
      }
    }
  }

  if (sorted.length === adj.size) {
    return { valid: true, topological_order: sorted }
  }

  // DFS back-edge detection for exact cycle trace
  const state = new Map() // 0 = unvisited, 1 = visiting, 2 = visited
  const stack = []
  let cycleTrace = null

  const dfs = (u) => {
    state.set(u, 1)
    stack.push(u)
    for (const v of adj.get(u) || []) {
      if (cycleTrace) return
      const st = state.get(v) || 0
      if (st === 1) {
        const idx = stack.indexOf(v)
        cycleTrace = [...stack.slice(idx), v]
        return
      }
      if (st === 0) dfs(v)
    }
    stack.pop()
    state.set(u, 2)
  }

  for (const node of [...adj.keys()].sort()) {
    if ((state.get(node) || 0) === 0) {
      dfs(node)
      if (cycleTrace) break
    }
  }

  throw new CanonEngineError(
    'ErrTimelineCycle',
    `Paradoxical timeline cycle detected: ${cycleTrace.join(' -> ')}`,
    { cycle: cycleTrace }
  )
}

// 3. Discrete Holonomy Contradiction Detector
export function detectHolonomyConflicts(observations = []) {
  // Each observation: { entity, attribute, era, source, value }
  const grouped = new Map()
  for (const obs of observations) {
    const key = `${obs.entity}::${obs.attribute}::${obs.era}`
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(obs)
  }

  const conflicts = []
  for (const [key, list] of grouped.entries()) {
    const distinctValues = new Set(list.map((o) => String(o.value).trim()))
    if (distinctValues.size > 1) {
      const [entity, attribute, era] = key.split('::')
      conflicts.push({
        code: 'HolonomyConflict',
        entity,
        attribute,
        era,
        sources: list.map((o) => ({ source: o.source, value: o.value })),
      })
    }
  }

  return {
    consistent: conflicts.length === 0,
    conflict_count: conflicts.length,
    conflicts,
  }
}

// 4. Deterministic Integer-Scaled Jaccard Entity Clustering
export function rankRelatedEntities(targetTokens = [], candidates = []) {
  // candidates: [{ id, tokens: [...] }]
  const tSet = new Set(targetTokens.map((t) => String(t).toLowerCase()))
  const SCALE = 1_000_000n

  const scored = candidates.map((cand) => {
    const cSet = new Set((cand.tokens || []).map((t) => String(t).toLowerCase()))
    let intersection = 0n
    for (const tok of tSet) {
      if (cSet.has(tok)) intersection += 1n
    }
    const union = BigInt(tSet.size + cSet.size) - intersection
    const jaccardScaled = union === 0n ? 0n : (intersection * SCALE) / union
    return {
      id: String(cand.id),
      jaccard_micros: Number(jaccardScaled),
    }
  })

  // Deterministic sort: highest score first, tie-break lexicographically by id
  scored.sort((a, b) => {
    if (b.jaccard_micros !== a.jaccard_micros) {
      return b.jaccard_micros - a.jaccard_micros
    }
    return a.id.localeCompare(b.id)
  })

  return scored
}
