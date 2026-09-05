"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { AgilizaLogo } from '@/components/ui/AgilizaLogo';

interface Advertisement {
  id: string;
  ad_type: string; // "PROFESSIONAL_DIRECT" or "EXTERNAL_LINK"
  title: string;
  subtitle?: string;
  banner_image_url: string;
  target_url?: string;
  professional_user_id?: string;
  category_id?: string;
  expires_at?: string;
}

export default function ClienteHome() {
  const router = useRouter();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [user, setUser] = useState<any>(null);
  const [featuredPros, setFeaturedPros] = useState<any[]>([]);
  const [loadingPros, setLoadingPros] = useState<boolean>(true);
  const [locationName, setLocationName] = useState<string>("São Paulo, SP");
  
  const adScrollRef = useRef<HTMLDivElement>(null);

  const scrollAds = (direction: 'left' | 'right') => {
    if (adScrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      adScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('agiliza_token');
    if (!token) {
      router.push('/login/cliente');
      return;
    }

    // 1. Carregar Banners Promocionais Patrocinados
    fetch('/api/advertisements')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAdvertisements(data);
      })
      .catch(console.error);

    // 2. Carregar Usuário Atual
    fetch('/api/auth/current', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('agiliza_token');
          localStorage.removeItem('agiliza_user');
          router.push('/login/cliente');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) setUser(data);
      })
      .catch(console.error);

    // 3. Carregar Profissionais em Destaque do Dia Imediatamente
    fetchProsSemLocalizacao(token);

    // 4. Se o navegador tiver GPS ativo, tenta refinar a localização
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || "Sua Região";
            const state = data.address?.state || "";
            setLocationName(`${city}${state ? `, ${state}` : ''}`);
          } catch(e) {}
        },
        (error) => {
          console.warn("Geolocalizacao nao autorizada", error);
        },
        { timeout: 3000 }
      );
    }

  }, [router]);

  const fetchProsSemLocalizacao = (token: string) => {
    fetch(`/api/auth/professionals/featured`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFeaturedPros(data);
        } else {
          // Se o token estiver expirado/inválido, tenta buscar publicamente
          fetch('/api/auth/professionals/featured')
            .then(res => res.json())
            .then(pubData => {
              if (Array.isArray(pubData)) setFeaturedPros(pubData);
            })
            .catch(console.error);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingPros(false));
  };

  const handleAdClick = (ad: Advertisement) => {
    if (ad.ad_type === 'PROFESSIONAL_DIRECT' && ad.professional_user_id) {
      // Chat Direto instantâneo com o profissional contratado
      router.push(`/chat/direct/${ad.professional_user_id}`);
    } else if (ad.ad_type === 'EXTERNAL_LINK' && ad.target_url) {
      // Abrir link externo em nova aba
      window.open(ad.target_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div style={{ paddingBottom: '32px', backgroundColor: 'var(--md-sys-color-bg)', minHeight: '100vh', color: 'var(--md-sys-color-text)' }}>
      
      {/* M3 Light Surface App Bar Header (Visível apenas em dispositivos móveis) */}
      <header className="mobile-header-only" style={{ 
        backgroundColor: 'var(--md-sys-color-surface)', 
        padding: '24px 24px 32px 24px',
        borderBottomRightRadius: 'var(--md-shape-xl)', 
        borderBottomLeftRadius: 'var(--md-shape-xl)',
        boxShadow: 'var(--md-elevation-1)',
        borderBottom: '1px solid var(--md-sys-color-border)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <AgilizaLogo size={42} showText={true} />
          <Link href="/cliente/perfil">
            <img 
              src={user?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} 
              alt="Perfil" 
              style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid var(--md-sys-color-primary)', boxShadow: 'var(--md-elevation-1)', objectFit: 'cover' }} 
              referrerPolicy="no-referrer"
              onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random` }}
            />
          </Link>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-text-muted)', marginBottom: '2px' }}>Localização atual</p>
          <h2 style={{ fontSize: '0.98rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--md-sys-color-primary)' }}>
            📍 {locationName} <span style={{ fontSize: '0.75rem' }}>▼</span>
          </h2>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '18px', letterSpacing: '-0.3px', color: 'var(--md-sys-color-text)' }}>Do que você precisa hoje?</h1>
        
        <div style={{ position: 'relative' }}>
          <Input 
            placeholder="Buscar serviços ou profissionais..." 
            style={{ 
              backgroundColor: 'var(--md-sys-color-surface-variant)', 
              border: '1.5px solid var(--md-sys-color-border)', 
              paddingLeft: '44px',
              borderRadius: 'var(--md-shape-full)',
              color: 'var(--md-sys-color-text)'
            }} 
          />
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem' }}>🔍</span>
        </div>
      </header>

      <div style={{ padding: '0 24px' }}>
        
        {/* Call to Action Principal (Pedir Serviço) - Hero Banner M3 */}
        <Link href="/cliente/pedidos/novo" style={{ display: 'block', textDecoration: 'none', margin: '24px 0 32px 0' }}>
          <Card style={{ 
            backgroundColor: 'var(--md-sys-color-primary)', 
            color: 'white', 
            borderRadius: 'var(--md-shape-xl)',
            border: 'none',
            boxShadow: 'var(--md-elevation-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '28px 36px'
          }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px', color: '#FFFFFF' }}>Pedir um Serviço</h3>
              <p style={{ fontSize: '0.95rem', opacity: 0.9, color: 'rgba(255, 255, 255, 0.85)' }}>Descreva seu problema e receba propostas dos melhores profissionais da sua região</p>
            </div>
            <div style={{ 
              backgroundColor: 'var(--md-sys-color-secondary)', 
              color: 'var(--md-sys-color-on-secondary)',
              width: '56px', 
              height: '56px', 
              borderRadius: 'var(--md-shape-full)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.8rem', 
              fontWeight: 700,
              flexShrink: 0,
              boxShadow: 'var(--md-elevation-2)'
            }}>
              +
            </div>
          </Card>
        </Link>

        {/* Módulo de Banners Promocionais (3 Colunas em Desktop / Carrossel em Mobile) */}
        {advertisements.length > 0 && (
          <section style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--md-sys-color-text)' }}>Destaques e Ofertas</h2>
              
              {/* Botões de Navegação em Mobile/Tablet */}
              <div className="desktop-nav-arrows" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => scrollAds('left')}
                  title="Anterior"
                  style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    backgroundColor: 'var(--md-sys-color-surface-variant)', border: '1.5px solid var(--md-sys-color-border)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '1.1rem', color: 'var(--md-sys-color-primary)',
                    boxShadow: 'var(--md-elevation-1)'
                  }}
                >
                  ‹
                </button>
                <button 
                  type="button" 
                  onClick={() => scrollAds('right')}
                  title="Próximo"
                  style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    backgroundColor: 'var(--md-sys-color-surface-variant)', border: '1.5px solid var(--md-sys-color-border)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '1.1rem', color: 'var(--md-sys-color-primary)',
                    boxShadow: 'var(--md-elevation-1)'
                  }}
                >
                  ›
                </button>
              </div>
            </div>
            
            {/* Contêiner Responsivo de Banners */}
            <div 
              ref={adScrollRef}
              className="ads-responsive-grid"
              style={{ 
                display: 'flex', 
                gap: '16px', 
                overflowX: 'auto', 
                paddingBottom: '12px',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin'
              }}
            >
              {advertisements.map(ad => {
                const formattedDate = ad.expires_at ? new Date(ad.expires_at).toLocaleDateString('pt-BR') : null;
                return (
                  <div 
                    key={ad.id}
                    onClick={() => handleAdClick(ad)}
                    className="ad-card-item"
                    style={{
                      scrollSnapAlign: 'start',
                      flexShrink: 0,
                      width: 'calc(100% - 32px)',
                      maxWidth: '340px',
                      borderRadius: 'var(--md-shape-xl)',
                      overflow: 'hidden',
                      position: 'relative',
                      boxShadow: 'var(--md-elevation-2)',
                      border: '1px solid var(--md-sys-color-border)',
                      cursor: 'pointer',
                      backgroundColor: 'var(--md-sys-color-surface)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                  >
                    {/* Imagem do Banner Padronizada 3:1 */}
                    <div style={{ width: '100%', aspectRatio: '3 / 1', overflow: 'hidden', position: 'relative' }}>
                      <img 
                        src={ad.banner_image_url} 
                        alt={ad.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      
                      {/* Badge Tipo de Anúncio */}
                      <span style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        backgroundColor: ad.ad_type === 'PROFESSIONAL_DIRECT' ? 'var(--md-sys-color-primary)' : '#059669',
                        color: '#FFFFFF',
                        padding: '4px 10px',
                        borderRadius: 'var(--md-shape-full)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        boxShadow: 'var(--md-elevation-1)'
                      }}>
                        {ad.ad_type === 'PROFESSIONAL_DIRECT' ? '⭐ Destaque Profissional' : '📢 Patrocinado'}
                      </span>

                      {/* Badge Validade / Expiracao */}
                      {formattedDate && (
                        <span style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '10px',
                          backgroundColor: 'rgba(0, 0, 0, 0.65)',
                          backdropFilter: 'blur(4px)',
                          color: '#FFFFFF',
                          padding: '3px 8px',
                          borderRadius: 'var(--md-shape-sm)',
                          fontSize: '0.68rem',
                          fontWeight: 500
                        }}>
                          Válido até: {formattedDate}
                        </span>
                      )}
                    </div>

                    {/* Rodapé do Card do Banner */}
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <strong style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--md-sys-color-text)', lineHeight: '1.3' }}>
                        {ad.title}
                      </strong>
                      {ad.subtitle && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-text-muted)', lineHeight: '1.4' }}>
                          {ad.subtitle}
                        </span>
                      )}
                      <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--md-sys-color-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {ad.ad_type === 'PROFESSIONAL_DIRECT' ? '💬 Falar no Chat Direto →' : '🔗 Visitar Oferta Externa →'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Profissionais em Destaque (3 Colunas em Desktop / Lista em Mobile) */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--md-sys-color-text)' }}>Profissionais em Destaque</h2>
            <span style={{ fontSize: '0.88rem', color: 'var(--md-sys-color-primary)', fontWeight: 700, cursor: 'pointer' }}>Ver todos</span>
          </div>

          <div className="pros-responsive-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loadingPros ? (
              <Card style={{ textAlign: 'center', padding: '28px' }}>
                <p style={{ color: 'var(--md-sys-color-text-muted)', fontSize: '0.92rem' }}>Carregando profissionais recomendados...</p>
              </Card>
            ) : featuredPros.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '28px' }}>
                <p style={{ color: 'var(--md-sys-color-text-muted)', fontSize: '0.92rem' }}>Nenhum profissional em destaque no momento.</p>
              </Card>
            ) : featuredPros.map((pro: any) => (
              <Card 
                key={pro.id} 
                onClick={() => router.push(`/chat/direct/${pro.user_id}`)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  padding: '20px', 
                  borderRadius: 'var(--md-shape-lg)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <img 
                  src={pro.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.full_name || 'User')}&background=random`} 
                  alt={pro.full_name} 
                  style={{ width: '65px', height: '65px', borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: 'var(--md-elevation-1)', zIndex: 2 }}
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.full_name || 'User')}&background=random` }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '1.02rem', fontWeight: 700, marginBottom: '2px', color: 'var(--md-sys-color-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pro.full_name}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pro.bio || 'Profissional Verificado'}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f59e0b' }}>★ {Number(pro.average_rating || 0).toFixed(1)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-text-muted)' }}>{pro.total_reviews} aval.</div>
                </div>
              </Card>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
