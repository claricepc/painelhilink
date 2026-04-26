import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { Card, ProgressBar, Spinner } from '../components/UI';

const DAILY_GOAL_ML = 2500;
const QUICK_ADD = [200, 300, 500, 750];

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

  if (!isConfigured) {
    return (
      <div>
        <div className="module-header"><h2 className="module-title">Água 💧</h2></div>
        <div className="error-banner">Configure as variáveis do Supabase para começar.</div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="module-header">
        <h2 className="module-title">Água 💧</h2>
      </div>

      {goalReached && (
        <div style={{
          background: 'color-mix(in srgb, var(--teal) 20%, var(--card))',
          border: '1px solid color-mix(in srgb, var(--teal) 40%, transparent)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          marginBottom: 16,
          textAlign: 'center',
          color: 'var(--teal)',
          fontWeight: 700,
        }}>
          🎉 Meta diária atingida! +20 pontos
        </div>
      )}

      {/* Progress card */}
      <Card style={{ marginBottom: 20, textAlign: 'center', padding: '24px 20px' }}>
        <div style={{
          fontSize: 56,
          fontWeight: 900,
          color: pct >= 100 ? 'var(--teal)' : 'var(--blue)',
          lineHeight: 1,
          marginBottom: 4,
        }}>
          {(total / 1000).toFixed(2).replace('.', ',')}L
        </div>
        <div style={{ color: 'var(--text-sub)', fontSize: 14, marginBottom: 16 }}>
          de {(DAILY_GOAL_ML / 1000).toFixed(1).replace('.', ',')}L — {pct}%
        </div>
        <ProgressBar
          value={total}
          max={DAILY_GOAL_ML}
          color={pct >= 100 ? 'var(--teal)' : 'var(--blue)'}
        />
        {pct >= 100 && (
          <div style={{ marginTop: 10, color: 'var(--teal)', fontSize: 14, fontWeight: 600 }}>
            ✅ Meta atingida hoje!
          </div>
        )}
      </Card>

      {/* Quick add buttons */}
      <p className="section-title">Adicionar Água</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {QUICK_ADD.map(ml => (
          <button
            key={ml}
            className="water-btn"
            onClick={() => addWater(ml)}
            disabled={adding}
          >
            +{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
          </button>
        ))}
      </div>

      {/* Today's log */}
      {entries.length > 0 && (
        <>
          <p className="section-title">Registro de Hoje ({entries.length} entradas)</p>
          <Card variant="subtle">
            {entries.map((e, i) => (
              <div key={e.id}>
                {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: 'var(--blue)', fontWeight: 600 }}>+{e.amount_ml}ml</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{fmtTime(e.logged_at)}</span>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
