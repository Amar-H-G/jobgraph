/**
 * JobGraph — Cypher Query Definitions
 * All queries are parameterized. Never concatenate user input.
 *
 * Status: UNVERIFIED — must be executed against CognoDB in Phase 5/6.
 */

// ─────────────────────────────────────────────────────────────
// Q1 — Candidate Profile + Skills
// Traversal: (Candidate)-[:HAS_SKILL]->(Skill)  [1 hop]
// Used by: GET /api/candidates/:id
// ─────────────────────────────────────────────────────────────
const GET_CANDIDATE_WITH_SKILLS = `
  MATCH (c:Candidate {id: $candidateId})
  OPTIONAL MATCH (c)-[r:HAS_SKILL]->(s:Skill)
  RETURN
    c.id          AS id,
    c.name        AS name,
    c.title       AS title,
    c.bio         AS bio,
    collect({
      id:          s.id,
      name:        s.name,
      category:    s.category,
      years:       r.yearsOfExperience,
      level:       r.proficiencyLevel
    }) AS skills
`;

// ─────────────────────────────────────────────────────────────
// Q1b — Candidate Preferred Locations
// Used by: GET /api/candidates/:id (merged with Q1 response)
// ─────────────────────────────────────────────────────────────
const GET_CANDIDATE_LOCATIONS = `
  MATCH (c:Candidate {id: $candidateId})-[:PREFERS]->(l:Location)
  RETURN l.id AS id, l.city AS city, l.country AS country, l.remote AS remote
`;

// ─────────────────────────────────────────────────────────────
// Q2 — Direct Job Matching
// Traversal: Candidate→Skill←Job→Company, Job→Location  [2–3 hops]
// Returns jobs where candidate has ≥1 required skill, with match score.
// Used by: GET /api/candidates/:id/jobs/direct
// ─────────────────────────────────────────────────────────────
const GET_DIRECT_MATCHING_JOBS = `
  MATCH (c:Candidate {id: $candidateId})-[:HAS_SKILL]->(cs:Skill)
  MATCH (j:Job)-[:REQUIRES]->(cs)
  WITH c, j, collect(DISTINCT cs) AS matchedSkills

  MATCH (j)-[:REQUIRES]->(allReq:Skill)
  WITH j, matchedSkills, collect(DISTINCT allReq) AS requiredSkills

  MATCH (j)-[:POSTED_BY]->(co:Company)
  MATCH (j)-[:LOCATED_IN]->(l:Location)

  RETURN
    j.id              AS jobId,
    j.title           AS title,
    j.description     AS description,
    j.employmentType  AS employmentType,
    j.salaryRange     AS salaryRange,
    j.postedAt        AS postedAt,
    co.id             AS companyId,
    co.name           AS companyName,
    co.industry       AS industry,
    l.city            AS city,
    l.country         AS country,
    l.remote          AS remote,
    [s IN matchedSkills  | {id: s.id, name: s.name, category: s.category}] AS matchingSkills,
    [s IN requiredSkills | {id: s.id, name: s.name, category: s.category}] AS requiredSkills,
    size(matchedSkills)  AS matchedCount,
    size(requiredSkills) AS totalRequired,
    round(100.0 * size(matchedSkills) / size(requiredSkills)) AS matchScore
  ORDER BY matchScore DESC
`;

// ─────────────────────────────────────────────────────────────
// Q3 — Match / Close / Missing Skills for a Job
// Used by: GET /api/jobs/:id/match/:candidateId
// Returns three skill buckets for Job Detail screen.
// ─────────────────────────────────────────────────────────────
const GET_JOB_SKILL_BREAKDOWN = `
  MATCH (j:Job {id: $jobId})-[:REQUIRES]->(req:Skill)
  WITH j, collect(DISTINCT req) AS requiredSkills

  MATCH (c:Candidate {id: $candidateId})-[:HAS_SKILL]->(cs:Skill)
  WITH j, requiredSkills, collect(DISTINCT cs) AS candidateSkills

  OPTIONAL MATCH (c2:Candidate {id: $candidateId})-[:HAS_SKILL]->(bridge:Skill)
               -[:RELATED_TO]->(closeSkill:Skill)
  WHERE closeSkill IN requiredSkills
    AND NOT closeSkill IN candidateSkills
  WITH j, requiredSkills, candidateSkills,
       collect(DISTINCT {skill: closeSkill, via: bridge}) AS closePaths

  RETURN
    [s IN requiredSkills WHERE s IN candidateSkills
      | {id: s.id, name: s.name, category: s.category}] AS matchingSkills,
    [cp IN closePaths
      | {id: cp.skill.id, name: cp.skill.name, category: cp.skill.category, via: cp.via.name}] AS closeSkills,
    [s IN requiredSkills
     WHERE NOT s IN candidateSkills
       AND NOT s IN [cp IN closePaths | cp.skill]
      | {id: s.id, name: s.name, category: s.category}] AS missingSkills,
    size(requiredSkills) AS totalRequired,
    size([s IN requiredSkills WHERE s IN candidateSkills]) AS matchedCount
`;

