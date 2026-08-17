import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// ─── Candidates ──────────────────────────────────────────
export const getCandidate       = (id) => api.get(`/candidates/${id}`).then(r => r.data);
export const getDirectJobs      = (id) => api.get(`/candidates/${id}/jobs/direct`).then(r => r.data);
export const getExtendedJobs    = (id) => api.get(`/candidates/${id}/jobs/extended`).then(r => r.data);
export const getRelatedCompanies= (id) => api.get(`/candidates/${id}/companies`).then(r => r.data);

// ─── Jobs ────────────────────────────────────────────────
export const getJobs       = (params) => api.get('/jobs', { params }).then(r => r.data);
export const getJob        = (id)     => api.get(`/jobs/${id}`).then(r => r.data);
export const getJobMatch   = (jobId, candidateId) => api.get(`/jobs/${jobId}/match/${candidateId}`).then(r => r.data);
export const getRelatedJobs= (id)     => api.get(`/jobs/${id}/related`).then(r => r.data);

// ─── Graph ───────────────────────────────────────────────
export const getGraphData  = (candidateId) => api.get(`/graph/${candidateId}`).then(r => r.data);
