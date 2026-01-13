import Dexie, { type EntityTable } from 'dexie'
import dexieCloud from 'dexie-cloud-addon'
import type { Card } from 'ts-fsrs'

export interface FlashCard {
  id: string
  instruction: string
  front: string
  back: string
  blockedBy: string[]
  owner?: string
  realmId?: string
}

export interface LearningContent {
  id: string
  content: string
  relatedFlashcards: string[]
  owner?: string
  realmId?: string
}

export interface LearningProgress extends Card {
  id: string
  owner?: string
  realmId?: string
}

class KartenDatabase extends Dexie {
  flashcards!: EntityTable<FlashCard, 'id'>
  learningContent!: EntityTable<LearningContent, 'id'>
  learningProgress!: EntityTable<LearningProgress, 'id'>

  constructor() {
    super('karten', { addons: [dexieCloud] })

    this.version(1).stores({
      flashcards: 'id, *blockedBy, owner, realmId',
      learningContent: 'id, *relatedFlashcards, owner, realmId',
      learningProgress: 'id, due, owner, realmId'
    })
  }
}

export const db = new KartenDatabase()

db.cloud.configure({
  databaseUrl: import.meta.env.VITE_DEXIE_CLOUD_URL || 'https://xxxxx.dexie.cloud',
  requireAuth: false
})
