export interface FlashCard {
  id: string
  instruction: string
  front: string
  back: string
  blockedBy: string[] // ids of `Flashcard
//   tags: string[] // ids of `Tag`
// dexie management  
  owner?: string
  realmId?: string
}