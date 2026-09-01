import sqlite3
import uuid
import random
from datetime import datetime, timedelta
from faker import Faker

fake = Faker('pt_BR')

db_path = '/home/claus/src/Agiliza_app-main/agiliza_loco/agiliza_loco.sqlite'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("🚀 Iniciando Seed Python com Faker Brasil...")

# 1. Garantir Planos
plans = [
    ('free', 'Grátis', 0, 5, None, '["Até 5 contatos/mês", "Perfil básico no catálogo"]', 1),
    ('pro', 'Agiliza Pro', 2990, 20, 'price_1U6TgbLTtCtvRRHBjbPo5XbI', '["Até 20 contatos/mês", "Selo de Profissional Verificado", "Notificação em tempo real"]', 1),
    ('premium', 'Agiliza Premium', 4990, 999999, 'price_1U6TgcLTtCtvRRHBPoFgenQ0', '["Desbloqueios ilimitados", "Selo Premium no topo", "Suporte prioritário 24/7"]', 1)
]

for p in plans:
    cursor.execute("""
        INSERT OR IGNORE INTO subscription_plans (id, name, price_cents, monthly_unlock_limit, stripe_price_id, features, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, DATETIME('now'), DATETIME('now'))
    """, p)

# 2. Expandir e Garantir Categorias
categories = [
    # Manutenção & Reformas
    ("eletrica", "Elétrica", "eletrica", "⚡", "Serviços elétricos em geral", None),
    ("instalacao-chuveiro", "Instalação de Chuveiro", "instalacao-chuveiro", "🚿", "Instalação e reparo de chuveiros elétricos", "eletrica"),
    ("troca-fiacao", "Troca de Fiação", "troca-fiacao", "🔌", "Manutenção e substituição de fiação residencial", "eletrica"),
    ("encanamento", "Encanamento", "encanamento", "💧", "Reparos hidráulicos e desentupimentos", None),
    ("desentupimento", "Desentupimento", "desentupimento", "🪠", "Desentupimento de pias, ralos e vasos", "encanamento"),
    ("pintura", "Pintura", "pintura", "🎨", "Pintura residencial e comercial", None),
    ("limpeza", "Limpeza", "limpeza", "🧹", "Faxina e limpeza pós-obra", None),
    ("reformas", "Reformas", "reformas", "🔨", "Pequenas reformas e alvenaria", None),
    
    # Serviços Jurídicos
    ("servicos-juridicos", "Serviços Jurídicos", "servicos-juridicos", "⚖️", "Consultoria, contratos e assessoria jurídica", None),
    ("direito-trabalhista", "Direito Trabalhista", "direito-trabalhista", "📜", "Assessoria e cálculos trabalhistas", "servicos-juridicos"),
    ("direito-civil", "Direito Civil & Família", "direito-civil", "🏛️", "Inventários, divórcios e contratos civis", "servicos-juridicos"),
    
    # Saúde & Bem-Estar
    ("psicologia", "Psicologia & Terapia", "psicologia", "🧠", "Atendimento psicológico, terapia individual e de casal", None),
    ("nutricao", "Nutrição", "nutricao", "🥗", "Consultoria nutricional e reeducação alimentar", None),
    ("personal-trainer", "Personal Trainer", "personal-trainer", "🏋️", "Treino personalizado presencial e online", None),
    
    # Tecnologia & Programação
    ("programacao", "Programação & Tecnologia", "programacao", "💻", "Desenvolvimento de sites, apps e sistemas", None),
    ("desenvolvimento-web", "Desenvolvimento Web", "desenvolvimento-web", "🌐", "Criação de sites, landing pages e e-commerce", "programacao"),
    ("suporte-tecnico", "Assistência Técnica & TI", "suporte-tecnico", "🖥️", "Conserto de computadores, notebooks e redes", "programacao"),
    
    # Design & Marketing
    ("design-grafico", "Design & Identidade Visual", "design-grafico", "🎨", "Criação de logos, banners e materiais gráficos", None),
    ("marketing-digital", "Marketing Digital & Redes Sociais", "marketing-digital", "📈", "Gestão de tráfego, redes sociais e SEO", None),
    
    # Automotivo
    ("mecanica-automotiva", "Mecânica Automotiva", "mecanica-automotiva", "🚗", "Manutenção mecânica, elétrica e socorro 24h", None),
    
    # Aulas & Treinamentos
    ("aulas-particulares", "Aulas Particulares & Idiomas", "aulas-particulares", "📚", "Reforço escolar, idiomas e música", None)
]

cat_ids = []
for c in categories:
    cat_ids.append(c[0])
    cursor.execute("""
        INSERT OR IGNORE INTO service_categories (id, name, slug, icon, description, is_active, parent_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, DATETIME('now'), DATETIME('now'))
    """, c)

# 3. Garantir Admin
cursor.execute("SELECT id FROM users WHERE email = 'admin@agilizapro.com.br'")
if not cursor.fetchone():
    admin_id = uuid.uuid4().bytes
    cursor.execute("""
        INSERT INTO users (id, email, password, name, api_key, role, is_staff, is_verified, is_active, is_blocked, cpf, created_at, updated_at)
        VALUES (?, 'admin@agilizapro.com.br', '$argon2id$v=19$m=19456,t=2,p=1$6efg8SetEgQqDFORj5osKQ$72HTtLMl8SEjnRtcJ9Xxgkjxbe8uSYempyPg5slPywQ', 'Administrador AgilizaPro', 'ako_admin', 'ADMIN', 1, 1, 1, 0, '000.000.000-00', DATETIME('now'), DATETIME('now'))
    """, (admin_id,))

