import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { getCandidate, getDirectJobs, getExtendedJobs, getRelatedCompanies } from '../api';
import { JobCard } from '../components/JobCard';
import { ErrorState, SkeletonCard } from '../components/States';

const CANDIDATE_ID = 'alex-chen';

const CATEGORY_ORDER = ['Frontend', 'Backend', 'DevOps', 'Data', 'General'];

function groupSkills(skills) {
  return CATEGORY_ORDER.reduce((acc, cat) => {
    const group = skills.filter(s => s.category === cat);
    if (group.length) acc[cat] = group;
    return acc;
  }, {});
}

export default function Dashboard() {
  const candidate  = useFetch(() => getCandidate(CANDIDATE_ID),        []);
  const directJobs = useFetch(() => getDirectJobs(CANDIDATE_ID),       []);
  const extJobs    = useFetch(() => getExtendedJobs(CANDIDATE_ID),     []);
  const companies  = useFetch(() => getRelatedCompanies(CANDIDATE_ID), []);

  const skills  = candidate.data?.skills || [];
  const grouped = groupSkills(skills);
  const topJobs = (directJobs.data || []).slice(0, 3);

  return (
    <div>
      {/* ── Profile Card ── */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {candidate.loading && <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}><div className="spinner" /><span style={{ color: 'var(--text-muted)' }}>Loading profile…</span></div>}
        {candidate.error  && <ErrorState message={candidate.error} onRetry={candidate.refetch} />}
        {candidate.data && (
          <>
            {/* Avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.75rem', fontWeight: 800, flexShrink: 0,
            }}>
              {candidate.data.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>{candidate.data.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.375rem' }}>{candidate.data.title}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: 600 }}>{candidate.data.bio}</div>
              {candidate.data.preferredLocations?.length > 0 && (
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 Prefers:</span>
                  {candidate.data.preferredLocations.map(l => (
                    <span key={l.id} className="chip chip-default">{l.remote ? 'Remote' : l.city}</span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{skills.length}</div>
          <div className="stat-label">Skills</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--green)' }}>
            {directJobs.loading ? '…' : (directJobs.data?.length ?? 0)}
          </div>
          <div className="stat-label">Direct Matches</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--purple)' }}>
            {extJobs.loading ? '…' : (extJobs.data?.length ?? 0)}
          </div>
          <div className="stat-label">Extended Matches</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--amber)' }}>
            {companies.loading ? '…' : (companies.data?.length ?? 0)}
          </div>
          <div className="stat-label">Companies via Graph</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
        {/* ── Left column ── */}
        <div>
          {/* Skills */}
          <div style={{ marginBottom: '2rem' }}>
            <div className="section-title">Your Skills</div>
            {candidate.loading && <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>{[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 26, width: 90, borderRadius: 999 }} />)}</div>}
            {candidate.data && Object.entries(grouped).map(([cat, catSkills]) => (
              <div key={cat} style={{ marginBottom: '0.875rem' }}>
                <div className="skill-section-label">{cat}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {catSkills.map(s => (
                    <span key={s.id} className={`chip chip-${cat.toLowerCase()}`} title={`${s.years} yr · ${s.level}`}>
                      {s.name}
                      <span style={{ opacity: 0.65, marginLeft: 2 }}>· {s.years}yr</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Top matching jobs */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="section-title" style={{ marginBottom: 0 }}>Top Matches</div>
              <Link to="/jobs" className="btn btn-ghost" style={{ fontSize: '0.8125rem' }}>View all →</Link>
            </div>
            {directJobs.loading && <div className="grid-2">{[1,2].map(i => <SkeletonCard key={i} height={200} />)}</div>}
            {directJobs.error  && <ErrorState message={directJobs.error} onRetry={directJobs.refetch} />}
            {!directJobs.loading && !directJobs.error && (
              topJobs.length > 0
                ? <div className="grid-2">{topJobs.map(j => <JobCard key={j.jobId} job={j} candidateId={CANDIDATE_ID} />)}</div>
                : <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                    <div className="empty-state-icon">🎯</div>
                    <div className="empty-state-title">No direct matches yet</div>
                  </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div>
          <div className="section-title">Companies via Related Skills</div>
          <div className="section-subtitle">Hiring for skills adjacent to yours</div>
          {companies.loading && [...Array(3)].map((_, i) => <SkeletonCard key={i} height={90} />)}
          {companies.error  && <ErrorState message={companies.error} onRetry={companies.refetch} />}
          {!companies.loading && !companies.error && (companies.data || []).map(co => (
            <div key={co.companyId} className="card" style={{ marginBottom: '0.75rem', padding: '1rem 1.25rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{co.companyName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{co.industry} · {co.openRoles} open {co.openRoles === 1 ? 'role' : 'roles'}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {(co.bridgeSkills || []).map(sk => (
                  <span key={sk} className="chip chip-purple" style={{ fontSize: '0.6875rem' }}>🔗 {sk}</span>
                ))}
              </div>
            </div>
          ))}
          {!companies.loading && !companies.error && (companies.data || []).length === 0 && (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <div className="empty-state-desc">No related company opportunities found</div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: stack columns */}
      <style>{`
        @media (max-width: 900px) {
          .dashboard-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
