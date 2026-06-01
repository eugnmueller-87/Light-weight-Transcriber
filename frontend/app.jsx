/* global React, ReactDOM, Landing, SourceSetup, ChatWorkspace */
const { useState, useEffect } = React;

function App() {
  const [view, setView] = useState("landing");   // 'landing' | 'setup' | 'chat'
  const [setupMode, setSetupMode] = useState("youtube");
  const [source, setSource] = useState(null);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("transcriber-dark") === "1"; } catch (e) { return false; }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try { localStorage.setItem("transcriber-dark", dark ? "1" : "0"); } catch (e) {}
  }, [dark]);

  const launch = (mode) => { setSetupMode(mode); setView("setup"); window.scrollTo(0, 0); };
  const onLoad = (src) => { setSource(src); setView("chat"); window.scrollTo(0, 0); };

  return (
    <div className="app-root">
      {view === "landing" && (
        <Landing onLaunch={launch} dark={dark} onToggleDark={() => setDark((d) => !d)} />
      )}
      {view === "setup" && (
        <SourceSetup initialMode={setupMode} onLoad={onLoad} onBack={() => setView("landing")} />
      )}
      {view === "chat" && source && (
        <ChatWorkspace source={source} onBack={() => setView("setup")} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
