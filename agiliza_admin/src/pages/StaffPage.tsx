import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

export function StaffPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('ADMIN');
  
  const [generatedInvite, setGeneratedInvite] = useState<{ invite_token: string; invite_url: string } | null>(null);

  const fetchStaff = () => {
    fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data.filter(u => u.is_staff || u.role === 'ADMIN' || u.role === 'GERENTE' || u.role === 'SUPORTE'));
        }
      });
  };

  useEffect(() => {
    fetchStaff();
  }, [token]);

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/staff/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        email: inviteEmail,
        role: inviteRole
      })
    });

    const data = await res.json();
    if (res.ok) {
      setGeneratedInvite(data);
      fetchStaff();
    } else {
      alert(data.message || 'Erro ao gerar convite.');
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Olá! Você foi convidado para a equipe administrativa do AgilizaPro (Nível: ${inviteRole}).\n\nAcesse o link abaixo para criar sua conta (válido por 24 horas):\n${generatedInvite?.invite_url}`
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Gestão de Acessos Administrativos (Staff)</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Gere convites por Token válidos por 24h, defina o nível de acesso e compartilhe via WhatsApp, E-mail ou QR Code.</p>
        </div>

        <button
          onClick={() => {
            setGeneratedInvite(null);
            setInviteEmail('');
            setInviteRole('ADMIN');
            setShowInviteModal(true);
          }}
          style={{
            backgroundColor: '#0284c7',
            color: 'white',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)'
          }}
        >
          + Convidar Novo Membro (Token)
        </button>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#0f172a', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '14px 20px', color: '#475569' }}>Nome & E-mail</th>
              <th style={{ padding: '14px 20px', color: '#475569' }}>Nível de Acesso (Role)</th>
              <th style={{ padding: '14px 20px', color: '#475569' }}>Status da Conta</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                    {u.role || 'ADMIN'}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', fontSize: '0.85rem' }}>
                  {u.reset_token ? (
                    <span style={{ color: '#d97706', fontWeight: 700 }}>⏳ Convite Pendente (Válido 24h)</span>
                  ) : (
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>🟢 Conta Ativa</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Gerador de Convite por Token */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '520px', color: '#0f172a', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 0 }}>Gerar Convite de Administrador (Token)</h2>
            
            {!generatedInvite ? (
              <form onSubmit={handleGenerateInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>E-mail do Novo Membro</label>
                  <input 
                    type="email" 
                    value={inviteEmail} 
                    onChange={(e) => setInviteEmail(e.target.value)} 
                    required 
                    placeholder="novo.admin@empresa.com"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>Nível de Acesso (Definido pelo Emissor)</label>
                  <select 
                    value={inviteRole} 
                    onChange={(e) => setInviteRole(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}
                  >
                    <option value="ADMIN">Administrador Geral (Acesso Total)</option>
                    <option value="GERENTE">Gerente de Operações</option>
                    <option value="SUPORTE">Suporte & Atendimento ao Cliente</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button type="button" onClick={() => setShowInviteModal(false)} style={{ backgroundColor: 'transparent', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                  <button type="submit" style={{ backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Gerar Token (24h)</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', color: '#166534', fontWeight: 700 }}>
                  ⏳ Token Gerado! Expira em 24 horas. Nível: {inviteRole}
                </div>

                {/* Opção 1: Compartilhar via WhatsApp */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>1. Enviar direto pelo WhatsApp</label>
                  <a
                    href={`https://wa.me/?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#25D366',
                      color: 'white',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}
                  >
                    💬 Compartilhar via WhatsApp
                  </a>
                </div>

                {/* Opção 2: QR Code Visual */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '8px', fontWeight: 600 }}>2. Escanear QR Code Visual de Cadastro</label>
                  <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', display: 'inline-block', border: '1px solid #e2e8f0' }}>
                    <QRCodeSVG value={generatedInvite.invite_url} size={150} />
                  </div>
                </div>

                {/* Opção 3: Link direto */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>3. Link do Convite (Copiar & Enviar por E-mail)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      readOnly 
                      value={generatedInvite.invite_url} 
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.85rem' }} 
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedInvite.invite_url);
                        alert('Link copiado para a área de transferência!');
                      }}
                      style={{ backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '10px 14px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button onClick={() => setShowInviteModal(false)} style={{ backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Concluído</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
