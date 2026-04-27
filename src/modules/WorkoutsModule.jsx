import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { Card, Button, Input, Textarea, EmptyState, Spinner, NotConfigured, Badge } from '../components/UI';
import { IconDumbbell, IconPlus, IconClock, IconCalendar, IconCheck } from '../components/Icons';

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

  if (!isConfigured) return <NotConfigured title="Treinos" />;
  if (loading) return <Spinner />;

  return (
    <div>
      <div className="module-header">
        <div>
          <span className="module-sub">Hoje</span>
          <h2 className="module-title">Seus <span className="em">treinos</span></h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="secondary" onClick={() => setShowLogForm(s => !s)}>
            <IconCheck width="14" height="14" /> Registrar
          </Button>
          <Button size="sm" onClick={() => setShowPlanForm(s => !s)}>
            <IconPlus width="14" height="14" /> Plano
          </Button>
        </div>
      </div>

      {showPlanForm && (
        <Card className="mb-16" variant="elevated">
          <div className="text-bold mb-12" style={{ fontSize: 16 }}>Novo plano</div>
          <Input
            placeholder="Nome do plano *"
            value={planForm.name}
            onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))}
          />
          <div className="mt-8" />
          <Input
            placeholder="Descrição (opcional)"
            value={planForm.description}
            onChange={e => setPlanForm(p => ({ ...p, description: e.target.value }))}
          />
          <div className="mt-8" />
          <Textarea
            placeholder={"Exercícios (um por linha):\nAgachamento\nSupino\nRemada"}
            value={planForm.exercises}
            onChange={e => setPlanForm(p => ({ ...p, exercises: e.target.value }))}
            rows={5}
          />
          <div className="row mt-12 gap-8">
            <Button variant="ghost" onClick={() => setShowPlanForm(false)} block>Cancelar</Button>
            <Button onClick={addPlan} disabled={saving} block>
              {saving ? 'Salvando…' : 'Salvar plano'}
            </Button>
          </div>
        </Card>
      )}

      {showLogForm && (
        <Card className="mb-16" variant="elevated">
          <div className="row-between mb-12">
            <div className="text-bold" style={{ fontSize: 16 }}>Registrar treino</div>
            <Badge>+50 pts</Badge>
          </div>

          <label className="input-label">Plano utilizado</label>
          <div className="row gap-6 mb-12" style={{ flexWrap: 'wrap' }}>
            <button
              className={`chip${!selectedPlan ? ' active' : ''}`}
              onClick={() => setSelectedPlan(null)}
            >
              Livre
            </button>
            {plans.map(p => (
              <button
                key={p.id}
                className={`chip${selectedPlan?.id === p.id ? ' active' : ''}`}
                onClick={() => setSelectedPlan(p)}
              >
                {p.name}
              </button>
            ))}
          </div>

          <Input
            label="Duração (minutos)"
            type="number"
            value={logForm.duration_minutes}
            onChange={e => setLogForm(p => ({ ...p, duration_minutes: e.target.value }))}
          />
          <div className="mt-8" />
          <Textarea
            label="Observações"
            placeholder="Como foi o treino?"
            value={logForm.notes}
            onChange={e => setLogForm(p => ({ ...p, notes: e.target.value }))}
            rows={3}
          />
          <div className="row mt-12 gap-8">
            <Button variant="ghost" onClick={() => setShowLogForm(false)} block>Cancelar</Button>
            <Button onClick={logWorkout} disabled={saving} block>
              {saving ? 'Salvando…' : 'Registrar treino'}
            </Button>
          </div>
        </Card>
      )}

      <p className="section-title">Meus planos · {plans.length}</p>
      {plans.length === 0 ? (
        <EmptyState
          icon={<IconDumbbell />}
          message="Nenhum plano criado"
          action="Crie seu primeiro plano de treino"
        />
      ) : (
        plans.map(plan => (
          <Card key={plan.id} className="mb-8">
            <div className="row-between">
              <div className="flex-1" style={{ minWidth: 0 }}>
                <div className="text-bold" style={{ fontSize: 16 }}>{plan.name}</div>
                {plan.description && (
                  <div className="text-sub text-sm mt-8" style={{ marginTop: 2 }}>{plan.description}</div>
                )}
              </div>
              {Array.isArray(plan.exercises) && plan.exercises.length > 0 && (
                <Badge>{plan.exercises.length} exerc.</Badge>
              )}
            </div>
            {Array.isArray(plan.exercises) && plan.exercises.length > 0 && (
              <div className="row mt-12 gap-6" style={{ flexWrap: 'wrap' }}>
                {plan.exercises.slice(0, 5).map((ex, i) => (
                  <span key={i} className="tag">{ex}</span>
                ))}
                {plan.exercises.length > 5 && (
                  <span className="tag">+{plan.exercises.length - 5}</span>
                )}
              </div>
            )}
          </Card>
        ))
      )}

      <p className="section-title">Histórico recente</p>
      {logs.length === 0 ? (
        <EmptyState
          icon={<IconCalendar />}
          message="Nenhum treino registrado"
          action="Registre sua primeira sessão"
        />
      ) : (
        logs.map(log => (
          <Card key={log.id} className="mb-8" variant="subtle">
            <div className="row-between">
              <div className="flex-1" style={{ minWidth: 0 }}>
                <div className="text-bold" style={{ fontSize: 15 }}>{log.plan_name || 'Treino livre'}</div>
                {log.notes && (
                  <div className="text-sub text-sm" style={{ marginTop: 2 }}>{log.notes}</div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                <div className="text-mute text-xs" style={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {fmtDate(log.logged_at)}
                </div>
                {log.duration_minutes && (
                  <div className="row gap-6" style={{ justifyContent: 'flex-end', color: 'var(--primary)', fontWeight: 800, fontSize: 13, marginTop: 2 }}>
                    <IconClock width="13" height="13" />
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
