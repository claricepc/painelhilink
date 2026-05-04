import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { Card, Button, Input, Select, Spinner, NotConfigured, Badge, EmptyState } from '../components/UI';
import {
  IconWallet, IconArrowUpCircle, IconArrowDownCircle,
  IconUsers, IconFlag, IconBank, IconPlus, IconX, IconAlert,
} from '../components/Icons';

// ─── Constantes ─────────────────────────────────────────────────────────────

const OPERATIONAL_CATEGORIES = [
  'Receita de Serviços',
  'Assinaturas / Planos',
  'Infraestrutura',
  'Marketing',
  'Pessoal',
  'Impostos / Taxas',
  'Fornecedores',
  'Outros',
];

const PARTNER_CATEGORIES = [
  'Pró-labore',
  'Distribuição de Lucro',
  'Adiantamento',
  'Reembolso',
  'Aporte de Capital',
  'Empréstimo',
  'Outros',
];

// palavras-chave que sinalizam movimentação de sócio numa transação operacional
const PARTNER_KEYWORDS = [
  'sócio', 'socio', 'retirada', 'aporte', 'pró-labore', 'pro-labore',
  'rafael', 'clarice', 'distribuição', 'distribuicao', 'empréstimo', 'emprestimo',
];

const fmtBRL = (v) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDate = (d) => {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

const today = () => new Date().toISOString().slice(0, 10);

// ─── Detecção de Inconsistências ─────────────────────────────────────────────

function detectOperationalFlags(rows) {
  return rows.map((row, i) => {
    const flags = [];

    if (!row.category) flags.push('sem_categoria');

    const descLower = (row.description || '').toLowerCase();
    if (PARTNER_KEYWORDS.some((kw) => descLower.includes(kw)))
      flags.push('possivel_socio');

    // duplicata: mesmo valor + tipo + data em outra linha
    const isDupe = rows.some(
      (r, j) =>
        j !== i &&
        r.date === row.date &&
        r.type === row.type &&
        Number(r.value) === Number(row.value) &&
        r.description === row.description,
    );
    if (isDupe) flags.push('duplicata');

    return { ...row, flags };
  });
}

function detectPartnerFlags(rows) {
  return rows.map((row, i) => {
    const flags = [];

    if (!row.category) flags.push('sem_categoria');
    if (!row.partner_name) flags.push('sem_socio');

    const isDupe = rows.some(
      (r, j) =>
        j !== i &&
        r.date === row.date &&
        r.type === row.type &&
        Number(r.value) === Number(row.value) &&
        r.partner_name === row.partner_name,
    );
    if (isDupe) flags.push('duplicata');

    return { ...row, flags };
  });
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function FlagBadges({ flags }) {
  if (!flags || flags.length === 0) return null;
  const labels = {
    sem_categoria: 'Sem categoria',
    possivel_socio: 'Possível sócio',
    duplicata: 'Duplicata',
    sem_socio: 'Sócio não identificado',
  };
  return (
    <div className="fin-flags">
      {flags.map((f) => (
        <span key={f} className="fin-flag">
          <IconFlag width={10} height={10} />
          {labels[f] || f}
        </span>
      ))}
    </div>
  );
}

function SummaryBar({ income, expense, label }) {
  const balance = income - expense;
  return (
    <div className="fin-summary-bar">
      <div className="fin-summary-item">
        <IconArrowUpCircle width={18} height={18} style={{ color: 'var(--green)' }} />
        <div>
          <div className="fin-summary-label">{label === 'partner' ? 'Aportes' : 'Receitas'}</div>
          <div className="fin-summary-value green">{fmtBRL(income)}</div>
        </div>
      </div>
      <div className="fin-summary-item">
        <IconArrowDownCircle width={18} height={18} style={{ color: 'var(--red)' }} />
        <div>
          <div className="fin-summary-label">{label === 'partner' ? 'Retiradas' : 'Despesas'}</div>
          <div className="fin-summary-value red">{fmtBRL(expense)}</div>
        </div>
      </div>
      <div className="fin-summary-item">
        <IconWallet width={18} height={18} style={{ color: balance >= 0 ? 'var(--primary)' : 'var(--orange)' }} />
        <div>
          <div className="fin-summary-label">Saldo</div>
          <div className={`fin-summary-value ${balance >= 0 ? 'primary' : 'orange'}`}>{fmtBRL(balance)}</div>
        </div>
      </div>
    </div>
  );
}

function InconsistencyBanner({ rows }) {
  const withFlags = rows.filter((r) => r.flags && r.flags.length > 0);
  if (withFlags.length === 0) return null;
  return (
    <div className="fin-warn-banner">
      <IconAlert width={16} height={16} />
      <span>
        {withFlags.length} {withFlags.length === 1 ? 'inconsistência encontrada' : 'inconsistências encontradas'} — verifique os itens sinalizados abaixo.
      </span>
    </div>
  );
}

function TransactionRow({ tx, onDelete, isPartner }) {
  const isIncome = isPartner
    ? tx.type === 'aporte'
    : tx.type === 'receita';
  const hasFlags = tx.flags && tx.flags.length > 0;

  return (
    <div className={`fin-tx-row${hasFlags ? ' flagged' : ''}`}>
      <div className="fin-tx-main">
        <div className="fin-tx-left">
          <div className={`fin-tx-type-dot ${isIncome ? 'income' : 'expense'}`} />
          <div>
            <div className="fin-tx-desc">{tx.description}</div>
            <div className="fin-tx-meta">
              {fmtDate(tx.date)}
              {tx.category && <> · {tx.category}</>}
              {tx.origin && <> · {tx.origin}</>}
              {isPartner && tx.partner_name && <> · <strong>{tx.partner_name}</strong></>}
              {tx.status === 'pendente' && (
                <span className="fin-status-badge">pendente</span>
              )}
            </div>
          </div>
        </div>
        <div className="fin-tx-right">
          <span className={`fin-tx-value ${isIncome ? 'green' : 'red'}`}>
            {isIncome ? '+' : '-'}{fmtBRL(tx.value)}
          </span>
          <button className="fin-delete-btn" onClick={() => onDelete(tx.id)} aria-label="Remover">
            <IconX width={14} height={14} />
          </button>
        </div>
      </div>
      <FlagBadges flags={tx.flags} />
    </div>
  );
}

// ─── Aba: Caixa Operacional ───────────────────────────────────────────────────

function CaixaOperacional() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: today(),
    description: '',
    type: 'receita',
    value: '',
    category: '',
    origin: '',
    status: 'realizado',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('financial_transactions')
      .select('*')
      .order('date', { ascending: false });
    setRows(detectOperationalFlags(data || []));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const income = rows.filter((r) => r.type === 'receita').reduce((s, r) => s + Number(r.value), 0);
  const expense = rows.filter((r) => r.type === 'despesa').reduce((s, r) => s + Number(r.value), 0);

  async function save() {
    if (!form.description.trim() || !form.value || Number(form.value) <= 0) return;
    setSaving(true);
    try {
      const { data } = await supabase
        .from('financial_transactions')
        .insert({
          date: form.date,
          description: form.description.trim(),
          type: form.type,
          value: Number(form.value),
          category: form.category || null,
          origin: form.origin || null,
          status: form.status,
        })
        .select()
        .single();
      if (data) {
        setRows((prev) => detectOperationalFlags([data, ...prev]));
        setForm({ date: today(), description: '', type: 'receita', value: '', category: '', origin: '', status: 'realizado' });
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    await supabase.from('financial_transactions').delete().eq('id', id);
    setRows((prev) => detectOperationalFlags(prev.filter((r) => r.id !== id)));
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="module-header">
        <div>
          <span className="module-sub">Apenas realizados no banco</span>
          <h2 className="module-title">Caixa <span className="em">Operacional</span></h2>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowForm((s) => !s)}>
          <IconPlus width={14} height={14} /> {showForm ? 'Fechar' : 'Lançar'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-16" variant="elevated">
          <div className="fin-form-grid">
            <Input label="Data" type="date" value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            <Select label="Tipo" value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </Select>
          </div>
          <div style={{ marginTop: 8 }}>
            <Input label="Descrição" placeholder="Ex: Mensalidade cliente X"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="fin-form-grid" style={{ marginTop: 8 }}>
            <Input label="Valor (R$)" type="number" min="0.01" step="0.01"
              placeholder="0,00" value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
            <Select label="Status" value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="realizado">Realizado</option>
              <option value="pendente">Pendente</option>
            </Select>
          </div>
          <div className="fin-form-grid" style={{ marginTop: 8 }}>
            <Select label="Categoria" value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              <option value="">— Selecione —</option>
              {OPERATIONAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input label="Conta / Origem" placeholder="Ex: Banco do Brasil"
              value={form.origin}
              onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))} />
          </div>
          <Button block onClick={save} disabled={saving || !form.description.trim() || !form.value}
            style={{ marginTop: 12 }}>
            {saving ? 'Salvando…' : 'Registrar lançamento'}
          </Button>
        </Card>
      )}

      <SummaryBar income={income} expense={expense} />

      <InconsistencyBanner rows={rows} />

      {rows.length === 0 ? (
        <EmptyState
          icon={<IconBank width={32} height={32} />}
          message="Nenhum lançamento operacional ainda."
          action={<Button size="sm" onClick={() => setShowForm(true)}>Adicionar primeiro lançamento</Button>}
        />
      ) : (
        rows.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} onDelete={remove} isPartner={false} />
        ))
      )}
    </div>
  );
}

