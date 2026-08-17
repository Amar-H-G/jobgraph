import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { getJob, getJobMatch, getRelatedJobs } from '../api';
import { SkillChip, MatchBar, MatchLabel } from '../components/SkillChip';
import { EmptyState, ErrorState, SkeletonCard } from '../components/States';

export default function JobDetail() {
  const { id }             = useParams();
  const [params]           = useSearchParams();
  const candidateId        = params.get('candidate') || 'alex-chen';

  const job      = useFetch(() => getJob(id),                        [id]);
  const match    = useFetch(() => getJobMatch(id, candidateId),      [id, candidateId]);
  const related  = useFetch(() => getRelatedJobs(id),                [id]);

  if (job.loading) return (
    <div>
      <SkeletonCard height={300} />
      <div style={{ marginTop: '1.5rem' }}><SkeletonCard height={200} /></div>
    </div>
  );
  if (job.error) return <ErrorState message={job.error} onRetry={job.refetch} />;
  if (!job.data) return <EmptyState icon="🔍" title="Job not found" />;

  const j = job.data;
  const m = match.data || {};

  const matchScore      = m.matchScore      ?? 0;
  const matchingSkills  = m.matchingSkills  ?? [];
  const closeSkills     = m.closeSkills     ?? [];
  const missingSkills   = m.missingSkills   ?? [];
  const totalRequired   = m.totalRequired   ?? j.requiredSkills?.length ?? 0;

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Back */}
      <Link to="/jobs" className="btn btn-ghost" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
        ← Back to Jobs
      </Link>

      {/* Job header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>{j.title}</h1>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{j.company?.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{j.company?.industry} · {j.company?.size}</div>
          </div>
          {!match.loading && <MatchLabel score={matchScore} />}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <span className="chip chip-default">📍 {j.location?.remote ? 'Remote' : j.location?.city + ', ' + j.location?.country}</span>
          <span className="chip chip-default">💼 {j.employmentType}</span>
          {j.salaryRange && <span className="chip chip-default">💰 {j.salaryRange}</span>}
          <span className="chip chip-default">📅 {j.postedAt}</span>
        </div>

        <div className="divider" />
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{j.description}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
        {/* ── Left: skill breakdown ── */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '1rem' }}>Match Breakdown</div>

            {match.loading && <div className="spinner" />}
            {match.error   && <ErrorState message={match.error} onRetry={match.refetch} />}

            {!match.loading && !match.error && (
              <>
                {/* Score */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {m.matchedCount ?? 0} of {totalRequired} required skills
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '1.25rem', color: matchScore >= 75 ? 'var(--green)' : matchScore >= 50 ? 'var(--blue)' : matchScore >= 25 ? 'var(--amber)' : 'var(--text-muted)' }}>
                      {matchScore}%
                    </span>
                  </div>
                  <MatchBar score={matchScore} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Score = (matching skills / total required skills) × 100
                  </div>
                </div>

                {/* Matching */}
                {matchingSkills.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div className="skill-section-label" style={{ color: 'var(--green)', marginBottom: '0.5rem' }}>✅ Skills you have</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {matchingSkills.map(s => <SkillChip key={s.id} skill={s} variant="green" />)}
                    </div>
                  </div>
                )}

                {/* Close via related skill */}
                {closeSkills.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div className="skill-section-label" style={{ color: 'var(--purple)', marginBottom: '0.5rem' }}>🔗 Close via related skill</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {closeSkills.map(s => (
                        <span key={s.id} className="chip chip-purple" title={`You have: ${s.via}`}>
                          {s.name} <span style={{ opacity: 0.7, fontSize: '0.6875rem' }}>via {s.via}</span>
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      You don't have these directly, but your skills are closely related.
                    </div>
                  </div>
                )}

                {/* Missing */}
                {missingSkills.length > 0 && (
                  <div>
                    <div className="skill-section-label" style={{ color: 'var(--red)', marginBottom: '0.5rem' }}>❌ Skills you need</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {missingSkills.map(s => <SkillChip key={s.id} skill={s} variant="red" />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Graph path */}
          <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.25)' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent)' }}>🔀 How you're connected</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span className="chip chip-blue">Alex Chen</span>
              <span style={{ color: 'var(--text-muted)' }}>→ HAS_SKILL →</span>
              {matchingSkills.length > 0
                ? matchingSkills.slice(0, 2).map(s => (
                    <span key={s.id} className="chip chip-green">{s.name}</span>
                  ))
                : closeSkills.slice(0, 1).map(s => (
                    <span key={s.id} className="chip chip-default">{s.via}</span>
                  ))
              }
              {closeSkills.length > 0 && matchingSkills.length === 0 && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>→ RELATED_TO →</span>
                  {closeSkills.slice(0, 1).map(s => <span key={s.id} className="chip chip-purple">{s.name}</span>)}
                </>
              )}
              <span style={{ color: 'var(--text-muted)' }}>← REQUIRES ←</span>
              <span className="chip chip-amber">{j.title}</span>
              <span style={{ color: 'var(--text-muted)' }}>→ POSTED_BY →</span>
              <span className="chip chip-default">{j.company?.name}</span>
            </div>
          </div>
        </div>

        {/* ── Right: related jobs ── */}
        <div>
          <div style={{ fontWeight: 700, marginBottom: '1rem' }}>Related Jobs</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Sharing required skills</div>

          {related.loading && [...Array(3)].map((_, i) => <SkeletonCard key={i} height={80} />)}
          {related.error && <div style={{ fontSize: '0.875rem', color: 'var(--red)' }}>Could not load related jobs.</div>}
          {!related.loading && !related.error && (related.data || []).length === 0 && (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <div className="empty-state-desc">No related jobs found</div>
            </div>
          )}
          {!related.loading && !related.error && (related.data || []).map(rj => (
            <Link key={rj.jobId} to={`/jobs/${rj.jobId}?candidate=${candidateId}`}
              className="card card-interactive"
              style={{ display: 'block', marginBottom: '0.75rem', padding: '0.875rem 1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{rj.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>{rj.companyName} · {rj.city}</div>
              <span className="chip chip-blue" style={{ fontSize: '0.6875rem' }}>
                {rj.sharedSkills} shared skill{rj.sharedSkills !== 1 ? 's' : ''}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 750px) {
          .job-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
