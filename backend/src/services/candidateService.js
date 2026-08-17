const { runQuery } = require('../config/database');
const Q = require('../queries/index');

/**
 * Get candidate profile + skills + preferred locations.
 */
async function getCandidateById(candidateId) {
  const [profileRows, locationRows] = await Promise.all([
    runQuery(Q.GET_CANDIDATE_WITH_SKILLS, { candidateId }),
    runQuery(Q.GET_CANDIDATE_LOCATIONS,   { candidateId }),
  ]);

  if (!profileRows.length) return null;

  const row = profileRows[0];
  // Filter out null skill entries from OPTIONAL MATCH when candidate has no skills
  const skills = (row.skills || []).filter(s => s.id !== null && s.id !== undefined);

  return {
    id:        row.id,
    name:      row.name,
    title:     row.title,
    bio:       row.bio,
    skills,
    preferredLocations: locationRows,
  };
}

/**
 * Get jobs where the candidate has ≥1 matching required skill.
 */
async function getDirectMatchingJobs(candidateId) {
  const rows = await runQuery(Q.GET_DIRECT_MATCHING_JOBS, { candidateId });

  return rows.map(row => ({
    ...row,
    // Derive missingSkills from requiredSkills − matchingSkills
    missingSkills: (row.requiredSkills || []).filter(
      req => !(row.matchingSkills || []).find(m => m.id === req.id)
    ),
  }));
}

/**
 * Get jobs reachable only through related-skill traversal (3-hop).
 */
async function getExtendedMatchingJobs(candidateId) {
  return runQuery(Q.GET_EXTENDED_MATCHING_JOBS, { candidateId });
}

/**
 * Get companies discoverable via candidate → skill → related skill → job → company.
 */
async function getRelatedCompanies(candidateId) {
  return runQuery(Q.GET_COMPANIES_VIA_RELATED_SKILLS, { candidateId });
}

module.exports = {
  getCandidateById,
  getDirectMatchingJobs,
  getExtendedMatchingJobs,
  getRelatedCompanies,
};
