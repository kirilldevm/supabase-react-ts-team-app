ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Users can view their own team"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    id = (SELECT public.get_user_team_id())
  );

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Profiles policies
CREATE POLICY "Users can view profiles in their team"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    team_id = (SELECT public.get_user_team_id())
  );

CREATE POLICY "Users can insert own profile when creating or joining team"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Users can update profiles in their team"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    team_id = (SELECT public.get_user_team_id())
  )
  WITH CHECK (
    team_id = (SELECT public.get_user_team_id())
  );

-- Products policies
CREATE POLICY "Users can view products in their team"
  ON public.products FOR SELECT
  TO authenticated
  USING (
    team_id = (SELECT public.get_user_team_id())
  );

CREATE POLICY "Users can insert products in their team"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id = (SELECT public.get_user_team_id())
    AND created_by = auth.uid()
    AND status = 'draft'
  );

CREATE POLICY "Users can update draft products in their team"
  ON public.products FOR UPDATE
  TO authenticated
  USING (
    team_id = (SELECT public.get_user_team_id())
    AND status = 'draft'
  )
  WITH CHECK (
    team_id = (SELECT public.get_user_team_id())
  );

-- Allow status transitions
CREATE POLICY "Users can publish or soft-delete draft products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (
    team_id = (SELECT public.get_user_team_id())
    AND status = 'draft'
  )
  WITH CHECK (
    team_id = (SELECT public.get_user_team_id())
    AND status IN ('active', 'deleted')
  );