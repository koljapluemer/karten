export interface FlashCard {
  id: string
  front: string
  back: string
  blockedBy: string[] // ids of `Flashcard`
  tags: string[] // ids of `Tag`
  frontMediaIds?: string[] // ids of Media records
  backMediaIds?: string[] // ids of Media records
  owner?: string
  realmId?: string
}