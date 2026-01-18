export interface FlashCard {
  id: string
  front: string
  back: string
  blockedBy: string[] // ids of `Flashcard`
  tags: string[] // ids of `Tag`
  owner?: string
  realmId?: string
}