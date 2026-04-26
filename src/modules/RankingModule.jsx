import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { Card, Spinner, Badge } from '../components/UI';

const ACTION_LABELS = {
  workout:     { label: 'Treino realizado',        icon: '🏋️', pts: 50 },
  body_record: { label: 'Medição corporal',         icon: '📏', pts: 15 },
  water_goal:  { label: 'Meta de água atingida',    icon: '💧', pts: 20 },
  checklist:   { label: 'Hábito diário',            icon: '✅', pts: 10 },
};

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function RankingModule({ user, users }) {
  const [scores, setScores] = useState({});
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const userIds = Object.values(users).map(u => u.id);

      const [ptsRes, actRes] = await Promise.all([
        supabase.from('points').select('user_id, points').in('user_id', userIds),
        supabase
          .from('points')
          .select('*')
          .in('user_id', userIds)
          .order('earned_at', { ascending: false })
          .limit(20),
      ]);

      if (ptsRes.data) {
        const totals = {};
        ptsRes.data.forEach(row => {
          totals[row.user_id] = (totals[row.user_id] || 0) + row.points;
        });
        setScores(totals);
      }

      if (actRes.data) setActivity(actRes.data);
    } catch (_) {}
    setLoading(false);
  }, [users]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const ranked = Object.values(users)
    .map(u => ({ ...u, total: scores[u.id] || 0 }))
    .sort((a, b) => b.total - a.total);

  const leader = ranked[0];
  const second = ranked[1];
  if (!isConfigured) {
    return (
      <div>
        <div className="module-header"><h2 className="module-title">Ranking 🏆</h2></div>
        <div className="error-banner">Configure as variáveis do Supabase para começar.</div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="module-header">
        <h2 className="module-title">Ranking 🏆</h2>
      </div>

      {/* Podium */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div className="podium-card podium-1">
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 20 }}>🥇</div>
          <div className="podium-emoji">{leader.emoji}</div>
          <div className="podium-name">{leader.name}</div>
          <div className="podium-pts">{leader.total.toLocaleString('pt-BR')}</div>
          <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 2 }}>pontos</div>
          {leader.id === user.id && (
            <Badge color="var(--yellow)" style={{ marginTop: 8 }}>Você 🌟</Badge>
          )}
        </div>

        <div className="podium-card podium-2">
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 20 }}>🥈</div>
          <div className="podium-emoji">{second.emoji}</div>
          <div className="podium-name">{second.name}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-sub)' }}>
            {second.total.toLocaleString('pt-BR')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>pontos</div>
          {second.id === user.id && (
            <Badge color="var(--text-sub)" style={{ marginTop: 8 }}>Você</Badge>
          )}
        </div>
      </div>

      {/* Gap */}
      <Card variant="subtle" style={{ textAlign: 'center', marginBottom: 20, padding: '12px' }}>
        {leader.id === user.id ? (
          <span style={{ color: 'var(--teal)', fontWeight: 600 }}>
            🔥 Você está na frente por {(leader.total - second.total).toLocaleString('pt-BR')} pontos!
          </span>
        ) : (
          <span style={{ color: 'var(--coral)', fontWeight: 600 }}>
            💪 Você está a {(leader.total - second.total).toLocaleString('pt-BR')} pontos de virar o jogo!
          </span>
        )}
      </Card>

      {/* Como ganhar pontos */}
      <p className="section-title">Como Ganhar Pontos</p>
      <Card style={{ marginBottom: 20 }}>
        {Object.values(ACTION_LABELS).map(a => (
          <div key={a.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14 }}>{a.icon} {a.label}</span>
            <span style={{ color: 'var(--yellow)', fontWeight: 700, fontSize: 14 }}>+{a.pts}pts</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
          <span style={{ fontSize: 14 }}>✅ Cada hábito do checklist</span>
          <span style={{ color: 'var(--yellow)', fontWeight: 700, fontSize: 14 }}>+10pts</span>
        </div>
      </Card>

      {/* Recent activity */}
      {activity.length > 0 && (
        <>
          <p className="section-title">Atividade Recente</p>
          <Card>
            {activity.map(a => {
              const actUser = Object.values(users).find(u => u.id === a.user_id);
              const meta = ACTION_LABELS[a.action] || { icon: '⭐', label: a.action };
              return (
                <div key={a.id} className="activity-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{meta.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {actUser?.name || '?'}
                        <span style={{ color: 'var(--text-sub)', fontWeight: 400 }}> — {a.description || meta.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(a.earned_at)}</div>
                    </div>
                  </div>
                  <span style={{ color: 'var(--yellow)', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    +{a.points}pts
                  </span>
                </div>
              );
            })}
          </Card>
        </>
      )}
    </div>
  );
}
