/* global React */
const { useState, useEffect, useRef } = React;

function Icon({ path, size = 18, fill = "none", strokeWidth = 1.75, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
      strokeLinejoin="round" style={{ display: "block", flex: "none" }} {...rest}>
      {path}
    </svg>
  );
}

const Icons = {
  youtube: (p) => <Icon {...p} path={<><rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none"/></>} />,
  text:    (p) => <Icon {...p} path={<><path d="M4 6h16M4 12h16M4 18h10"/></>} />,
  arrow:   (p) => <Icon {...p} path={<><path d="M5 12h14M13 6l6 6-6 6"/></>} />,
  send:    (p) => <Icon {...p} path={<><path d="M12 19V6M6 12l6-6 6 6"/></>} />,
  copy:    (p) => <Icon {...p} path={<><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 012-2h8"/></>} />,
  check:   (p) => <Icon {...p} path={<><path d="M4 12.5l5 5 11-11"/></>} />,
  close:   (p) => <Icon {...p} path={<><path d="M6 6l12 12M18 6L6 18"/></>} />,
  back:    (p) => <Icon {...p} path={<><path d="M19 12H5M11 6l-6 6 6 6"/></>} />,
  doc:     (p) => <Icon {...p} path={<><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5"/></>} />,
  spark:   (p) => <Icon {...p} path={<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/></>} />,
  alert:   (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></>} />,
  moon:    (p) => <Icon {...p} path={<><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/></>} />,
  sun:     (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>} />,
};

function Waveform({ bars = 5, playing = false, color = "currentColor", h = 20, w = 3, gap = 3 }) {
  const seeds = useRef(Array.from({ length: bars }, (_, i) => ({
    base: 0.3 + ((i * 7) % 10) / 14,
    dur: 0.7 + ((i * 5) % 9) / 10,
    delay: (i * 0.11) % 1,
  }))).current;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap, height: h }} aria-hidden="true">
      {seeds.map((s, i) => (
        <span key={i} style={{
          width: w, height: h, borderRadius: w, background: color,
          transformOrigin: "center",
          transform: `scaleY(${playing ? 1 : s.base})`,
          animation: playing ? `barPulse ${s.dur}s var(--ease) ${s.delay}s infinite` : "none",
          transition: "transform 0.3s var(--ease)",
        }} />
      ))}
    </span>
  );
}

function WaveField({ count = 64, height = 64, playing = true, color = "var(--accent)", faint = "var(--line-strong)" }) {
  const seeds = useRef(Array.from({ length: count }, (_, i) => {
    const env = Math.sin((i / count) * Math.PI);
    const noise = 0.35 + ((i * 13) % 17) / 22;
    return { base: Math.max(0.12, env * noise), dur: 0.9 + ((i * 7) % 11) / 8, delay: (i * 0.04) % 1.4, hot: env > 0.55 };
  })).current;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height, width: "100%", justifyContent: "center" }} aria-hidden="true">
      {seeds.map((s, i) => (
        <span key={i} style={{
          width: 3, height: "100%", borderRadius: 3,
          background: s.hot ? color : faint,
          opacity: s.hot ? 1 : 0.55,
          transformOrigin: "center",
          transform: `scaleY(${s.base})`,
          animation: playing ? `barPulse ${s.dur}s var(--ease) ${s.delay}s infinite` : "none",
        }} />
      ))}
    </div>
  );
}

function Logo({ size = 22, withText = true, onClick }) {
  return (
    <div onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: onClick ? "pointer" : "default" }}>
      <span style={{
        width: size + 8, height: size + 8, borderRadius: 8, background: "var(--ink)",
        display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
      }}>
        <Waveform bars={4} playing={false} color="var(--accent)" h={size - 6} w={2.5} gap={2.5} />
      </span>
      {withText && (
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: size * 0.82, letterSpacing: "-0.02em", color: "var(--ink)" }}>
          Transcriber
        </span>
      )}
    </div>
  );
}

function CopyButton({ text, label = "Copy", small = false }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch (e) {}
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  };
  return (
    <button onClick={copy} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500,
      letterSpacing: "0.04em", textTransform: "uppercase",
      color: done ? "var(--good)" : "var(--ink-mute)",
      padding: small ? "4px 8px" : "6px 10px", borderRadius: 6,
      border: "1px solid var(--line)", background: "var(--surface)",
      transition: "all 0.18s var(--ease)",
    }}>
      {done ? <Icons.check size={13} /> : <Icons.copy size={13} />}
      {done ? "Copied" : label}
    </button>
  );
}

Object.assign(window, { Icon, Icons, Waveform, WaveField, Logo, CopyButton });
