"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import dynamic from 'next/dynamic';

const MapPickerModal = dynamic(() => import('@/components/MapPickerModal'), { ssr: false });

interface Address {
  id: string;
  title: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export default function EnderecosCliente() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('agiliza_client_addresses');
    if (stored) {
      try {
        setAddresses(JSON.parse(stored));
      } catch (e) {}
    } else {
      // Endereco inicial padrao
      const initial: Address[] = [{
        id: '1',
        title: 'Minha Casa',
        street: 'Av. Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        isDefault: true
      }];
      setAddresses(initial);
      localStorage.setItem('agiliza_client_addresses', JSON.stringify(initial));
    }
  }, []);

  const saveAddresses = (newAddrs: Address[]) => {
    setAddresses(newAddrs);
    localStorage.setItem('agiliza_client_addresses', JSON.stringify(newAddrs));
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const newAddress: Address = {
      id: Date.now().toString(),
      title: title || 'Novo Endereço',
      street,
      number,
      neighborhood,
      city,
      state,
      isDefault: addresses.length === 0
    };

    const updated = [...addresses, newAddress];
    saveAddresses(updated);

    // Reset form
    setTitle('');
    setStreet('');
    setNumber('');
    setNeighborhood('');
    setCity('');
    setState('');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    const updated = addresses.filter(a => a.id !== id);
    saveAddresses(updated);
  };

  const handleSetDefault = (id: string) => {
    const updated = addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    saveAddresses(updated);
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '80px', backgroundColor: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/cliente/perfil" style={{ fontSize: '1.5rem', color: 'var(--color-text)', textDecoration: 'none' }}>←</Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          Endereços Salvos
        </h1>
      </header>

      {!showAddForm ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {addresses.length === 0 ? (
              <Card style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px' }}>
                Nenhum endereço cadastrado ainda.
              </Card>
            ) : (
              addresses.map(addr => (
                <Card key={addr.id} style={{ padding: '20px', borderLeft: addr.isDefault ? '4px solid #B3F63F' : '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#B3F63F' }}>
                      📍 {addr.title}
                    </h3>
                    {addr.isDefault && (
                      <span style={{ backgroundColor: '#B3F63F', color: 'var(--color-bg)', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                        PRINCIPAL
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', margin: '4px 0' }}>
                    {addr.street}, {addr.number} - {addr.neighborhood}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    {addr.city} / {addr.state}
                  </p>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    {!addr.isDefault && (
                      <Button variant="outline" style={{ fontSize: '0.8rem', padding: '8px 12px' }} onClick={() => handleSetDefault(addr.id)}>
                        Tornar Principal
                      </Button>
                    )}
                    <Button variant="outline" style={{ fontSize: '0.8rem', padding: '8px 12px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={() => handleDelete(addr.id)}>
                      Remover
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          <Button variant="primary" fullWidth onClick={() => setShowAddForm(true)} style={{ padding: '16px' }}>
            + Adicionar Novo Endereço
          </Button>
        </>
      ) : (
        <Card style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: '#B3F63F' }}>Cadastrar Endereço</h2>
          <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input 
              label="Título (ex: Minha Casa, Trabalho)" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Ex: Minha Casa"
              required 
              style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
            />
            
            <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Localização selecionada:</p>
              {street ? (
                <p style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>{street} - {neighborhood}, {city}/{state}</p>
              ) : (
                <p style={{ fontSize: '0.95rem', margin: 0, color: '#ef4444' }}>Nenhum local selecionado</p>
              )}
              
              <Button 
                type="button" 
                variant="outline" 
                fullWidth 
                onClick={() => setIsMapModalOpen(true)}
                style={{ marginTop: '12px', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
              >
                📍 Escolher no Mapa
              </Button>
            </div>

            <Input 
              label="Número / Complemento" 
              value={number} 
              onChange={e => setNumber(e.target.value)} 
              placeholder="Ex: 123, Apto 4"
              required 
              style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
            />

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <Button type="button" variant="outline" style={{ flex: 1 }} onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" style={{ flex: 1 }} disabled={!street}>
                Salvar Endereço
              </Button>
            </div>
          </form>
        </Card>
      )}

      <MapPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        lat={-23.55052}
        lng={-46.633308}
        radiusKm={0}
        onConfirm={(newLat, newLng, newAddr) => {
          if (newAddr) {
            // Tentativa rudimentar de parsear o endereco do Nominatim
            const parts = newAddr.split(',');
            setStreet(parts[0]?.trim() || '');
            setNeighborhood(parts[1]?.trim() || '');
            setCity(parts[2]?.trim() || '');
            setState(parts[3]?.trim() || '');
          }
        }}
      />
    </div>
  );
}