# 4. Gerar 1.000 Clientes
print("👥 Gerando 1.000 Clientes com Faker Brasil e CPFs Válidos...")
client_ids = []
cursor.execute("SELECT id FROM users WHERE role = 'CLIENT'")
existing_c = cursor.fetchall()
for r in existing_c:
    client_ids.append(r[0])

needed_clients = 1000 - len(client_ids)
if needed_clients > 0:
    client_batch = []
    for i in range(needed_clients):
        c_uuid = uuid.uuid4()
        c_bytes = c_uuid.bytes
        client_ids.append(c_bytes)
        name = fake.name()
        email = "cliente1@example.com" if i == 0 else f"cliente_{c_uuid.hex[:8]}@{fake.domain_name()}"
        cpf = fake.cpf()
        avatar = f"https://i.pravatar.cc/150?u={c_uuid.hex}"
        client_batch.append((
            c_bytes, email, "$argon2id$v=19$m=19456,t=2,p=1$6efg8SetEgQqDFORj5osKQ$72HTtLMl8SEjnRtcJ9Xxgkjxbe8uSYempyPg5slPywQ", name, f"ako_{c_uuid.hex[:8]}", 'CLIENT', 1, 1, 0, cpf, avatar
        ))
    
    cursor.executemany("""
        INSERT INTO users (id, email, password, name, api_key, role, is_verified, is_active, is_blocked, cpf, profile_image, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now'), DATETIME('now'))
    """, client_batch)
    print("  ➔ 1.000 Clientes gerados com CPFs válidos!")

# 5. Gerar 100 Profissionais
print("🛠️ Gerando 100 Profissionais com Bios, Preços e CPFs Válidos...")
cursor.execute("SELECT id FROM users WHERE role = 'PROFESSIONAL'")
existing_p = cursor.fetchall()
needed_pros = 100 - len(existing_p)

plans_list = ['free', 'pro', 'premium']
specs = ['Eletricista Residencial', 'Encanador Hidráulico', 'Pintor de Interiores', 'Mestre de Obras', 'Especialista em Reformas', 'Higienizador de Estofados']

if needed_pros > 0:
    pro_users_batch = []
    pro_profiles_batch = []

    for i in range(needed_pros):
        p_uuid = uuid.uuid4()
        p_bytes = p_uuid.bytes
        prof_bytes = uuid.uuid4().bytes
        name = f"Marcos Eletricista ({random.choice(specs)})" if i == 0 else f"{fake.name()} ({random.choice(specs)})"
        email = "pro1@example.com" if i == 0 else f"pro_{p_uuid.hex[:8]}@{fake.domain_name()}"
        plan = random.choice(plans_list)
        cpf = fake.cpf()
        avatar = "https://i.pravatar.cc/150?img=11" if i == 0 else f"https://i.pravatar.cc/150?u={p_uuid.hex}"

        pro_users_batch.append((
            p_bytes, email, "$argon2id$v=19$m=19456,t=2,p=1$6efg8SetEgQqDFORj5osKQ$72HTtLMl8SEjnRtcJ9Xxgkjxbe8uSYempyPg5slPywQ", name, f"ako_{p_uuid.hex[:8]}", 'PROFESSIONAL', 1, 1, 0, cpf, avatar
        ))

        pro_profiles_batch.append((
            prof_bytes, p_bytes, fake.paragraph(nb_sentences=3), random.randint(2, 25), round(random.uniform(50.0, 180.0), 2),
            random.randint(10, 50), plan, 'active', round(random.uniform(4.0, 5.0), 1), random.randint(5, 120)
        ))

    cursor.executemany("""
        INSERT INTO users (id, email, password, name, api_key, role, is_verified, is_active, is_blocked, cpf, profile_image, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now'), DATETIME('now'))
    """, pro_users_batch)

    cursor.executemany("""
        INSERT INTO professional_profiles (id, user_id, bio, years_experience, hourly_rate, service_radius_km, subscription_plan, subscription_status, average_rating, total_reviews, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now'), DATETIME('now'))
    """, pro_profiles_batch)
    print("  ➔ 100 Profissionais gerados!")

# 6. Gerar 10.000 Serviços Pedidos
print("📋 Gerando 10.000 Serviços Históricos (espalhados nos últimos 90 dias)...")
cursor.execute("SELECT COUNT(*) FROM service_requests")
current_reqs = cursor.fetchone()[0]
needed_reqs = 10000 - current_reqs

if needed_reqs > 0:
    statuses = ['OPEN', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    req_batch = []
    now = datetime.now()

    for i in range(needed_reqs):
        r_bytes = uuid.uuid4().bytes
        c_id = random.choice(client_ids)
        cat_id = random.choice(cat_ids)
        status = random.choice(statuses)
        
        days_ago = random.randint(0, 90)
        created_at = now - timedelta(days=days_ago, minutes=random.randint(0, 1440))
        created_str = created_at.strftime('%Y-%m-%d %H:%M:%S')

        completed_str = None
        if status == 'COMPLETED':
            comp_time = created_at + timedelta(hours=random.randint(2, 48))
            completed_str = comp_time.strftime('%Y-%m-%d %H:%M:%S')

        title = f"{fake.catch_phrase()} #{i + 1}"
        desc = fake.text(max_nb_chars=180)
        address = f"{fake.street_name()}, {fake.building_number()} - {fake.city()}, SP"

        req_batch.append((
            r_bytes, c_id, cat_id, title, desc, status, address, created_str, completed_str
        ))

    cursor.executemany("""
        INSERT INTO service_requests (id, client_id, service_category_id, title, description, status, address, created_at, completed_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now'))
    """, req_batch)
    print("  ➔ 10.000 Serviços inseridos com sucesso!")

conn.commit()
conn.close()
print("✅ Seed Python Concluído com Sucesso!")
