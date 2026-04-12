/**
 * App - Root component with routing and bottom navigation
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import PracticeMode from './pages/PracticeMode';
import QuestionBank from './pages/QuestionBank';
import MockExam from './pages/MockExam';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Routes>
          <Route path="/" element={<Navigate to="/practice" replace />} />
          <Route path="/practice" element={<PracticeMode />} />
          <Route path="/bank" element={<QuestionBank />} />
          <Route path="/exam" element={<MockExam />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
