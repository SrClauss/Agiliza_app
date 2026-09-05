"use client";
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export interface AddressResult {
  formatted: string;
  street?: string;
  district?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  provider?: 'viacep' | 'nominatim' | 'gps';
}

interface AddressAutocompleteProps {
  value?: string;
  onSelect: (result: AddressResult) => void;
  placeholder?: string;
}

interface Suggestion {
  display_name: string;
  lat: number;
  lng: number;
  street?: string;
  district?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  provider: 'viacep' | 'nominatim';
}

export default function AddressAutocomplete({ value = '', onSelect, placeholder }: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleTriggerSearch = async () => {
    const clean = query.trim();
    if (clean.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    fetchSuggestions(clean);
  };

  const fetchSuggestions = async (q: string) => {
    setLoading(true);
    const cepDigits = q.replace(/\D+/g, '');

    // 1. Suporte a CEP via ViaCEP (se for no formato de 8 dígitos)
    if (/^\d{8}$/.test(cepDigits)) {
      try {
        const resp = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
        const data = await resp.json();
        if (!data.erro) {
          const street = data.logradouro || '';
          const district = data.bairro || '';
          const city = data.localidade || '';
          const state = data.uf || '';
          const display = `${street ? street + ' - ' : ''}${district ? district + ', ' : ''}${city} - ${state}, ${cepDigits}`;

          // Obter coordenadas no Nominatim para o CEP/Endereço
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(display)}&limit=1&countrycodes=br`);
          const geoData = await geoRes.json();

          let lat = -23.5505;
          let lng = -46.6333;
          if (Array.isArray(geoData) && geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lng = parseFloat(geoData[0].lon);
          }

          const sug: Suggestion = {
            display_name: display,
            lat,
            lng,
            street,
            district,
            city,
            state,
            postalCode: cepDigits,
            provider: 'viacep'
          };
          setSuggestions([sug]);
          setIsOpen(true);
          setLoading(false);
          return;
        }
      } catch (e) {
        // Fallback para Nominatim
      }
    }

    // 2. Busca de texto livre via Nominatim OpenStreetMap
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=br`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped: Suggestion[] = data.map(item => {
          const addr = item.address || {};
          const city = addr.city || addr.town || addr.municipality || '';
          const state = addr.state || '';
          const road = addr.road || addr.suburb || '';
          return {
            display_name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            street: road,
            district: addr.suburb || '',
            city,
            state,
            postalCode: addr.postcode || '',
            provider: 'nominatim'
          };
        });
        setSuggestions(mapped);
        setIsOpen(mapped.length > 0);
      }
    } catch (e) {
      console.error(e);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (sug: Suggestion) => {
    setQuery(sug.display_name);
    setIsOpen(false);
    setSuggestions([]);
    onSelect({
      formatted: sug.display_name,
      street: sug.street,
      district: sug.district,
      city: sug.city,
      state: sug.state,
      postalCode: sug.postalCode,
      latitude: sug.lat,
      longitude: sug.lng,
      provider: sug.provider
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <Input
            placeholder={placeholder || 'Digite um CEP (ex: 29936-808) ou endereço...'}
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setIsOpen(false);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleTriggerSearch();
              }
            }}
            style={{ width: '100%' }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleTriggerSearch}
          disabled={loading}
          style={{ padding: '12px 18px', whiteSpace: 'nowrap', borderColor: '#B3F63F', color: '#B3F63F' }}
        >
          {loading ? 'Buscando...' : '🔍 Buscar'}
        </Button>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 9999,
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #e2e8f0)',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          marginTop: '6px',
          maxHeight: '260px',
          overflowY: 'auto'
        }}>
          {suggestions.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(item)}
              style={{
                padding: '12px 16px',
                borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid var(--color-border, #f1f5f9)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(179, 246, 63, 0.12)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  📍 {item.display_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  GPS: {item.lat.toFixed(5)}, {item.lng.toFixed(5)}
                </div>
              </div>

              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: item.provider === 'viacep' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(179, 246, 63, 0.2)',
                color: item.provider === 'viacep' ? '#3b82f6' : '#84cc16',
                textTransform: 'uppercase',
                flexShrink: 0
              }}>
                {item.provider === 'viacep' ? 'ViaCEP' : 'GPS'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
