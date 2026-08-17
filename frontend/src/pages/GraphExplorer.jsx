import { useRef, useEffect, useCallback, useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { getGraphData } from '../api';
import { Spinner, EmptyState, ErrorState } from '../components/States';

const CANDIDATE_ID = 'alex-chen';

const NODE_COLORS = {
  Candidate: '#6366f1',
  Skill:     '#10b981',
  Job:       '#f59e0b',
  Company:   '#a855f7',
};

const LEGEND = Object.entries(NODE_COLORS);

// Simple canvas-based graph renderer (no external lib needed for basic graph)
function GraphCanvas({ nodes, edges }) {
  const canvasRef   = useRef(null);
  const posRef      = useRef({});  // node positions
  const velRef      = useRef({});  // velocities
  const rafRef      = useRef(null);
  const dragRef     = useRef(null);
  const [selected, setSelected] = useState(null);

  // Initialize positions in a circle
  useEffect(() => {
    if (!nodes.length) return;
    const cx = 500, cy = 350;
    nodes.forEach((n, i) => {
      if (!posRef.current[n.id]) {
        const angle = (2 * Math.PI * i) / nodes.length;
        const r = 200 + Math.random() * 100;
        posRef.current[n.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
        velRef.current[n.id] = { x: 0, y: 0 };
      }
    });
  }, [nodes]);

  const simulate = useCallback(() => {
    const pos = posRef.current;
    const vel = velRef.current;
    const alpha = 0.06;
    const repulsion = 6500;
    const springLen = 170;
    const springK   = 0.025;
    const damping   = 0.82;

    // Repulsion between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        if (!pos[a.id] || !pos[b.id]) continue;
        const dx = pos[b.id].x - pos[a.id].x;
        const dy = pos[b.id].y - pos[a.id].y;
        const dist = Math.max(Math.sqrt(dx*dx + dy*dy), 1);
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        vel[a.id].x -= fx * alpha;
        vel[a.id].y -= fy * alpha;
        vel[b.id].x += fx * alpha;
        vel[b.id].y += fy * alpha;
      }
    }

    // Spring attraction along edges
    edges.forEach(e => {
      const a = pos[e.source], b = pos[e.target];
      if (!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.max(Math.sqrt(dx*dx + dy*dy), 1);
      const force = (dist - springLen) * springK;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      vel[e.source].x += fx;
      vel[e.source].y += fy;
      vel[e.target].x -= fx;
      vel[e.target].y -= fy;
    });

    // Center gravity
    nodes.forEach(n => {
      if (!pos[n.id]) return;
      vel[n.id].x += (600 - pos[n.id].x) * 0.0018;
      vel[n.id].y += (375 - pos[n.id].y) * 0.0018;
    });

    // Apply velocities + damping
    nodes.forEach(n => {
      if (!pos[n.id] || (dragRef.current && dragRef.current.id === n.id)) return;
      pos[n.id].x += vel[n.id].x;
      pos[n.id].y += vel[n.id].y;
      vel[n.id].x *= damping;
      vel[n.id].y *= damping;
    });
  }, [nodes, edges]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = posRef.current;
    const W = canvas.width, H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Edges
    edges.forEach(e => {
      const a = pos[e.source], b = pos[e.target];
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = 'rgba(100,116,139,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Edge label at midpoint
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      ctx.fillStyle = 'rgba(100,116,139,0.7)';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(e.type, mx, my - 4);
    });

    // Nodes
    nodes.forEach(n => {
      const p = pos[n.id];
      if (!p) return;
      const r = n.label === 'Candidate' ? 18 : n.label === 'Company' ? 14 : 12;
      const color = NODE_COLORS[n.label] || '#64748b';
      const isSel = selected && selected.id === n.id;

      // Glow for selected
      if (isSel) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 6, 0, Math.PI * 2);
        ctx.fillStyle = color + '33';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = isSel ? '#fff' : color + '88';
      ctx.lineWidth = isSel ? 2.5 : 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#f1f5f9';
      ctx.font = `${n.label === 'Candidate' ? '10' : '9'}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(n.name?.length > 16 ? n.name.slice(0, 14) + '…' : n.name, p.x, p.y + r + 12);
    });
  }, [nodes, edges, selected]);

  // Animation loop
  useEffect(() => {
    let frame = 0;
    function loop() {
      if (frame < 300) simulate(); // stop physics after 300 frames
      draw();
      frame++;
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [simulate, draw]);

  // Mouse interactions
  function getNodeAt(x, y) {
    const pos = posRef.current;
    for (const n of nodes) {
      const p = pos[n.id];
      if (!p) continue;
      const r = n.label === 'Candidate' ? 18 : 14;
      if (Math.sqrt((x-p.x)**2 + (y-p.y)**2) < r) return n;
    }
    return null;
  }

  function toCanvas(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function onMouseDown(e) {
    const { x, y } = toCanvas(e);
    const n = getNodeAt(x, y);
    if (n) { dragRef.current = { id: n.id }; setSelected(n); }
    else setSelected(null);
  }

  function onMouseMove(e) {
    if (!dragRef.current) return;
    const { x, y } = toCanvas(e);
    posRef.current[dragRef.current.id] = { x, y };
  }

  function onMouseUp()   { dragRef.current = null; }
  function onMouseLeave(){ dragRef.current = null; }

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={1200}
        height={750}
        style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: 'default', maxHeight: '72vh' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      />

      {/* Selected node panel */}
      {selected && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1rem',
          minWidth: 200,
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: NODE_COLORS[selected.label] }}>
              {selected.label}
            </span>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{selected.name}</div>
          {selected.category && <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Category: {selected.category}</div>}
        </div>
      )}
    </div>
  );
}

export default function GraphExplorer() {
  const { data, loading, error, refetch } = useFetch(() => getGraphData(CANDIDATE_ID), []);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Graph Explorer</div>
        <div className="page-desc">Visualize the relationships connecting you to jobs and companies through skill traversal</div>
      </div>

      {/* Legend */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '0.875rem 1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>NODE TYPES:</span>
          {LEGEND.map(([label, color]) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, display: 'inline-block' }} />
              {label}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click a node to inspect · Drag to reposition</span>
        </div>
      </div>

      {/* Multi-hop explanation */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.25)', padding: '1rem 1.25rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--accent)' }}>Graph Traversal Paths shown:</strong>
          <div style={{ marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 2 }}>
            <span style={{ color: '#6366f1' }}>Candidate</span> →HAS_SKILL→ <span style={{ color: '#10b981' }}>Skill</span> →RELATED_TO→ <span style={{ color: '#10b981' }}>Related Skill</span> ←REQUIRES← <span style={{ color: '#f59e0b' }}>Job</span> →POSTED_BY→ <span style={{ color: '#a855f7' }}>Company</span>
          </div>
          This 4-hop path reveals opportunities beyond direct skill matching.
        </div>
      </div>

      {loading && <Spinner label="Building your graph…" />}
      {error   && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && (!data || data.nodes.length === 0) && (
        <EmptyState icon="🌐" title="Graph data unavailable" desc="Check your database connection or seed data." />
      )}
      {!loading && !error && data && data.nodes.length > 0 && (
        <>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {data.nodes.length} nodes · {data.edges.length} relationships
          </div>
          <GraphCanvas nodes={data.nodes} edges={data.edges} />
        </>
      )}
    </div>
  );
}
