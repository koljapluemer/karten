import { db } from '@/db/db'
import type { UserSettings } from '@/db/UserSettings'

const USER_SETTINGS_ID = 'user-settings:default'
const DEFAULT_DAILY_FLIPPED_CARD_GOAL = 100

export const loadUserSettings = async (): Promise<UserSettings> => {
  const existing = await db.userSettings.get(USER_SETTINGS_ID)
  if (existing) {
    return existing
  }
  const defaults: UserSettings = {
    id: USER_SETTINGS_ID,
    dailyFlippedCardGoal: DEFAULT_DAILY_FLIPPED_CARD_GOAL
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
    owner: existing?.owner,
    realmId: existing?.realmId
  }
  await db.userSettings.put(updated)
  return updated
}
