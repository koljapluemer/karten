Let's implement a tag system.
Every [flashcard](src/db/Flashcard.ts) should store an array of `tags`, which are referenced to a new entity `tag` (to be established).
We will need some dynamic smart type handling because `Flashcard.tags` should not be optional (instead default to empty array), yet we have flashcards in the db predating this change that have no `tags` prop.


Tags can have the following simple propssimple strings (on frontend, these are enfored to be alphanumeric+dash only).