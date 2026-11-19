#!/bin/sh
# Postgres konteyneri birinchi marta ishga tushganda (bo'sh ma'lumot papkasi bilan) bir marta bajariladi.
# Ilova superuser bo'lmagan rol bilan ulanadi, shunda RLS siyosatlari chetlab o'tilmaydi. Jadval huquqlari migratsiyalarda.
# Parol: APP_DB_PASSWORD (prod'da majburiy; lokal sukut faqat dev uchun).
set -eu
APP_PW="${APP_DB_PASSWORD:-erp_app_password}"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -v app_pw="$APP_PW" <<'SQL'
SELECT format('CREATE ROLE erp_app LOGIN PASSWORD %L NOSUPERUSER NOBYPASSRLS', :'app_pw')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') \gexec
SELECT format('ALTER ROLE erp_app PASSWORD %L', :'app_pw') \gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO erp_app', current_database()) \gexec
SQL
