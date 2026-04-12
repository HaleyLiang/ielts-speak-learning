/**
 * BottomNav - Fixed bottom navigation bar with 4 tabs
 */

import { NavLink } from 'react-router-dom';
import { BookOpen, Mic, GraduationCap, Settings } from 'lucide-react';
import useI18n from '../i18n/useI18n';

export default function BottomNav() {
  const { t } = useI18n();

  const navItems = [
    { to: '/practice', icon: Mic, label: t('nav.practice') },
    { to: '/bank', icon: BookOpen, label: t('nav.bank') },
    { to: '/exam', icon: GraduationCap, label: t('nav.exam') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
  ];

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
