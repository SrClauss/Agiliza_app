"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parent_id?: string;
  is_remote?: boolean;
  is_physical?: boolean;
}

interface SavedAddress {
  id: string;
  title: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export default function NovoPedido() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // Dynamic categories
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [subCategoriesList, setSubCategoriesList] = useState<Category[]>([]);

  // Request details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isRemoteChosen, setIsRemoteChosen] = useState(false);

  // Location / Address states
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [addressChoice, setAddressChoice] = useState<'gps' | 'saved' | 'manual'>('gps');
  const [selectedSavedId, setSelectedSavedId] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>('Clique no botão para buscar via GPS');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const selectedCatId = subCategory || parentCategory;
    if (!selectedCatId) return;
    const currentCatObj = allCategories.find(c => c.id === selectedCatId);
    if (currentCatObj) {
      if (currentCatObj.is_remote && !currentCatObj.is_physical) {
        setIsRemoteChosen(true);
      } else if (!currentCatObj.is_remote) {
        setIsRemoteChosen(false);
      }
    }
  }, [parentCategory, subCategory, allCategories]);

  useEffect(() => {
    const token = localStorage.getItem('agiliza_token');
    if (!token) {
      router.push('/login/cliente');
      return;
    }

    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAllCategories(data);
      })
      .catch(console.error);

    const stored = localStorage.getItem('agiliza_client_addresses');
    if (stored) {
      try {
        const addrs: SavedAddress[] = JSON.parse(stored);
        setSavedAddresses(addrs);
        const def = addrs.find(a => a.isDefault);
        if (def) setSelectedSavedId(def.id);
        else if (addrs.length > 0) setSelectedSavedId(addrs[0].id);
      } catch (e) {}
    }
  }, [router]);

  useEffect(() => {
    if (!parentCategory) {
      setSubCategoriesList([]);
      setSubCategory('');
      return;
    }

    const subs = allCategories.filter(c => c.parent_id === parentCategory);
    setSubCategoriesList(subs);
    setSubCategory('');
  }, [parentCategory, allCategories]);

  const fetchGpsLocation = () => {
    if (!("geolocation" in navigator)) {
      setGpsStatus("Geolocalização não é suportada por este dispositivo.");
      return;
    }

    setGpsStatus("Obtendo coordenadas do GPS...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLat(latitude);
        setLng(longitude);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const road = data.address?.road || data.address?.suburb || '';
          const city = data.address?.city || data.address?.town || '';
          const full = `${road ? road + ', ' : ''}${city} (GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          setManualAddress(full);
          setGpsStatus(`Localização obtida: ${full}`);
        } catch(e) {
          const fallback = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
          setManualAddress(fallback);
          setGpsStatus(`Localização obtida: ${fallback}`);
        }
      },
      (err) => {
        console.warn(err);
        setGpsStatus("Erro ou permissão de GPS negada.");
      }
    );
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && !parentCategory) {
      setErrorMsg('Por favor, selecione uma categoria principal.');
      return;
    }
    setErrorMsg('');
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleCreateOrder();
    }
  };

  const handleCreateOrder = async () => {
    setLoading(true);
    setErrorMsg('');

    const token = localStorage.getItem('agiliza_token');
    
    let finalAddress = manualAddress;
    if (addressChoice === 'saved') {
      const selected = savedAddresses.find(a => a.id === selectedSavedId);
      if (selected) {
        finalAddress = `${selected.street}, ${selected.number} - ${selected.neighborhood}, ${selected.city}/${selected.state}`;
      }
    }

    const selectedCat = subCategory || parentCategory;
    const catObj = allCategories.find(c => c.id === selectedCat);

    try {
      const res = await fetch('/api/services/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title || (catObj ? `Serviço de ${catObj.name}` : 'Solicitação de Serviço'),
          description: description,
          category: selectedCat,
          address: isRemoteChosen ? (manualAddress || 'Atendimento Online / Remoto') : finalAddress,
          latitude: isRemoteChosen ? null : lat,
          longitude: isRemoteChosen ? null : lng,
          is_remote: isRemoteChosen
        })
      });

      if (res.ok) {
        alert('Pedido criado com sucesso!');
        router.push('/cliente/pedidos');
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Falha ao criar o pedido.');
      }
    } catch(err) {
      setErrorMsg('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const parentCategories = allCategories.filter(c => !c.parent_id);
  const filteredParentCategories = parentCategories.filter(c => 
    c.name.toLowerCase().includes(categorySearchQuery.toLowerCase().trim())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--md-sys-color-bg)', color: 'var(--md-sys-color-text)', paddingBottom: '80px' }}>
      <header style={{ 
        display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px', 
        backgroundColor: 'var(--md-sys-color-surface)', borderBottom: '1px solid var(--md-sys-color-border)', boxShadow: 'var(--md-elevation-1)'
      }}>
        <Link href="/cliente" style={{ fontSize: '1.5rem', color: 'var(--md-sys-color-primary)', textDecoration: 'none', fontWeight: 700 }}>←</Link>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Pedir Serviço</h1>
      </header>

      <div style={{ padding: '24px', flex: 1 }}>
        
        {/* M3 Linear Progress / Step Indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          <div style={{ height: '6px', flex: 1, backgroundColor: step >= 1 ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-variant)', borderRadius: 'var(--md-shape-full)', transition: 'background-color 0.3s ease' }} />
          <div style={{ height: '6px', flex: 1, backgroundColor: step >= 2 ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-variant)', borderRadius: 'var(--md-shape-full)', transition: 'background-color 0.3s ease' }} />
          <div style={{ height: '6px', flex: 1, backgroundColor: step >= 3 ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-variant)', borderRadius: 'var(--md-shape-full)', transition: 'background-color 0.3s ease' }} />
        </div>

        <Card style={{ padding: '28px 24px', borderRadius: 'var(--md-shape-xl)' }}>
          {errorMsg && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '12px 14px', borderRadius: 'var(--md-shape-md)', marginBottom: '18px', fontSize: '0.9rem', fontWeight: 500 }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            
            {/* PASSOS DO WIZARD */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--md-sys-color-primary)' }}>1. Escolha o Tipo de Serviço</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-text-muted)', marginTop: '2px' }}>Busque ou deslize o carrossel para selecionar</p>
                </div>
                
                {/* 1. Input de Filtro / Busca */}
                <div style={{ position: 'relative' }}>
                  <Input 
                    placeholder="🔍 Filtrar categorias (ex: Elétrica, Pintura...)"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    style={{ borderRadius: 'var(--md-shape-full)', paddingLeft: '18px' }}
                  />
                  {categorySearchQuery && (
                    <button 
                      type="button" 
                      onClick={() => setCategorySearchQuery('')}
                      style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--md-sys-color-text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* 2. Carrossel Horizontal de Linha Única com Arraste */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--md-sys-color-text-muted)', letterSpacing: '0.1px' }}>
                      Categorias Principais ({filteredParentCategories.length})
                    </label>
                    <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>👉 Deslize para o lado</span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '14px', 
                    overflowX: 'auto', 
                    padding: '8px 4px 16px 4px', 
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}>
                    {filteredParentCategories.length === 0 ? (
                      <div style={{ padding: '20px', color: 'var(--md-sys-color-text-muted)', fontSize: '0.9rem', textAlign: 'center', width: '100%' }}>
                        Nenhuma categoria encontrada para "{categorySearchQuery}".
                      </div>
                    ) : filteredParentCategories.map(c => {
                      const isSelected = parentCategory === c.id;
                      return (
                        <div 
                          key={c.id}
                          onClick={() => setParentCategory(c.id)}
                          style={{
                            scrollSnapAlign: 'start',
                            flexShrink: 0,
                            width: '130px',
                            padding: '20px 12px',
                            borderRadius: 'var(--md-shape-xl)',
                            border: `2px solid ${isSelected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-border)'}`,
                            backgroundColor: isSelected ? 'rgba(48, 2, 103, 0.08)' : 'var(--md-sys-color-surface-variant)',
                            color: isSelected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-text)',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '10px',
                            textAlign: 'center',
                            transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
                            boxShadow: isSelected ? 'var(--md-elevation-2)' : 'var(--md-elevation-1)',
                            transform: isSelected ? 'scale(1.04)' : 'scale(1)'
                          }}
                        >
                          <div style={{ 
                            width: '50px', 
                            height: '50px', 
                            borderRadius: '50%', 
                            backgroundColor: isSelected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface)',
                            color: isSelected ? '#FFFFFF' : 'var(--md-sys-color-primary)',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '1.6rem',
                            boxShadow: isSelected ? 'var(--md-elevation-1)' : 'none',
                            transition: 'all 0.2s ease'
                          }}>
                            <span style={{ fontSize: 'inherit' }}>
                              {c.icon || '🛠️'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.88rem', lineHeight: '1.25' }}>{c.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Subcategorias / Especialidades */}
                {subCategoriesList.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--md-sys-color-primary)', letterSpacing: '0.1px' }}>
                      Especialidade (Opcional)
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {subCategoriesList.map(sc => {
                        const isSubSelected = subCategory === sc.id;
                        return (
                          <div 
                            key={sc.id}
                            onClick={() => setSubCategory(isSubSelected ? '' : sc.id)}
                            style={{
                              padding: '10px 16px',
                              borderRadius: 'var(--md-shape-full)',
                              border: `1.5px solid ${isSubSelected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-border)'}`,
                              backgroundColor: isSubSelected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-variant)',
                              color: isSubSelected ? '#FFFFFF' : 'var(--md-sys-color-text)',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {sc.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--md-sys-color-primary)' }}>2. Detalhes do Pedido</h2>
                
                <Input 
                  label="Título do Pedido"
                  placeholder="Ex: Instalação de Tomadas e Chuveiro"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--md-sys-color-text-muted)', letterSpacing: '0.1px' }}>Descrição detalhada</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o que precisa ser feito, o ambiente, horários preferenciais..."
                    required
                    rows={4}
                    style={{
                      padding: '14px 18px', borderRadius: 'var(--md-shape-md)', border: '1.5px solid var(--md-sys-color-border)',
                      backgroundColor: 'var(--md-sys-color-surface-variant)', fontSize: '0.95rem', color: 'var(--md-sys-color-text)',
                      outline: 'none', resize: 'vertical', fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Opção de Atendimento Remoto / Presencial */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  <label style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--md-sys-color-text)' }}>Modalidade de Atendimento</label>
                  
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', borderRadius: 'var(--md-shape-md)', border: `2px solid ${!isRemoteChosen ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-border)'}`, cursor: 'pointer', backgroundColor: !isRemoteChosen ? 'var(--md-sys-color-surface-variant)' : 'transparent', transition: 'all 0.2s' }}>
                      <input type="radio" checked={!isRemoteChosen} onChange={() => setIsRemoteChosen(false)} style={{ accentColor: 'var(--md-sys-color-primary)' }} />
                      <span style={{ fontWeight: 600 }}>📍 Presencial</span>
                    </label>

                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', borderRadius: 'var(--md-shape-md)', border: `2px solid ${isRemoteChosen ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-border)'}`, cursor: 'pointer', backgroundColor: isRemoteChosen ? 'var(--md-sys-color-surface-variant)' : 'transparent', transition: 'all 0.2s' }}>
                      <input type="radio" checked={isRemoteChosen} onChange={() => setIsRemoteChosen(true)} style={{ accentColor: 'var(--md-sys-color-primary)' }} />
                      <span style={{ fontWeight: 600 }}>💻 Remoto / Online</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--md-sys-color-primary)' }}>3. Local do Atendimento</h2>

                {isRemoteChosen ? (
                  <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'rgba(76, 175, 80, 0.12)', color: '#2e7d32', borderRadius: 'var(--md-shape-lg)', border: '2px dashed #4caf50' }}>
                    <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🌍</span>
                    <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '4px' }}>Atendimento 100% Online</strong>
                    <span style={{ fontSize: '0.9rem' }}>Nenhum endereço é necessário. Você receberá propostas de profissionais de qualquer lugar do país!</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Opcao A: GPS Nativo */}
                  <label style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', 
                    backgroundColor: addressChoice === 'gps' ? 'var(--md-sys-color-surface-variant)' : 'transparent',
                    borderRadius: 'var(--md-shape-md)', border: `1.5px solid ${addressChoice === 'gps' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-border)'}`, cursor: 'pointer'
                  }}>
                    <input 
                      type="radio" 
                      name="loc" 
                      checked={addressChoice === 'gps'} 
                      onChange={() => setAddressChoice('gps')} 
                    />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--md-sys-color-text)' }}>📡 Usar GPS Nativo do Celular</strong>
                      <span style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-text-muted)' }}>Obter coordenadas atuais em tempo real</span>
                    </div>
                  </label>

                  {addressChoice === 'gps' && (
                    <div style={{ padding: '16px', backgroundColor: 'var(--md-sys-color-surface-variant)', borderRadius: 'var(--md-shape-md)', border: '1px solid var(--md-sys-color-border)' }}>
                      <Button type="button" variant="outline" onClick={fetchGpsLocation} style={{ width: '100%', marginBottom: '10px' }}>
                        🎯 Obter Minha Localização Agora
                      </Button>
                      <p style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-primary)', margin: 0, textAlign: 'center', fontWeight: 500 }}>
                        {gpsStatus}
                      </p>
                    </div>
                  )}

                  {/* Opcao B: Enderecos Salvos */}
                  {savedAddresses.length > 0 && (
                    <label style={{ 
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', 
                      backgroundColor: addressChoice === 'saved' ? 'var(--md-sys-color-surface-variant)' : 'transparent',
                      borderRadius: 'var(--md-shape-md)', border: `1.5px solid ${addressChoice === 'saved' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-border)'}`, cursor: 'pointer'
                    }}>
                      <input 
                        type="radio" 
                        name="loc" 
                        checked={addressChoice === 'saved'} 
                        onChange={() => setAddressChoice('saved')} 
                      />
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--md-sys-color-text)' }}>📍 Selecionar dos Meus Endereços Salvos</strong>
                        <span style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-text-muted)' }}>Escolha um local cadastrado no seu perfil</span>
                      </div>
                    </label>
                  )}

                  {addressChoice === 'saved' && (
                    <select 
                      value={selectedSavedId}
                      onChange={e => setSelectedSavedId(e.target.value)}
                      style={{
                        padding: '14px 18px', borderRadius: 'var(--md-shape-md)', border: '1.5px solid var(--md-sys-color-border)',
                        backgroundColor: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-text)', fontSize: '0.95rem', cursor: 'pointer'
                      }}
                    >
                      {savedAddresses.map(addr => (
                        <option key={addr.id} value={addr.id}>
                          {addr.title}: {addr.street}, {addr.number} ({addr.city})
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Opcao C: Digitar Manual */}
                  <label style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', 
                    backgroundColor: addressChoice === 'manual' ? 'var(--md-sys-color-surface-variant)' : 'transparent',
                    borderRadius: 'var(--md-shape-md)', border: `1.5px solid ${addressChoice === 'manual' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-border)'}`, cursor: 'pointer'
                  }}>
                    <input 
                      type="radio" 
                      name="loc" 
                      checked={addressChoice === 'manual'} 
                      onChange={() => setAddressChoice('manual')} 
                    />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--md-sys-color-text)' }}>✍️ Digitar Endereço Manualmente</strong>
                    </div>
                  </label>

                  {addressChoice === 'manual' && (
                    <Input 
                      placeholder="Rua, número, bairro, cidade..."
                      value={manualAddress}
                      onChange={e => setManualAddress(e.target.value)}
                      required
                    />
                  )}

                </div>
                )}
              </div>
            )}

            {/* Botoes de Navegacao */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
              {step > 1 && (
                <Button type="button" variant="outline" style={{ flex: 1 }} onClick={() => setStep(step - 1)}>
                  Voltar
                </Button>
              )}
              <Button type="submit" variant="primary" style={{ flex: 1 }} disabled={loading}>
                {step === 3 ? (loading ? 'Criando Pedido...' : 'Finalizar e Publicar') : 'Próximo Passo ➤'}
              </Button>
            </div>

          </form>
        </Card>

      </div>
    </div>
  );
}
