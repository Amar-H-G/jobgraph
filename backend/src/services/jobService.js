const { runQuery } = require('../config/database');
const Q = require('../queries/index');

async function getJobById(jobId) {
  const rows = await runQuery(Q.GET_JOB_BY_ID, { jobId });
  if (!rows.length) return null;
  const r = rows[0];
  return {
    jobId:         r.jobId,
    title:         r.title,
    description:   r.description,
    employmentType: r.employmentType,
    salaryRange:   r.salaryRange,
    postedAt:      r.postedAt,
    company: {
      id:       r.companyId,
      name:     r.companyName,
      industry: r.industry,
      size:     r.companySize,
    },
    location: { city: r.city, country: r.country, remote: r.remote },
    requiredSkills: (r.requiredSkills || []).filter(s => s.id != null),
  };
}

async function getJobSkillBreakdown(jobId, candidateId) {
  const rows = await runQuery(Q.GET_JOB_SKILL_BREAKDOWN, { jobId, candidateId });
  if (!rows.length) return { matchingSkills: [], closeSkills: [], missingSkills: [], matchedCount: 0, totalRequired: 0 };
  const r = rows[0];
  const matchScore = r.totalRequired > 0
    ? Math.round((r.matchedCount / r.totalRequired) * 100)
    : 0;
  return { ...r, matchScore };
}

async function getRelatedJobs(jobId) {
  return runQuery(Q.GET_RELATED_JOBS, { jobId });
}

async function searchJobs({ title, city, employmentType, limit = 50 }) {
  return runQuery(Q.GET_JOBS_FILTERED, {
    title:          title          || null,
    city:           city           || null,
    employmentType: employmentType || null,
    limit:          limit,
  });
}

module.exports = { getJobById, getJobSkillBreakdown, getRelatedJobs, searchJobs };
