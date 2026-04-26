import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const checkLogin = async () => {
    try {
      // In a real app, we might want a 'has_api_key' command
      // For now, we'll try to get stats, if it fails with "No API key found", we show login
      await invoke("get_stats");
      setIsLoggedIn(true);
    } catch (e) {
      if (String(e).includes("No API key found")) {
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
    return <div className="container">Loading...</div>;
  }

  return (
    <main>
      {isLoggedIn ? (
        <Dashboard />
      ) : (
        <Login onLogin={() => setIsLoggedIn(true)} />
      )}
    </main>
  );
}

export default App;
