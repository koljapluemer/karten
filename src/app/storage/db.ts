import Dexie, { type EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

export interface FlashCard {
  id: string
  instruction: string
  front: string
  back: string
  blockedBy: string[]
  owner?: string // Cloud-ready
  realmId?: string // Cloud-ready
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
    super('karten')

    this.version(1).stores({
      flashcards: 'id, *blockedBy, owner, realmId',
      learningContent: 'id, *relatedFlashcards, owner, realmId',
      learningProgress: 'id, due, owner, realmId'
    })
  }
}

export const db = new KartenDatabase()
