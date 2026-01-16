import type { Card } from "ts-fsrs"

export interface LearningProgress extends Card {
  id: string
  owner?: string
  realmId?: string
}