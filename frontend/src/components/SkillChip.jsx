const CATEGORY_CLASS = {
  Frontend: 'chip-frontend',
  Backend:  'chip-backend',
  DevOps:   'chip-devops',
  Data:     'chip-data',
  General:  'chip-general',
};

export function SkillChip({ skill, variant, small }) {
  const cls = variant
    ? `chip chip-${variant}`
    : `chip ${CATEGORY_CLASS[skill?.category] || 'chip-default'}`;

  return (
    <span className={cls} style={small ? { fontSize: '0.6875rem' } : {}}>
      {skill?.name || skill}
    </span>
  );
}

export function MatchBar({ score }) {
  const level =
    score >= 75 ? 'strong' :
    score >= 50 ? 'good'   :
    score >= 25 ? 'partial': 'low';

  return (
    <div className="match-bar-wrap">
      <div className="match-bar-track">
        <div
          className={`match-bar-fill ${level}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`match-score-label ${level}`}>{score}%</span>
    </div>
  );
}

export function MatchLabel({ score }) {
  if (score >= 75) return <span className="chip chip-green">Strong Match</span>;
  if (score >= 50) return <span className="chip chip-blue">Good Match</span>;
  if (score >= 25) return <span className="chip chip-amber">Partial Match</span>;
  return <span className="chip chip-default">Low Match</span>;
}
