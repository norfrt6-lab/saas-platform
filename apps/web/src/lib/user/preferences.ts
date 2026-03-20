import { z } from "zod";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const userPreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.string().default("en"),
  timezone: z.string().default("UTC"),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).default("YYYY-MM-DD"),
  emailNotifications: z.object({
    marketing: z.boolean().default(false),
    security: z.boolean().default(true),
    billing: z.boolean().default(true),
    activityDigest: z.boolean().default(true),
  }),
  dashboardLayout: z.enum(["grid", "list"]).default("grid"),
  compactMode: z.boolean().default(false),
  sidebarCollapsed: z.boolean().default(false),
  defaultProjectView: z.enum(["board", "table", "timeline"]).default("board"),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

const DEFAULT_PREFERENCES: UserPreferences = userPreferencesSchema.parse({
  emailNotifications: {},
});

interface PreferencesStore {
  preferences: UserPreferences;
  setPreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  updateEmailNotifications: (
    updates: Partial<UserPreferences["emailNotifications"]>
  ) => void;
  resetToDefaults: () => void;
  loadFromServer: (serverPrefs: Partial<UserPreferences>) => void;
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,

      setPreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        })),

      updateEmailNotifications: (updates) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            emailNotifications: {
              ...state.preferences.emailNotifications,
              ...updates,
            },
          },
        })),

      resetToDefaults: () => set({ preferences: DEFAULT_PREFERENCES }),

      loadFromServer: (serverPrefs) =>
        set((state) => {
          const merged = { ...state.preferences, ...serverPrefs };
          const result = userPreferencesSchema.safeParse(merged);
          return { preferences: result.success ? result.data : state.preferences };
        }),
    }),
    {
      name: "user-preferences",
      partialize: (state) => ({ preferences: state.preferences }),
    }
  )
);

export function validatePreferences(
  raw: unknown
): { success: true; data: UserPreferences } | { success: false; error: string } {
  const result = userPreferencesSchema.safeParse(raw);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.message };
}
