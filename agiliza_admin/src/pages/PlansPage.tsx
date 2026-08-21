import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function PlansPage() {
  const { token } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [priceCents, setPriceCents] = useState(2990);
  const [monthlyUnlockLimit, setMonthlyUnlockLimit] = useState(20);
  const [stripePriceId, setStripePriceId] = useState('');
  const [features, setFeatures] = useState('');

  const fetchPlans = () => {
    fetch('http://localhost:5150/api/admin/plans', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPlans(data);
      });
  };

  useEffect(() => {
    fetchPlans();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const featArray = features.split('\n').filter((f) => f.trim().length > 0);

    const res = await fetch('http://localhost:5150/api/admin/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        id,
        name,
        price_cents: Number(priceCents),
        monthly_unlock_limit: Number(monthlyUnlockLimit),
        stripe_price_id: stripePriceId,
        features: featArray
      })
    });

    if (res.ok) {
      setShowModal(false);
      fetchPlans();
    } else {
      alert('Erro ao salvar plano.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Gestão de Planos de Assinatura</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Cadastre e edite preços, cotas de desbloqueio e IDs do Stripe de forma 100% dinâmica.</p>
        </div>

        <button
          onClick={() => {
            setId('');
            setName('');
            setPriceCents(2990);
            setMonthlyUnlockLimit(20);
            setStripePriceId('');
            setFeatures('');
            setShowModal(true);
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
          + Novo Plano
        </button>
      </div>

      {/* Tabela de Planos */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#0f172a', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '14px 20px', color: '#475569' }}>Identificador (ID)</th>
              <th style={{ padding: '14px 20px', color: '#475569' }}>Nome do Plano</th>
              <th style={{ padding: '14px 20px', color: '#475569' }}>Preço Mensal</th>
              <th style={{ padding: '14px 20px', color: '#475569' }}>Desbloqueios/Mês</th>
              <th style={{ padding: '14px 20px', color: '#475569' }}>ID do Stripe</th>
              <th style={{ padding: '14px 20px', color: '#475569' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>{p.id}</td>
                <td style={{ padding: '14px 20px', fontWeight: 700 }}>{p.name}</td>
                <td style={{ padding: '14px 20px', color: '#16a34a', fontWeight: 800 }}>R$ {(p.price_cents / 100).toFixed(2)}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#334155' }}>
                    {p.monthly_unlock_limit >= 9999 ? '∞ Ilimitado' : `${p.monthly_unlock_limit} / mês`}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>{p.stripe_price_id || 'N/A'}</td>
                <td style={{ padding: '14px 20px' }}>
                  <button
                    onClick={() => {
                      setId(p.id);
                      setName(p.name);
                      setPriceCents(p.price_cents);
                      setMonthlyUnlockLimit(p.monthly_unlock_limit);
                      setStripePriceId(p.stripe_price_id || '');
                      setFeatures(Array.isArray(p.features) ? p.features.join('\n') : '');
                      setShowModal(true);
                    }}
                    style={{ backgroundColor: 'transparent', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    ✏️ Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Cadastro/Edição de Plano */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '480px', color: '#0f172a', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 0 }}>{id ? 'Editar Plano' : 'Criar Novo Plano'}</h2>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>ID Único (ex: pro, premium)</label>
                <input 
                  type="text" 
                  value={id} 
                  onChange={(e) => setId(e.target.value)} 
                  required 
                  disabled={!!plans.find(p => p.id === id)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>Nome de Exibição</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>Preço em Centavos (ex: 2990)</label>
                  <input 
                    type="number" 
                    value={priceCents} 
                    onChange={(e) => setPriceCents(Number(e.target.value))} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>Desbloqueios Mensais</label>
                  <input 
                    type="number" 
                    value={monthlyUnlockLimit} 
                    onChange={(e) => setMonthlyUnlockLimit(Number(e.target.value))} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>ID do Preço no Stripe (stripe_price_id)</label>
                <input 
                  type="text" 
                  value={stripePriceId} 
                  onChange={(e) => setStripePriceId(e.target.value)} 
                  placeholder="price_..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>Benefícios (1 por linha)</label>
                <textarea 
                  rows={3}
                  value={features} 
                  onChange={(e) => setFeatures(e.target.value)} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ backgroundColor: 'transparent', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" style={{ backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Salvar Plano</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
