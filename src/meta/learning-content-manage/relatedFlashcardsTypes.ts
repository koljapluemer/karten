import type { FlashCardDoc } from '@/db/Flashcard'

export type FlashcardNode = {
  card: FlashCardDoc
  children: FlashcardNode[]
  parentId: string | null
  repeated: boolean
}
