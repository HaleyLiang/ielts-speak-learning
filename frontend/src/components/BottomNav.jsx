/**
 * BottomNav - Fixed bottom navigation bar with 4 tabs
 */

import { NavLink } from 'react-router-dom';
import { BookOpen, Mic, GraduationCap, Settings } from 'lucide-react';

const navItems = [
  { to: '/practice', icon: Mic, label: 'Practice' },
  { to: '/bank', icon: BookOpen, label: 'Bank' },
  { to: '/exam', icon: GraduationCap, label: 'Exam' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" id="bottom-nav">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
        >
          <Icon size={22} />
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
