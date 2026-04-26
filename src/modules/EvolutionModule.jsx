import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { Card, Button, Input, Textarea, EmptyState, Spinner } from '../components/UI';

const FIELDS = [
  { key: 'weight_kg',     label: 'Peso (kg)',       type: 'number', step: '0.1', placeholder: '75.0' },
  { key: 'body_fat_pct',  label: 'Gordura (%)',      type: 'number', step: '0.1', placeholder: '18.0' },
  { key: 'waist_cm',      label: 'Cintura (cm)',     type: 'number', step: '0.5', placeholder: '82.0' },
  { key: 'chest_cm',      label: 'Peito (cm)',       type: 'number', step: '0.5', placeholder: '100.0' },
  { key: 'hip_cm',        label: 'Quadril (cm)',     type: 'number', step: '0.5', placeholder: '96.0' },
  { key: 'bicep_cm',      label: 'Bíceps (cm)',      type: 'number', step: '0.5', placeholder: '35.0' },
];

const EMPTY_FORM = Object.fromEntries([...FIELDS.map(f => [f.key, '']), ['notes', '']]);

export default function EvolutionModule({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('body_records')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(20);
      if (data) setRecords(data);
    } catch (_) {}
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  async function addRecord() {
    const payload = { user_id: user.id };
    FIELDS.forEach(f => {
      if (form[f.key] !== '') payload[f.key] = parseFloat(form[f.key]);
    });
    if (form.notes.trim()) payload.notes = form.notes.trim();

    if (Object.keys(payload).length <= 1) return;

    setSaving(true);
    try {
      await Promise.all([
        supabase.from('body_records').insert(payload),
        supabase.from('points').insert({
          user_id: user.id,
          action: 'body_record',
          description: 'Medição corporal registrada',
          points: 15,
        }),
      ]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchRecords();
    } finally {
      setSaving(false);
    }
  }

  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
  }

  function diff(current, previous, key) {
    if (!previous || previous[key] == null || current[key] == null) return null;
    return (current[key] - previous[key]).toFixed(1);
  }

  if (!isConfigured) {
    return (
      <div>
        <div className="module-header"><h2 className="module-title">Evolução 📊</h2></div>
        <div className="error-banner">Configure as variáveis do Supabase para começar.</div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  const latest = records[0];
  const prev = records[1];

  return (
    <div>
      <div className="module-header">
        <h2 className="module-title">Evolução 📊</h2>
        <Button size="sm" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancelar' : '+ Medição'}
        </Button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Nova Medição · +15pts</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {FIELDS.map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 4 }}>{f.label}</div>
                <Input
                  type={f.type}
                  step={f.step}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <Textarea
            placeholder="Observações (opcional)"
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            style={{ marginTop: 8 }}
            rows={2}
          />
          <Button onClick={addRecord} disabled={saving} style={{ width: '100%', marginTop: 12 }}>
            {saving ? 'Salvando…' : 'Salvar Medição'}
          </Button>
        </Card>
      )}

      {latest && (
        <>
          <p className="section-title">Última Medição — {fmtDate(latest.recorded_at)}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
            {FIELDS.map(f => {
              if (latest[f.key] == null) return null;
              const d = diff(latest, prev, f.key);
              const isGood = f.key === 'weight_kg' || f.key === 'body_fat_pct' || f.key === 'waist_cm'
                ? d !== null && parseFloat(d) < 0
                : d !== null && parseFloat(d) > 0;
              return (
                <Card key={f.key} style={{ textAlign: 'center', padding: '12px 8px' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{f.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{latest[f.key]}</div>
                  {d !== null && (
                    <div style={{
                      fontSize: 12,
                      marginTop: 2,
                      color: isGood ? 'var(--green)' : parseFloat(d) > 0 ? 'var(--coral)' : 'var(--text-muted)',
                    }}>
                      {parseFloat(d) > 0 ? '▲' : '▼'} {Math.abs(d)}
                    </div>
                  )}
                </Card>
              );
            }).filter(Boolean)}
          </div>
          {latest.notes && (
            <Card variant="subtle" style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>📝 {latest.notes}</div>
            </Card>
          )}
        </>
      )}

      {records.length === 0 && (
        <EmptyState icon="📏" message="Nenhuma medição registrada" action="Registre suas medidas para acompanhar o progresso" />
      )}

      {records.length > 1 && (
        <>
          <p className="section-title">Histórico</p>
          {records.slice(1).map(rec => (
            <Card key={rec.id} variant="subtle" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ color: 'var(--text-sub)', fontSize: 13 }}>{fmtDate(rec.recorded_at)}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {FIELDS.filter(f => rec[f.key] != null).map(f => (
                    <span key={f.key} style={{ fontSize: 13 }}>
                      <span style={{ color: 'var(--text-sub)' }}>{f.label.split(' ')[0]}: </span>
                      <span style={{ fontWeight: 600 }}>{rec[f.key]}</span>
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
