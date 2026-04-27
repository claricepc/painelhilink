import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { Card, Button, Input, Textarea, EmptyState, Spinner, NotConfigured, Badge } from '../components/UI';
import { IconScale, IconPlus } from '../components/Icons';

const FIELDS = [
  { key: 'weight_kg',     label: 'Peso',       short: 'Peso',    unit: 'kg', type: 'number', step: '0.1', placeholder: '75.0' },
  { key: 'body_fat_pct',  label: 'Gordura',    short: '% Gord',  unit: '%',  type: 'number', step: '0.1', placeholder: '18.0' },
  { key: 'waist_cm',      label: 'Cintura',    short: 'Cintura', unit: 'cm', type: 'number', step: '0.5', placeholder: '82.0' },
  { key: 'chest_cm',      label: 'Peito',      short: 'Peito',   unit: 'cm', type: 'number', step: '0.5', placeholder: '100.0' },
  { key: 'hip_cm',        label: 'Quadril',    short: 'Quadril', unit: 'cm', type: 'number', step: '0.5', placeholder: '96.0' },
  { key: 'bicep_cm',      label: 'Bíceps',     short: 'Bíceps',  unit: 'cm', type: 'number', step: '0.5', placeholder: '35.0' },
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

  if (!isConfigured) return <NotConfigured title="Evolução" />;
  if (loading) return <Spinner />;

  const latest = records[0];
  const prev = records[1];

  return (
    <div>
      <div className="module-header">
        <div>
          <span className="module-sub">Progresso</span>
          <h2 className="module-title">Sua <span className="em">evolução</span></h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(s => !s)}>
          <IconPlus width="14" height="14" /> {showForm ? 'Fechar' : 'Medir'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-16" variant="elevated">
          <div className="row-between mb-12">
            <div className="text-bold" style={{ fontSize: 16 }}>Nova medição</div>
            <Badge>+15 pts</Badge>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {FIELDS.map(f => (
              <Input
                key={f.key}
                label={`${f.label} (${f.unit})`}
                type={f.type}
                step={f.step}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              />
            ))}
          </div>
          <div className="mt-12" />
          <Textarea
            label="Observações"
            placeholder="Como você está se sentindo?"
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            rows={2}
          />
          <Button onClick={addRecord} disabled={saving} block style={{ marginTop: 12 }}>
            {saving ? 'Salvando…' : 'Salvar medição'}
          </Button>
        </Card>
      )}

      {latest && (
        <>
          <p className="section-title">Última medição · {fmtDate(latest.recorded_at)}</p>
          <div className="bg-grid mb-12">
            {FIELDS.map(f => {
              if (latest[f.key] == null) return null;
              const d = diff(latest, prev, f.key);
              const isReductionGood = ['weight_kg', 'body_fat_pct', 'waist_cm'].includes(f.key);
              const dn = d !== null ? parseFloat(d) : null;
              const isGood = dn !== null && (isReductionGood ? dn < 0 : dn > 0);
              const isBad = dn !== null && (isReductionGood ? dn > 0 : dn < 0);
              const trendColor = isGood ? 'var(--primary)' : isBad ? 'var(--red)' : 'var(--text-mute)';
              return (
                <div key={f.key} className="rt-card" style={{ textAlign: 'center', padding: '14px 8px' }}>
                  <div className="stat-label">{f.short}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4, letterSpacing: '-0.01em' }}>
                    {latest[f.key]}
                    <span style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 700, marginLeft: 2 }}>
                      {f.unit}
                    </span>
                  </div>
                  {d !== null && (
                    <div style={{
                      fontSize: 11,
                      marginTop: 4,
                      color: trendColor,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                    }}>
                      {dn > 0 ? '▲' : dn < 0 ? '▼' : '·'} {Math.abs(d)}{f.unit}
                    </div>
                  )}
                </div>
              );
            }).filter(Boolean)}
          </div>
          {latest.notes && (
            <Card variant="subtle" className="mb-16">
              <div className="text-sub text-sm">{latest.notes}</div>
            </Card>
          )}
        </>
      )}

      {records.length === 0 && (
        <EmptyState
          icon={<IconScale />}
          message="Nenhuma medição registrada"
          action="Registre suas medidas para acompanhar a evolução"
        />
      )}

      {records.length > 1 && (
        <>
          <p className="section-title">Histórico</p>
          {records.slice(1).map(rec => (
            <Card key={rec.id} variant="subtle" className="mb-8">
              <div className="row-between mb-8" style={{ flexWrap: 'wrap', gap: 8 }}>
                <span className="text-mute text-xs" style={{ fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {fmtDate(rec.recorded_at)}
                </span>
              </div>
              <div className="row gap-12" style={{ flexWrap: 'wrap' }}>
                {FIELDS.filter(f => rec[f.key] != null).map(f => (
                  <span key={f.key} className="text-sm">
                    <span className="text-mute">{f.short}: </span>
                    <span className="text-bold">{rec[f.key]}{f.unit}</span>
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
