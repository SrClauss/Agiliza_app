"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/Button';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  onConfirm: (lat: number, lng: number, addressText?: string) => void;
}

export default function MapPickerModal({ isOpen, onClose, lat, lng, radiusKm, onConfirm }: MapPickerModalProps) {
  const [currentLat, setCurrentLat] = React.useState<number | null>(lat);
  const [currentLng, setCurrentLng] = React.useState<number | null>(lng);
  const [currentAddress, setCurrentAddress] = React.useState<string>('');

  React.useEffect(() => {
    setCurrentLat(lat);
    setCurrentLng(lng);
  }, [lat, lng, isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10000,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--color-surface, #ffffff)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '650px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        overflow: 'hidden',
        border: '1px solid var(--color-border, #e2e8f0)'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          borderBottom: '1px solid var(--color-border, #e2e8f0)',
          backgroundColor: 'var(--color-bg, #f8fafc)'
        }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
              📍 Ajustar Posição Exata no Mapa
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
              Clique ou arraste o pino para refinar a sua base de atendimento ({radiusKm} km de raio)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.4rem',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body - Map Canvas */}
        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <MapPicker
            lat={currentLat}
            lng={currentLng}
            radiusKm={radiusKm}
            onLocationChange={(newLat, newLng, newAddr) => {
              setCurrentLat(newLat);
              setCurrentLng(newLng);
              if (newAddr) setCurrentAddress(newAddr);
            }}
          />

          {currentLat && currentLng && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(179, 246, 63, 0.1)',
              border: '1px solid #B3F63F',
              fontSize: '0.85rem'
            }}>
              <strong>Coordenadas Selecionadas:</strong> {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
              {currentAddress && <div style={{ marginTop: '2px', color: 'var(--color-text-muted)' }}>{currentAddress}</div>}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          padding: '16px 24px',
          borderTop: '1px solid var(--color-border, #e2e8f0)',
          backgroundColor: 'var(--color-bg, #f8fafc)'
        }}>
          <Button variant="outline" onClick={onClose} style={{ padding: '10px 20px' }}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (currentLat && currentLng) {
                onConfirm(currentLat, currentLng, currentAddress);
              }
              onClose();
            }}
            style={{ padding: '10px 24px' }}
          >
            Confirmar Localização
          </Button>
        </div>
      </div>
    </div>
  );
}
