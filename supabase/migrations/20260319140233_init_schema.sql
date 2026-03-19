CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TYPE product_status AS ENUM ('draft', 'active', 'deleted');

-- Generate 8-char alphanumeric invite code
CREATE OR REPLACE FUNCTION public.gen_invite_code()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT upper(encode(extensions.gen_random_bytes(4), 'hex'));
$$;

-- Teams
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE DEFAULT public.gen_invite_code(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles: links auth.users to teams (one team per user)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX profiles_team_id_idx ON public.profiles(team_id);
CREATE INDEX profiles_user_id_idx ON public.profiles(user_id);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT,
  status product_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED
);

CREATE INDEX products_team_id_idx ON public.products(team_id);
CREATE INDEX products_created_by_idx ON public.products(created_by);
CREATE INDEX products_status_idx ON public.products(status);
CREATE INDEX products_updated_at_idx ON public.products(updated_at);
CREATE INDEX products_deleted_at_idx ON public.products(deleted_at);
CREATE INDEX products_search_vector_idx ON public.products USING gin(search_vector);

-- Trigger: set deleted_at when status changes to 'deleted'
CREATE OR REPLACE FUNCTION public.set_product_deleted_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'deleted' AND (OLD.status IS NULL OR OLD.status != 'deleted') THEN
    NEW.deleted_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_set_deleted_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_product_deleted_at();
