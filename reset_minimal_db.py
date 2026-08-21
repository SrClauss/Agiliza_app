import sqlite3
import os

db_path = 'agiliza_loco/agiliza_loco.sqlite'

if not os.path.exists(db_path):
    print(f"Erro: Banco de dados nao encontrado em {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
c = conn.cursor()

print("🧹 Limpando pedidos, conversas, mensagens, historicos e avaliacoes...")

# Truncar/limpar tabelas de dados dinâmicos
tables_to_clear = [
    'service_requests',
    'chat_messages',
    'quotes',
    'reviews',
    'unlocked_contacts',
    'notifications'
]

for table in tables_to_clear:
    try:
        c.execute(f"DELETE FROM {table}")
        print(f"  ✓ Tabela '{table}' limpa com sucesso.")
    except Exception as e:
        print(f"  ⚠️ Aviso ao limpar '{table}': {e}")

# Manter apenas pro1@example.com e cliente1@example.com
print("\n👥 Mantendo apenas os usuarios pro1@example.com e cliente1@example.com...")
c.execute("DELETE FROM users WHERE email NOT IN ('pro1@example.com', 'cliente1@example.com', 'admin@agilizapro.com.br')")

# Limpar perfis profissionais extras
c.execute("DELETE FROM professional_profiles WHERE user_id NOT IN (SELECT id FROM users WHERE email = 'pro1@example.com')")

conn.commit()

print("\n📊 Estado atual do Banco de Dados:")
c.execute("SELECT email, role FROM users")
for row in c.fetchall():
    print(f"  - Usuario: {row[0]} | Role: {row[1]}")

c.execute("SELECT COUNT(*) FROM service_requests")
print(f"  - Total de Pedidos de Servico: {c.fetchone()[0]}")

conn.close()
print("\n✅ Banco de dados resetado para o estado minimo com sucesso!")
