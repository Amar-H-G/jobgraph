/**
 * Query Verification Script
 * Runs all Q1-Q9 against live CognoDB and reports results.
 * Does NOT print any credentials.
 */
require('dotenv').config();
const neo4j = require('neo4j-driver');
const Q = require('../src/queries/index');

const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(process.env.COGNODB_USERNAME, process.env.COGNODB_PASSWORD)
);

function toPlain(value) {
  if (value === null || value === undefined) return value;
  if (neo4j.isInt(value)) return value.toNumber();
  if (Array.isArray(value)) return value.map(toPlain);
  if (value && typeof value === 'object' && value.labels) return { _labels: value.labels, ...toPlain(value.properties) };
  if (typeof value === 'object') {
    const r = {};
    for (const [k, v] of Object.entries(value)) r[k] = toPlain(v);
    return r;
  }
  return value;
}

async function runQuery(query, params = {}) {
  const session = driver.session();
  try {
    const result = await session.run(query, params);
    return result.records.map(rec => {
      const obj = {};
      rec.keys.forEach(k => { obj[k] = toPlain(rec.get(k)); });
      return obj;
    });
  } finally {
    await session.close();
  }
}

function pass(name, rows, notes = '') {
  console.log(`  ✅ ${name}: ${rows.length} row(s)${notes ? ' — ' + notes : ''}`);
}
function fail(name, err) {
  console.error(`  ❌ ${name}: FAILED — ${err.message}`);
}

async function main() {
  console.log('\n=== QUERY VERIFICATION AGAINST COGNODB ===\n');

  // Q1 — Candidate + Skills
  try {
    const rows = await runQuery(Q.GET_CANDIDATE_WITH_SKILLS, { candidateId: 'alex-chen' });
    const skills = (rows[0]?.skills || []).filter(s => s.id);
    pass('Q1 — Candidate+Skills', rows, `candidate: ${rows[0]?.name}, skills: ${skills.length}`);
  } catch(e) { fail('Q1', e); }

  // Q1b — Preferred Locations
  try {
    const rows = await runQuery(Q.GET_CANDIDATE_LOCATIONS, { candidateId: 'alex-chen' });
    pass('Q1b — Preferred Locations', rows, rows.map(r => r.city).join(', '));
  } catch(e) { fail('Q1b', e); }

  // Q2 — Direct Matching Jobs
  try {
    const rows = await runQuery(Q.GET_DIRECT_MATCHING_JOBS, { candidateId: 'alex-chen' });
    const top = rows[0];
    pass('Q2 — Direct Matching Jobs', rows, `top: "${top?.title}" @ ${top?.matchScore}%`);
  } catch(e) { fail('Q2', e); }

  // Q3 — Skill Breakdown for a job
  const directTestJobId = 'job-stripe-fe';
  try {
    const rows = await runQuery(Q.GET_JOB_SKILL_BREAKDOWN, { jobId: directTestJobId, candidateId: 'alex-chen' });
    const r = rows[0] || {};
    pass('Q3 — Skill Breakdown', rows, `matched: ${r.matchedCount}/${r.totalRequired}, close: ${(r.closeSkills||[]).length}, missing: ${(r.missingSkills||[]).length}`);
  } catch(e) { fail('Q3', e); }

  // Q4 — Extended Matching (3-hop traversal) ⭐
  try {
    const rows = await runQuery(Q.GET_EXTENDED_MATCHING_JOBS, { candidateId: 'alex-chen' });
    const sample = rows[0];
    pass('Q4 — Extended (3-hop)', rows, sample ? `sample: "${sample.title}" via ${JSON.stringify(sample.bridgePaths?.[0])}` : 'no results');
  } catch(e) { fail('Q4 [CRITICAL]', e); }

  // Q5 — Company Discovery (4-hop) ⭐
  try {
    const rows = await runQuery(Q.GET_COMPANIES_VIA_RELATED_SKILLS, { candidateId: 'alex-chen' });
    pass('Q5 — Company Discovery (4-hop)', rows, rows.map(r => `${r.companyName}(${r.openRoles})`).join(', '));
  } catch(e) { fail('Q5 [CRITICAL]', e); }

  // Q6 — Related Jobs
  try {
    const rows = await runQuery(Q.GET_RELATED_JOBS, { jobId: directTestJobId });
    pass('Q6 — Related Jobs', rows, rows.map(r => r.title).slice(0,3).join(', '));
  } catch(e) { fail('Q6', e); }

  // Q7 — Graph Explorer
  try {
    const rows = await runQuery(Q.GET_GRAPH_EXPLORER_DATA, { candidateId: 'alex-chen' });
    pass('Q7 — Graph Explorer', rows, `${rows.length} rows returned`);
  } catch(e) { fail('Q7', e); }

  // Q8 — Job Filter (no filter)
  try {
    const rows = await runQuery(Q.GET_JOBS_FILTERED, { title: null, city: null, employmentType: null, limit: 50 });
    pass('Q8a — Filter (all)', rows);
  } catch(e) { fail('Q8a', e); }

  // Q8 — Job Filter (with city)
  try {
    const rows = await runQuery(Q.GET_JOBS_FILTERED, { title: null, city: 'San Francisco', employmentType: null, limit: 50 });
    pass('Q8b — Filter (city=SF)', rows, `${rows.length} jobs in SF`);
  } catch(e) { fail('Q8b', e); }

  // Q8 — Job Filter (title search)
  try {
    const rows = await runQuery(Q.GET_JOBS_FILTERED, { title: 'engineer', city: null, employmentType: null, limit: 50 });
    pass('Q8c — Filter (title=engineer)', rows, `${rows.length} results`);
  } catch(e) { fail('Q8c', e); }

  // Q9 — Single Job by ID
  try {
    const rows = await runQuery(Q.GET_JOB_BY_ID, { jobId: directTestJobId });
    pass('Q9 — Get Job By ID', rows, `title: "${rows[0]?.title}"`);
  } catch(e) { fail('Q9', e); }

  console.log('\n=== VERIFICATION COMPLETE ===\n');
  await driver.close();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  driver.close().then(() => process.exit(1));
});
