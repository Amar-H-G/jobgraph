import axios from 'axios';

const rawBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api';
const baseURL = rawBase.endsWith('/api') || rawBase === '/api' ? rawBase : `${rawBase.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL,
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
