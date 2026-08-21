import subprocess

users_sql = """
INSERT INTO users (created_at, updated_at, email, password, name, role, is_verified, is_active, is_staff, is_blocked)
VALUES 
(NOW(), NOW(), 'pro1@example.com', '$argon2id$v=19$m=19456,t=2,p=1$6efg8SetEgQqDFORj5osKQ$72HTtLMl8SEjnRtcJ9Xxgkjxbe8uSYempyPg5slPywQ', 'Marcos Eletricista (Encanador Hidráulico)', 'PROFESSIONAL', true, true, false, false),
(NOW(), NOW(), 'cliente1@example.com', '$argon2id$v=19$m=19456,t=2,p=1$6efg8SetEgQqDFORj5osKQ$72HTtLMl8SEjnRtcJ9Xxgkjxbe8uSYempyPg5slPywQ', 'Maria Vitória Câmara', 'CLIENT', true, true, false, false),
(NOW(), NOW(), 'admin@agilizapro.com.br', '$argon2id$v=19$m=19456,t=2,p=1$EBjvqGJXJlNHkbGstBif6A$PJE2yiEGd5i67uCdwGohI7DajPDMkYjZEKnTBqx7Lc4', 'Administrador AgilizaPro', 'ADMIN', true, true, true, false)
ON CONFLICT (email) DO NOTHING;
"""

print("📦 Inserindo usuários no PostgreSQL da VPS...")
cmd = ["ssh", "root@72.61.48.59", f"docker exec -i agiliza_postgres psql -U agiliza -d agiliza_db -c \"{users_sql}\""]
res = subprocess.run(" ".join(cmd), shell=True, capture_output=True, text=True)
print(res.stdout)
print(res.stderr)

check_cmd = "ssh root@72.61.48.59 \"docker exec -i agiliza_postgres psql -U agiliza -d agiliza_db -c 'SELECT id, name, email, role FROM users;'\""
res_check = subprocess.run(check_cmd, shell=True, capture_output=True, text=True)
print("📊 Usuários no PostgreSQL:")
print(res_check.stdout)
