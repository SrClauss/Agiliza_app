"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ProfileData {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  bio?: string;
  years_experience: number;
  hourly_rate: string;
  service_radius_km: number;
  address?: string;
  average_rating: string;
  total_reviews: number;
  subscription_status: string;
  profile_image?: string;
}

interface ReviewData {
  id: string;
  client_name: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export default function PerfilProfissional() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados dos Modais
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Formulário de Edição
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [yearsExp, setYearsExp] = useState<number>(1);
  const [hourlyRate, setHourlyRate] = useState('');
  const [radiusKm, setRadiusKm] = useState<number>(30);
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const fetchProfile = async () => {
    const token = localStorage.getItem('agiliza_token');
    if (!token) {
      router.push('/login/profissional');
      return;
    }

    try {
      const res = await fetch('/api/auth/professionals/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data: ProfileData = await res.json();
        setProfile(data);
        setFullName(data.full_name || '');
        setBio(data.bio || '');
        setYearsExp(data.years_experience || 1);
        setHourlyRate(data.hourly_rate || '50');
        setRadiusKm(data.service_radius_km || 30);
        setAddress(data.address || '');
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleOpenReviews = async () => {
    setShowReviewsModal(true);
    setReviewsLoading(true);
    const token = localStorage.getItem('agiliza_token');

    try {
      const res = await fetch('/api/auth/professionals/me/reviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Erro ao buscar avaliações:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');
    const token = localStorage.getItem('agiliza_token');

    try {
      const res = await fetch('/api/auth/professionals/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: fullName,
          bio: bio,
          years_experience: Number(yearsExp),
          hourly_rate: hourlyRate,
          service_radius_km: Number(radiusKm),
          address: address
        })
      });

      if (res.ok) {
        setSaveMessage('✅ Perfil atualizado com sucesso!');
        await fetchProfile();
        setTimeout(() => {
          setShowEditModal(false);
          setSaveMessage('');
        }, 1200);
      } else {
        setSaveMessage('⚠️ Erro ao salvar alterações.');
      }
    } catch (err) {
      setSaveMessage('⚠️ Erro de conexão ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('agiliza_token');
    localStorage.removeItem('agiliza_user');
    router.push('/login/profissional');
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '90px', backgroundColor: 'var(--color-bg)', minHeight: '100vh', boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '20px', color: 'var(--color-text)' }}>Meu Perfil Pro</h1>
      
      <Card style={{ padding: '20px', borderRadius: 'var(--md-shape-xl)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img 
            src={profile?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Pro')}&background=random`} 
            alt="Perfil" 
            style={{ width: '68px', height: '68px', borderRadius: '50%', border: '2px solid var(--md-sys-color-primary)', objectFit: 'cover' }} 
            referrerPolicy="no-referrer"
            onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Pro')}&background=random` }}
          />
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              {loading ? 'Carregando...' : profile?.full_name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <span style={{ backgroundColor: 'var(--md-sys-color-primary)', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                {profile?.subscription_status === 'ACTIVE' ? 'PARCEIRO PRO' : 'GRÁTIS'}
              </span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                ★ {Number(profile?.average_rating || 5).toFixed(1)} ({profile?.total_reviews || 0} avaliações)
              </span>
            </div>
            {profile?.address && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
                📍 {profile.address}
              </p>
            )}
          </div>
        </div>

        {profile?.bio && (
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', marginTop: '16px', borderTop: '1px solid var(--md-sys-color-border)', paddingTop: '12px', fontStyle: 'italic' }}>
            "{profile.bio}"
          </p>
        )}
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Link href="/pro/planos" style={{ display: 'block', textDecoration: 'none' }}>
          <Button variant="primary" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '16px' }}>
            <span>⭐ Assinatura e Planos</span>
            <span>Ver Planos ➤</span>
          </Button>
        </Link>

        <Link href="/pro/configuracoes" style={{ display: 'block', textDecoration: 'none' }}>
          <Button variant="outline" style={{ width: '100%', textAlign: 'left', padding: '16px', justifyContent: 'flex-start' }}>
            ⚙️ Configurações & Categorias
          </Button>
        </Link>

        <Button 
          variant="outline" 
          style={{ width: '100%', textAlign: 'left', padding: '16px', justifyContent: 'flex-start' }}
          onClick={() => setShowEditModal(true)}
        >
          ✏️ Editar Informações
        </Button>

        <Button 
          variant="outline" 
          style={{ width: '100%', textAlign: 'left', padding: '16px', justifyContent: 'flex-start' }}
          onClick={handleOpenReviews}
        >
          💬 Minhas Avaliações ({profile?.total_reviews || 0})
        </Button>

        <Button 
          variant="outline" 
          style={{ width: '100%', textAlign: 'left', padding: '16px', justifyContent: 'flex-start', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          onClick={handleLogout}
        >
          🚪 Sair da Conta
        </Button>
      </div>

      {/* MODAL RESPONSIVO: EDITAR INFORMAÇÕES */}
      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '12px', boxSizing: 'border-box'
        }}>
          <Card style={{
            width: '100%', maxWidth: '420px', maxHeight: '88vh', overflowY: 'auto',
            padding: '20px 16px', borderRadius: 'var(--md-shape-xl)', boxSizing: 'border-box',
            backgroundColor: 'var(--md-sys-color-surface)', boxShadow: 'var(--md-elevation-4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>Editar Informações</h2>
              <button 
                onClick={() => setShowEditModal(false)} 
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {saveMessage && (
              <div style={{ padding: '10px 12px', borderRadius: 'var(--md-shape-md)', marginBottom: '14px', fontSize: '0.85rem', fontWeight: 600, backgroundColor: saveMessage.includes('✅') ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: saveMessage.includes('✅') ? '#15803d' : '#ef4444' }}>
                {saveMessage}
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--md-sys-color-text-muted)' }}>
                  Nome Completo
                </label>
                <input 
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 'var(--md-shape-md)',
                    border: '1.5px solid var(--md-sys-color-border)', backgroundColor: 'var(--md-sys-color-surface-variant)',
                    fontSize: '0.92rem', color: 'var(--md-sys-color-text)', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--md-sys-color-text-muted)' }}>
                  Apresentação / Bio
                </label>
                <textarea 
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Descreva seus serviços e diferenciais..."
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 'var(--md-shape-md)',
                    border: '1.5px solid var(--md-sys-color-border)', backgroundColor: 'var(--md-sys-color-surface-variant)',
                    fontSize: '0.92rem', color: 'var(--md-sys-color-text)', outline: 'none', resize: 'vertical', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--md-sys-color-text-muted)', whiteSpace: 'nowrap' }}>
                    Exp. (Anos)
                  </label>
                  <input 
                    type="number"
                    value={yearsExp}
                    onChange={(e) => setYearsExp(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '11px 12px', borderRadius: 'var(--md-shape-md)',
                      border: '1.5px solid var(--md-sys-color-border)', backgroundColor: 'var(--md-sys-color-surface-variant)',
                      fontSize: '0.92rem', color: 'var(--md-sys-color-text)', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--md-sys-color-text-muted)', whiteSpace: 'nowrap' }}>
                    Valor/Hora (R$)
                  </label>
                  <input 
                    type="text"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    style={{
                      width: '100%', padding: '11px 12px', borderRadius: 'var(--md-shape-md)',
                      border: '1.5px solid var(--md-sys-color-border)', backgroundColor: 'var(--md-sys-color-surface-variant)',
                      fontSize: '0.92rem', color: 'var(--md-sys-color-text)', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <div style={{ flex: '0 0 110px', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--md-sys-color-text-muted)', whiteSpace: 'nowrap' }}>
                    Raio (km)
                  </label>
                  <input 
                    type="number"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '11px 12px', borderRadius: 'var(--md-shape-md)',
                      border: '1.5px solid var(--md-sys-color-border)', backgroundColor: 'var(--md-sys-color-surface-variant)',
                      fontSize: '0.92rem', color: 'var(--md-sys-color-text)', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--md-sys-color-text-muted)', whiteSpace: 'nowrap' }}>
                    Cidade / Estado
                  </label>
                  <input 
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="São Paulo, SP"
                    style={{
                      width: '100%', padding: '11px 12px', borderRadius: 'var(--md-shape-md)',
                      border: '1.5px solid var(--md-sys-color-border)', backgroundColor: 'var(--md-sys-color-surface-variant)',
                      fontSize: '0.92rem', color: 'var(--md-sys-color-text)', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', width: '100%' }}>
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '12px' }}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={saving} style={{ flex: 1.4, padding: '12px' }}>
                  {saving ? 'Salvar...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL RESPONSIVO: MINHAS AVALIAÇÕES */}
      {showReviewsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '12px', boxSizing: 'border-box'
        }}>
          <Card style={{
            width: '100%', maxWidth: '440px', maxHeight: '88vh', overflowY: 'auto',
            padding: '20px 16px', borderRadius: 'var(--md-shape-xl)', boxSizing: 'border-box',
            backgroundColor: 'var(--md-sys-color-surface)', boxShadow: 'var(--md-elevation-4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>Minhas Avaliações</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
                  Nota Média ★ {Number(profile?.average_rating || 5).toFixed(1)} • Total: {profile?.total_reviews || 0}
                </p>
              </div>
              <button 
                onClick={() => setShowReviewsModal(false)} 
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {reviewsLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px 0' }}>Carregando avaliações...</p>
            ) : reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--color-text-muted)' }}>
                <p style={{ fontSize: '2rem', margin: '0 0 8px 0' }}>⭐</p>
                <p style={{ fontWeight: 600, fontSize: '0.92rem' }}>Nenhuma avaliação individual registrada ainda.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Sua nota geral é baseada na reputação verificada da sua conta.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviews.map((rev) => (
                  <div key={rev.id} style={{
                    padding: '12px 14px', borderRadius: 'var(--md-shape-md)',
                    backgroundColor: 'var(--md-sys-color-surface-variant)', border: '1px solid var(--md-sys-color-border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>{rev.client_name}</span>
                      <span style={{ color: '#eab308', fontWeight: 700, fontSize: '0.88rem' }}>{'★'.repeat(rev.rating)}</span>
                    </div>
                    {rev.comment && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>"{rev.comment}"</p>
                    )}
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                      {new Date(rev.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Button variant="outline" fullWidth onClick={() => setShowReviewsModal(false)} style={{ marginTop: '18px', padding: '12px' }}>
              Fechar
            </Button>
          </Card>
        </div>
      )}

    </div>
  );
}
