import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateTimelineDag,
  evaluateStackedMultiplier,
  detectHolonomyConflicts,
  rankRelatedEntities,
} from './toolkit/canon_engine.mjs'
import { dispatchTool } from './fandom-mcp.mjs'

test('Saga & Timeline DAG performs deterministic topological sort and catches cycles', () => {
  const valid = validateTimelineDag(
    ['DB', 'DBZ', 'DBS', 'DBGT'],
    [
      ['DB', 'DBZ'],
      ['DBZ', 'DBS'],
      ['DBZ', 'DBGT'],
    ]
  )
  assert.equal(valid.valid, true)
  assert.deepEqual(valid.topological_order, ['DB', 'DBZ', 'DBS', 'DBGT'])

  assert.throws(
    () =>
      validateTimelineDag(
        ['Present', 'Future Trunks', 'Cell Timeline'],
        [
          ['Present', 'Future Trunks'],
          ['Future Trunks', 'Cell Timeline'],
          ['Cell Timeline', 'Present'],
        ]
      ),
    { code: 'ErrTimelineCycle' }
  )
})

test('Exact BigInt Rational Multipliers stack without IEEE-754 float overflow', () => {
  const res = evaluateStackedMultiplier('3000000', ['ssj3', 'kaioken_x20', 'potara_rival_estimate'])
  assert.equal(res.formatted_power, '24000000000000')
  assert.deepEqual(res.exact_rational, { p: '24000000000000', q: '1' })
})

test('Discrete Holonomy Detector flags cross-source canon contradictions', () => {
  const audit = detectHolonomyConflicts([
    { entity: 'Broly', attribute: 'CanonStatus', era: 'Z', source: 'DBZ Movie 8', value: 'Non-Canon' },
    { entity: 'Broly', attribute: 'CanonStatus', era: 'Z', source: 'DBS: Broly', value: 'Canon Reboot' },
  ])
  assert.equal(audit.consistent, false)
  assert.equal(audit.conflict_count, 1)
  assert.equal(audit.conflicts[0].code, 'HolonomyConflict')
})

test('Deterministic Jaccard Entity Clustering breaks ties lexicographically', () => {
  const ranked = rankRelatedEntities(
    ['saiyan', 'kamehameha', 'earth'],
    [
      { id: 'vegeta', tokens: ['saiyan', 'earth', 'galick_gun'] },
      { id: 'gohan', tokens: ['saiyan', 'earth', 'masenko'] },
      { id: 'krillin', tokens: ['earth', 'kamehameha', 'destructo_disc'] },
    ]
  )
  assert.deepEqual(
    ranked.map((r) => r.id),
    ['gohan', 'krillin', 'vegeta']
  )
})

test('Phase 3 MCP dispatchTool rejects unknown tool arguments at boundary', async () => {
  await assert.rejects(
    () => dispatchTool('fandom_search', { query: 'Goku', evil_override: true }),
    /Unknown argument "evil_override"/
  )
})
test('Phase 2/3 MCP dispatchTool executes fandom_canon_audit end-to-end', async () => {
  const result = await dispatchTool('fandom_canon_audit', {
    dag_nodes: ['DB', 'DBZ', 'DBS'],
    dag_edges: [
      ['DB', 'DBZ'],
      ['DBZ', 'DBS'],
    ],
    base_power: '10',
    multipliers: ['ozaru', 'kaioken_x4'],
    observations: [
      { entity: 'Bardock', attribute: 'PowerLevel', era: 'Saiyan', source: 'TV Special', value: '10000' },
      { entity: 'Bardock', attribute: 'PowerLevel', era: 'Saiyan', source: 'DBS: Broly', value: 'Unspecified' },
    ],
    target_tokens: ['saiyan', 'earth'],
    candidates: [
      { id: 'piccolo', tokens: ['namekian', 'earth'] },
      { id: 'goku', tokens: ['saiyan', 'earth'] },
    ],
  })

  assert.equal(result.ok, true)
  assert.deepEqual(result.timeline_dag.topological_order, ['DB', 'DBZ', 'DBS'])
  assert.equal(result.power_multiplier.formatted_power, '400')
  assert.equal(result.holonomy_audit.conflict_count, 1)
  assert.equal(result.entity_clustering[0].id, 'goku')
})
