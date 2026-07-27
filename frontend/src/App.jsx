import { Routes, Route } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage.jsx';
import PoolPage from './pages/PoolPage.jsx';
import MatchPage from './pages/MatchPage.jsx';
import ResultPage from './pages/ResultPage.jsx';

/**
 * Four MVP routes only:
 * /                   Welcome
 * /pool               Pool
 * /match/:matchId     Match
 * /result/:matchId    Result
 */
export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/pool" element={<PoolPage />} />
        <Route path="/match/:matchId" element={<MatchPage />} />
        <Route path="/result/:matchId" element={<ResultPage />} />
      </Routes>
    </div>
  );
}
