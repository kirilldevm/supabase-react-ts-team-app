CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Purge products with status 'deleted' older than 2 weeks
CREATE OR REPLACE FUNCTION public.purge_old_deleted_products()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.products
  WHERE status = 'deleted'
    AND deleted_at IS NOT NULL
    AND deleted_at < now() - interval '2 weeks';
END;
$$;

-- Cron: purge deleted products older than 2 weeks
SELECT cron.schedule(
  'purge-deleted-products',
  '0 0 * * *',
  'select public.purge_old_deleted_products()'
);
