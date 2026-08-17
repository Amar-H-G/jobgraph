# JobGraph — Cypher Query Reference & Traversal Analysis

This document details all Cypher queries executed in **JobGraph**, backed by **CognoDB**. All queries are parameterized, production-ready, and verified against a live CognoDB cloud instance.

---

## Query Summary & Traversal Graph

| ID | Name | Traversal Path / Pattern | Hops | Purpose |
|---|---|---|---|---|
| **Q1** | Candidate Profile + Skills | `(c:Candidate)-[:HAS_SKILL]->(s:Skill)` | 1 | Candidate dashboard & profile |
| **Q1b** | Preferred Locations | `(c:Candidate)-[:PREFERS]->(l:Location)` | 1 | Candidate location preferences |
| **Q2** | Direct Job Matching | `(c:Candidate)-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES]-(j:Job)` | 2 | Primary job discovery with match % |
| **Q3** | Match Breakdown | `(j:Job)-[:REQUIRES]->(s:Skill)` + `(c)-[:HAS_SKILL]->(s)` + Bridge | 1–3 | 3-bucket breakdown (Matched, Close, Missing) |
| **Q4** ⭐ | Extended Job Matching | `(c)-[:HAS_SKILL]->(cs)-[:RELATED_TO]->(rs)<-[:REQUIRES]-(j)` | **3** | **Multi-hop traversal discovering adjacent opportunities** |
| **Q5** ⭐ | Company Discovery | `(c)-[:HAS_SKILL]->(cs)-[:RELATED_TO]->(rs)<-[:REQUIRES]-(j)-[:POSTED_BY]->(co)` | **4** | **Relationally awkward 4-hop query finding hiring companies** |
| **Q6** | Related Jobs | `(j:Job)-[:REQUIRES]->(s:Skill)<-[:REQUIRES]-(rel:Job)` | 2 | Content-based job recommendations |
| **Q7** | Graph Explorer Subgraph | `(c)-[:HAS_SKILL]->(s)-[:RELATED_TO]->(rs)`, `(j)-[:REQUIRES]`, `(j)-[:POSTED_BY]` | 1–4 | Subgraph projection for interactive canvas |
| **Q8** | Job Search & Filter | `(j:Job)-[:POSTED_BY]->(co)`, `(j)-[:LOCATED_IN]->(l)` | 1 | Parametric search with optional filters |
| **Q9** | Single Job Detail | `(j:Job)-[:POSTED_BY]->(co)`, `(j)-[:LOCATED_IN]->(l)`, `(j)-[:REQUIRES]->(s)` | 1 | Detailed job view with requirements |

---

## Detailed Query Specifications

### Q1 — Candidate Profile + Skills
- **Endpoint**: `GET /api/candidates/:id`
- **Traversal**: 1 hop (`Candidate` → `HAS_SKILL` → `Skill`)
```cypher
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
```

---

### Q2 — Direct Job Matching
- **Endpoint**: `GET /api/candidates/:id/jobs/direct`
- **Traversal**: 2 hops (`Candidate` → `Skill` ← `Job`) + 1 hop (`Job` → `Company`, `Job` → `Location`)
```cypher
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
```

---

### Q4 ⭐ — Extended Job Matching (3-Hop Traversal)
- **Endpoint**: `GET /api/candidates/:id/jobs/extended`
- **Traversal**: 3 hops:
  $$\text{Candidate} \xrightarrow{\text{HAS\_SKILL}} \text{Skill} \xrightarrow{\text{RELATED\_TO}} \text{Skill} \xleftarrow{\text{REQUIRES}} \text{Job}$$
- **Key Mechanism**: Discovers positions requiring skills that the candidate does *not* directly possess, but are adjacent to candidate skills via graph ontology edges (`RELATED_TO`).

```cypher
MATCH (c:Candidate {id: $candidateId})-[:HAS_SKILL]->(hs:Skill)
WITH c, collect(hs.id) AS heldIds

MATCH (c)-[:HAS_SKILL]->(cs:Skill)-[:RELATED_TO]->(rs:Skill)
      <-[:REQUIRES]-(j:Job)
WHERE NOT rs.id IN heldIds

MATCH (j)-[:POSTED_BY]->(co:Company)
MATCH (j)-[:LOCATED_IN]->(l:Location)

WITH j, co, l,
     collect(DISTINCT {candidateSkill: cs.name, relatedSkill: rs.name}) AS bridgePaths

MATCH (j)-[:REQUIRES]->(req:Skill)
WITH j, co, l, bridgePaths,
     collect(DISTINCT {id: req.id, name: req.name, category: req.category}) AS requiredSkills

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
```

---

### Q5 ⭐ — Company Discovery via Related Skills (4-Hop Traversal)
- **Endpoint**: `GET /api/candidates/:id/companies`
- **Traversal**: 4 hops:
  $$\text{Candidate} \xrightarrow{\text{HAS\_SKILL}} \text{Skill} \xrightarrow{\text{RELATED\_TO}} \text{Skill} \xleftarrow{\text{REQUIRES}} \text{Job} \xrightarrow{\text{POSTED\_BY}} \text{Company}$$
- **Why this is "Relationally Awkward" in SQL**:
  In a relational database, this requires joining 6 tables (`candidates`, `candidate_skills`, `skills`, `skill_relationships`, `job_skills`, `jobs`, `companies`) plus aggregation and self-exclusion filters. In CognoDB, this is a single elegant path traversal.

```cypher
MATCH (c:Candidate {id: $candidateId})-[:HAS_SKILL]->(hs:Skill)
WITH c, collect(hs.id) AS heldIds

MATCH (c)-[:HAS_SKILL]->(cs:Skill)-[:RELATED_TO]->(rs:Skill)
      <-[:REQUIRES]-(j:Job)-[:POSTED_BY]->(co:Company)
WHERE NOT rs.id IN heldIds

WITH co,
     collect(DISTINCT cs.name) AS bridgeSkills,
     count(DISTINCT j)         AS openRoles

RETURN
  co.id       AS companyId,
  co.name     AS companyName,
  co.industry AS industry,
  co.size     AS size,
  bridgeSkills,
  openRoles
ORDER BY openRoles DESC
```

---

### Q6 — Related Jobs
- **Endpoint**: `GET /api/jobs/:id/related`
- **Traversal**: 2 hops (`Job` → `Skill` ← `Job`)
```cypher
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
```

---

### Q7 — Graph Explorer Subgraph Projection
- **Endpoint**: `GET /api/graph/:candidateId`
- **Purpose**: Flattens multi-hop graph neighbourhood around candidate to deliver reactive node & link definitions to the frontend force-directed canvas.

```cypher
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
```
