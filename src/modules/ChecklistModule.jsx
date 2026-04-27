import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { Card, ProgressBar, Button, Input, Spinner, NotConfigured } from '../components/UI';
import { IconCheck, IconPlus, IconFlame } from '../components/Icons';

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
          description: item.item,
          points: 10,
        });
      }
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...updates } : i));
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

  if (!isConfigured) return <NotConfigured title="Hábitos" />;
  if (loading) return <Spinner />;

  return (
    <div>
      <div className="module-header">
        <div>
          <span className="module-sub">Hoje</span>
          <h2 className="module-title">Seus <span className="em">hábitos</span></h2>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowAdd(s => !s)}>
          <IconPlus width="14" height="14" /> {showAdd ? 'Fechar' : 'Item'}
        </Button>
      </div>

      {showAdd && (
        <Card className="mb-16" variant="elevated">
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
            block
            style={{ marginTop: 8 }}
          >
            {addingItem ? 'Adicionando…' : 'Adicionar hábito'}
          </Button>
        </Card>
      )}

      <Card className="mb-16">
        <div className="row-between mb-8">
          <div className="row gap-8">
            <IconFlame width="18" height="18" style={{ color: pct === 100 ? 'var(--primary)' : 'var(--orange)' }} />
            <span className="text-bold">Progresso de hoje</span>
          </div>
          <span className="text-bold" style={{ color: pct === 100 ? 'var(--primary)' : 'var(--text-sub)' }}>
            {done}/{total}
          </span>
        </div>
        <ProgressBar
          value={done}
          max={total || 1}
          color={pct === 100 ? 'var(--primary)' : 'var(--primary)'}
        />
        {pct === 100 && total > 0 && (
          <div className="mt-12 text-bold" style={{ textAlign: 'center', color: 'var(--primary)', fontSize: 13, letterSpacing: '0.06em' }}>
            DIA PERFEITO · TODOS CONCLUÍDOS
          </div>
        )}
      </Card>

      {items.map(item => (
        <div
          key={item.id}
          className={`checklist-item${item.is_completed ? ' done' : ''}`}
          onClick={() => toggleItem(item)}
          style={{ opacity: toggling === item.id ? 0.5 : 1 }}
        >
          <div className="checklist-checkbox">
            {item.is_completed && <IconCheck />}
          </div>
          <span className="checklist-text">{item.item}</span>
          {item.is_completed && <span className="checklist-pts">+10 PTS</span>}
        </div>
      ))}

      <div className="text-mute text-sm mt-16" style={{ textAlign: 'center' }}>
        Cada hábito completo vale 10 pontos
      </div>
    </div>
  );
}
