export interface FlashCard {
  id: string
  instruction: string
  front: string
  back: string
  blockedBy: string[] // ids of `Flashcard`
  tags: string[] // ids of `Tag`
  owner?: string
  realmId?: string
}