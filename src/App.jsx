import React, { useState } from 'react';
import WorkoutsModule from './modules/WorkoutsModule';
import EvolutionModule from './modules/EvolutionModule';
import WaterModule from './modules/WaterModule';
import ChecklistModule from './modules/ChecklistModule';
import RankingModule from './modules/RankingModule';
import './index.css';

const USERS = {
  rafael: { id: '11111111-1111-1111-1111-111111111111', name: 'Rafael', emoji: '🦁', color: '#7c6ff7' },
  clarice: { id: '22222222-2222-2222-2222-222222222222', name: 'Clarice', emoji: '🌸', color: '#ff6b6b' },
};

const TABS = [
  { id: 'workouts',  label: 'Treinos',   icon: '🏋️' },
  { id: 'evolution', label: 'Evolução',  icon: '📊' },
  { id: 'water',     label: 'Água',      icon: '💧' },
  { id: 'checklist', label: 'Checklist', icon: '✅' },
  { id: 'ranking',   label: 'Ranking',   icon: '🏆' },
];

export default function App() {
  const [userId, setUserId] = useState(() => localStorage.getItem('fitduo_user'));
  const [activeTab, setActiveTab] = useState('workouts');

  const user = userId ? USERS[userId] : null;

  if (!user) {
    return (
      <div className="user-select-screen">
        <div className="logo">
          <div className="logo-icon">💪</div>
          <h1>FitDuo</h1>
          <p>Quem está treinando hoje?</p>
        </div>
        <div className="user-cards">
          {Object.entries(USERS).map(([key, u]) => (
            <button
              key={key}
              className="user-card"
              style={{ '--user-color': u.color }}
              onClick={() => {
                localStorage.setItem('fitduo_user', key);
                setUserId(key);
              }}
            >
              <span className="user-emoji">{u.emoji}</span>
              <span className="user-name">{u.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-user" style={{ '--user-color': user.color }}>
          <span>{user.emoji}</span>
          <span>{user.name}</span>
        </div>
        <button
          className="switch-user-btn"
          onClick={() => {
            localStorage.removeItem('fitduo_user');
            setUserId(null);
          }}
        >
          Trocar
        </button>
      </header>

      <main className="app-main">
        {activeTab === 'workouts'  && <WorkoutsModule user={user} />}
        {activeTab === 'evolution' && <EvolutionModule user={user} />}
        {activeTab === 'water'     && <WaterModule user={user} />}
        {activeTab === 'checklist' && <ChecklistModule user={user} />}
        {activeTab === 'ranking'   && <RankingModule user={user} users={USERS} />}
      </main>

      <nav className="bottom-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
