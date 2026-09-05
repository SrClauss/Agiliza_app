"use client";

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, style, type, autoCapitalize, autoCorrect, ...props }, ref) => {
    const isEmail = type === 'email';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        {label && (
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--md-sys-color-text-muted)', letterSpacing: '0.1px' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          autoCapitalize={autoCapitalize || (isEmail ? 'none' : undefined)}
          autoCorrect={autoCorrect || (isEmail ? 'off' : undefined)}
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--md-shape-md)',
            border: `1.5px solid ${error ? '#ef4444' : 'var(--md-sys-color-border)'}`,
            backgroundColor: 'var(--md-sys-color-surface-variant)',
            fontSize: '1rem',
            color: 'var(--md-sys-color-text)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            outline: 'none',
            ...style
          }}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--md-sys-color-primary)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(48, 2, 103, 0.15)';
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--md-sys-color-border)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
          {...props}
        />
        {error && (
          <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 500, marginTop: '2px' }}>
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
