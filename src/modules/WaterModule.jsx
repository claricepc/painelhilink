import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { Spinner, NotConfigured } from '../components/UI';
import { IconDroplet } from '../components/Icons';

const DAILY_GOAL_ML = 2500;
const QUICK_ADD = [200, 300, 500];

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function WaterModule({ user }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [goalReached, setGoalReached] = useState(false);

  const fetchToday = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', todayStart())
        .order('logged_at', { ascending: true });
      if (data) setEntries(data);
    } catch (_) {}
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  const total = entries.reduce((sum, e) => sum + e.amount_ml, 0);
  const pct = Math.min(100, Math.round((total / DAILY_GOAL_ML) * 100));

  async function addWater(ml) {
    setAdding(true);
    const wasBelow = total < DAILY_GOAL_ML;
    const willReach = total + ml >= DAILY_GOAL_ML;
    try {
      const ops = [
        supabase.from('water_logs').insert({ user_id: user.id, amount_ml: ml }),
      ];
      if (wasBelow && willReach) {
        ops.push(
          supabase.from('points').insert({
            user_id: user.id,
            action: 'water_goal',
            description: 'Meta de água diária atingida!',
            points: 20,
          })
        );
        setGoalReached(true);
        setTimeout(() => setGoalReached(false), 3000);
      }
      await Promise.all(ops);
      fetchToday();
    } finally {
      setAdding(false);
    }
  }

  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  if (!isConfigured) return <NotConfigured title="Hidratação" />;
  if (loading) return <Spinner />;

  return (
    <div>
      <div className="module-header">
        <div>
          <span className="module-sub">Hoje</span>
          <h2 className="module-title"><span className="em">Hidratação</span></h2>
        </div>
      </div>

      {goalReached && (
        <div className="rt-card accent mb-16" style={{ textAlign: 'center', fontWeight: 800 }}>
          🎉 Meta diária atingida! +20 pts
        </div>
      )}

      <div className="water-progress-card mb-16">
        <div className="label">Total consumido</div>
        <div className="value">
          {(total / 1000).toFixed(2).replace('.', ',')}
          <span className="unit">L</span>
        </div>
        <div className="goal">
          de {(DAILY_GOAL_ML / 1000).toFixed(1).replace('.', ',')}L · {pct}%
        </div>
        <div className="water-progress-track">
          <div className="water-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <p className="section-title">Adicionar rapidamente</p>
      <div className="water-grid">
        {QUICK_ADD.map(ml => (
          <button
            key={ml}
            className="water-btn"
            onClick={() => addWater(ml)}
            disabled={adding}
          >
            <IconDroplet />
            <span>+{ml}ml</span>
          </button>
        ))}
      </div>

      {entries.length > 0 && (
        <>
          <p className="section-title">Registro de hoje · {entries.length}</p>
          <div className="rt-card subtle">
            {entries.map((e, i) => (
              <div key={e.id}>
                {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />}
                <div className="row-between" style={{ padding: '4px 0' }}>
                  <span className="row gap-8" style={{ color: 'var(--blue)', fontWeight: 700 }}>
                    <IconDroplet width="14" height="14" />
                    +{e.amount_ml}ml
                  </span>
                  <span className="text-mute text-sm">{fmtTime(e.logged_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
