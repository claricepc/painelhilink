import React from 'react';

export function Card({ children, style, variant }) {
  const base = {
    background: variant === 'subtle' ? 'var(--surface)' : 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '14px 16px',
  };
  return <div style={{ ...base, ...style }}>{children}</div>;
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, style }) {
  const base = {
    borderRadius: 'var(--radius-sm)',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'all var(--transition)',
    opacity: disabled ? 0.5 : 1,
    fontSize: size === 'sm' ? 13 : 15,
    padding: size === 'sm' ? '7px 14px' : '11px 20px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  };
  const variants = {
    primary: {
      background: 'var(--primary)',
      color: '#fff',
    },
    secondary: {
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      color: 'var(--text-sub)',
    },
    ghost: {
      background: 'transparent',
      border: '1px solid var(--border)',
      color: 'var(--text-sub)',
    },
    danger: {
      background: 'color-mix(in srgb, var(--coral) 20%, transparent)',
      border: '1px solid color-mix(in srgb, var(--coral) 35%, transparent)',
      color: 'var(--coral)',
    },
    success: {
      background: 'color-mix(in srgb, var(--green) 20%, transparent)',
      border: '1px solid color-mix(in srgb, var(--green) 35%, transparent)',
      color: 'var(--green)',
    },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

export function Input({ style, ...props }) {
  return (
    <input
      style={{
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text)',
        fontSize: 15,
        padding: '10px 12px',
        outline: 'none',
        ...style,
      }}
      {...props}
    />
  );
}

export function Textarea({ style, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      style={{
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text)',
        fontSize: 15,
        padding: '10px 12px',
        outline: 'none',
        resize: 'vertical',
        fontFamily: 'inherit',
        ...style,
      }}
      {...props}
    />
  );
}

export function Select({ children, style, ...props }) {
  return (
    <select
      style={{
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text)',
        fontSize: 15,
        padding: '10px 12px',
        outline: 'none',
        ...style,
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function ProgressBar({ value, max, color = 'var(--primary)', style }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ background: 'var(--border)', borderRadius: 99, height: 10, overflow: 'hidden', ...style }}>
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 99,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div
        style={{
          width: 36,
          height: 36,
          border: '3px solid var(--border)',
          borderTop: '3px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function EmptyState({ icon, message, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{message}</div>
      {action && <div style={{ fontSize: 13 }}>{action}</div>}
    </div>
  );
}

export function Badge({ children, color = 'var(--primary)' }) {
  return (
    <span
      style={{
        background: `color-mix(in srgb, ${color} 18%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
        color,
        padding: '2px 10px',
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}
