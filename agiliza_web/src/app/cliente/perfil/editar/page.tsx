"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function EditarPerfilCliente() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('agiliza_token');
    if (!token) {
      router.push('/login/cliente');
      return;
    }

    fetch('/api/auth/current', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.name) setName(data.name);
        if (data.phone) setPhone(data.phone);
        if (data.profile_image) setAvatarUrl(data.profile_image);
      })
      .catch(console.error);
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setLoading(true);

    const token = localStorage.getItem('agiliza_token');

    try {
      // 1. Se uma nova imagem foi selecionada, fazer o upload para o MinIO S3
      let finalAvatarUrl = avatarUrl;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('avatar', selectedFile);

        const uploadRes = await fetch('/api/auth/profile/avatar', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            finalAvatarUrl = uploadData.url;
            setAvatarUrl(uploadData.url);
          }
        }
      }

      // 2. Atualizar perfil com novos dados e URL da imagem
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: name,
          phone: phone,
          profile_image: finalAvatarUrl
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('Informações e avatar atualizados com sucesso!');
        // Atualizar usuario no localStorage
        const storedUser = localStorage.getItem('agiliza_user');
        if (storedUser) {
          try {
            const u = JSON.parse(storedUser);
            u.user = { ...u.user, name: name, profile_image: finalAvatarUrl };
            localStorage.setItem('agiliza_user', JSON.stringify(u));
          } catch(e) {}
        }
      } else {
        setErrorMsg(data.message || 'Falha ao atualizar o perfil.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '80px', backgroundColor: 'var(--color-bg)', minHeight: '100%', color: 'var(--color-text)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/cliente/perfil" style={{ fontSize: '1.5rem', color: 'var(--color-text)', textDecoration: 'none' }}>←</Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          Editar Informações
        </h1>
      </header>

      <Card style={{ padding: '24px' }}>
        {successMsg && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center' }}>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Foto de Perfil / Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ position: 'relative' }}>
              <img 
                src={previewUrl || avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`} 
                alt="Avatar" 
                style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #B3F63F', boxShadow: '0 4px 14px rgba(0,0,0,0.6)' }}
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random` }}
              />
            </div>
            <label style={{ 
              backgroundColor: 'var(--color-primary-light)', color: '#B3F63F', border: '1px solid #B3F63F', 
              padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' 
            }}>
              📸 Alterar Foto de Perfil
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                style={{ display: 'none' }} 
              />
            </label>
            {selectedFile && (
              <span style={{ fontSize: '0.75rem', color: '#B3F63F' }}>
                Nova foto selecionada: {selectedFile.name}
              </span>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 600, color: 'var(--color-text)' }}>
              Nome Completo
            </label>
            <Input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Seu nome"
              required 
              style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 600, color: 'var(--color-text)' }}>
              Telefone / WhatsApp
            </label>
            <Input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="(11) 99999-9999"
              style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            />
          </div>

          <Button type="submit" variant="primary" fullWidth disabled={loading} style={{ marginTop: '8px', padding: '16px' }}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