// ─── Aba: Conta Corrente de Sócios ───────────────────────────────────────────

function ContaSocios() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: today(),
    description: '',
    type: 'retirada',
    value: '',
    category: '',
    origin: '',
    partner_name: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('partner_transactions')
      .select('*')
      .order('date', { ascending: false });
    setRows(detectPartnerFlags(data || []));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // aportes aumentam; tudo mais diminui o saldo
  const inflows = rows.filter((r) => r.type === 'aporte').reduce((s, r) => s + Number(r.value), 0);
  const outflows = rows.filter((r) => r.type !== 'aporte').reduce((s, r) => s + Number(r.value), 0);

  async function save() {
    if (!form.description.trim() || !form.value || Number(form.value) <= 0 || !form.partner_name.trim()) return;
    setSaving(true);
    try {
      const { data } = await supabase
        .from('partner_transactions')
        .insert({
          date: form.date,
          description: form.description.trim(),
          type: form.type,
          value: Number(form.value),
          category: form.category || null,
          origin: form.origin || null,
          partner_name: form.partner_name.trim(),
        })
        .select()
        .single();
      if (data) {
        setRows((prev) => detectPartnerFlags([data, ...prev]));
        setForm({ date: today(), description: '', type: 'retirada', value: '', category: '', origin: '', partner_name: '' });
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    await supabase.from('partner_transactions').delete().eq('id', id);
    setRows((prev) => detectPartnerFlags(prev.filter((r) => r.id !== id)));
  }

  // saldo por sócio
  const byPartner = rows.reduce((acc, r) => {
    const name = r.partner_name || 'Desconhecido';
    if (!acc[name]) acc[name] = { in: 0, out: 0 };
    if (r.type === 'aporte') acc[name].in += Number(r.value);
    else acc[name].out += Number(r.value);
    return acc;
  }, {});

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="module-header">
        <div>
          <span className="module-sub">Isolada do resultado operacional</span>
          <h2 className="module-title">Conta de <span className="em">Sócios</span></h2>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowForm((s) => !s)}>
          <IconPlus width={14} height={14} /> {showForm ? 'Fechar' : 'Lançar'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-16" variant="elevated">
          <div className="fin-form-grid">
            <Input label="Data" type="date" value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            <Select label="Tipo" value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="retirada">Retirada</option>
              <option value="aporte">Aporte</option>
              <option value="pagamento_cruzado">Pagamento cruzado</option>
              <option value="emprestimo">Empréstimo</option>
            </Select>
          </div>
          <div style={{ marginTop: 8 }}>
            <Input label="Sócio" placeholder="Nome do sócio"
              value={form.partner_name}
              onChange={(e) => setForm((f) => ({ ...f, partner_name: e.target.value }))} />
          </div>
          <div style={{ marginTop: 8 }}>
            <Input label="Descrição" placeholder="Ex: Retirada pró-labore Maio/25"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="fin-form-grid" style={{ marginTop: 8 }}>
            <Input label="Valor (R$)" type="number" min="0.01" step="0.01"
              placeholder="0,00" value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
            <Select label="Categoria" value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              <option value="">— Selecione —</option>
              {PARTNER_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div style={{ marginTop: 8 }}>
            <Input label="Conta / Origem" placeholder="Ex: Conta PJ Itaú"
              value={form.origin}
              onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))} />
          </div>
          <Button block onClick={save}
            disabled={saving || !form.description.trim() || !form.value || !form.partner_name.trim()}
            style={{ marginTop: 12 }}>
            {saving ? 'Salvando…' : 'Registrar movimentação'}
          </Button>
        </Card>
      )}

      <SummaryBar income={inflows} expense={outflows} label="partner" />

      {Object.keys(byPartner).length > 0 && (
        <div className="fin-partner-grid">
          {Object.entries(byPartner).map(([name, bal]) => (
            <div key={name} className="fin-partner-card">
              <div className="fin-partner-name">{name}</div>
              <div className={`fin-partner-balance ${bal.in - bal.out >= 0 ? 'green' : 'red'}`}>
                {fmtBRL(bal.in - bal.out)}
              </div>
              <div className="fin-partner-detail">
                <span style={{ color: 'var(--green)' }}>+{fmtBRL(bal.in)}</span>
                <span style={{ color: 'var(--red)' }}>-{fmtBRL(bal.out)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <InconsistencyBanner rows={rows} />

      {rows.length === 0 ? (
        <EmptyState
          icon={<IconUsers width={32} height={32} />}
          message="Nenhuma movimentação de sócio registrada."
          action={<Button size="sm" onClick={() => setShowForm(true)}>Adicionar primeira movimentação</Button>}
        />
      ) : (
        rows.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} onDelete={remove} isPartner />
        ))
      )}
    </div>
  );
}

// ─── Módulo Principal ────────────────────────────────────────────────────────

const TABS = [
  { id: 'caixa',   label: 'Caixa Operacional', Icon: IconBank },
  { id: 'socios',  label: 'Conta de Sócios',   Icon: IconUsers },
];

export default function FinancialModule() {
  const [tab, setTab] = useState('caixa');

  if (!isConfigured) return <NotConfigured title="Financeiro" />;

  return (
    <div>
      <div className="fin-tab-bar">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`fin-tab-btn${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon width={16} height={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'caixa'  && <CaixaOperacional />}
      {tab === 'socios' && <ContaSocios />}
    </div>
  );
}
