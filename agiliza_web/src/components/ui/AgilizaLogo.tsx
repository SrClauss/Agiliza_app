"use client";

import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function AgilizaLogo({ 
  size = 48, 
  style, 
  className
}: LogoProps) {
  // Proporção de curvatura M3 baseada no tamanho (aprox 22% do tamanho)
  const borderRadius = Math.max(8, Math.round(size * 0.22));

  return (
    <div 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(48, 2, 103, 0.2)',
        flexShrink: 0,
        ...style 
      }} 
      className={className}
    >
      <img
        src="/agilizapro_logo_badge.png"
        alt="AgilizaPro"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
    </div>
  );
}
