import React from 'react';
import { IconAlert } from './Icons';

export function Card({ children, variant = 'default', style, className = '', onClick }) {
  const cls = `rt-card ${variant !== 'default' ? variant : ''} ${className}`.trim();
  return (
    <div className={cls} style={style} onClick={onClick}>
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  block,
  type = 'button',
  style,
}) {
  const cls = [
    'rt-btn',
    variant,
    size === 'sm' && 'size-sm',
    size === 'lg' && 'size-lg',
    block && 'rt-btn-block',
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cls}
      style={style}
    >
      {children}
    </button>
  );
}

export function Input({ label, style, ...props }) {
  return (
    <div style={{ width: '100%' }}>
      {label && <label className="input-label">{label}</label>}
      <input className="rt-input" style={style} {...props} />
    </div>
  );
}

export function Textarea({ label, style, rows = 3, ...props }) {
  return (
    <div style={{ width: '100%' }}>
      {label && <label className="input-label">{label}</label>}
      <textarea className="rt-textarea" rows={rows} style={style} {...props} />
    </div>
  );
}

export function Select({ label, children, style, ...props }) {
  return (
    <div style={{ width: '100%' }}>
      {label && <label className="input-label">{label}</label>}
      <select className="rt-select" style={style} {...props}>
        {children}
      </select>
    </div>
  );
}

export function ProgressBar({ value, max, color, style }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className="rt-progress" style={style}>
      <div
        className="rt-progress-fill"
        style={{ width: `${pct}%`, ...(color ? { background: color } : {}) }}
      />
    </div>
  );
}

export function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
    </div>
  );
}

export function EmptyState({ icon, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-msg">{message}</div>
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

export function Badge({ children, variant }) {
  const cls = `tag ${variant || ''}`.trim();
  return <span className={cls}>{children}</span>;
}

export function NotConfigured({ title }) {
  return (
    <div>
      <div className="module-header">
        <h2 className="module-title">{title}</h2>
      </div>
      <div className="warn-banner">
        <IconAlert />
        <div>
          <strong>Banco de dados não configurado</strong>
          Configure as variáveis do Supabase para começar a registrar seus dados.
        </div>
      </div>
    </div>
  );
}

export function StatCard({ icon, label, value, unit, accent = 'default' }) {
  return (
    <div className="rt-card stat-card">
      <div className={`stat-icon ${accent}`}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="stat-label">{label}</div>
        <div className="stat-value">
          {value}
          {unit && <span className="unit">{unit}</span>}
        </div>
      </div>
    </div>
  );
}
