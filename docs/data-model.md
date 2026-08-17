# JobGraph — Graph Data Model

## Node Labels & Properties

### `Candidate`
| Property | Type | Required | Purpose |
|----------|------|----------|---------|
| `id` | String (UUID) | ✅ | Unique identifier; used in all query parameters |
| `name` | String | ✅ | Display name |
| `title` | String | ✅ | Current job title / role label |
| `bio` | String | ✅ | Short profile description |
| `email` | String | ✅ | Contact info (not exposed to frontend) |

---

### `Skill`
| Property | Type | Required | Purpose |
|----------|------|----------|---------|
| `id` | String (UUID) | ✅ | Unique identifier |
| `name` | String | ✅ | Skill name (e.g., "React", "PostgreSQL") |
| `category` | String | ✅ | One of: Frontend, Backend, DevOps, Data, General |

---

### `Job`
| Property | Type | Required | Purpose |
|----------|------|----------|---------|
| `id` | String (UUID) | ✅ | Unique identifier |
| `title` | String | ✅ | Job title |
| `description` | String | ✅ | Role description |
| `employmentType` | String | ✅ | One of: Full-time, Contract, Remote |
| `salaryRange` | String | ⬜ | e.g., "$120k–$150k" |
| `postedAt` | String | ✅ | ISO date string |

---

### `Company`
| Property | Type | Required | Purpose |
|----------|------|----------|---------|
| `id` | String (UUID) | ✅ | Unique identifier |
| `name` | String | ✅ | Company name |
| `industry` | String | ✅ | e.g., "Fintech", "E-commerce" |
| `size` | String | ✅ | e.g., "1–50", "501–1000" |

---

### `Location`
| Property | Type | Required | Purpose |
|----------|------|----------|---------|
| `id` | String (UUID) | ✅ | Unique identifier |
| `city` | String | ✅ | City name (e.g., "San Francisco") |
| `country` | String | ✅ | Country (e.g., "USA") |
| `remote` | Boolean | ✅ | true if this is a remote location node |

---

## Relationship Types

### `(:Candidate)-[:HAS_SKILL]->(:Skill)`
| Property | Type | Required | Purpose |
|----------|------|----------|---------|
| `yearsOfExperience` | Integer | ✅ | Self-reported years with this skill |
| `proficiencyLevel` | String | ✅ | One of: Beginner, Intermediate, Advanced, Expert |

**Purpose:** Maps what skills the candidate holds. Drives direct matching (Q2) and multi-hop discovery (Q4).

---

### `(:Job)-[:REQUIRES]->(:Skill)`
| Property | Type | Required | Purpose |
|----------|------|----------|---------|
| `importance` | String | ✅ | One of: required, preferred |

**Purpose:** Defines what the job needs. Core of all matching logic.

---

### `(:Job)-[:POSTED_BY]->(:Company)`
*(No properties)*

**Purpose:** Links job to its hiring company. Used in Q2, Q4, Q5.

---

### `(:Job)-[:LOCATED_IN]->(:Location)`
*(No properties)*

**Purpose:** Geographic association for location filtering (Q2, Q8).

---

### `(:Skill)-[:RELATED_TO]->(:Skill)`
| Property | Type | Required | Purpose |
|----------|------|----------|---------|
| `strength` | Float (0.0–1.0) | ✅ | How closely related the skills are |

**Purpose:** This is the central graph-differentiating relationship. Enables 3-hop extended matching (Q4) and 4-hop company discovery (Q5). Bidirectional in the data (both directions created).

---

### `(:Candidate)-[:PREFERS]->(:Location)`
*(No properties)*

**Purpose:** Candidate's preferred work locations. Used for UI display on Dashboard.

---

## Graph Diagram (README-ready)

```
                    ┌────────────────────────────────────┐
                    │           Candidate                │
                    │  id, name, title, bio, email       │
                    └────────────┬───────────┬───────────┘
                                 │           │
                    HAS_SKILL    │           │  PREFERS
              (yearsOfExp,       │           │
               proficiency)      ▼           ▼
                    ┌────────────────┐   ┌──────────────────┐
                    │     Skill      │   │    Location      │
                    │ id, name,      │   │ id, city,        │
                    │ category       │   │ country, remote  │
                    └───┬────────┬───┘   └────────┬─────────┘
                        │        │                 │
           RELATED_TO   │        │ ▲               │ LOCATED_IN
           (strength)   │        │ │               │
                        ▼        │ │ REQUIRES      │
                    ┌────────────┘ │(importance)   │
                    │     Skill    │               │
                    └─────────────►┌───────────────▼──────────┐
                                  │           Job             │
                                  │ id, title, description,  │
                                  │ employmentType,           │
                                  │ salaryRange, postedAt     │
                                  └────────────┬──────────────┘
                                               │
                                   POSTED_BY   │
                                               ▼
                                  ┌────────────────────────┐
                                  │        Company         │
                                  │ id, name, industry,    │
                                  │ size                   │
                                  └────────────────────────┘
```

