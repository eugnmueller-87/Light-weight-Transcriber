/* global React, Icons, Waveform, CopyButton, WorkHeader, API_BASE, API_TOKEN */
const { useState: useC, useEffect: useCE, useRef: useCR } = React;

const STARTERS = [
  "Summarize this in three bullet points.",
  "What's the main argument?",
  "List any specific numbers or stats mentioned.",
  "What are the key takeaways?",
];

function ChatWorkspace({ source, onBack }) {
  const [messages, setMessages] = useC(() => {
    // If the source arrived with a pre-fetched first answer, seed the thread
    if (source.firstAnswer) {
      return [
        { role: "user", content: source.firstQuestion },
        { role: "assistant", content: source.firstAnswer },
      ];
    }
    return [];
  });
  const [draft, setDraft] = useC("");
  const [busy, setBusy] = useC(false);
  const [panelOpen, setPanelOpen] = useC(false);
  const threadRef = useCR(null);
  const taRef = useCR(null);

  const wordCount = source.transcript.split(/\s+/).length;

  useCE(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, busy]);

  const ask = async (qRaw) => {
    const q = (qRaw ?? draft).trim();
    if (!q || busy) return;
    setDraft("");
    if (taRef.current) taRef.current.style.height = "auto";

    const nextMessages = [...messages, { role: "user", content: q }];
    setMessages(nextMessages);
    setBusy(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Api-Token": API_TOKEN },
        body: JSON.stringify({
          transcript: source.transcript,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const { detail } = await res.json().catch(() => ({}));
        throw new Error(detail || `Request failed (${res.status})`);
      }

      const { answer } = await res.json();
      setMessages((cur) => [...cur, { role: "assistant", content: answer.trim() || "I couldn't produce an answer for that." }]);
    } catch (e) {
      setMessages((cur) => [...cur, { role: "assistant", content: e.message || "Something went wrong. Try again in a moment.", error: true }]);
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); }
  };

  const autoGrow = (e) => {
    setDraft(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
  };

  const title = {
    icon: source.mode === "youtube" ? <Icons.youtube size={18} /> : <Icons.text size={18} />,
    text: source.meta.title,
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <WorkHeader onBack={onBack} title={title} right={
        <button onClick={() => setPanelOpen((v) => !v)} style={{
          display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600,
          color: panelOpen ? "var(--ink)" : "var(--ink-soft)", padding: "8px 13px", borderRadius: 8,
          border: "1px solid var(--line)", background: panelOpen ? "var(--bg-2)" : "var(--surface)",
          transition: "all 0.15s var(--ease)",
        }}>
          <Icons.doc size={15} /> Transcript
        </button>
      } />

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <TranscriptPanel source={source} wordCount={wordCount} open={panelOpen} onClose={() => setPanelOpen(false)} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
          <div ref={threadRef} style={{ flex: 1, overflowY: "auto", padding: "32px clamp(16px, 5vw, 40px) 20px" }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              {messages.length === 0 && !busy && (
                <EmptyState source={source} wordCount={wordCount} onPick={(q) => ask(q)} />
              )}
              {messages.map((m, i) => <Bubble key={i} m={m} />)}
              {busy && <Thinking />}
            </div>
          </div>

          <div style={{
            borderTop: "1px solid var(--line)", padding: "16px clamp(16px, 5vw, 40px) 22px",
            background: "color-mix(in srgb, var(--bg) 70%, transparent)", backdropFilter: "blur(8px)",
          }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <div style={{
                display: "flex", alignItems: "flex-end", gap: 10, background: "var(--surface)",
                border: "1px solid var(--line-strong)", borderRadius: 16, padding: "8px 8px 8px 16px",
                boxShadow: "var(--sh-sm)", transition: "border-color 0.15s var(--ease)",
              }}
                onFocusCapture={(e) => e.currentTarget.style.borderColor = "var(--ink-mute)"}
                onBlurCapture={(e) => e.currentTarget.style.borderColor = "var(--line-strong)"}>
                <textarea ref={taRef} value={draft} onChange={autoGrow} onKeyDown={onKey} rows={1}
                  placeholder={busy ? "Reading the transcript…" : "Ask a question about the source…"}
                  disabled={busy}
                  style={{
                    flex: 1, border: "none", outline: "none", background: "transparent", resize: "none",
                    fontSize: 15.5, lineHeight: 1.5, color: "var(--ink)", padding: "9px 0",
                    maxHeight: 180, fontFamily: "var(--font-body)",
                  }} />
                <button onClick={() => ask()} disabled={busy || !draft.trim()} style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 40, height: 40, flex: "none", borderRadius: 12,
                  background: draft.trim() && !busy ? "var(--accent)" : "var(--bg-2)",
                  color: draft.trim() && !busy ? "var(--accent-ink)" : "var(--ink-faint)",
                  transition: "background 0.15s var(--ease)", cursor: draft.trim() && !busy ? "pointer" : "default",
                }}>
                  {busy
                    ? <Waveform bars={3} playing color="var(--ink-faint)" h={15} w={2.5} gap={2.5} />
                    : <Icons.send size={18} />}
                </button>
              </div>
              <p style={{ textAlign: "center", fontSize: 12, color: "var(--ink-faint)", margin: "11px 0 0" }}>
                Answers are drawn only from your source · Enter to send · Shift+Enter for a new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderRich(text) {
  const lines = String(text).split("\n");
  return lines.map((line, li) => {
    const parts = [];
    const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    let last = 0, m, key = 0;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      const tok = m[0];
      if (tok.startsWith("**")) parts.push(<strong key={key++} style={{ fontWeight: 700 }}>{tok.slice(2, -2)}</strong>);
      else if (tok.startsWith("`")) parts.push(<code key={key++} style={{ fontFamily: "var(--font-mono)", fontSize: "0.88em", background: "var(--bg-2)", padding: "1px 5px", borderRadius: 4 }}>{tok.slice(1, -1)}</code>);
      else parts.push(<em key={key++}>{tok.slice(1, -1)}</em>);
      last = m.index + tok.length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return <span key={li}>{parts}{li < lines.length - 1 ? <br /> : null}</span>;
  });
}

function Bubble({ m }) {
  if (m.role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "22px 0", animation: "fadeUp 0.35s var(--ease)" }}>
        <div style={{
          maxWidth: "82%", background: "var(--ink)", color: "var(--surface)", padding: "12px 17px",
          borderRadius: "16px 16px 5px 16px", fontSize: 15.5, lineHeight: 1.5, fontWeight: 450, whiteSpace: "pre-wrap",
        }}>
          {m.content}
        </div>
      </div>
    );
  }
  return (
    <div style={{ margin: "22px 0", animation: "fadeUp 0.35s var(--ease)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
        <span style={{
          width: 24, height: 24, borderRadius: 7, background: "var(--ink)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
        }}>
          <Waveform bars={3} playing={false} color="var(--accent)" h={11} w={2} gap={2} />
        </span>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
          color: m.error ? "var(--accent)" : "var(--ink-mute)",
        }}>{m.error ? "Error" : "From the source"}</span>
      </div>
      <div style={{ fontSize: 16, lineHeight: 1.62, color: "var(--ink)", whiteSpace: "pre-wrap", paddingLeft: 33, textWrap: "pretty" }}>
        {m.error ? m.content : renderRich(m.content)}
      </div>
      {!m.error && (
        <div style={{ paddingLeft: 33, marginTop: 12 }}>
          <CopyButton text={m.content} small />
        </div>
      )}
    </div>
  );
}

