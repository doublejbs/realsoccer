import { z } from "zod";

export const PreferencesSchema = z.object({
  favoriteLeagues: z.array(z.string()).max(20).default([]),
  favoriteTeams: z.array(z.string()).max(50).default([]),
  favoriteStyles: z.array(z.string()).max(10).default([]),
});

export type PreferencesInput = z.infer<typeof PreferencesSchema>;
