import React, { useState } from 'react';
import WorkoutsModule from './modules/WorkoutsModule';
import EvolutionModule from './modules/EvolutionModule';
import WaterModule from './modules/WaterModule';
import ChecklistModule from './modules/ChecklistModule';
import RankingModule from './modules/RankingModule';
import FinancialModule from './modules/FinancialModule';
import {
  IconDumbbell,
  IconChart,
  IconDroplet,
  IconCheckSquare,
  IconTrophy,
  IconLogout,
  IconLogo,
  IconWallet,
} from './components/Icons';
import './index.css';

const USERS = {
  rafael:  { id: '11111111-1111-1111-1111-111111111111', name: 'Rafael',  initial: 'R', color: '#c5ff3d' },
  clarice: { id: '22222222-2222-2222-2222-222222222222', name: 'Clarice', initial: 'C', color: '#ff7aa7' },
};

const TABS = [
  { id: 'workouts',   label: 'Treinos',     Icon: IconDumbbell },
  { id: 'evolution',  label: 'Evolução',    Icon: IconChart },
  { id: 'water',      label: 'Água',        Icon: IconDroplet },
  { id: 'checklist',  label: 'Hábitos',     Icon: IconCheckSquare },
  { id: 'ranking',    label: 'Ranking',     Icon: IconTrophy },
  { id: 'financial',  label: 'Financeiro',  Icon: IconWallet },
];

const STORAGE_KEY = 'rt_user';

export default function App() {
  const [userId, setUserId] = useState(() =>
    localStorage.getItem(STORAGE_KEY) || localStorage.getItem('fitduo_user')
  );
  const [activeTab, setActiveTab] = useState('workouts');

  const user = userId ? USERS[userId] : null;

  if (!user) {
    return (
      <div className="user-select-screen">
        <div className="brand-block">
          <div className="brand-mark">
            <IconLogo width="56" height="56" />
          </div>
          <h1 className="brand-title">
            REGISTRO <span className="accent">DE TREINO</span>
          </h1>
          <div className="brand-tagline">
            Treine <span className="dot">·</span> Registre <span className="dot">·</span> Evolua
          </div>
        </div>

        <div className="welcome-cta">
          <div className="welcome-cta-title">Quem está treinando agora?</div>
          <div className="user-cards">
            {Object.entries(USERS).map(([key, u]) => (
              <button
                key={key}
                className="user-card"
                style={{ '--user-color': u.color }}
                onClick={() => {
                  localStorage.setItem(STORAGE_KEY, key);
                  setUserId(key);
                }}
              >
                <span className="user-initial">{u.initial}</span>
                <span className="user-name">{u.name}</span>
                <span className="user-sub">Entrar</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-user" style={{ '--user-color': user.color }}>
          <div className="header-avatar">{user.initial}</div>
          <div className="header-name">
            <span className="greet">Olá,</span>
            <span className="name">{user.name}</span>
          </div>
        </div>
        <button
          className="icon-btn"
          aria-label="Trocar usuário"
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem('fitduo_user');
            setUserId(null);
          }}
        >
          <IconLogout />
        </button>
      </header>

      <main className="app-main">
        {activeTab === 'workouts'  && <WorkoutsModule user={user} />}
        {activeTab === 'evolution' && <EvolutionModule user={user} />}
        {activeTab === 'water'     && <WaterModule user={user} />}
        {activeTab === 'checklist' && <ChecklistModule user={user} />}
        {activeTab === 'ranking'   && <RankingModule user={user} users={USERS} />}
        {activeTab === 'financial' && <FinancialModule />}
      </main>

      <nav className="bottom-nav">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-tab${activeTab === id ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
            aria-label={label}
          >
            <Icon />
            <span className="tab-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
