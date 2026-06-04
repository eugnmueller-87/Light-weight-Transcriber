/* global React, Icons, Waveform, Logo */
const { useState: useS, useRef: useR } = React;

const API_BASE = "https://light-weight-transcriber-production.up.railway.app";

function extractVideoId(url) {
  try {
    const u = new URL(url.trim());
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    if (u.hostname.endsWith("youtube.com")) return u.searchParams.get("v");
  } catch (e) {}
  return null;
}

function SourceSetup({ initialMode, onLoad, onBack }) {
  const [mode, setMode] = useS(initialMode || "youtube");
  const [url, setUrl] = useS("");
  const [text, setText] = useS("");
  const [notice, setNotice] = useS(null);
  const [loading, setLoading] = useS(false);

  const loadYoutube = async () => {
    setNotice(null);
    const id = extractVideoId(url);
    if (!id) {
      setNotice({ type: "error", msg: "That doesn't look like a YouTube URL. Try a youtube.com or youtu.be link." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ask/youtube`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), question: "What is this video about? Give a one-sentence summary." }),
      });
      if (!res.ok) {
        const { detail } = await res.json().catch(() => ({}));
        setNotice({ type: "error", msg: detail || `Could not load transcript (${res.status}).` });
        return;
      }
      const { transcript, answer } = await res.json();
      // Extract a title from the URL as a fallback display name
      const videoTitle = `YouTube · ${id}`;
      onLoad({
        mode: "youtube",
        transcript,
        meta: { title: videoTitle, id },
        firstAnswer: answer,
        firstQuestion: "What is this video about? Give a one-sentence summary.",
      });
    } catch (e) {
      setNotice({ type: "error", msg: "Could not reach the backend. Make sure the server is running on localhost:8000." });
    } finally {
      setLoading(false);
    }
  };

  const loadText = async () => {
    setNotice(null);
    if (text.trim().length < 20) {
      setNotice({ type: "error", msg: "Paste a bit more text — at least a couple of sentences to ask about." });
      return;
    }
    onLoad({
      mode: "text",
      transcript: text.trim(),
      meta: { title: "Pasted text", words: text.trim().split(/\s+/).length },
    });
  };

  const tryStyle = (active) => ({
    flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9,
    padding: "12px 14px", borderRadius: 10, fontSize: 14.5, fontWeight: 600,
    color: active ? "var(--ink)" : "var(--ink-mute)",
    background: active ? "var(--surface)" : "transparent",
    boxShadow: active ? "var(--sh-sm)" : "none",
    border: active ? "1px solid var(--line)" : "1px solid transparent",
    whiteSpace: "nowrap",
    transition: "all 0.18s var(--ease)",
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <WorkHeader onBack={onBack} title={null} />
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "40px clamp(20px, 5vw, 56px) 64px",
      }}>
        <div style={{ width: "min(640px, 100%)", animation: "fadeUp 0.5s var(--ease)" }}>
          <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
            <Waveform bars={4} playing color="var(--accent)" h={13} w={2.5} gap={2.5} />
            New conversation
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "-0.03em",
            fontSize: "clamp(30px, 5vw, 44px)", lineHeight: 1.04, textAlign: "center", margin: "18px 0 8px",
          }}>
            What should we read?
          </h1>
          <p style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: 16, margin: "0 0 30px", lineHeight: 1.5 }}>
            Load a source once, then ask as many questions as you like.
          </p>

          <div style={{ display: "flex", gap: 6, padding: 6, background: "var(--bg-2)", borderRadius: 14, marginBottom: 20 }}>
            <button style={tryStyle(mode === "youtube")} onClick={() => { setMode("youtube"); setNotice(null); }}>
              <Icons.youtube size={18} /> YouTube link
            </button>
            <button style={tryStyle(mode === "text")} onClick={() => { setMode("text"); setNotice(null); }}>
              <Icons.text size={18} /> Paste text
            </button>
          </div>

          <div style={{
            background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)",
            padding: 22, boxShadow: "var(--sh-sm)",
          }}>
            {mode === "youtube" ? (
              <>
                <label className="eyebrow" style={{ display: "block", marginBottom: 10 }}>Video URL</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…"
                    onKeyDown={(e) => e.key === "Enter" && !loading && loadYoutube()}
                    disabled={loading}
                    style={inputStyle} />
                  <button onClick={loadYoutube} disabled={loading} style={{ ...primaryBtn, opacity: loading ? 0.7 : 1 }}>
                    {loading
                      ? <><Waveform bars={3} playing color="var(--accent-ink)" h={14} w={2} gap={2} /> Loading…</>
                      : <>Load <Icons.arrow size={16} /></>}
                  </button>
                </div>
              </>
            ) : (
              <>
                <label className="eyebrow" style={{ display: "block", marginBottom: 10 }}>Your text</label>
                <textarea value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="Paste a transcript, an article, meeting notes — anything you want to question…"
                  style={{ ...inputStyle, width: "100%", minHeight: 168, resize: "vertical", lineHeight: 1.55, padding: "14px 16px" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)" }}>
                    {text.trim() ? `${text.trim().split(/\s+/).length} words` : "no text yet"}
                  </span>
                  <button onClick={loadText} style={primaryBtn}>Load text <Icons.arrow size={16} /></button>
                </div>
              </>
            )}

            {notice && (
              <div style={{
                marginTop: 16, display: "flex", gap: 11, alignItems: "flex-start",
                padding: "13px 15px", borderRadius: 10,
                background: notice.type === "error" ? "var(--accent-soft)" : "var(--bg-2)",
                border: `1px solid ${notice.type === "error" ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "var(--line)"}`,
              }}>
                <span style={{ color: notice.type === "error" ? "var(--accent)" : "var(--ink-mute)", marginTop: 1 }}>
                  <Icons.alert size={17} />
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-soft)" }}>{notice.msg}</span>
              </div>
            )}
          </div>

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-faint)", marginTop: 22, lineHeight: 1.5 }}>
            Answers come straight from your source. Nothing is stored.
          </p>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  flex: 1, minWidth: 200, padding: "13px 16px", fontSize: 15, color: "var(--ink)",
  background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 10, outline: "none",
};
const primaryBtn = {
  display: "inline-flex", alignItems: "center", gap: 8, background: "var(--accent)", color: "var(--accent-ink)",
  fontWeight: 600, fontSize: 15, padding: "13px 20px", borderRadius: 10, whiteSpace: "nowrap",
  transition: "background 0.15s var(--ease)", cursor: "pointer",
};

function WorkHeader({ onBack, title, right }) {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px clamp(16px, 4vw, 32px)", borderBottom: "1px solid var(--line)",
      background: "color-mix(in srgb, var(--bg) 85%, transparent)", backdropFilter: "blur(10px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
        <button onClick={onBack} style={{
          display: "inline-flex", alignItems: "center", gap: 7, color: "var(--ink-soft)",
          fontSize: 14, fontWeight: 500, padding: "7px 10px", borderRadius: 8,
          transition: "background 0.15s var(--ease)",
        }}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-2)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <Icons.back size={16} /> <span className="nav-hide">Back</span>
        </button>
        <div style={{ width: 1, height: 22, background: "var(--line)" }} />
        {title ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span style={{ color: "var(--accent)" }}>{title.icon}</span>
            <span style={{
              fontWeight: 600, fontSize: 14.5, color: "var(--ink)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "44vw",
            }}>{title.text}</span>
          </div>
        ) : <Logo size={18} />}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{right}</div>
    </header>
  );
}

Object.assign(window, { SourceSetup, WorkHeader, extractVideoId, API_BASE });
