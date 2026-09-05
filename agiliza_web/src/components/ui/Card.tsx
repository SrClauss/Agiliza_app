import React from 'react';

export function Card({ children, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        backgroundColor: 'var(--md-sys-color-surface)',
        borderRadius: 'var(--md-shape-lg)',
        border: '1px solid var(--md-sys-color-border)',
        boxShadow: 'var(--md-elevation-1)',
        padding: '24px',
        color: 'var(--md-sys-color-text)',
        transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1)',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}
