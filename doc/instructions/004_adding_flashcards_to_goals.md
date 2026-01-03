Let's add [flashcards](src/entities/flashcards) to the [learning goals](src/pages/learning-goals).

Add an "icon button" to the goal rows that is actually the number of `flashcards` attached to this goal.
Clicking that opens a modal showing the flashcards in a simple list (use a daisy table, rendering front and back, truncate so cells aren't overrun).
Add the bottom of the modal, have an "Add flashcard" button that opens another modal allowing to add a flashcard; for that, extract the existing currently living [here](src/pages/practice/FlashcardAddForm.vue) into its own feature.

From the table with the attached flashcards, via icon buttons, it should also be possible to (fully) view flashcards (via another modal), edit flashcards, to disattach them, and to delete them.

While we're at it, let's build a shared dumb component `FlashcardRenderer` in the flashcard entity folder and use it both in [practice](src/pages/practice) and for the the preview modal mentioned above.

Design-wise, model it after [this inspiration](doc/FLASHCARD_RENDER_EXAMPLES.md) (the white design, the flip animation, not the bespoke text row logic).

Stick to THE ACTUAL INSTRUCTIONS in `agents.md`