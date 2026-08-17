const candidateService = require('../services/candidateService');

function notFound(res, msg) { res.status(404).json({ error: msg }); }

const CANDIDATE_ID = process.env.DEMO_CANDIDATE_ID || 'alex-chen';

async function getCandidate(req, res, next) {
  try {
    const candidate = await candidateService.getCandidateById(req.params.id);
    if (!candidate) return notFound(res, 'Candidate not found.');
    res.json(candidate);
  } catch (err) { next(err); }
}

async function getDirectJobs(req, res, next) {
  try {
    const jobs = await candidateService.getDirectMatchingJobs(req.params.id);
    res.json(jobs);
  } catch (err) { next(err); }
}

async function getExtendedJobs(req, res, next) {
  try {
    const jobs = await candidateService.getExtendedMatchingJobs(req.params.id);
    res.json(jobs);
  } catch (err) { next(err); }
}

async function getCompanies(req, res, next) {
  try {
    const companies = await candidateService.getRelatedCompanies(req.params.id);
    res.json(companies);
  } catch (err) { next(err); }
}

module.exports = { getCandidate, getDirectJobs, getExtendedJobs, getCompanies };
