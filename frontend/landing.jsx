/* global React, Icons, WaveField, Logo, Waveform */
const { useState: useStateL, useEffect: useEffectL } = React;

function Landing({ onLaunch, dark, onToggleDark }) {
  const [mounted, setMounted] = useStateL(false);
  useEffectL(() => { const t = setTimeout(() => setMounted(true), 30); return () => clearTimeout(t); }, []);

  const stagger = (i) => ({ animation: `fadeUp 0.7s var(--ease) ${i * 0.08}s both` });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px clamp(20px, 5vw, 56px)",
        background: "color-mix(in srgb, var(--bg) 82%, transparent)",
        backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)",
      }}>
        <Logo size={20} />
        <nav style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onToggleDark} className="theme-toggle" title={dark ? "Switch to light" : "Switch to dark"}>
            {dark ? <Icons.sun size={14} /> : <Icons.moon size={14} />}
            <span className="nav-hide">{dark ? "Light" : "Dark"}</span>
          </button>
          <button onClick={() => onLaunch("text")} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--ink)", color: "var(--surface)", fontWeight: 600, fontSize: 14,
            padding: "9px 16px", borderRadius: 999, whiteSpace: "nowrap",
            transition: "transform 0.15s var(--ease)",
          }}
            onMouseDown={(e) => e.currentTarget.style.transform = "translateY(1px)"}
            onMouseUp={(e) => e.currentTarget.style.transform = ""}
            onMouseLeave={(e) => e.currentTarget.style.transform = ""}>
            Launch app <Icons.arrow size={15} />
          </button>
        </nav>
      </header>

      <main style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        padding: "clamp(48px, 9vh, 110px) clamp(20px, 5vw, 56px) 0", maxWidth: 1080, margin: "0 auto", width: "100%",
      }}>
        <div className="eyebrow" style={{ ...stagger(0), display: "inline-flex", alignItems: "center", gap: 10 }}>
          <Waveform bars={4} playing color="var(--accent)" h={13} w={2.5} gap={2.5} />
          Ask anything, grounded in the source
        </div>

        <h1 style={{
          ...stagger(1),
          fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "-0.035em",
          fontSize: "clamp(44px, 7.6vw, 92px)", lineHeight: 1.02, margin: "24px 0 0",
          color: "var(--ink)", maxWidth: "12ch",
        }}>
          Talk to any{" "}
          <span style={{ fontStyle: "italic", fontWeight: 500, color: "var(--accent)", whiteSpace: "nowrap" }}>transcript</span>
        </h1>

        <p style={{
          ...stagger(2),
          fontSize: "clamp(17px, 2.1vw, 21px)", lineHeight: 1.55, color: "var(--ink-soft)",
          maxWidth: "52ch", margin: "30px 0 0", fontWeight: 400, textWrap: "balance",
        }}>
          Drop in a YouTube link or paste your own text. The transcript becomes a conversation —
          ask follow-up questions and get answers drawn strictly from the source. Nothing invented.
        </p>

        <div style={{ ...stagger(3), display: "flex", gap: 14, marginTop: 40, flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={() => onLaunch("youtube")} style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "var(--accent)", color: "var(--accent-ink)", fontWeight: 600, fontSize: 16,
            padding: "15px 26px", borderRadius: 999, whiteSpace: "nowrap", boxShadow: "var(--sh-md)",
            transition: "transform 0.15s var(--ease), background 0.15s var(--ease)",
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--accent-deep)"}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.transform = ""; }}
            onMouseDown={(e) => e.currentTarget.style.transform = "translateY(1px)"}
            onMouseUp={(e) => e.currentTarget.style.transform = ""}>
            Start asking <Icons.arrow size={17} />
          </button>
          <button onClick={() => onLaunch("text")} style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "var(--surface)", color: "var(--ink)", fontWeight: 600, fontSize: 16,
            padding: "15px 26px", borderRadius: 999, whiteSpace: "nowrap", border: "1px solid var(--line-strong)",
            transition: "border-color 0.15s var(--ease)",
          }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--ink-mute)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--line-strong)"}>
            Paste your own text
          </button>
        </div>

        <div style={{ ...stagger(4), width: "min(720px, 100%)", marginTop: "clamp(40px, 7vh, 76px)" }}>
          <WaveField count={72} height={88} playing />
          <div style={{ height: 1, background: "var(--line)", marginTop: 18 }} />
        </div>

        <section style={{
          ...stagger(5), display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16, width: "100%", marginTop: 56, textAlign: "left",
        }}>
          {[
            { ic: <Icons.youtube size={22} />, k: "01", t: "From a video", d: "Paste a YouTube URL. We pull the captions and turn them into something you can interrogate." },
            { ic: <Icons.text size={22} />, k: "02", t: "From your text", d: "Drop in a transcript, an article, meeting notes — anything. No upload, no account." },
            { ic: <Icons.spark size={22} />, k: "03", t: "Grounded answers", d: "Every reply is pulled from the source. If it isn't in the transcript, you'll be told so." },
          ].map((c, i) => (
            <div key={i} style={{
              background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)",
              padding: "24px 24px 26px", transition: "border-color 0.18s var(--ease), transform 0.18s var(--ease)",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.transform = ""; }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "var(--accent)" }}>{c.ic}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)" }}>{c.k}</span>
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, letterSpacing: "-0.02em", margin: "18px 0 8px" }}>{c.t}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--ink-soft)", margin: 0 }}>{c.d}</p>
            </div>
          ))}
        </section>

        <div style={{ height: 72 }} />
      </main>

      <footer style={{
        borderTop: "1px solid var(--line)", padding: "22px clamp(20px, 5vw, 56px)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <span style={{ fontSize: 13, color: "var(--ink-mute)" }}>A lightweight, source-grounded transcript Q&amp;A.</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)" }}>FastAPI · Claude · YouTube</span>
      </footer>
    </div>
  );
}

Object.assign(window, { Landing });
