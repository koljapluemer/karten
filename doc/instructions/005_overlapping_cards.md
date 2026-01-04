Let's introduce a concept of `overlapping`[] cards (this should be a prop of [flashcards](src/entities/flashcards)), referring to ids of other flashcards.

First, let's redesign [the overview component](src/pages/learning-goals/GoalFlashcardsModal.vue) from a table to a card-based view, using the [renderer](src/entities/flashcards/FlashcardRenderer.vue) to show the flashcards, but transforming them down via CSS to 0.5. We can delete the "view" button and modal, since it's not giving us anything anymore now.

To the actions of each card, add another icon button that opens a modal managing the overlapping flashcards, with a similar flashcard cards-based list view.
Should be possible to add, edit, disattach and delete `overlapping` flashcards from here.

- An `overlapping` flashcard is another normal SR flashcard putting the facts/learning content of the card in context, helping to remember it, embedding it. For example, if we have a language learning flashcard for a verb, we may have `overlapping` flashcards asking about a conjugated form or an example sentence.
- `overlapping` is symmetrical, so if we add B to `overlapping` of A, we should also add `A` to overlapping of `B`

- stick to `agents.md` and reuse/cleanly refactor existing code as much as possible.