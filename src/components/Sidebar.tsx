import React from 'react';
import { Link } from 'react-router-dom';

export interface CurrentUser {
  username: string;
  email: string;
}

interface SidebarProps {
  currentUser: CurrentUser | null;
  onLogout: () => void;
  onResetNavigation?: () => void;
  activeMenu?: 'catalog' | 'subject';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  onLogout,
  onResetNavigation,
  activeMenu = 'catalog',
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">CampusNode</div>
        <span className="sidebar-badge">База знаний МФТИ</span>
      </div>

      <nav className="sidebar-nav">
        {onResetNavigation ? (
          <button
            type="button"
            className={`nav-item ${activeMenu === 'catalog' ? 'active' : ''}`}
            onClick={onResetNavigation}
          >
            <span>🏛️</span> Все факультеты
          </button>
        ) : (
          <Link to="/" className="nav-item">
            <span>🏛️</span> Все факультеты
          </Link>
        )}

        <a href="./index.html" className="nav-item">
          <span>🌐</span> На лендинг
        </a>
      </nav>

      <div className="sidebar-footer">
        {currentUser ? (
          <div className="user-box">
            <div className="user-name">{currentUser.username}</div>
            <div className="user-email">{currentUser.email}</div>
            <button type="button" onClick={onLogout} className="btn-logout">
              Выйти
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn-login-link">
            Войти / Регистрация
          </Link>
        )}
      </div>
    </aside>
  );
};
