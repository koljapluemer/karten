import Dexie, { type EntityTable } from 'dexie'
import dexieCloud from 'dexie-cloud-addon'
import type { FlashCard } from './Flashcard'
import type { LearningContent } from './LearningContent'
import type { LearningProgress } from './LearningProgress'
import type { ReviewCount } from './ReviewCount'
import type { Tag } from './Tag'
import type { Prompt } from './Prompt'
import type { UserSettings } from './UserSettings'
import type { Media } from './Media'







class KartenDatabase extends Dexie {
  declare flashcards: EntityTable<FlashCard, 'id'>
  declare learningContent: EntityTable<LearningContent, 'id'>
  declare learningProgress: EntityTable<LearningProgress, 'id'>
  declare reviewCounts: EntityTable<ReviewCount, 'id'>
  declare tags: EntityTable<Tag, 'id'>
  declare prompts: EntityTable<Prompt, 'id'>
  declare userSettings: EntityTable<UserSettings, 'id'>
  declare media: EntityTable<Media, 'id'>

  constructor() {
    super('karten', { addons: [dexieCloud] })

    this.version(1).stores({
      flashcards: 'id, *blockedBy, owner, realmId',
      learningContent: 'id, *relatedFlashcards, owner, realmId',
      learningProgress: 'id, due, owner, realmId'
    })

    this.version(2).stores({
      flashcards: 'id, *blockedBy, owner, realmId',
      learningContent: 'id, *relatedFlashcards, owner, realmId',
      learningProgress: 'id, due, owner, realmId',
      reviewCounts: 'id, date, owner, realmId'
    })

    this.version(3).stores({
      flashcards: 'id, *blockedBy, *tags, owner, realmId',
      learningContent: 'id, *relatedFlashcards, *tags, owner, realmId',
      learningProgress: 'id, due, owner, realmId',
      reviewCounts: 'id, date, owner, realmId',
      tags: 'id, content, owner, realmId'
    })

    this.version(4).stores({
      flashcards: 'id, *blockedBy, *tags, owner, realmId',
      learningContent: 'id, *relatedFlashcards, *tags, owner, realmId',
      learningProgress: 'id, due, owner, realmId',
      reviewCounts: 'id, date, owner, realmId',
      tags: 'id, content, owner, realmId',
      prompts: 'id, name, owner, realmId'
    })

    this.version(5).stores({
      flashcards: 'id, *blockedBy, *tags, owner, realmId',
      learningContent: 'id, *relatedFlashcards, *tags, owner, realmId',
      learningProgress: 'id, due, owner, realmId',
      reviewCounts: 'id, date, owner, realmId',
      tags: 'id, content, owner, realmId',
      prompts: 'id, name, owner, realmId',
      userSettings: 'id, owner, realmId'
    })

    this.version(6).stores({
      flashcards: 'id, *blockedBy, *tags, owner, realmId',
      learningContent: 'id, *relatedFlashcards, *tags, owner, realmId',
      learningProgress: 'id, due, owner, realmId',
      reviewCounts: 'id, date, owner, realmId',
      tags: 'id, content, owner, realmId',
      prompts: 'id, name, owner, realmId',
      userSettings: 'id, owner, realmId'
    }).upgrade(tx => {
      return tx.table('tags').toCollection().modify(tag => {
        if ('importance' in tag) {
          tag.priority = tag.importance
          delete tag.importance
        }
      })
    })

    this.version(7).stores({
      flashcards: 'id, *blockedBy, *tags, owner, realmId',
      learningContent: 'id, *relatedFlashcards, *tags, owner, realmId',
      learningProgress: 'id, due, owner, realmId',
      reviewCounts: 'id, date, owner, realmId',
      tags: 'id, content, owner, realmId',
      prompts: 'id, name, owner, realmId',
      userSettings: 'id, owner, realmId'
    }).upgrade(tx => {
      return tx.table('userSettings').toCollection().modify(settings => {
        if (!('untaggedPriority' in settings)) {
          settings.untaggedPriority = 5
        }
      })
    })

    this.version(8).stores({
      flashcards: 'id, *blockedBy, *tags, owner, realmId',
      learningContent: 'id, *relatedFlashcards, *tags, owner, realmId',
      learningProgress: 'id, due, owner, realmId',
      reviewCounts: 'id, date, owner, realmId',
      tags: 'id, content, owner, realmId',
      prompts: 'id, name, owner, realmId',
      userSettings: 'id, owner, realmId',
      media: 'id, mediaType, owner, realmId'
    })
  }
}

export const db = new KartenDatabase()

db.cloud.configure({
  databaseUrl: import.meta.env.VITE_DEXIE_CLOUD_URL || 'https://xxxxx.dexie.cloud',
  requireAuth: false
})
