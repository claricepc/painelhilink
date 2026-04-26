import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { Card, ProgressBar, Button, Input, Spinner } from '../components/UI';

const DEFAULT_ITEMS = [
  'Fazer o treino do dia',
  'Beber 2,5L de água',
  'Dormir pelo menos 7h',
  'Comer bem (sem excessos)',
  'Fazer 10min de alongamento',
];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function ChecklistModule({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('daily_checklist')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', todayDate())
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        setItems(data);
      } else {
        // Seed default items for today
        const rows = DEFAULT_ITEMS.map(item => ({
          user_id: user.id,
          item,
          is_completed: false,
          date: todayDate(),
        }));
        const { data: seeded } = await supabase
          .from('daily_checklist')
          .insert(rows)
          .select();
        if (seeded) setItems(seeded);
      }
    } catch (_) {}
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function toggleItem(item) {
    if (toggling) return;
    setToggling(item.id);
    const completing = !item.is_completed;
    try {
      const updates = {
        is_completed: completing,
        completed_at: completing ? new Date().toISOString() : null,
      };
      await supabase.from('daily_checklist').update(updates).eq('id', item.id);
      if (completing) {
        await supabase.from('points').insert({
          user_id: user.id,
          action: 'checklist',
          description: `✅ ${item.item}`,
          points: 10,
        });
      }
      setItems(prev =>
        prev.map(i => i.id === item.id ? { ...i, ...updates } : i)
      );
    } finally {
      setToggling(null);
    }
  }

  async function addCustomItem() {
    if (!newItem.trim()) return;
    setAddingItem(true);
    try {
      const { data } = await supabase
        .from('daily_checklist')
        .insert({
          user_id: user.id,
          item: newItem.trim(),
          is_completed: false,
          date: todayDate(),
        })
        .select()
        .single();
      if (data) setItems(prev => [...prev, data]);
      setNewItem('');
      setShowAdd(false);
    } finally {
      setAddingItem(false);
    }
  }

  const done = items.filter(i => i.is_completed).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  if (!isConfigured) {
    return (
      <div>
        <div className="module-header"><h2 className="module-title">Checklist ✅</h2></div>
        <div className="error-banner">Configure as variáveis do Supabase para começar.</div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="module-header">
        <h2 className="module-title">Checklist ✅</h2>
        <Button size="sm" variant="secondary" onClick={() => setShowAdd(s => !s)}>
          {showAdd ? 'Cancelar' : '+ Item'}
        </Button>
      </div>

      {showAdd && (
        <Card style={{ marginBottom: 16 }}>
          <Input
            placeholder="Novo hábito do dia..."
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomItem()}
            autoFocus
          />
          <Button
            onClick={addCustomItem}
            disabled={addingItem || !newItem.trim()}
            style={{ width: '100%', marginTop: 8 }}
          >
            {addingItem ? 'Adicionando…' : 'Adicionar'}
          </Button>
        </Card>
      )}

      {/* Progress */}
      <Card style={{ marginBottom: 20, padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontWeight: 700 }}>Progresso de hoje</span>
          <span style={{ color: pct === 100 ? 'var(--green)' : 'var(--text-sub)', fontWeight: 700 }}>
            {done}/{total}
          </span>
        </div>
        <ProgressBar
          value={done}
          max={total || 1}
          color={pct === 100 ? 'var(--green)' : 'var(--primary)'}
        />
        {pct === 100 && total > 0 && (
          <div style={{ marginTop: 10, textAlign: 'center', color: 'var(--green)', fontWeight: 700, fontSize: 15 }}>
            🏆 Dia perfeito! Todos os hábitos concluídos
          </div>
        )}
      </Card>

      {/* Items */}
      {items.map(item => (
        <div
          key={item.id}
          className={`checklist-item${item.is_completed ? ' done' : ''}`}
          onClick={() => toggleItem(item)}
          style={{ opacity: toggling === item.id ? 0.6 : 1 }}
        >
          <div className="checklist-checkbox">
            {item.is_completed && '✓'}
          </div>
          <span className="checklist-text">{item.item}</span>
          {item.is_completed && (
            <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 600, flexShrink: 0 }}>
              +10pts
            </span>
          )}
        </div>
      ))}

      <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
        Cada item completo vale 10 pontos 🎯
      </div>
    </div>
  );
}