function Thinking() {
  return (
    <div style={{ margin: "22px 0", animation: "fadeIn 0.3s var(--ease)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
        <span style={{
          width: 24, height: 24, borderRadius: 7, background: "var(--ink)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
        }}>
          <Waveform bars={3} playing color="var(--accent)" h={11} w={2} gap={2} />
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-mute)" }}>Reading</span>
      </div>
      <div style={{ paddingLeft: 33, display: "flex", alignItems: "center", gap: 12, color: "var(--ink-mute)" }}>
        <Waveform bars={7} playing color="var(--accent)" h={22} w={3} gap={3} />
        <span style={{ fontSize: 14.5 }}>Scanning the transcript for your answer…</span>
      </div>
    </div>
  );
}

function EmptyState({ source, wordCount, onPick }) {
  return (
    <div style={{ animation: "fadeUp 0.5s var(--ease)", paddingTop: 8 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 13, marginBottom: 22, padding: "16px 18px",
        background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)",
      }}>
        <span style={{
          width: 42, height: 42, borderRadius: 11, background: "var(--accent-soft)", color: "var(--accent)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
        }}>
          {source.mode === "youtube" ? <Icons.youtube size={22} /> : <Icons.text size={22} />}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15.5, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {source.meta.title}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-mute)" }}>
            {source.meta.channel ? `${source.meta.channel} · ` : ""}
            {source.meta.duration ? `${source.meta.duration} · ` : ""}
            {wordCount.toLocaleString()} words loaded
          </div>
        </div>
      </div>

      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
        Ask your first question
      </h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 15.5, lineHeight: 1.55, margin: "0 0 22px", maxWidth: "54ch" }}>
        Everything below comes straight from the source. Try one of these to start, or write your own.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        {STARTERS.map((s, i) => (
          <button key={i} onClick={() => onPick(s)} style={{
            textAlign: "left", display: "flex", alignItems: "center", gap: 11, padding: "14px 16px",
            background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12,
            fontSize: 14.5, color: "var(--ink-soft)", fontWeight: 500, transition: "all 0.16s var(--ease)",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)"; e.currentTarget.style.color = "var(--ink)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-soft)"; e.currentTarget.style.transform = ""; }}>
            <Icons.arrow size={15} style={{ color: "var(--accent)", flex: "none" }} /> {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function TranscriptPanel({ source, wordCount, open, onClose }) {
  return (
    <aside className={"transcript-panel" + (open ? " open" : "")} style={{ flexBasis: open ? 360 : 0 }}>
      <div style={{
        padding: "20px 20px 14px", borderBottom: "1px solid var(--line)",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10,
      }}>
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Source transcript</div>
          <div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.35, marginBottom: 4 }}>{source.meta.title}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-mute)" }}>{wordCount.toLocaleString()} words</div>
        </div>
        <button onClick={onClose} className="panel-close" style={{ color: "var(--ink-mute)", padding: 6, borderRadius: 7, flex: "none" }}>
          <Icons.close size={18} />
        </button>
      </div>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)" }}>
        <CopyButton text={source.transcript} label="Copy transcript" />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px 28px" }}>
        <p style={{ fontSize: 13.5, lineHeight: 1.7, color: "var(--ink-soft)", whiteSpace: "pre-wrap", margin: 0 }}>
          {source.transcript}
        </p>
      </div>
    </aside>
  );
}

Object.assign(window, { ChatWorkspace });
