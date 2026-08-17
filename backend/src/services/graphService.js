const { runQuery } = require('../config/database');
const Q = require('../queries/index');

/**
 * Fetch flat rows from CognoDB and assemble a graph structure
 * (nodes array + edges array) suitable for react-force-graph-2d.
 */
async function getGraphData(candidateId) {
  const rows = await runQuery(Q.GET_GRAPH_EXPLORER_DATA, { candidateId });

  const nodesMap = new Map();
  const edgesSet = new Set();
  const edges    = [];

  function addNode(id, label, name, extra = {}) {
    if (id == null || nodesMap.has(id)) return;
    nodesMap.set(id, { id, label, name, ...extra });
  }

  function addEdge(source, target, type) {
    if (source == null || target == null) return;
    const key = `${source}→${type}→${target}`;
    if (edgesSet.has(key)) return;
    edgesSet.add(key);
    edges.push({ source, target, type });
  }

  for (const r of rows) {
    addNode(r.candidateId,  'Candidate', r.candidateName);
    addNode(r.skillId,      'Skill',     r.skillName,     { category: r.skillCategory });
    addNode(r.relSkillId,   'Skill',     r.relSkillName);
    addNode(r.jobId,        'Job',       r.jobTitle);
    addNode(r.jobId2,       'Job',       r.jobTitle2);
    addNode(r.companyId,    'Company',   r.companyName);
    addNode(r.companyId2,   'Company',   r.companyName2);

    addEdge(r.candidateId, r.skillId,    'HAS_SKILL');
    addEdge(r.skillId,     r.relSkillId, 'RELATED_TO');
    addEdge(r.jobId,       r.skillId,    'REQUIRES');
    addEdge(r.jobId2,      r.relSkillId, 'REQUIRES');
    addEdge(r.jobId,       r.companyId,  'POSTED_BY');
    addEdge(r.jobId2,      r.companyId2, 'POSTED_BY');
  }

  return { nodes: Array.from(nodesMap.values()), edges };
}

module.exports = { getGraphData };
