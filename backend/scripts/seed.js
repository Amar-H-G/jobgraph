/**
 * JobGraph — Seed Script
 * Populates CognoDB with realistic data for the demo.
 * Safe to re-run: uses MERGE to avoid duplicate nodes/relationships.
 *
 * Run: npm run seed
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(process.env.COGNODB_USERNAME, process.env.COGNODB_PASSWORD)
);

async function run(session, query, params = {}) {
  await session.run(query, params);
}

// ────────────────────────────────────────────────────────────────
// DATA
// ────────────────────────────────────────────────────────────────

const SKILLS = [
  // Frontend
  { id: 'skill-react',      name: 'React',        category: 'Frontend' },
  { id: 'skill-vue',        name: 'Vue.js',       category: 'Frontend' },
  { id: 'skill-typescript', name: 'TypeScript',   category: 'Frontend' },
  { id: 'skill-tailwind',   name: 'Tailwind CSS', category: 'Frontend' },
  { id: 'skill-nextjs',     name: 'Next.js',      category: 'Frontend' },
  // Backend
  { id: 'skill-nodejs',     name: 'Node.js',      category: 'Backend'  },
  { id: 'skill-python',     name: 'Python',       category: 'Backend'  },
  { id: 'skill-go',         name: 'Go',           category: 'Backend'  },
  { id: 'skill-postgres',   name: 'PostgreSQL',   category: 'Backend'  },
  { id: 'skill-mongodb',    name: 'MongoDB',       category: 'Backend'  },
  { id: 'skill-redis',      name: 'Redis',         category: 'Backend'  },
  { id: 'skill-graphql',    name: 'GraphQL',       category: 'Backend'  },
  { id: 'skill-rest',       name: 'REST APIs',     category: 'Backend'  },
  // DevOps
  { id: 'skill-docker',     name: 'Docker',        category: 'DevOps'   },
  { id: 'skill-kubernetes', name: 'Kubernetes',    category: 'DevOps'   },
  { id: 'skill-aws',        name: 'AWS',           category: 'DevOps'   },
  { id: 'skill-gcp',        name: 'GCP',           category: 'DevOps'   },
  // General
  { id: 'skill-git',        name: 'Git',           category: 'General'  },
  { id: 'skill-sql',        name: 'SQL',           category: 'General'  },
  { id: 'skill-system-design', name: 'System Design', category: 'General' },
];

// [fromId, toId, strength] — bidirectional pairs
const SKILL_RELATIONS = [
  ['skill-react',    'skill-vue',        0.80],
  ['skill-react',    'skill-typescript', 0.90],
  ['skill-react',    'skill-nextjs',     0.95],
  ['skill-nodejs',   'skill-python',     0.60],
  ['skill-nodejs',   'skill-go',         0.55],
  ['skill-mongodb',  'skill-redis',      0.65],
  ['skill-postgres', 'skill-sql',        0.95],
  ['skill-postgres', 'skill-mongodb',    0.60],
  ['skill-docker',   'skill-kubernetes', 0.90],
  ['skill-aws',      'skill-gcp',        0.70],
  ['skill-graphql',  'skill-rest',       0.70],
  ['skill-typescript','skill-javascript',0.95], // javascript not in skills list intentionally
];

const LOCATIONS = [
  { id: 'loc-sf',     city: 'San Francisco', country: 'USA',    remote: false },
  { id: 'loc-ny',     city: 'New York',      country: 'USA',    remote: false },
  { id: 'loc-london', city: 'London',        country: 'UK',     remote: false },
  { id: 'loc-remote', city: 'Remote',        country: 'Global', remote: true  },
  { id: 'loc-berlin', city: 'Berlin',        country: 'Germany',remote: false },
];

const COMPANIES = [
  { id: 'co-stripe',  name: 'Stripe',  industry: 'Fintech',    size: '1001–5000' },
  { id: 'co-airbnb',  name: 'Airbnb',  industry: 'Travel',     size: '5001–10000' },
  { id: 'co-shopify', name: 'Shopify', industry: 'E-commerce', size: '5001–10000' },
  { id: 'co-notion',  name: 'Notion',  industry: 'Productivity',size: '201–500' },
  { id: 'co-vercel',  name: 'Vercel',  industry: 'DevTools',   size: '51–200' },
];

const CANDIDATE = {
  id:    'alex-chen',
  name:  'Alex Chen',
  title: 'Full-Stack Engineer',
  bio:   'Passionate engineer with 4 years building modern web applications. Love working across the stack from React UIs to Node.js APIs.',
  email: 'alex.chen@example.com',
};

// [skillId, years, level]
const CANDIDATE_SKILLS = [
  ['skill-react',      4, 'Advanced'],
  ['skill-typescript', 3, 'Advanced'],
  ['skill-nodejs',     4, 'Advanced'],
  ['skill-mongodb',    3, 'Intermediate'],
  ['skill-rest',       4, 'Expert'],
  ['skill-git',        5, 'Expert'],
  ['skill-docker',     2, 'Intermediate'],
];

const CANDIDATE_PREFS = ['loc-sf', 'loc-remote'];

// Jobs: [id, title, desc, type, salary, postedAt, companyId, locationId, requiredSkillIds[]]
const JOBS = [
  // ── Direct matches for Alex (high overlap with alex's skills)
  {
    id: 'job-stripe-fe',
    title: 'Senior Frontend Engineer',
    description: 'Build the next generation of Stripe\'s dashboard using React and TypeScript. You\'ll own key product surfaces, collaborate with design, and ship features used by millions.',
    employmentType: 'Full-time',
    salaryRange: '$160k–$200k',
    postedAt: '2026-08-01',
    companyId: 'co-stripe',
    locationId: 'loc-sf',
    skills: [
      ['skill-react', 'required'],
      ['skill-typescript', 'required'],
      ['skill-nodejs', 'preferred'],
      ['skill-git', 'required'],
    ],
  },
  {
    id: 'job-notion-fe',
    title: 'Frontend Engineer — Editor',
    description: 'Work on Notion\'s core editing experience. You\'ll deep-dive into complex UI problems, optimize performance, and build new block types with React.',
    employmentType: 'Full-time',
    salaryRange: '$140k–$175k',
    postedAt: '2026-08-05',
    companyId: 'co-notion',
    locationId: 'loc-remote',
    skills: [
      ['skill-react', 'required'],
      ['skill-typescript', 'required'],
      ['skill-rest', 'preferred'],
      ['skill-git', 'required'],
    ],
  },
  {
    id: 'job-vercel-fullstack',
    title: 'Full-Stack Engineer',
    description: 'Join Vercel\'s product team to build the platform that millions of developers use to deploy applications. Work across React frontend and Node.js APIs.',
    employmentType: 'Remote',
    salaryRange: '$150k–$185k',
    postedAt: '2026-08-10',
    companyId: 'co-vercel',
    locationId: 'loc-remote',
    skills: [
      ['skill-react', 'required'],
      ['skill-nodejs', 'required'],
      ['skill-typescript', 'required'],
      ['skill-docker', 'preferred'],
      ['skill-git', 'required'],
    ],
  },
  {
    id: 'job-shopify-backend',
    title: 'Backend Node.js Engineer',
    description: 'Scale Shopify\'s commerce platform. Build APIs that handle Black Friday traffic spikes. Work with Node.js, MongoDB, and Redis.',
    employmentType: 'Full-time',
    salaryRange: '$145k–$180k',
    postedAt: '2026-08-03',
    companyId: 'co-shopify',
    locationId: 'loc-ny',
    skills: [
      ['skill-nodejs', 'required'],
      ['skill-mongodb', 'required'],
      ['skill-redis', 'preferred'],
      ['skill-rest', 'required'],
      ['skill-docker', 'preferred'],
    ],
  },
  {
    id: 'job-airbnb-fe',
    title: 'React Engineer — Listing Experience',
    description: 'Own the listing creation and management experience at Airbnb. Build high-quality React components and collaborate with product teams.',
    employmentType: 'Full-time',
    salaryRange: '$155k–$195k',
    postedAt: '2026-08-07',
    companyId: 'co-airbnb',
    locationId: 'loc-sf',
    skills: [
      ['skill-react', 'required'],
      ['skill-typescript', 'preferred'],
      ['skill-rest', 'required'],
      ['skill-graphql', 'preferred'],
      ['skill-git', 'required'],
    ],
  },

  // ── Partial matches (Alex has some but not all skills)
  {
    id: 'job-stripe-platform',
    title: 'Platform Engineer',
    description: 'Build Stripe\'s developer platform infrastructure. Work with Go, Kubernetes, and AWS to ensure reliability at scale.',
    employmentType: 'Full-time',
    salaryRange: '$170k–$210k',
    postedAt: '2026-08-02',
    companyId: 'co-stripe',
    locationId: 'loc-sf',
    skills: [
      ['skill-go', 'required'],
      ['skill-kubernetes', 'required'],
      ['skill-docker', 'required'],
      ['skill-aws', 'required'],
      ['skill-system-design', 'required'],
    ],
  },
  {
    id: 'job-airbnb-data',
    title: 'Data Engineer',
    description: 'Build and maintain Airbnb\'s data pipelines. Design scalable data models using PostgreSQL and Python.',
    employmentType: 'Full-time',
    salaryRange: '$140k–$170k',
    postedAt: '2026-08-08',
    companyId: 'co-airbnb',
    locationId: 'loc-sf',
    skills: [
      ['skill-python', 'required'],
      ['skill-postgres', 'required'],
      ['skill-sql', 'required'],
      ['skill-docker', 'preferred'],
    ],
  },

  // ── Extended matches only (reachable via RELATED_TO from Alex's skills)
  // Alex has React → related to Vue.js → Vue jobs
  {
    id: 'job-notion-vue',
    title: 'Vue.js Frontend Engineer',
    description: 'Help build Notion\'s web experience using Vue.js. Strong component design skills required.',
    employmentType: 'Full-time',
    salaryRange: '$130k–$165k',
    postedAt: '2026-08-09',
    companyId: 'co-notion',
    locationId: 'loc-berlin',
    skills: [
      ['skill-vue', 'required'],
      ['skill-typescript', 'preferred'],
      ['skill-rest', 'preferred'],
    ],
  },
  // Alex has React → related to Next.js → Next.js jobs
  {
    id: 'job-vercel-nextjs',
    title: 'Next.js Solutions Engineer',
    description: 'Help Vercel\'s largest customers succeed with Next.js. Deep framework knowledge and customer-facing skills required.',
    employmentType: 'Remote',
    salaryRange: '$130k–$160k',
    postedAt: '2026-08-11',
    companyId: 'co-vercel',
    locationId: 'loc-remote',
    skills: [
      ['skill-nextjs', 'required'],
      ['skill-typescript', 'preferred'],
      ['skill-git', 'preferred'],
    ],
  },
  // Alex has MongoDB → related to PostgreSQL → postgres jobs
  {
    id: 'job-shopify-db',
    title: 'Database Engineer',
    description: 'Own Shopify\'s database layer. Optimize PostgreSQL queries, design schemas, and ensure data integrity.',
    employmentType: 'Full-time',
    salaryRange: '$145k–$175k',
    postedAt: '2026-08-04',
    companyId: 'co-shopify',
    locationId: 'loc-ny',
    skills: [
      ['skill-postgres', 'required'],
      ['skill-sql', 'required'],
      ['skill-python', 'preferred'],
    ],
  },
  // Alex has REST → related to GraphQL → GraphQL jobs
  {
    id: 'job-airbnb-graphql',
    title: 'GraphQL API Engineer',
    description: 'Design and build Airbnb\'s GraphQL API layer. Own the API platform that powers the Airbnb app.',
    employmentType: 'Full-time',
    salaryRange: '$150k–$185k',
    postedAt: '2026-08-06',
    companyId: 'co-airbnb',
    locationId: 'loc-sf',
    skills: [
      ['skill-graphql', 'required'],
      ['skill-nodejs', 'preferred'],
      ['skill-typescript', 'preferred'],
    ],
  },
  // Alex has Docker → related to Kubernetes → K8s jobs
  {
    id: 'job-stripe-k8s',
    title: 'Infrastructure Engineer',
    description: 'Run Stripe\'s Kubernetes infrastructure. Manage cluster operations, build tooling, and ensure uptime.',
    employmentType: 'Full-time',
    salaryRange: '$165k–$200k',
    postedAt: '2026-08-12',
    companyId: 'co-stripe',
    locationId: 'loc-sf',
    skills: [
      ['skill-kubernetes', 'required'],
      ['skill-aws', 'required'],
      ['skill-go', 'preferred'],
    ],
  },

  // ── No match / very low match for Alex (demonstrates empty/low states)
  {
    id: 'job-vercel-devrel',
    title: 'Developer Advocate',
    description: 'Represent Vercel at conferences, create content, and help developers succeed with the platform.',
    employmentType: 'Remote',
    salaryRange: '$120k–$150k',
    postedAt: '2026-08-13',
    companyId: 'co-vercel',
    locationId: 'loc-remote',
    skills: [
      ['skill-nextjs', 'required'],
      ['skill-python', 'preferred'],
      ['skill-gcp', 'preferred'],
    ],
  },
  {
    id: 'job-shopify-go',
    title: 'Go Backend Engineer',
    description: 'Build high-performance services in Go to power Shopify\'s commerce APIs.',
    employmentType: 'Contract',
    salaryRange: '$100/hr',
    postedAt: '2026-08-14',
    companyId: 'co-shopify',
    locationId: 'loc-ny',
    skills: [
      ['skill-go', 'required'],
      ['skill-postgres', 'required'],
      ['skill-kubernetes', 'preferred'],
      ['skill-system-design', 'required'],
    ],
  },
];

// ────────────────────────────────────────────────────────────────
// SEED FUNCTIONS
// ────────────────────────────────────────────────────────────────

async function createConstraints(session) {
  console.log('Creating constraints...');
  const constraints = [
    `CREATE CONSTRAINT candidate_id IF NOT EXISTS FOR (c:Candidate) REQUIRE c.id IS UNIQUE`,
    `CREATE CONSTRAINT skill_id IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE`,
    `CREATE CONSTRAINT skill_name IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE`,
    `CREATE CONSTRAINT job_id IF NOT EXISTS FOR (j:Job) REQUIRE j.id IS UNIQUE`,
    `CREATE CONSTRAINT company_id IF NOT EXISTS FOR (co:Company) REQUIRE co.id IS UNIQUE`,
    `CREATE CONSTRAINT location_id IF NOT EXISTS FOR (l:Location) REQUIRE l.id IS UNIQUE`,
  ];
  for (const c of constraints) {
    try {
      await run(session, c);
    } catch (err) {
      // Some CognoDB versions may not support IF NOT EXISTS — log and continue
      console.warn(`  Constraint warning (may already exist): ${err.message}`);
    }
  }
  console.log('Constraints done.');
}

async function seedSkills(session) {
  console.log(`Seeding ${SKILLS.length} skills...`);
  for (const s of SKILLS) {
    await run(session,
      `MERGE (s:Skill {id: $id})
       ON CREATE SET s.name = $name, s.category = $category
       ON MATCH SET  s.name = $name, s.category = $category`,
      s
    );
  }
}

async function seedSkillRelations(session) {
  console.log(`Seeding ${SKILL_RELATIONS.length} skill relations (bidirectional)...`);
  for (const [fromId, toId, strength] of SKILL_RELATIONS) {
    // Create both directions
    await run(session,
      `MATCH (a:Skill {id: $fromId}), (b:Skill {id: $toId})
       MERGE (a)-[r:RELATED_TO]->(b)
       ON CREATE SET r.strength = $strength
       ON MATCH SET  r.strength = $strength`,
      { fromId, toId, strength }
    );
    await run(session,
      `MATCH (a:Skill {id: $fromId}), (b:Skill {id: $toId})
       MERGE (b)-[r:RELATED_TO]->(a)
       ON CREATE SET r.strength = $strength
       ON MATCH SET  r.strength = $strength`,
      { fromId, toId, strength }
    );
  }
}

async function seedLocations(session) {
  console.log(`Seeding ${LOCATIONS.length} locations...`);
  for (const l of LOCATIONS) {
    await run(session,
      `MERGE (l:Location {id: $id})
       ON CREATE SET l.city = $city, l.country = $country, l.remote = $remote
       ON MATCH SET  l.city = $city, l.country = $country, l.remote = $remote`,
      l
    );
  }
}

async function seedCompanies(session) {
  console.log(`Seeding ${COMPANIES.length} companies...`);
  for (const c of COMPANIES) {
    await run(session,
      `MERGE (co:Company {id: $id})
       ON CREATE SET co.name = $name, co.industry = $industry, co.size = $size
       ON MATCH SET  co.name = $name, co.industry = $industry, co.size = $size`,
      c
    );
  }
}

async function seedCandidate(session) {
  console.log('Seeding candidate Alex Chen...');
  await run(session,
    `MERGE (c:Candidate {id: $id})
     ON CREATE SET c.name = $name, c.title = $title, c.bio = $bio, c.email = $email
     ON MATCH SET  c.name = $name, c.title = $title, c.bio = $bio, c.email = $email`,
    CANDIDATE
  );

  for (const [skillId, years, level] of CANDIDATE_SKILLS) {
    await run(session,
      `MATCH (c:Candidate {id: $cid}), (s:Skill {id: $sid})
       MERGE (c)-[r:HAS_SKILL]->(s)
       ON CREATE SET r.yearsOfExperience = $years, r.proficiencyLevel = $level
       ON MATCH SET  r.yearsOfExperience = $years, r.proficiencyLevel = $level`,
      { cid: CANDIDATE.id, sid: skillId, years, level }
    );
  }

  for (const locId of CANDIDATE_PREFS) {
    await run(session,
      `MATCH (c:Candidate {id: $cid}), (l:Location {id: $lid})
       MERGE (c)-[:PREFERS]->(l)`,
      { cid: CANDIDATE.id, lid: locId }
    );
  }
}

async function seedJobs(session) {
  console.log(`Seeding ${JOBS.length} jobs...`);
  for (const job of JOBS) {
    const { id, title, description, employmentType, salaryRange, postedAt, companyId, locationId, skills } = job;

    await run(session,
      `MERGE (j:Job {id: $id})
       ON CREATE SET j.title = $title, j.description = $description,
                     j.employmentType = $employmentType, j.salaryRange = $salaryRange,
                     j.postedAt = $postedAt
       ON MATCH SET  j.title = $title, j.description = $description,
                     j.employmentType = $employmentType, j.salaryRange = $salaryRange,
                     j.postedAt = $postedAt`,
      { id, title, description, employmentType, salaryRange, postedAt }
    );

    await run(session,
      `MATCH (j:Job {id: $jid}), (co:Company {id: $coid})
       MERGE (j)-[:POSTED_BY]->(co)`,
      { jid: id, coid: companyId }
    );

    await run(session,
      `MATCH (j:Job {id: $jid}), (l:Location {id: $lid})
       MERGE (j)-[:LOCATED_IN]->(l)`,
      { jid: id, lid: locationId }
    );

    for (const [skillId, importance] of skills) {
      await run(session,
        `MATCH (j:Job {id: $jid}), (s:Skill {id: $sid})
         MERGE (j)-[r:REQUIRES]->(s)
         ON CREATE SET r.importance = $importance
         ON MATCH SET  r.importance = $importance`,
        { jid: id, sid: skillId, importance }
      );
    }
  }
}

// ────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== JobGraph Seed Script ===\n');
  const session = driver.session();

  try {
    await createConstraints(session);
    await seedSkills(session);
    await seedSkillRelations(session);
    await seedLocations(session);
    await seedCompanies(session);
    await seedCandidate(session);
    await seedJobs(session);

    console.log('\n✅ Seed complete!');
    console.log(`   Skills:    ${SKILLS.length}`);
    console.log(`   Relations: ${SKILL_RELATIONS.length * 2} (bidirectional)`);
    console.log(`   Locations: ${LOCATIONS.length}`);
    console.log(`   Companies: ${COMPANIES.length}`);
    console.log(`   Jobs:      ${JOBS.length}`);
    console.log(`   Candidate: 1 (Alex Chen, id: alex-chen)`);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

main();
