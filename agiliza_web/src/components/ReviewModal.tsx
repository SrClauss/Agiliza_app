'use client';
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalProfileId: string;
  serviceRequestId: string;
  professionalName?: string;
  serviceTitle?: string;
  onSuccess?: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  professionalProfileId,
  serviceRequestId,
  professionalName = 'Profissional',
  serviceTitle,
  onSuccess
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professionalProfileId) {
      setError('ID do profissional não identificado.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const token = localStorage.getItem('agiliza_token');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          professional_profile: professionalProfileId,
          service_request_id: serviceRequestId,
          rating,
          comment: comment.trim() || undefined
        })
      });

      if (!res.ok) {
        // Fallback para rota legada se necessário
        const resLegacy = await fetch('/api/auth/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            professional_profile: professionalProfileId,
            service_request_id: serviceRequestId,
            rating,
            comment: comment.trim() || undefined
          })
        });

        if (!resLegacy.ok) {
          const errData = await resLegacy.json().catch(() => ({}));
          throw new Error(errData.message || 'Falha ao enviar avaliação.');
        }
      }

      setSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 2000);

    } catch(err: any) {
      setError(err.message || 'Erro ao registrar avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <Card style={{
        maxWidth: '440px',
        width: '100%',
        padding: '28px',
        borderRadius: 'var(--md-shape-xl)',
        backgroundColor: 'var(--md-sys-color-surface)',
        color: 'var(--md-sys-color-text)',
        border: '1.5px solid var(--md-sys-color-primary)',
        boxShadow: 'var(--md-elevation-3)'
      }}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--md-sys-color-primary)', margin: '0 0 8px 0' }}>
              Avaliação Enviada!
            </h3>
            <p style={{ color: 'var(--md-sys-color-text-muted)', fontSize: '0.92rem', margin: 0 }}>
              Muito obrigado por avaliar o atendimento de <strong>{professionalName}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '4px' }}>⭐</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--md-sys-color-primary)' }}>
                Avaliar Atendimento
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--md-sys-color-text-muted)', margin: '4px 0 0 0' }}>
                Como foi o serviço de <strong>{professionalName}</strong>?
                {serviceTitle && <span style={{ display: 'block', fontStyle: 'italic' }}>&quot;{serviceTitle}&quot;</span>}
              </p>
            </div>

            {/* Seletor de 5 Estrelas */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '8px 0' }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '2.4rem',
                      cursor: 'pointer',
                      color: isFilled ? '#f59e0b' : 'var(--md-sys-color-border)',
                      transition: 'transform 0.15s ease, color 0.15s ease',
                      transform: (hoverRating === star || rating === star) ? 'scale(1.15)' : 'scale(1)',
                      padding: 0,
                      lineHeight: 1
                    }}
                    title={`${star} estrela${star > 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.88rem', fontWeight: 600, color: '#f59e0b', marginTop: '-8px' }}>
              {rating === 5 && 'Excelente! ⭐⭐⭐⭐⭐'}
              {rating === 4 && 'Muito Bom! ⭐⭐⭐⭐'}
              {rating === 3 && 'Bom / Satisfatório ⭐⭐⭐'}
              {rating === 2 && 'Regular ⭐⭐'}
              {rating === 1 && 'Ruim ⭐'}
            </div>

            {/* Campo de Comentário */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--md-sys-color-text)', marginBottom: '6px' }}>
                Deixe seu comentário (opcional):
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Conte pontos positivos, pontualidade, qualidade do trabalho..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--md-shape-md)',
                  border: '1.5px solid var(--md-sys-color-border)',
                  backgroundColor: 'var(--md-sys-color-surface-variant)',
                  color: 'var(--md-sys-color-text)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
                style={{ flex: 1, padding: '12px' }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                style={{ flex: 1, padding: '12px' }}
              >
                {submitting ? 'Enviando...' : 'Enviar Avaliação ✨'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
