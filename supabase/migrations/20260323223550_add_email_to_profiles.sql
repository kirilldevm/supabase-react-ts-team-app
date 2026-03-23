ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Back-fill existing rows
UPDATE public.profiles p
SET    email = u.email
FROM   auth.users u
WHERE  p.user_id = u.id;

-- Trigger function
CREATE OR REPLACE FUNCTION public.profiles_set_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.email := (SELECT email FROM auth.users WHERE id = NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER profiles_set_email_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_set_email();
