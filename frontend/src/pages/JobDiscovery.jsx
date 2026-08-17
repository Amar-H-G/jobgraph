import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { getDirectJobs, getExtendedJobs } from '../api';
import { JobCard } from '../components/JobCard';
import { EmptyState, ErrorState, SkeletonCard } from '../components/States';

const CANDIDATE_ID = 'alex-chen';

function FilterBar({ filters, onChange }) {
  return (
    <div className="filter-bar">
      <input
        className="input"
        placeholder="Search job title…"
        value={filters.title}
        onChange={e => onChange({ ...filters, title: e.target.value })}
      />
      <select className="select" value={filters.employmentType} onChange={e => onChange({ ...filters, employmentType: e.target.value })}>
        <option value="">All Types</option>
        <option value="Full-time">Full-time</option>
        <option value="Contract">Contract</option>
        <option value="Remote">Remote</option>
      </select>
      <select className="select" value={filters.city} onChange={e => onChange({ ...filters, city: e.target.value })}>
        <option value="">All Locations</option>
        <option value="San Francisco">San Francisco</option>
        <option value="New York">New York</option>
        <option value="London">London</option>
        <option value="Berlin">Berlin</option>
        <option value="Remote">Remote</option>
      </select>
    </div>
  );
}

function applyFilters(jobs, filters) {
  return jobs.filter(j => {
    if (filters.title && !j.title.toLowerCase().includes(filters.title.toLowerCase())) return false;
    if (filters.employmentType && j.employmentType !== filters.employmentType) return false;
    if (filters.city && j.city !== filters.city && !(filters.city === 'Remote' && j.remote)) return false;
    return true;
  });
}

export default function JobDiscovery() {
  const [tab, setTab] = useState('direct');
  const [filters, setFilters] = useState({ title: '', employmentType: '', city: '' });

  const directJobs = useFetch(() => getDirectJobs(CANDIDATE_ID), []);
  const extJobs    = useFetch(() => getExtendedJobs(CANDIDATE_ID), []);

  const activeData  = tab === 'direct' ? (directJobs.data || []) : (extJobs.data || []);
  const activeState = tab === 'direct' ? directJobs : extJobs;
  const filtered    = applyFilters(activeData, filters);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Job Discovery</div>
        <div className="page-desc">Matching jobs powered by graph traversal — direct and extended via related skills</div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn${tab === 'direct' ? ' active' : ''}`}
          onClick={() => setTab('direct')}
        >
          ✓ Direct Matches
          {!directJobs.loading && ` (${directJobs.data?.length ?? 0})`}
        </button>
        <button
          className={`tab-btn${tab === 'extended' ? ' active' : ''}`}
          onClick={() => setTab('extended')}
        >
          ⟳ Extended via Related Skills
          {!extJobs.loading && ` (${extJobs.data?.length ?? 0})`}
        </button>
      </div>

      {/* Extended explanation */}
      {tab === 'extended' && (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.25)', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--purple)' }}>🔗 How extended matching works</strong><br />
            These jobs were found through a <strong>3-hop graph traversal</strong>:
            <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
              You → Skill → <em>Related Skill</em> → Job
            </span>
            . You don't have the required skill directly, but one of your skills is closely related to it — making these roles worth exploring.
          </div>
        </div>
      )}

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Results */}
      {activeState.loading && (
        <div className="grid-2">
          {[1,2,3,4].map(i => <SkeletonCard key={i} height={220} />)}
        </div>
      )}
      {activeState.error && (
        <ErrorState message={activeState.error} onRetry={activeState.refetch} />
      )}
      {!activeState.loading && !activeState.error && (
        filtered.length === 0
          ? <EmptyState
              icon={tab === 'direct' ? '🎯' : '🔗'}
              title={tab === 'direct' ? 'No direct matches found' : 'No extended matches found'}
              desc={
                filters.title || filters.employmentType || filters.city
                  ? 'Try clearing some filters.'
                  : tab === 'direct'
                    ? 'No jobs match your current skills directly.'
                    : 'No jobs found via related skill traversal.'
              }
            />
          : <div className="grid-2">
              {filtered.map(j => (
                <JobCard
                  key={j.jobId}
                  job={j}
                  candidateId={CANDIDATE_ID}
                  extended={tab === 'extended'}
                />
              ))}
            </div>
      )}
    </div>
  );
}
