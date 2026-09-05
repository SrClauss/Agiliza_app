"use client";

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  style, 
  ...props 
}: ButtonProps) {
  
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--md-sys-color-primary)',
          color: 'var(--md-sys-color-on-primary)',
          boxShadow: 'var(--md-elevation-1)',
          border: 'none',
          fontWeight: 700,
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--md-sys-color-secondary)',
          color: 'var(--md-sys-color-on-secondary)',
          boxShadow: 'var(--md-elevation-1)',
          border: 'none',
          fontWeight: 700,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--md-sys-color-primary)',
          border: '1.5px solid var(--md-sys-color-primary)',
          fontWeight: 600,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--md-sys-color-primary)',
          border: 'none',
          fontWeight: 600,
        };
      default:
        return {};
    }
  };

  return (
    <button
      style={{
        padding: '14px 28px',
        borderRadius: 'var(--md-shape-full)',
        fontSize: '0.98rem',
        letterSpacing: '0.1px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
        width: fullWidth ? '100%' : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...getVariantStyles(),
        ...style
      }}
      onMouseOver={(e) => {
        if (variant === 'primary') {
          e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary-hover)';
          e.currentTarget.style.boxShadow = 'var(--md-elevation-2)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        } else if (variant === 'secondary') {
          e.currentTarget.style.backgroundColor = 'var(--md-sys-color-secondary-hover)';
          e.currentTarget.style.boxShadow = 'var(--md-elevation-2)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        } else if (variant === 'outline') {
          e.currentTarget.style.backgroundColor = 'rgba(48, 2, 103, 0.06)';
        } else {
          e.currentTarget.style.backgroundColor = 'rgba(48, 2, 103, 0.08)';
        }
      }}
      onMouseOut={(e) => {
        if (variant === 'primary') {
          e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary)';
          e.currentTarget.style.boxShadow = 'var(--md-elevation-1)';
          e.currentTarget.style.transform = 'translateY(0)';
        } else if (variant === 'secondary') {
          e.currentTarget.style.backgroundColor = 'var(--md-sys-color-secondary)';
          e.currentTarget.style.boxShadow = 'var(--md-elevation-1)';
          e.currentTarget.style.transform = 'translateY(0)';
        } else {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}
