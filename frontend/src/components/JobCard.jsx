import { Link } from 'react-router-dom';
import { SkillChip, MatchBar, MatchLabel } from './SkillChip';

export function JobCard({ job, candidateId, extended = false }) {
  const {
    jobId, title, companyName, city, remote, employmentType,
    matchingSkills = [], missingSkills = [], matchScore,
    requiredSkills = [], bridgePaths = [],
  } = job;

  const displayMissing = missingSkills.length > 0
    ? missingSkills
    : requiredSkills.filter(r => !matchingSkills.find(m => m.id === r.id));

  return (
    <Link to={`/jobs/${jobId}?candidate=${candidateId}`} className="card card-interactive job-card">
      {/* Header */}
      <div className="job-card-header">
        <div>
          <div className="job-title">{title}</div>
          <div className="job-company">{companyName}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem' }}>
          {extended
            ? <span className="badge badge-extended">⟳ Extended</span>
            : <span className="badge badge-direct">✓ Direct</span>
          }
          {!extended && <MatchLabel score={matchScore} />}
        </div>
      </div>

      {/* Meta */}
      <div className="job-meta">
        <span className="job-meta-item">📍 {remote ? 'Remote' : city}</span>
        <span className="job-meta-item">💼 {employmentType}</span>
      </div>

      {/* Match bar (direct only) */}
      {!extended && typeof matchScore === 'number' && (
        <MatchBar score={matchScore} />
      )}

      {/* Bridge path (extended only) */}
      {extended && bridgePaths?.length > 0 && (
        <div className="bridge-path">
          🔗 Via: <strong>{bridgePaths[0].candidateSkill}</strong> → <strong>{bridgePaths[0].relatedSkill}</strong>
        </div>
      )}

      {/* Skills */}
      <div>
        {matchingSkills.length > 0 && (
          <>
            <div className="skill-section-label">You have</div>
            <div className="job-skills" style={{ marginBottom: '0.5rem' }}>
              {matchingSkills.slice(0, 5).map(s => (
                <SkillChip key={s.id} skill={s} variant="green" />
              ))}
            </div>
          </>
        )}
        {displayMissing.length > 0 && (
          <>
            <div className="skill-section-label">You need</div>
            <div className="job-skills">
              {displayMissing.slice(0, 4).map(s => (
                <SkillChip key={s.id} skill={s} variant="red" />
              ))}
              {displayMissing.length > 4 && (
                <span className="chip chip-default">+{displayMissing.length - 4} more</span>
              )}
            </div>
          </>
        )}
        {extended && requiredSkills.length > 0 && matchingSkills.length === 0 && (
          <>
            <div className="skill-section-label">Required</div>
            <div className="job-skills">
              {requiredSkills.slice(0, 5).map(s => (
                <SkillChip key={s.id} skill={s} variant="amber" />
              ))}
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