// ─────────────────────────────────────────────────────────────
// Q4 — Extended Job Matching (3-hop Multi-hop Traversal) ⭐
// Traversal: Candidate→Skill→RELATED_TO→Skill←REQUIRES←Job→Company [3 hops]
// Finds jobs NOT in direct matches, reachable via related skills.
// Used by: GET /api/candidates/:id/jobs/extended
// ─────────────────────────────────────────────────────────────
const GET_EXTENDED_MATCHING_JOBS = `
  MATCH (c:Candidate {id: $candidateId})-[:HAS_SKILL]->(cs:Skill)
        -[:RELATED_TO]->(rs:Skill)
        <-[:REQUIRES]-(j:Job)
  WHERE NOT (c)-[:HAS_SKILL]->(rs)
    AND NOT EXISTS {
      MATCH (c)-[:HAS_SKILL]->(any:Skill)<-[:REQUIRES]-(j)
    }

  MATCH (j)-[:POSTED_BY]->(co:Company)
  MATCH (j)-[:LOCATED_IN]->(l:Location)

  WITH j, co, l,
       collect(DISTINCT {candidateSkill: cs.name, relatedSkill: rs.name}) AS bridgePaths

  MATCH (j)-[:REQUIRES]->(req:Skill)
  WITH j, co, l, bridgePaths, collect(DISTINCT {id: req.id, name: req.name, category: req.category}) AS requiredSkills

  RETURN
    j.id             AS jobId,
    j.title          AS title,
    j.description    AS description,
    j.employmentType AS employmentType,
    j.salaryRange    AS salaryRange,
    j.postedAt       AS postedAt,
    co.id            AS companyId,
    co.name          AS companyName,
    co.industry      AS industry,
    l.city           AS city,
    l.country        AS country,
    l.remote         AS remote,
    requiredSkills,
    bridgePaths
`;

// ─────────────────────────────────────────────────────────────
// Q5 — Company Discovery via Related Skills (4-hop) ⭐ Relationally Awkward
// Traversal: Candidate→Skill→RELATED_TO→Skill←REQUIRES←Job→Company [4 hops]
// Used by: GET /api/candidates/:id/companies
// ─────────────────────────────────────────────────────────────
const GET_COMPANIES_VIA_RELATED_SKILLS = `
  MATCH (c:Candidate {id: $candidateId})-[:HAS_SKILL]->(cs:Skill)
        -[:RELATED_TO]->(rs:Skill)
        <-[:REQUIRES]-(j:Job)
        -[:POSTED_BY]->(co:Company)
  WHERE NOT (c)-[:HAS_SKILL]->(rs)

  WITH co,
       collect(DISTINCT cs.name) AS bridgeSkills,
       collect(DISTINCT j.id)    AS jobIds,
       count(DISTINCT j)         AS openRoles

  RETURN
    co.id       AS companyId,
    co.name     AS companyName,
    co.industry AS industry,
    co.size     AS size,
    bridgeSkills,
    openRoles
  ORDER BY openRoles DESC
`;

// ─────────────────────────────────────────────────────────────
// Q6 — Related Jobs (shared required skills)
// Traversal: Job→Skill←Job  [2 hops]
// Used by: GET /api/jobs/:id/related
// ─────────────────────────────────────────────────────────────
const GET_RELATED_JOBS = `
  MATCH (j:Job {id: $jobId})-[:REQUIRES]->(s:Skill)<-[:REQUIRES]-(rel:Job)
  WHERE rel.id <> $jobId
  MATCH (rel)-[:POSTED_BY]->(co:Company)
  MATCH (rel)-[:LOCATED_IN]->(l:Location)
  WITH rel, co, l, count(DISTINCT s) AS sharedSkills
  RETURN
    rel.id             AS jobId,
    rel.title          AS title,
    rel.employmentType AS employmentType,
    co.name            AS companyName,
    l.city             AS city,
    sharedSkills
  ORDER BY sharedSkills DESC
  LIMIT 5
`;

