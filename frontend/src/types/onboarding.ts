export type OnboardingTeam = {
  id: string;
  name: string;
  invite_code: string;
};

export type OnboardingGetResponse = {
  needsOnboarding: boolean;
  team: OnboardingTeam | null;
};

export type OnboardingCreateTeamResponse = {
  ok: true;
  action: 'create_team';
  team: OnboardingTeam;
};

export type OnboardingJoinTeamResponse = {
  ok: true;
  action: 'join_team';
  team: OnboardingTeam;
};

/** JSON body returned on 4xx/5xx from the Edge function (when parseable). */
export type OnboardingErrorBody = {
  error: string;
  code?: string;
  team?: OnboardingTeam;
};
