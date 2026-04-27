import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { Card, Spinner, NotConfigured } from '../components/UI';
import { IconDumbbell, IconScale, IconDroplet, IconCheckSquare, IconSparkle } from '../components/Icons';

const ACTION_META = {
  workout:     { label: 'Treino realizado',     pts: 50, Icon: IconDumbbell },
  body_record: { label: 'Medição corporal',     pts: 15, Icon: IconScale },
  water_goal:  { label: 'Meta de água',         pts: 20, Icon: IconDroplet },
  checklist:   { label: 'Hábito do dia',        pts: 10, Icon: IconCheckSquare },
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

  if (!isConfigured) return <NotConfigured title="Ranking" />;
  if (loading) return <Spinner />;

  const ranked = Object.values(users)
    .map(u => ({ ...u, total: scores[u.id] || 0 }))
    .sort((a, b) => b.total - a.total);

  const leader = ranked[0];
  const second = ranked[1];

  return (
    <div>
      <div className="module-header">
        <div>
          <span className="module-sub">Disputa</span>
          <h2 className="module-title"><span className="em">Ranking</span></h2>
        </div>
      </div>

      <div className="podium-grid mb-16">
        <div className="podium-card podium-1">
          <div className="podium-rank">1º · LÍDER</div>
          <div className="podium-emoji">{leader.emoji}</div>
          <div className="podium-name">{leader.name}</div>
          <div className="podium-pts">
            {leader.total.toLocaleString('pt-BR')}
            <span className="unit">PTS</span>
          </div>
          {leader.id === user.id && (
            <div style={{ marginTop: 6, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em' }}>
              VOCÊ ESTÁ NA FRENTE
            </div>
          )}
        </div>

        <div className="podium-card podium-2">
          <div className="podium-rank">2º</div>
          <div className="podium-emoji">{second.emoji}</div>
          <div className="podium-name">{second.name}</div>
          <div className="podium-pts text-sub">
            {second.total.toLocaleString('pt-BR')}
            <span className="unit">PTS</span>
          </div>
          {second.id === user.id && (
            <div className="text-mute" style={{ marginTop: 6, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em' }}>
              VOCÊ ESTÁ AQUI
            </div>
          )}
        </div>
      </div>

      <Card variant="subtle" className="mb-16" style={{ textAlign: 'center' }}>
        {leader.id === user.id ? (
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
            🔥 Na frente por {(leader.total - second.total).toLocaleString('pt-BR')} pontos
          </span>
        ) : leader.total === second.total ? (
          <span className="text-sub text-bold">Empate técnico! Vai com tudo!</span>
        ) : (
          <span style={{ color: 'var(--orange)', fontWeight: 700 }}>
            💪 {(leader.total - second.total).toLocaleString('pt-BR')} pts pra virar o jogo
          </span>
        )}
      </Card>

      <p className="section-title">Como ganhar pontos</p>
      <div className="col gap-8 mb-16">
        {Object.entries(ACTION_META).map(([key, m]) => (
          <div key={key} className="rt-card stat-card" style={{ padding: '12px 14px' }}>
            <div className="stat-icon"><m.Icon /></div>
            <div className="flex-1">
              <div className="text-bold" style={{ fontSize: 14 }}>{m.label}</div>
            </div>
            <div className="text-bold" style={{ color: 'var(--primary)' }}>+{m.pts} pts</div>
          </div>
        ))}
      </div>

      {activity.length > 0 && (
        <>
          <p className="section-title">Atividade recente</p>
          <div className="col gap-8">
            {activity.map(a => {
              const actUser = Object.values(users).find(u => u.id === a.user_id);
              const meta = ACTION_META[a.action] || { label: a.description || a.action, Icon: IconSparkle };
              const Icon = meta.Icon;
              return (
                <div key={a.id} className="activity-row">
                  <div className="row gap-12" style={{ flex: 1, minWidth: 0 }}>
                    <div className="stat-icon" style={{ width: 36, height: 36, borderRadius: 10 }}>
                      <Icon width="18" height="18" />
                    </div>
                    <div className="activity-meta" style={{ minWidth: 0 }}>
                      <span className="who">{actUser?.name || '?'}</span>
                      <span className="what" style={{
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {a.description || meta.label} · {fmtDate(a.earned_at)}
                      </span>
                    </div>
                  </div>
                  <span className="activity-pts">+{a.points}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