// ─────────────────────────────────────────────────────────────
// Q7 — Graph Explorer Subgraph
// Returns nodes + rels for the force-directed visualization.
// Used by: GET /api/graph/:candidateId
// NOTE: Variable-length path RELATED_TO*0..1 needs CognoDB verification.
// ─────────────────────────────────────────────────────────────
const GET_GRAPH_EXPLORER_DATA = `
  MATCH (c:Candidate {id: $candidateId})-[:HAS_SKILL]->(s:Skill)

  OPTIONAL MATCH (s)-[:RELATED_TO]->(rs:Skill)

  OPTIONAL MATCH (j:Job)-[:REQUIRES]->(s)
  OPTIONAL MATCH (j2:Job)-[:REQUIRES]->(rs)
  OPTIONAL MATCH (j)-[:POSTED_BY]->(co:Company)
  OPTIONAL MATCH (j2)-[:POSTED_BY]->(co2:Company)

  RETURN
    c.id    AS candidateId,   c.name    AS candidateName,
    s.id    AS skillId,       s.name    AS skillName,       s.category AS skillCategory,
    rs.id   AS relSkillId,    rs.name   AS relSkillName,
    j.id    AS jobId,         j.title   AS jobTitle,
    j2.id   AS jobId2,        j2.title  AS jobTitle2,
    co.id   AS companyId,     co.name   AS companyName,
    co2.id  AS companyId2,    co2.name  AS companyName2
  LIMIT 300
`;
// NOTE: This returns flat rows; the service layer assembles nodes/edges from them.

// ─────────────────────────────────────────────────────────────
// Q8 — Job Search / Filter
// Conditionally filtered; NULL params handled server-side
// (build query string conditionally to avoid NULL param issues)
// Used by: GET /api/jobs?title=&location=&type=
// ─────────────────────────────────────────────────────────────
const GET_JOBS_FILTERED = `
  MATCH (j:Job)-[:POSTED_BY]->(co:Company)
  MATCH (j)-[:LOCATED_IN]->(l:Location)
  WHERE ($title IS NULL OR toLower(j.title) CONTAINS toLower($title))
    AND ($city IS NULL OR l.city = $city)
    AND ($employmentType IS NULL OR j.employmentType = $employmentType)
  RETURN
    j.id             AS jobId,
    j.title          AS title,
    j.employmentType AS employmentType,
    j.salaryRange    AS salaryRange,
    j.postedAt       AS postedAt,
    co.name          AS companyName,
    co.industry      AS industry,
    l.city           AS city,
    l.country        AS country,
    l.remote         AS remote
  ORDER BY j.postedAt DESC
  LIMIT $limit
`;

// ─────────────────────────────────────────────────────────────
// Q9 — Get Single Job Detail
// Used by: GET /api/jobs/:id
// ─────────────────────────────────────────────────────────────
const GET_JOB_BY_ID = `
  MATCH (j:Job {id: $jobId})-[:POSTED_BY]->(co:Company)
  MATCH (j)-[:LOCATED_IN]->(l:Location)
  OPTIONAL MATCH (j)-[r:REQUIRES]->(s:Skill)
  RETURN
    j.id             AS jobId,
    j.title          AS title,
    j.description    AS description,
    j.employmentType AS employmentType,
    j.salaryRange    AS salaryRange,
    j.postedAt       AS postedAt,
    co.id            AS companyId,
    co.name          AS companyName,
    co.industry      AS industry,
    co.size          AS companySize,
    l.city           AS city,
    l.country        AS country,
    collect({
      id:         s.id,
      name:       s.name,
      category:   s.category,
      importance: r.importance
    }) AS requiredSkills
`;

// ─────────────────────────────────────────────────────────────
// Schema Setup — Run once before seeding
// ─────────────────────────────────────────────────────────────
const SCHEMA_CONSTRAINTS = [
  `CREATE CONSTRAINT candidate_id IF NOT EXISTS FOR (c:Candidate) REQUIRE c.id IS UNIQUE`,
  `CREATE CONSTRAINT skill_id IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE`,
  `CREATE CONSTRAINT skill_name IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE`,
  `CREATE CONSTRAINT job_id IF NOT EXISTS FOR (j:Job) REQUIRE j.id IS UNIQUE`,
  `CREATE CONSTRAINT company_id IF NOT EXISTS FOR (co:Company) REQUIRE co.id IS UNIQUE`,
  `CREATE CONSTRAINT location_id IF NOT EXISTS FOR (l:Location) REQUIRE l.id IS UNIQUE`,
];

module.exports = {
  GET_CANDIDATE_WITH_SKILLS,
  GET_CANDIDATE_LOCATIONS,
  GET_DIRECT_MATCHING_JOBS,
  GET_JOB_SKILL_BREAKDOWN,
  GET_EXTENDED_MATCHING_JOBS,
  GET_COMPANIES_VIA_RELATED_SKILLS,
  GET_RELATED_JOBS,
  GET_GRAPH_EXPLORER_DATA,
  GET_JOBS_FILTERED,
  GET_JOB_BY_ID,
  SCHEMA_CONSTRAINTS,
};
