export type Team = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
};

export type TeamMember = {
  user_id: string;
  joined_at: string;
  email: string | null;
};

export type ProfileWithTeam = {
  team_id: string;
  joined_at: string;
  teams: Team;
};

/** A member enriched with online status from Realtime presence. */
export type MemberPresence = {
  user_id: string;
  email: string;
  online_at: string;
};
