export type OnboardingTeam = {
  id: string;
  name: string;
  invite_code: string;
};

export type OnboardingGetResponse = {
  needsOnboarding: boolean;
  team: OnboardingTeam | null;
};
