import type { FlashCard } from '@/db/Flashcard'

export type FlashcardNode = {
  card: FlashCard
  children: FlashcardNode[]
  parentId: string | null
  repeated: boolean
}
