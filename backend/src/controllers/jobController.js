const jobService = require('../services/jobService');

async function getJob(req, res, next) {
  try {
    const job = await jobService.getJobById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    res.json(job);
  } catch (err) { next(err); }
}

async function getJobMatch(req, res, next) {
  try {
    const breakdown = await jobService.getJobSkillBreakdown(req.params.id, req.params.candidateId);
    res.json(breakdown);
  } catch (err) { next(err); }
}

async function getRelatedJobs(req, res, next) {
  try {
    const related = await jobService.getRelatedJobs(req.params.id);
    res.json(related);
  } catch (err) { next(err); }
}

async function searchJobs(req, res, next) {
  try {
    const { title, city, employmentType } = req.query;
    const jobs = await jobService.searchJobs({ title, city, employmentType, limit: 50 });
    res.json(jobs);
  } catch (err) { next(err); }
}

module.exports = { getJob, getJobMatch, getRelatedJobs, searchJobs };
