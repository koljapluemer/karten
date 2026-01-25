import { db } from '@/db/db'
import type { UserSettings } from '@/db/UserSettings'

const USER_SETTINGS_ID = 'user-settings:default'
const DEFAULT_DAILY_FLIPPED_CARD_GOAL = 100
const DEFAULT_UNTAGGED_PRIORITY = 5

export const loadUserSettings = async (): Promise<UserSettings> => {
  const existing = await db.userSettings.get(USER_SETTINGS_ID)
  if (existing) {
    return existing
  }
  const defaults: UserSettings = {
    id: USER_SETTINGS_ID,
    dailyFlippedCardGoal: DEFAULT_DAILY_FLIPPED_CARD_GOAL,
    untaggedPriority: DEFAULT_UNTAGGED_PRIORITY
  }
  await db.userSettings.put(defaults)
  return defaults
}

export const setDailyFlippedCardGoal = async (goal: number): Promise<UserSettings> => {
  const sanitized = Math.max(1, Math.floor(goal))
  const existing = await db.userSettings.get(USER_SETTINGS_ID)
  const updated: UserSettings = {
    id: USER_SETTINGS_ID,
    dailyFlippedCardGoal: sanitized,
    untaggedPriority: existing?.untaggedPriority ?? DEFAULT_UNTAGGED_PRIORITY,
    owner: existing?.owner,
    realmId: existing?.realmId
  }
  await db.userSettings.put(updated)
  return updated
}

export const updateUntaggedPriority = async (priority: number): Promise<UserSettings> => {
  const sanitized = Math.max(0, Math.min(10, Math.floor(priority)))
  const existing = await db.userSettings.get(USER_SETTINGS_ID)
  const updated: UserSettings = {
    id: USER_SETTINGS_ID,
    dailyFlippedCardGoal: existing?.dailyFlippedCardGoal ?? DEFAULT_DAILY_FLIPPED_CARD_GOAL,
    untaggedPriority: sanitized,
    owner: existing?.owner,
    realmId: existing?.realmId
  }
  await db.userSettings.put(updated)
  return updated
}
