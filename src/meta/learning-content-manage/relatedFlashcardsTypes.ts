import type { FlashCardDoc } from '@/entities/flashcard/Flashcard'

export type FlashcardNode = {
  card: FlashCardDoc
  children: FlashcardNode[]
  parentId: string | null
  repeated: boolean
}
