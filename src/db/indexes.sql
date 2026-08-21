-- ==============================================================================
-- BJJ-Academy SaaS Database Architecture & Multi-Tenant Indexing Script
-- Target Database: PostgreSQL 14+ / 16+
-- Goal: Prevent cross-tenant data leaks, optimize tenant queries & enforce RLS
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. DDL INDEXES: B-TREE & COMPOSITE MULTI-TENANT INDEXES
-- ==============================================================================

-- ACADEMIES (TENANTS)
CREATE INDEX IF NOT EXISTS idx_academies_subdomain ON academies (subdomain);
CREATE INDEX IF NOT EXISTS idx_academies_status ON academies (status);

-- INSTRUCTORS
CREATE INDEX IF NOT EXISTS idx_instructors_tenant_id ON instructors (tenant_id);
CREATE INDEX IF NOT EXISTS idx_instructors_tenant_role ON instructors (tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_instructors_tenant_status ON instructors (tenant_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS unique_instructors_tenant_email ON instructors (tenant_id, email);

-- STUDENTS (CORE ISOLATION)
CREATE INDEX IF NOT EXISTS idx_students_tenant_id ON students (tenant_id);
CREATE INDEX IF NOT EXISTS idx_students_tenant_status ON students (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_students_tenant_belt ON students (tenant_id, belt);
CREATE INDEX IF NOT EXISTS idx_students_tenant_asaas_cust ON students (tenant_id, asaas_customer_id);
CREATE INDEX IF NOT EXISTS idx_students_tenant_asaas_sub ON students (tenant_id, asaas_subscription_id);
CREATE INDEX IF NOT EXISTS idx_students_tenant_created_desc ON students (tenant_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS unique_students_tenant_cpf ON students (tenant_id, cpf) WHERE cpf IS NOT NULL;

-- SUBSCRIPTIONS & MENSALIDADES
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_status ON subscriptions (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_student ON subscriptions (tenant_id, student_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_due_date ON subscriptions (tenant_id, next_due_date);

-- PAYMENTS & INVOICES (FINANCEIRO & SPLIT ASAAS)
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments_history (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_status ON payments_history (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_due_date ON payments_history (tenant_id, due_date);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_payment_date ON payments_history (tenant_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_student ON payments_history (tenant_id, student_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_asaas_id ON payments_history (tenant_id, asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_created_desc ON payments_history (tenant_id, created_at DESC);

-- ATTENDANCES & TATAME CHECK-INS (GEMINI VISION AI)
CREATE INDEX IF NOT EXISTS idx_attendances_tenant_id ON attendances (tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendances_tenant_date ON attendances (tenant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendances_tenant_student ON attendances (tenant_id, student_id);
CREATE INDEX IF NOT EXISTS idx_attendances_tenant_ai ON attendances (tenant_id, verified_by_ai);

-- LEADS & CRM FUNNEL
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads (tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_stage ON leads (tenant_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_created ON leads (tenant_id, created_at DESC);

-- CLASS SCHEDULES
CREATE INDEX IF NOT EXISTS idx_classes_tenant_id ON class_schedules (tenant_id);
CREATE INDEX IF NOT EXISTS idx_classes_tenant_day ON class_schedules (tenant_id, day_of_week);

-- ACCOUNTS PAYABLE / CONTAS A PAGAR
CREATE INDEX IF NOT EXISTS idx_payables_tenant_id ON accounts_payable (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payables_tenant_status_due ON accounts_payable (tenant_id, status, due_date);

-- AUDIT TRAIL / LOGS
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON audit_logs (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_entity ON audit_logs (tenant_id, entity, entity_id);

-- WEBHOOK JOBS & DLQ
CREATE INDEX IF NOT EXISTS idx_webhook_jobs_tenant_id ON webhook_jobs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_jobs_tenant_status ON webhook_jobs (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_webhook_jobs_tenant_enqueued ON webhook_jobs (tenant_id, enqueued_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS unique_webhook_jobs_provider_event ON webhook_jobs (provider, event_id);

-- ==============================================================================
-- 3. POSTGRESQL ROW-LEVEL SECURITY (RLS) - DEFENSE IN DEPTH CONTRA DATA LEAK
-- ==============================================================================

-- Ativa RLS em todas as tabelas compartilhadas
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_jobs ENABLE ROW LEVEL SECURITY;

-- Cria políticas RLS que impedem qualquer SELECT/INSERT/UPDATE/DELETE fora do tenant atual
DROP POLICY IF EXISTS tenant_isolation_policy_students ON students;
CREATE POLICY tenant_isolation_policy_students ON students
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS tenant_isolation_policy_payments ON payments_history;
CREATE POLICY tenant_isolation_policy_payments ON payments_history
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS tenant_isolation_policy_attendances ON attendances;
CREATE POLICY tenant_isolation_policy_attendances ON attendances
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS tenant_isolation_policy_leads ON leads;
CREATE POLICY tenant_isolation_policy_leads ON leads
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS tenant_isolation_policy_payables ON accounts_payable;
CREATE POLICY tenant_isolation_policy_payables ON accounts_payable
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS tenant_isolation_policy_audit ON audit_logs;
CREATE POLICY tenant_isolation_policy_audit ON audit_logs
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS tenant_isolation_policy_webhooks ON webhook_jobs;
CREATE POLICY tenant_isolation_policy_webhooks ON webhook_jobs
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- ==============================================================================
-- 4. QUERY DE AUDITORIA & VERIFICAÇÃO DE ÍNDICES ATIVOS NO BANCO
-- ==============================================================================
-- Execute esta consulta para checar a saúde dos índices de tenant no PostgreSQL:
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE indexname LIKE '%tenant%'
ORDER BY tablename, indexname;
*/
