import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const checkLogin = async () => {
    try {
      await invoke("get_stats");
      setIsLoggedIn(true);
    } catch (e) {
      const errStr = String(e);
      if (errStr.includes("No API key found") || errStr.includes("401")) {
        setIsLoggedIn(false);
      } else {
        // Some other error (network?), but we have a key
        setIsLoggedIn(true);
      }
    }
  };

  useEffect(() => {
    checkLogin();
  }, []);

  if (isLoggedIn === null) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--card-border)', borderTopColor: 'var(--accent-primary)' }}></div>
          <p className="text-gray font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <main>
      {isLoggedIn ? (
        <Dashboard onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <Login onLogin={() => setIsLoggedIn(true)} />
      )}
    </main>
  );
}

export default App;
