# JobGraph 🌐 — Graph-Native Job Matching Platform

> **Wexa AI Take-Home Assignment — Powered by CognoDB**  
> Built with Node.js, Express, React, Vite, and CognoDB Graph Database via Bolt Protocol (`@neo4j/driver`).

---

## 🎯 Overview

**JobGraph** is a graph-first career and skill-matching platform that leverages the native power of **CognoDB** to solve the limitations of traditional keyword and relational job boards. 

Rather than relying on flat SQL tables or naive text searches, JobGraph models the entire recruitment ecosystem as an interconnected graph:
- **Candidates** connect to **Skills** they master.
- **Skills** connect to each other via bidirectional semantic similarity relationships (`RELATED_TO`).
- **Jobs** declare skill requirements (`REQUIRES`) and are posted by **Companies** (`POSTED_BY`) in specific **Locations** (`LOCATED_IN`).

Through **3-hop** and **4-hop graph traversals**, JobGraph unlocks **Extended Matching** — surfacing high-fit career opportunities that candidates are qualified for via adjacent skills, and identifying companies actively hiring across related domains.

---

## 🏗️ System Architecture

JobGraph follows a clean, layered, pure JavaScript full-stack architecture:

```
┌────────────────────────────────────────────────────────┐
│               Frontend (React 18 + Vite)               │
│   Dashboard  │  Job Discovery  │  Job Detail  │  Graph │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (Axios)
┌───────────────────────────▼────────────────────────────┐
│              Backend API (Express.js / Node)           │
│   Routes  ──►  Controllers  ──►  Services              │
└───────────────────────────┬────────────────────────────┘
                            │ Parameterized Cypher Queries
┌───────────────────────────▼────────────────────────────┐
│           CognoDB Graph Database (Bolt Protocol)       │
│  5 Node Labels  │  7 Edge Types  │  6 Constraints      │
└────────────────────────────────────────────────────────┘
```

---

## 📊 Graph Data Model

### Node Labels
| Label | Description | Primary Key | Key Properties |
|---|---|---|---|
| `:Candidate` | Job seeker profile | `id` | `name`, `title`, `bio`, `email` |
| `:Skill` | Technical & domain skills | `id` | `name`, `category` (Frontend, Backend, DevOps, etc.) |
| `:Job` | Open job posting | `id` | `title`, `description`, `employmentType`, `salaryRange`, `postedAt` |
| `:Company` | Employer organization | `id` | `name`, `industry`, `size` |
| `:Location` | Geographic / Remote location | `id` | `city`, `country`, `remote` (boolean) |

### Relationship Types
```
(:Candidate)-[:HAS_SKILL {yearsOfExperience, proficiencyLevel}]->(:Skill)
(:Candidate)-[:PREFERS]->(:Location)
(:Skill)-[:RELATED_TO {strength}]->(:Skill)
(:Job)-[:REQUIRES {importance}]->(:Skill)
(:Job)-[:POSTED_BY]->(:Company)
(:Job)-[:LOCATED_IN]->(:Location)
```

---

## ⚡ Multi-Hop Graph Traversal Highlights

### 1. Extended Job Matching (3-Hop Traversal)
Finds jobs that require skills adjacent to those possessed by the candidate:
$$\text{Candidate} \xrightarrow{\text{HAS\_SKILL}} \text{Skill} \xrightarrow{\text{RELATED\_TO}} \text{Skill} \xleftarrow{\text{REQUIRES}} \text{Job}$$

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

RETURN j.id AS jobId, j.title AS title, co.name AS companyName,
       l.city AS city, l.remote AS remote, bridgePaths, requiredSkills
```

### 2. Company Discovery via Related Skills (4-Hop Traversal — Relationally Awkward)
Surfaces companies hiring in tech stacks adjacent to the candidate's core expertise:
$$\text{Candidate} \xrightarrow{\text{HAS\_SKILL}} \text{Skill} \xrightarrow{\text{RELATED\_TO}} \text{Skill} \xleftarrow{\text{REQUIRES}} \text{Job} \xrightarrow{\text{POSTED\_BY}} \text{Company}$$

```cypher
MATCH (c:Candidate {id: $candidateId})-[:HAS_SKILL]->(hs:Skill)
WITH c, collect(hs.id) AS heldIds

MATCH (c)-[:HAS_SKILL]->(cs:Skill)-[:RELATED_TO]->(rs:Skill)
      <-[:REQUIRES]-(j:Job)-[:POSTED_BY]->(co:Company)
WHERE NOT rs.id IN heldIds

WITH co,
     collect(DISTINCT cs.name) AS bridgeSkills,
     count(DISTINCT j)         AS openRoles

RETURN co.id AS companyId, co.name AS companyName, co.industry AS industry,
       co.size AS size, bridgeSkills, openRoles
