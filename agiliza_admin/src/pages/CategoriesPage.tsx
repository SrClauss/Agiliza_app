import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import EmojiPicker from 'emoji-picker-react';

export function CategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Form
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('🛠️');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');

  const fetchCategories = () => {
    fetch('/api/admin/categories', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      });
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        id,
        name,
        slug,
        icon,
        description,
        parent_id: parentId || null
      })
    });

    if (res.ok) {
      setShowModal(false);
      fetchCategories();
    } else {
      alert('Erro ao salvar categoria.');
    }
  };

  const parentCategories = categories.filter((c) => !c.parent_id);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Categorias & Subcategorias (Com Emojis)</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Cadastre categorias em árvore e selecione os ícones facilmente via Emoji Picker.</p>
        </div>

        <button
          onClick={() => {
            setId('');
            setName('');
            setSlug('');
            setIcon('🛠️');
            setDescription('');
            setParentId('');
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
          + Nova Categoria / Subcategoria
        </button>
      </div>

      {/* Árvore de Categorias */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {parentCategories.map((parent) => {
          const subcats = categories.filter((c) => c.parent_id === parent.id);
          return (
            <div key={parent.id} style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: subcats.length ? '16px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.8rem', backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '12px' }}>{parent.icon || '🛠️'}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 800 }}>{parent.name}</h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/{parent.slug}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setId('');
                      setName('');
                      setSlug('');
                      setIcon('📍');
                      setDescription('');
                      setParentId(parent.id);
                      setShowModal(true);
                    }}
                    style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', color: '#0284c7', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    + Add Subcategoria
                  </button>

                  <button
                    onClick={() => {
                      setId(parent.id);
                      setName(parent.name);
                      setSlug(parent.slug);
                      setIcon(parent.icon || '🛠️');
                      setDescription(parent.description || '');
                      setParentId('');
                      setShowModal(true);
                    }}
                    style={{ backgroundColor: 'transparent', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    ✏️ Editar Categoria
                  </button>
                </div>
              </div>

              {/* Lista de Subcategorias */}
              {subcats.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                  {subcats.map((sub) => (
                    <div key={sub.id} style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{sub.icon || '📍'}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{sub.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setId(sub.id);
                          setName(sub.name);
                          setSlug(sub.slug);
                          setIcon(sub.icon || '📍');
                          setDescription(sub.description || '');
                          setParentId(parent.id);
                          setShowModal(true);
                        }}
                        style={{ backgroundColor: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        ✏️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Cadastro/Edição de Categoria com Emoji Picker */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '480px', color: '#0f172a', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 0 }}>{id ? 'Editar Categoria' : 'Criar Categoria / Subcategoria'}</h2>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>Tipo de Categoria</label>
                <select 
                  value={parentId} 
                  onChange={(e) => setParentId(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}
                >
                  <option value="">📁 Categoria Pai (Principal)</option>
                  {parentCategories.map(p => (
                    <option key={p.id} value={p.id}>↳ Subcategoria de: {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>ID Único (ex: eletrica, chuveiro)</label>
                <input 
                  type="text" 
                  value={id} 
                  onChange={(e) => setId(e.target.value)} 
                  required 
                  disabled={!!categories.find(c => c.id === id)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>Nome de Exibição</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!id) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  }} 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>Ícone Emoji (Fácil Escolha)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    style={{ fontSize: '1.5rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer' }}
                  >
                    {icon || '🛠️'}
                  </button>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Clique para escolher no Emoji Picker</span>
                </div>

                {showEmojiPicker && (
                  <div style={{ position: 'absolute', zIndex: 200, marginTop: '8px' }}>
                    <EmojiPicker 
                      onEmojiClick={(emojiData) => {
                        setIcon(emojiData.emoji);
                        setShowEmojiPicker(false);
                      }} 
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ backgroundColor: 'transparent', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" style={{ backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Salvar Categoria</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
