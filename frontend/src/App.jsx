/**
 * App - Root component with routing and bottom navigation
 */

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import PracticeMode from './pages/PracticeMode';
import QuestionBank from './pages/QuestionBank';
import QuestionDetail from './pages/QuestionDetail';
import MockExam from './pages/MockExam';
import Settings from './pages/Settings';
import { useEffect } from 'react';
import useStore from './stores/useStore';

function AppContent() {
  const location = useLocation();
  const hideNav = location.pathname.startsWith('/bank/');
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    // Force iOS PWA to recalculate dynamic viewport height and snap fixed bottom nav
    const fixViewport = () => window.scrollTo(0, 0);
    fixViewport();
    setTimeout(fixViewport, 100);
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app-layout">
      <Routes>
        <Route path="/" element={<Navigate to="/practice" replace />} />
        <Route path="/practice" element={<PracticeMode />} />
        <Route path="/bank" element={<QuestionBank />} />
        <Route path="/bank/:topicId/:questionId" element={<QuestionDetail />} />
        <Route path="/exam" element={<MockExam />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
