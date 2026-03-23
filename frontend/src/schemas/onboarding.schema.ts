import { z } from 'zod';

/** Matches Edge `onboarding` create_team max length. */
const TEAM_NAME_MAX = 120;

export const onboardingCreateTeamSchema = z.object({
  teamName: z
    .string()
    .trim()
    .min(1, 'Team name is required')
    .max(
      TEAM_NAME_MAX,
      `Team name must be at most ${TEAM_NAME_MAX} characters`,
    ),
});

export type OnboardingCreateTeamFormValues = z.infer<
  typeof onboardingCreateTeamSchema
>;

export const onboardingJoinTeamSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(4, 'Invite code must be at least 4 characters')
    .max(64, 'Invite code is too long'),
});

export type OnboardingJoinTeamFormValues = z.infer<
  typeof onboardingJoinTeamSchema
>;