**Simplified text version (for README):**
```
Candidate ──HAS_SKILL──► Skill ──RELATED_TO──► Skill
                           ▲                     │
                           │                  REQUIRES
                        REQUIRES                 │
                           │                     ▼
                          Job ◄─────────────── Job
                           │
                        POSTED_BY
                           ▼
                        Company

Candidate ──PREFERS──► Location ◄──LOCATED_IN── Job
```

---

## Query Support Verification

| Query | Traversal Path | Model Nodes Used | Supported? |
|-------|---------------|-----------------|-----------|
| Q1 — Candidate + Skills | `(c)-[:HAS_SKILL]->(s)` | Candidate, Skill, HAS_SKILL | ✅ |
| Q2 — Direct matching | `(c)-[:HAS_SKILL]->(s)<-[:REQUIRES]-(j)-[:POSTED_BY]->(co)-[:LOCATED_IN]->(l)` | All 5 nodes | ✅ |
| Q3 — Match/missing/close skills | `(c)-[:HAS_SKILL]->(cs)` + `(j)-[:REQUIRES]->(js)` | Candidate, Skill, Job | ✅ |
| Q4 — Extended 3-hop | `(c)-[:HAS_SKILL]->(cs)-[:RELATED_TO]->(rs)<-[:REQUIRES]-(j)-[:POSTED_BY]->(co)` | All 5 nodes | ✅ |
| Q5 — Company discovery 4-hop | Same as Q4 + `→Company` | All nodes | ✅ |
| Q6 — Related jobs | `(j)-[:REQUIRES]->(s)<-[:REQUIRES]-(j2)-[:POSTED_BY]->(co)` | Job, Skill, Company | ✅ |
| Q7 — Graph Explorer subgraph | Variable path combining all relationships | All 5 nodes | ✅ |
| Q8 — Search/filter | `(j)-[:POSTED_BY]->(co)`, `(j)-[:LOCATED_IN]->(l)` with WHERE | Job, Company, Location | ✅ |

---

## Index & Constraint Strategy

These constraints and indexes should be created before seeding.

### Uniqueness Constraints (also creates index automatically)
```cypher
CREATE CONSTRAINT candidate_id IF NOT EXISTS FOR (c:Candidate) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT skill_id IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT skill_name IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE;
CREATE CONSTRAINT job_id IF NOT EXISTS FOR (j:Job) REQUIRE j.id IS UNIQUE;
CREATE CONSTRAINT company_id IF NOT EXISTS FOR (co:Company) REQUIRE co.id IS UNIQUE;
CREATE CONSTRAINT location_id IF NOT EXISTS FOR (l:Location) REQUIRE l.id IS UNIQUE;
```

### Performance Indexes
```cypher
CREATE INDEX job_employment_type IF NOT EXISTS FOR (j:Job) ON (j.employmentType);
CREATE INDEX skill_category IF NOT EXISTS FOR (s:Skill) ON (s.category);
```

> NOTE: `IF NOT EXISTS` syntax makes constraint creation idempotent — safe for repeated seed runs.
> Must verify CognoDB openCypher supports `IF NOT EXISTS` syntax. Fallback: wrap in try/catch per constraint.

---

## openCypher Compatibility Notes

The following features are used and must be verified against CognoDB:

| Feature | Used in | Risk |
|---------|---------|------|
| `MERGE` with `ON CREATE SET` | Seed script | Low — standard openCypher |
| `collect()` aggregate | Q1, Q2 | Low — standard |
| List comprehension `[x IN list WHERE ...]` | Q3 | Medium — verify CognoDB supports |
| Variable-length paths `[:RELATED_TO*0..1]` | Q7 | Medium — verify CognoDB supports |
| `NULL` parameter in WHERE | Q8 | Medium — verify behavior |
| `round()` function | Q2 | Low — standard |
| `toLower()` function | Q8 | Low — standard |
| `CREATE CONSTRAINT ... IF NOT EXISTS` | Schema setup | Medium — verify syntax |
