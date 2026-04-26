import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { Card, Button, Input, Textarea, EmptyState, Spinner } from '../components/UI';

export default function WorkoutsModule({ user }) {
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ name: '', description: '', exercises: '' });
  const [logForm, setLogForm] = useState({ duration_minutes: '60', notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, logsRes] = await Promise.all([
        supabase
          .from('workout_plans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('workout_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(15),
      ]);
      if (plansRes.data) setPlans(plansRes.data);
      if (logsRes.data) setLogs(logsRes.data);
    } catch (_) {}
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function addPlan() {
    if (!planForm.name.trim()) return;
    setSaving(true);
    try {
      const exercises = planForm.exercises.split('\n').map(e => e.trim()).filter(Boolean);
      await supabase.from('workout_plans').insert({
        user_id: user.id,
        name: planForm.name.trim(),
        description: planForm.description.trim(),
        exercises,
      });
      setPlanForm({ name: '', description: '', exercises: '' });
      setShowPlanForm(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  }

  async function logWorkout() {
    setSaving(true);
    try {
      await Promise.all([
        supabase.from('workout_logs').insert({
          user_id: user.id,
          plan_id: selectedPlan?.id || null,
          plan_name: selectedPlan?.name || 'Treino livre',
          duration_minutes: parseInt(logForm.duration_minutes) || 60,
          notes: logForm.notes.trim(),
        }),
        supabase.from('points').insert({
          user_id: user.id,
          action: 'workout',
          description: `Treino: ${selectedPlan?.name || 'Livre'}`,
          points: 50,
        }),
      ]);
      setLogForm({ duration_minutes: '60', notes: '' });
      setSelectedPlan(null);
      setShowLogForm(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  }

  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  if (!isConfigured) {
    return (
      <div>
        <div className="module-header"><h2 className="module-title">Treinos 🏋️</h2></div>
        <div className="error-banner">Configure as variáveis do Supabase para começar.</div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="module-header">
        <h2 className="module-title">Treinos 🏋️</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="secondary" onClick={() => setShowLogForm(true)}>+ Registrar</Button>
          <Button size="sm" onClick={() => setShowPlanForm(true)}>+ Plano</Button>
        </div>
      </div>

      {showPlanForm && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Novo Plano</div>
          <Input
            placeholder="Nome do plano *"
            value={planForm.name}
            onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))}
          />
          <Input
            placeholder="Descrição (opcional)"
            value={planForm.description}
            onChange={e => setPlanForm(p => ({ ...p, description: e.target.value }))}
            style={{ marginTop: 8 }}
          />
          <Textarea
            placeholder={"Exercícios (um por linha):\nAgachamento\nSupino\nRemada"}
            value={planForm.exercises}
            onChange={e => setPlanForm(p => ({ ...p, exercises: e.target.value }))}
            style={{ marginTop: 8 }}
            rows={5}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button variant="ghost" onClick={() => setShowPlanForm(false)} style={{ flex: 1 }}>Cancelar</Button>
            <Button onClick={addPlan} disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Salvando…' : 'Salvar Plano'}
            </Button>
          </div>
        </Card>
      )}

      {showLogForm && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Registrar Treino · +50pts</div>
          <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 8 }}>Plano utilizado</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            <button className={`plan-chip${!selectedPlan ? ' active' : ''}`} onClick={() => setSelectedPlan(null)}>
              Livre
            </button>
            {plans.map(p => (
              <button
                key={p.id}
                className={`plan-chip${selectedPlan?.id === p.id ? ' active' : ''}`}
                onClick={() => setSelectedPlan(p)}
              >
                {p.name}
              </button>
            ))}
          </div>
          <Input
            type="number"
            placeholder="Duração (minutos)"
            value={logForm.duration_minutes}
            onChange={e => setLogForm(p => ({ ...p, duration_minutes: e.target.value }))}
          />
          <Textarea
            placeholder="Observações (opcional)"
            value={logForm.notes}
            onChange={e => setLogForm(p => ({ ...p, notes: e.target.value }))}
            style={{ marginTop: 8 }}
            rows={3}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button variant="ghost" onClick={() => setShowLogForm(false)} style={{ flex: 1 }}>Cancelar</Button>
            <Button onClick={logWorkout} disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Salvando…' : '✅ Registrar'}
            </Button>
          </div>
        </Card>
      )}

      <p className="section-title">Meus Planos ({plans.length})</p>
      {plans.length === 0 ? (
        <EmptyState icon="🏋️" message="Nenhum plano criado" action="Crie seu primeiro plano de treino" />
      ) : (
        plans.map(plan => (
          <Card key={plan.id} style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{plan.name}</div>
            {plan.description && (
              <div style={{ color: 'var(--text-sub)', fontSize: 13, marginTop: 2 }}>{plan.description}</div>
            )}
            {Array.isArray(plan.exercises) && plan.exercises.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {plan.exercises.slice(0, 5).map((ex, i) => (
                  <span key={i} className="exercise-chip">{ex}</span>
                ))}
                {plan.exercises.length > 5 && (
                  <span className="exercise-chip">+{plan.exercises.length - 5} mais</span>
                )}
              </div>
            )}
          </Card>
        ))
      )}

      <p className="section-title">Histórico Recente</p>
      {logs.length === 0 ? (
        <EmptyState icon="📅" message="Nenhum treino registrado" action="Registre sua primeira sessão" />
      ) : (
        logs.map(log => (
          <Card key={log.id} variant="subtle" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{log.plan_name || 'Treino livre'}</div>
                {log.notes && (
                  <div style={{ color: 'var(--text-sub)', fontSize: 13, marginTop: 2 }}>{log.notes}</div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                <div style={{ color: 'var(--text-sub)', fontSize: 13 }}>{fmtDate(log.logged_at)}</div>
                {log.duration_minutes && (
                  <div style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 700 }}>
                    {log.duration_minutes}min
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
