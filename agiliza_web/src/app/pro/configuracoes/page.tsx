"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import AddressAutocomplete, { AddressResult } from '@/components/AddressAutocomplete';
import MapPickerModal from '@/components/MapPickerModal';

interface Category {
  id: string;
  name: string;
  parent_id?: string;
  is_remote?: boolean;
  is_physical?: boolean;
}

export default function ConfiguracoesProfissional() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [notifyNewServices, setNotifyNewServices] = useState(true);
  const [notifyRadiusKm, setNotifyRadiusKm] = useState(30);

  // Address & Geolocation states
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('agiliza_token');
    if (!token) {
      router.push('/login/profissional');
      return;
    }

    // Puxar categorias disponíveis
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(console.error);

    // Carregar dados reais do perfil do profissional
    fetch('/api/auth/professionals/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          if (Array.isArray(data.categories)) setSelectedCategoryIds(data.categories);
          if (data.service_radius_km) setNotifyRadiusKm(data.service_radius_km);
          if (data.address) setAddress(data.address);
          if (data.latitude) setLatitude(Number(data.latitude));
          if (data.longitude) setLongitude(Number(data.longitude));
        }
      })
      .catch(console.error);

    const storedConfig = localStorage.getItem('agiliza_pro_config');
    if (storedConfig) {
      try {
        const conf = JSON.parse(storedConfig);
        if (typeof conf.notifyNewServices === 'boolean') setNotifyNewServices(conf.notifyNewServices);
      } catch(e) {}
    }
  }, [router]);

  const handleSelectAddress = (result: AddressResult) => {
    setAddress(result.formatted);
    if (result.city) setCity(result.city);
    if (result.state) setState(result.state);
    if (result.postalCode) setPostalCode(result.postalCode);
    setLatitude(result.latitude);
    setLongitude(result.longitude);
  };

  const handleGpsLocation = () => {
    if (!("geolocation" in navigator)) {
      setGpsStatus("Geolocalização não suportada neste dispositivo.");
      return;
    }

    setGpsStatus("Obtendo coordenadas do GPS...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          const road = data.address?.road || data.address?.suburb || '';
          const lCity = data.address?.city || data.address?.town || data.address?.municipality || '';
          const lState = data.address?.state || '';
          const fullAddr = `${road ? road + ', ' : ''}${lCity}${lState ? ' - ' + lState : ''}`;
          setAddress(fullAddr || `Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`);
          if (lCity) setCity(lCity);
          if (lState) setState(lState);
          setGpsStatus("✅ Localização GPS obtida com sucesso!");
        } catch(e) {
          setAddress(`Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`);
          setGpsStatus("✅ Coordenadas GPS obtidas!");
        }
      },
      (err) => {
        console.warn(err);
        setGpsStatus("Erro ou permissão de GPS negada.");
      }
    );
  };

  const toggleCategory = (catId: string) => {
    if (selectedCategoryIds.includes(catId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== catId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, catId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    const token = localStorage.getItem('agiliza_token');
    if (!token) return;

    try {
      const res = await fetch('/api/auth/professionals/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          address: address || null,
          latitude: latitude || null,
          longitude: longitude || null,
          categories: selectedCategoryIds,
          service_radius_km: notifyRadiusKm
        })
      });

      if (res.ok) {
        const config = {
          categories: selectedCategoryIds,
          notifyNewServices,
          notifyRadiusKm
        };
        localStorage.setItem('agiliza_pro_config', JSON.stringify(config));
        setSuccessMsg('Configurações salvas com sucesso!');
        setTimeout(() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push('/pro/perfil');
          }
        }, 600);
      } else {
        alert('Erro ao salvar configurações no servidor.');
      }
    } catch(err) {
      alert('Erro de conexão ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '32px', backgroundColor: 'var(--color-bg)', minHeight: '100%', color: 'var(--color-text)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/pro/perfil" style={{ fontSize: '1.5rem', color: 'var(--color-text)', textDecoration: 'none' }}>←</Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          Configurações Profissionais
        </h1>
      </header>

      {successMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '14px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', fontSize: '0.95rem', fontWeight: 600 }}>
          ✅ {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        
        {/* Seção 1: Base de Operações & Localização */}
        <Card style={{ padding: '24px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px', color: '#B3F63F' }}>
            📍 Base de Operações & Localização
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '18px' }}>
            Digite seu CEP ou endereço para autocompletar via ViaCEP/GPS:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Campo Autocomplete de Endereço e CEP */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
                Endereço ou CEP:
              </label>
              <AddressAutocomplete
                value={address}
                onSelect={handleSelectAddress}
                placeholder="Digite seu CEP (ex: 29936-808) ou endereço completo..."
              />
            </div>

            {/* Endereço Atual Confirmado */}
            {address && (
              <div style={{ padding: '14px', backgroundColor: 'rgba(179, 246, 63, 0.1)', border: '1px solid #B3F63F', borderRadius: '10px', fontSize: '0.9rem' }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#B3F63F' }}>Endereço Base Confirmado:</strong>
                <span>{address}</span>
                {latitude && longitude && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Coordenadas GPS: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                  </div>
                )}
              </div>
            )}

            {/* Ações de Mapa e GPS em formato de Grid de Botões */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Button type="button" variant="outline" onClick={handleGpsLocation} style={{ width: '100%', padding: '12px', fontSize: '0.88rem' }}>
                🎯 Usar GPS Atual
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsMapModalOpen(true)}
                style={{ width: '100%', padding: '12px', fontSize: '0.88rem', borderColor: '#B3F63F', color: '#B3F63F' }}
              >
                🗺️ Ajustar no Mapa
              </Button>
            </div>

            {gpsStatus && (
              <p style={{ fontSize: '0.82rem', color: '#B3F63F', margin: 0, textAlign: 'center', fontWeight: 600 }}>
                {gpsStatus}
              </p>
            )}

          </div>
        </Card>

        {/* Seção 2: Raio de Atendimento & Alertas */}
        <Card style={{ padding: '24px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '12px', color: '#B3F63F' }}>
            🔔 Raio de Atendimento & Alertas
          </h2>
          
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '18px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Receber alertas de novos serviços na região</span>
            <input 
              type="checkbox" 
              checked={notifyNewServices} 
              onChange={e => setNotifyNewServices(e.target.checked)}
              style={{ width: '20px', height: '20px', accentColor: '#B3F63F' }}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                Raio de atendimento para notificações:
              </label>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#B3F63F' }}>
                {notifyRadiusKm} km
              </span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="100" 
              step="5"
              value={notifyRadiusKm} 
              onChange={e => setNotifyRadiusKm(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#B3F63F', cursor: 'pointer' }}
            />
          </div>
        </Card>

        {/* Seção 3: Categorias e Subcategorias Atendidas */}
        <Card style={{ padding: '24px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px', color: '#B3F63F' }}>
            🛠️ Categorias e Especialidades Que Atende
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Marque as especialidades de serviços para receber orçamentos correspondentes:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
            {categories.map(cat => {
              const isSelected = selectedCategoryIds.includes(cat.id);
              const isParent = !cat.parent_id;

              return (
                <label 
                  key={cat.id} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
                    backgroundColor: isSelected ? 'var(--color-primary-light)' : 'var(--color-bg)',
                    border: '1px solid var(--color-border)', borderRadius: '10px', cursor: 'pointer',
                    marginLeft: isParent ? '0' : '22px'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => toggleCategory(cat.id)}
                    style={{ accentColor: '#B3F63F', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: isParent ? '0.95rem' : '0.88rem', fontWeight: isParent ? 700 : 400, color: isParent ? 'var(--color-text)' : '#e2e8f0' }}>
                    {isParent ? `📁 ${cat.name}` : `↳ ${cat.name}`}
                  </span>
                </label>
              );
            })}
          </div>
        </Card>

        <Button type="submit" variant="primary" disabled={saving} style={{ padding: '16px', fontSize: '1.05rem', fontWeight: 700 }}>
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </form>

      {/* Modal de Ajuste de Pino no Mapa (Estrutura do aggapp) */}
      <MapPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        lat={latitude}
        lng={longitude}
        radiusKm={notifyRadiusKm}
        onConfirm={(newLat, newLng, newAddr) => {
          setLatitude(newLat);
          setLongitude(newLng);
          if (newAddr) setAddress(newAddr);
        }}
      />
    </div>
  );
}
