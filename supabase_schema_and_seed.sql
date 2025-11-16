-- ============================================
-- SUPABASE SCHEMA & SEED FOR GREEN EXPRESS
-- ============================================
-- Execute this SQL in Supabase SQL Editor to create tables and seed initial data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    preferences JSONB DEFAULT '{"allergies": "", "dietary": "", "tags": []}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    plan_name TEXT,
    amount NUMERIC NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('pending', 'active', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. PAYMENT REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    plan_name TEXT,
    amount NUMERIC NOT NULL,
    user_name TEXT,
    user_email TEXT,
    proof_url TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. PAYMENT HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    invoice_number TEXT UNIQUE,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    to_role TEXT CHECK (to_role IN ('admin', 'user')) DEFAULT 'user',
    target_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    related_id UUID,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. CONTACT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON public.payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_to_role ON public.notifications(to_role);
CREATE INDEX IF NOT EXISTS idx_notifications_target_user_id ON public.notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BASIC RLS POLICIES (adjust as needed)
-- ============================================

-- Users can read their own profile
CREATE POLICY "users_read_own" ON public.users
    FOR SELECT USING (true);  -- Allow all to read (can be restricted later)

-- Admins can do everything
CREATE POLICY "admin_all_operations" ON public.users
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = (SELECT id FROM public.users LIMIT 1)) = 'admin'
    );

-- Subscriptions: users can read their own
CREATE POLICY "subscriptions_read_own" ON public.subscriptions
    FOR SELECT USING (true);  -- Can be restricted later

-- Payment requests: users can create and read their own
CREATE POLICY "payment_requests_read_own" ON public.payment_requests
    FOR SELECT USING (true);  -- Can be restricted later

-- Notifications: read by role (admin or user)
CREATE POLICY "notifications_read_by_role" ON public.notifications
    FOR SELECT USING (true);  -- Can be restricted later

-- Contact messages: anyone can insert
CREATE POLICY "contact_messages_insert" ON public.contact_messages
    FOR INSERT WITH CHECK (true);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert Admin User (danilomuela36@gmail.com / admin123)
INSERT INTO public.users (username, email, password_hash, name, phone, address, role, created_at)
VALUES (
    'admin',
    'danilomuela36@gmail.com',
    '$2a$12$WNYDseJNtuZQAtjfkn69yuvMlGfN8m6YDuJbOUJwajKloCLXXZcIm',
    'Administrateur',
    '097 254 5000',
    'Kolwezi, RDC',
    'admin',
    now()
)
ON CONFLICT (email) DO NOTHING;

-- Insert Demo Client User (client@example.com / client123)
INSERT INTO public.users (username, email, password_hash, name, phone, address, role, preferences, created_at)
VALUES (
    'client',
    'client@example.com',
    '$2a$12$uwl7TJ/a30OOakeIHP73zOgYhyYNKMx3lp2mQi93MG5a7S4PeUuC.',
    'Client Démo',
    '085 016 7641',
    'Kolwezi, RDC',
    'user',
    '{"allergies": "", "dietary": "", "tags": []}',
    now()
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- NOTES
-- ============================================
-- 1. Password hashes above are placeholders. You must:
--    a) Use bcrypt or another proper hashing algorithm
--    b) OR use Supabase Auth instead (recommended) and store only the auth.uid()
--
-- 2. To generate proper bcrypt hashes, you can use:
--    - Online: https://bcrypt-generator.com/ (NOT for production!)
--    - Node.js: npm install bcrypt; then bcrypt.hashSync("21121999", 10)
--    - Python: pip install bcrypt; bcrypt.hashpw(b"21121999", bcrypt.gensalt(10))
--
-- 3. Update the password_hash values with real hashes before using in production
--
-- 4. RLS policies are basic; enhance them based on your security requirements
