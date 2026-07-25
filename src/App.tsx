import { useState } from "react";
import { Layout } from "./components/Layout";
import { Compare } from "./pages/Compare";
import { Dashboard } from "./pages/Dashboard";
import { PreferenceList } from "./pages/PreferenceList";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { Universities } from "./pages/Universities";
import type { PageKey } from "./types/university";

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "profile":
        return <Profile />;
      case "universities":
        return <Universities />;
      case "compare":
        return <Compare onNavigate={setActivePage} />;
      case "preferences":
        return <PreferenceList onNavigate={setActivePage} />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {renderPage()}
    </Layout>
  );
}
