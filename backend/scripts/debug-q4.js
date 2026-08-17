require('dotenv').config();
const neo4j = require('neo4j-driver');
const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(process.env.COGNODB_USERNAME, process.env.COGNODB_PASSWORD)
);

async function run(q, p = {}) {
  const s = driver.session();
  try {
    const r = await s.run(q, p);
    return r.records.map(rec => {
      const o = {};
      rec.keys.forEach(k => {
        const v = rec.get(k);
        o[k] = neo4j.isInt(v) ? v.toNumber() : v;
      });
      return o;
    });
  } finally { await s.close(); }
}

async function main() {
  // Test 1: NOT (c)-[:HAS_SKILL]->(rs) — does anti-pattern filter work at all?
  console.log('--- Test 1: Anti-pattern WHERE NOT (c)-[:HAS_SKILL]->(rs) ---');
  let r = await run(
    `MATCH (c:Candidate {id: $id})-[:HAS_SKILL]->(cs:Skill)-[:RELATED_TO]->(rs:Skill)
     RETURN cs.name AS from, rs.name AS to, 
     CASE WHEN (c)-[:HAS_SKILL]->(rs) THEN 'HELD' ELSE 'NOT-HELD' END AS held`,
    { id: 'alex-chen' }
  );
  console.log('With CASE:', r.map(x => `${x.from}->${x.to}: ${x.held}`));

  // Test 2: Try collecting candidate skill IDs first, then using IN for exclusion
  console.log('\n--- Test 2: Collect candidateSkillIds first, use IN ---');
  r = await run(
    `MATCH (c:Candidate {id: $id})-[:HAS_SKILL]->(hs:Skill)
     WITH c, collect(hs.id) AS heldIds
     MATCH (c)-[:HAS_SKILL]->(cs:Skill)-[:RELATED_TO]->(rs:Skill)<-[:REQUIRES]-(j:Job)
     WHERE NOT rs.id IN heldIds
     RETURN cs.name AS from, rs.name AS to, j.title AS job
     LIMIT 10`,
    { id: 'alex-chen' }
  );
  console.log('Rows with IN approach:', r.length, r.map(x => `${x.from}->${x.to}:${x.job}`));

  // Test 3: Try WHERE with <> on IDs
  console.log('\n--- Test 3: NONE predicate approach ---');
  r = await run(
    `MATCH (c:Candidate {id: $id})-[:HAS_SKILL]->(hs:Skill)
     WITH c, collect(hs.id) AS heldIds
     MATCH (c)-[:HAS_SKILL]->(cs:Skill)-[:RELATED_TO]->(rs:Skill)<-[:REQUIRES]-(j:Job)-[:POSTED_BY]->(co:Company)
     WHERE NOT rs.id IN heldIds
     RETURN DISTINCT j.id AS jobId, j.title AS title, co.name AS company, rs.name AS relSkill, cs.name AS via`,
    { id: 'alex-chen' }
  );
  console.log('Extended jobs via IN filter:', r.length, 'results');
  r.forEach(x => console.log(` "${x.title}" @ ${x.company} via ${x.via}->${x.relSkill}`));

  await driver.close();
}

main().catch(e => { console.error('Fatal:', e.message); driver.close(); });