ORDER BY openRoles DESC
```

> **Why Graph beats SQL here:** In PostgreSQL or MySQL, this query requires a 6-table join with multiple recursive aggregations and anti-joins. In CognoDB, it is expressed as a single, intuitive path pattern evaluated in milliseconds.

---

## 🖥️ User Interface & Pages

1. **Dashboard (`/`)**:
   - Candidate Profile summary (Alex Chen).
   - Real-time KPI stat cards (Skills Count, Direct Matches, Extended Matches, Companies via Graph).
   - Grouped skill chips categorized by domain with years of experience.
   - Top Direct Job Matches with live match percentage.
   - Companies Hiring via Graph Sidebar.

2. **Job Discovery (`/jobs`)**:
   - Tab 1: **Direct Matches** with real-time match scores and skill overlap chips.
   - Tab 2: **Extended Matches (via Related Skills)** displaying bridge paths (e.g., `React → Vue.js`).
   - Interactive search bar and filters (Employment Type, Location).

3. **Job Detail (`/jobs/:id`)**:
   - Complete job posting metadata, salary range, and company overview.
   - 3-bucket Skill Breakdown: **Skills You Have** (Green), **Close via Related Skill** (Purple), **Skills You Need** (Red).
   - Interactive Visual Path Breadcrumb showing exact graph path from Candidate to Employer.
   - Related Jobs recommendation rail.

4. **Graph Explorer (`/graph`)**:
   - Interactive Force-Directed Canvas rendering Candidates, Skills, Jobs, and Companies.
   - Physics simulation with repulsion, link attraction, and centering gravity.
   - Node selection inspector panel and drag-to-reposition physics.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- CognoDB Cloud instance credentials

### 1. Clone & Configure Backend
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your CognoDB connection string:
```env
COGNODB_URI=bolt+s://<instance-id>.databases.cognodb.cloud
COGNODB_USERNAME=cognodb
COGNODB_PASSWORD=<your-password>
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

### 2. Install Dependencies & Seed Graph
```bash
# In /backend
npm install
npm run seed
```

### 3. Verify Cypher Queries Against Live CognoDB
```bash
npm run verify
```

### 4. Start the Application
```bash
# Terminal 1: Backend API
cd backend
npm start

# Terminal 2: Frontend Client
cd frontend
npm install
npm run dev
```

Open [[http://localhost:5173](https://jobgraph-kappa.vercel.app/)](https://jobgraph-kappa.vercel.app/) in your browser.

---

## 🧪 Verification Suite Results

All 9 Cypher queries and subqueries are executed and verified against live CognoDB:

```
=== QUERY VERIFICATION AGAINST COGNODB ===

  ✅ Q1 — Candidate+Skills: 1 row(s) — candidate: Alex Chen, skills: 7
  ✅ Q1b — Preferred Locations: 2 row(s) — San Francisco, Remote
  ✅ Q2 — Direct Matching Jobs: 10 row(s) — top: "Senior Frontend Engineer" @ 100%
  ✅ Q3 — Skill Breakdown: 1 row(s) — matched: 4/4, close: 1, missing: 0
  ✅ Q4 — Extended (3-hop): 11 row(s) — sample: "Vue.js Frontend Engineer" via {"candidateSkill":"React","relatedSkill":"Vue.js"}
  ✅ Q5 — Company Discovery (4-hop): 5 row(s) — Airbnb(3), Shopify(3), Vercel(2), Stripe(2), Notion(1)
  ✅ Q6 — Related Jobs: 5 row(s) — Full-Stack Engineer, Frontend Engineer — Editor, React Engineer — Listing Experience
  ✅ Q7 — Graph Explorer: 121 row(s) — 121 rows returned
  ✅ Q8a — Filter (all): 14 row(s)
  ✅ Q8b — Filter (city=SF): 6 row(s) — 6 jobs in SF
  ✅ Q8c — Filter (title=engineer): 13 row(s) — 13 results
  ✅ Q9 — Get Job By ID: 1 row(s) — title: "Senior Frontend Engineer"

=== VERIFICATION COMPLETE ===
```

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── scripts/
│   │   ├── seed.js             # Graph seed script (MERGE idempotent)
│   │   └── verify-queries.js   # Live query test suite
│   ├── src/
│   │   ├── config/database.js  # Neo4j/CognoDB driver & plain JS serializer
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Centralized error handling
│   │   ├── queries/index.js    # Parameterized Cypher queries (Q1–Q9)
│   │   ├── routes/             # REST routing
│   │   ├── services/           # Graph data transformation & aggregation
│   │   └── app.js              # Express app bootstrap
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/index.js        # Axios API client
│   │   ├── components/         # Navbar, JobCard, SkillChip, States
│   │   ├── hooks/useFetch.js   # Reusable data fetch hook
│   │   ├── pages/              # Dashboard, JobDiscovery, JobDetail, GraphExplorer
│   │   ├── index.css           # Premium Dark Mode Design System
│   │   └── main.jsx
│   └── vite.config.js
├── docs/
│   ├── data-model.md           # Graph Schema, Nodes, Rels, Constraints
│   └── queries.md              # Cypher query traversal breakdown
└── README.md
```

---

## 📄 License & Attribution
Created for the **Wexa AI Take-Home Assessment (CognoDB Assignment 2)**. Built with JavaScript, CognoDB, Express, and React.
