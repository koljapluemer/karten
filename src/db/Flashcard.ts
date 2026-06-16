export interface FlashCard {
  id: string
  front: string
  back: string
  blockedBy: string[] // ids of `Flashcard`
  befriendedCards?: string[] // ids of `Flashcard` to surface soon after practicing this one
  frontMediaIds?: string[] // ids of Media records
  backMediaIds?: string[] // ids of Media records
  owner?: string
  realmId?: string
}