import { db } from '@/db/db'
import { createPrompt } from './promptStore'

const PREVIOUS_KNOWLEDGE_PROMPT = `The following flashcard was difficult for me. Generate 3 flashcards covering prerequisite knowledge that would help me understand and remember this content better.

Flashcard:
{{flashcard}}

Generate exactly 3 flashcards that cover foundational concepts, definitions, or related knowledge that would make this flashcard easier to learn. Each flashcard should have:
- front: a question or prompt
- back: the answer
- instruction: a brief instruction for the learner (e.g., "Recall", "Explain", "Define", "Compare")`

const LEARNING_CONTENT_PROMPT = `Based on the following learning content, generate 5 flashcards.
Each flashcard should have:
- front: a question or prompt
- back: the answer
- instruction: a brief instruction for the learner (e.g., "Recall", "Explain", "Define", "Compare")

Learning Content:
---
{{learningcontent}}
---

Generate exactly 5 flashcards that test understanding of key concepts.`

export const ensureDefaultPrompts = async (): Promise<void> => {
  const existingPrompts = await db.prompts.count()
  if (existingPrompts > 0) {
    return
  }

  await createPrompt('Previous Knowledge Generator', PREVIOUS_KNOWLEDGE_PROMPT)
  await createPrompt('Flashcards from Learning Content', LEARNING_CONTENT_PROMPT)
}
