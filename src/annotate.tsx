/* eslint-disable react-refresh/only-export-components */
// Annotation + PEN tool over the airport chart. Two modes:
//   • Draw: click to lay down points; each finished polyline is a taxiway (chain
//     of nodes + edges) that I turn straight into graph geometry.
//   • Mark: drop hollow circles + notes to flag spots.
// Everything is in the 1200×860 coordinate space of airportGraph, so points map
// straight to node coordinates. Opens at /annotate.html.

import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { airportGraph, SVG_WIDTH, SVG_HEIGHT } from './data/airportGraph';

interface Pt { x: number; y: number; }
interface Path { id: number; name: string; pts: Pt[]; }
interface Marker { id: number; x: number; y: number; note: string; }

const COLORS = ['#16a34a', '#2563eb', '#db2777', '#ea580c', '#7c3aed', '#0891b2', '#ca8a04', '#dc2626'];

function Tool() {
  const [mode, setMode] = useState<'draw' | 'mark'>('draw');
  const [paths, setPaths] = useState<Path[]>([]);
  const [cur, setCur] = useState<Pt[]>([]);
  const [curName, setCurName] = useState('');
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [showEdges, setShowEdges] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [cursor, setCursor] = useState<Pt | null>(null);
  const nextPath = useRef(1);
  const nextMark = useRef(1);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const toSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: Math.round(p.x), y: Math.round(p.y) };
  };

  const finishPath = () => {
    setCur(c => {
      if (c.length >= 2) {
        const name = curName.trim() || `path${nextPath.current}`;
        setPaths(p => [...p, { id: nextPath.current++, name, pts: c }]);
        setCurName('');
      }
      return [];
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'Enter') finishPath();
      else if (e.key === 'Escape') setCur([]);
      else if ((e.key === 'z' && (e.ctrlKey || e.metaKey)) || e.key === 'Backspace') setCur(c => c.slice(0, -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // re-bind each render so finishPath sees fresh state

  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const p = toSvg(e.clientX, e.clientY);
    if (mode === 'draw') setCur(c => [...c, p]);
    else setMarkers(m => [...m, { id: nextMark.current++, x: p.x, y: p.y, note: '' }]);
  };

  const grid = useMemo(() => {
    if (!showGrid) return null;
    const els: React.ReactNode[] = [];
    for (let x = 0; x <= SVG_WIDTH; x += 50) els.push(<line key={`gx${x}`} x1={x} y1={0} x2={x} y2={SVG_HEIGHT} stroke={x % 100 ? '#f8b4b4' : '#dc2626'} strokeWidth={x % 100 ? 0.25 : 0.5} opacity={0.5} />);
    for (let y = 0; y <= SVG_HEIGHT; y += 50) els.push(<line key={`gy${y}`} x1={0} y1={y} x2={SVG_WIDTH} y2={y} stroke={y % 100 ? '#f8b4b4' : '#dc2626'} strokeWidth={y % 100 ? 0.25 : 0.5} opacity={0.5} />);
    for (let x = 0; x <= SVG_WIDTH; x += 100) for (let y = 100; y <= SVG_HEIGHT; y += 100) els.push(<text key={`gl${x}-${y}`} x={x + 1} y={y - 1} fontSize={5} fontWeight={800} fill="#b91c1c" opacity={0.85}>{x},{y}</text>);
    return <g>{els}</g>;
  }, [showGrid]);

  const edges = useMemo(() => {
    if (!showEdges) return null;
    return (
      <g>
        {airportGraph.edges.map(e => {
          if (e.type === 'runway') return null;
          const f = airportGraph.nodes.find(n => n.id === e.fromNodeId);
          const t = airportGraph.nodes.find(n => n.id === e.toNodeId);
          if (!f || !t) return null;
          return <line key={e.id} x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke="#00c8ff" strokeWidth={1.5} opacity={0.7} strokeLinecap="round" />;
        })}
      </g>
    );
  }, [showEdges]);

  const pathsText = paths.map(p => `PATH ${p.name}: ${p.pts.map(q => `${q.x},${q.y}`).join('  ')}`).join('\n');
  const marksText = markers.map(m => `#${m.id} (${m.x}, ${m.y})${m.note ? ': ' + m.note : ''}`).join('\n');

  const drawPoly = (pts: Pt[], color: string, name?: string, dashed = false) => (
    <g>
      {pts.length > 1 && <polyline points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color} strokeWidth={2.4} strokeDasharray={dashed ? '5,4' : undefined} strokeLinejoin="round" strokeLinecap="round" />}
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.4} fill="#fff" stroke={color} strokeWidth={1.4} />)}
      {name && pts[0] && <text x={pts[0].x + 3} y={pts[0].y - 3} fontSize={7} fontWeight={900} fill={color} stroke="#fff" strokeWidth={0.5} paintOrder="stroke">{name}</text>}
    </g>
  );

  return (
    <div style={{ display: 'flex', height: '100%', background: '#0c0f12', color: '#eee', fontSize: 13 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{ width: '100%', maxHeight: '98vh', background: '#ebebeb', cursor: 'crosshair', border: '1px solid #333' }}
          onClick={onClick}
          onMouseMove={e => setCursor(toSvg(e.clientX, e.clientY))}
        >
          <image href="/ref_full.png" x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} preserveAspectRatio="none" />
          {grid}
          {edges}
          {paths.map((p, i) => <g key={p.id}>{drawPoly(p.pts, COLORS[i % COLORS.length], p.name)}</g>)}
          {/* live path being drawn */}
          {drawPoly(cur, '#eab308', curName || 'drawing…', true)}
          {mode === 'draw' && cur.length > 0 && cursor && (
            <line x1={cur[cur.length - 1].x} y1={cur[cur.length - 1].y} x2={cursor.x} y2={cursor.y} stroke="#eab308" strokeWidth={1} strokeDasharray="3,3" opacity={0.7} />
          )}
          {markers.map(m => (
            <g key={m.id}>
              <circle cx={m.x} cy={m.y} r={13} fill="none" stroke="#ff2d2d" strokeWidth={2.2} />
              <text x={m.x} y={m.y - 15} textAnchor="middle" fontSize={9} fontWeight={900} fill="#ff2d2d" stroke="#fff" strokeWidth={0.6} paintOrder="stroke">{m.id}</text>
            </g>
          ))}
        </svg>
      </div>

      <div style={{ width: 340, flexShrink: 0, borderLeft: '1px solid #222', padding: 12, overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 16 }}>Chart Pen</h2>

        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <button onClick={() => setMode('draw')} style={mode === 'draw' ? btnOn : btn}>✏️ Draw path</button>
          <button onClick={() => setMode('mark')} style={mode === 'mark' ? btnOn : btn}>◯ Mark spot</button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
          <label><input type="checkbox" checked={showEdges} onChange={e => setShowEdges(e.target.checked)} /> Show my cyan lines</label>
          <label><input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} /> Grid</label>
        </div>

        {mode === 'draw' && (
          <div style={{ background: '#111a24', borderRadius: 8, padding: 10, marginBottom: 10 }}>
            <div style={{ color: '#9cf', marginBottom: 6 }}>Click to add points along a taxiway. <b>Enter</b> = finish it. <b>Backspace</b> = undo point. <b>Esc</b> = cancel.</div>
            <input value={curName} onChange={e => setCurName(e.target.value)} placeholder="name this path (e.g. E6, NS1)…"
              style={{ width: '100%', boxSizing: 'border-box', background: '#0d1318', color: '#eee', border: '1px solid #234', borderRadius: 4, padding: 5, marginBottom: 6 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={finishPath} style={btnOn}>Finish path ({cur.length} pts)</button>
              <button onClick={() => setCur(c => c.slice(0, -1))} style={btn}>Undo point</button>
              <button onClick={() => setCur([])} style={btn}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <button onClick={() => navigator.clipboard.writeText(mode === 'draw' ? pathsText : marksText)} style={btn}>Copy {mode === 'draw' ? 'paths' : 'marks'}</button>
          {mode === 'draw'
            ? <button onClick={() => setPaths([])} style={btn}>Clear paths</button>
            : <button onClick={() => setMarkers([])} style={btn}>Clear marks</button>}
        </div>

        {mode === 'draw' && paths.map((p, i) => (
          <div key={p.id} style={{ border: `1px solid ${COLORS[i % COLORS.length]}`, borderRadius: 6, padding: 6, marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ color: COLORS[i % COLORS.length] }}>{p.name}</b>
              <span style={{ color: '#9ab' }}>{p.pts.length} pts</span>
              <button onClick={() => setPaths(k => k.filter(x => x.id !== p.id))} style={{ ...btn, padding: '1px 6px' }}>✕</button>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#8ab', marginTop: 3 }}>{p.pts.map(q => `${q.x},${q.y}`).join('  ')}</div>
          </div>
        ))}

        {mode === 'mark' && markers.map(m => (
          <div key={m.id} style={{ border: '1px solid #234', borderRadius: 6, padding: 6, marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <b style={{ color: '#ff6b6b' }}>#{m.id}</b>
              <span style={{ color: '#9ab', fontFamily: 'monospace' }}>({m.x}, {m.y})</span>
              <button onClick={() => setMarkers(k => k.filter(x => x.id !== m.id))} style={{ ...btn, padding: '1px 6px' }}>✕</button>
            </div>
            <input value={m.note} placeholder="note…" onChange={e => setMarkers(k => k.map(x => x.id === m.id ? { ...x, note: e.target.value } : x))}
              style={{ width: '100%', marginTop: 4, boxSizing: 'border-box', background: '#0d1318', color: '#eee', border: '1px solid #234', borderRadius: 4, padding: 4 }} />
          </div>
        ))}

        {(mode === 'draw' ? paths.length > 0 : markers.length > 0) && (
          <pre style={{ background: '#0d1318', padding: 8, borderRadius: 6, whiteSpace: 'pre-wrap', fontSize: 11, marginTop: 8 }}>{mode === 'draw' ? pathsText : marksText}</pre>
        )}
      </div>
    </div>
  );
}

const btn: React.CSSProperties = { background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: 5, padding: '5px 9px', cursor: 'pointer', fontSize: 12 };
const btnOn: React.CSSProperties = { ...btn, background: '#2563eb', border: '1px solid #2563eb' };

createRoot(document.getElementById('root')!).render(<Tool />);
