Let's implement a tag system.
Every [flashcard](src/db/Flashcard.ts) should store an array of `tags`, which are referenced to a new entity `tag` (to be established).
We will need some dynamic smart type handling because `Flashcard.tags` should not be optional (instead default to empty array), yet we have flashcards in the db predating this change that have no `tags` prop.


Tags can have the following simple props:
- `content`: simple string (on frontend, these are enfored to be alphanumeric+dash only).
- `importance`: a simple number, enforced to be 0-10 (mostly ignored for now)

[learning content](src/db/LearningContent.ts) also should have `tags`, with the same thing that historic learningContent may not have tags yet.

Generate a smart input thing for flashcard's and content's tags where inputted tags show up as pills, where can also remove them with an icon button "x", and we get autocomplete suggesting on existing tags when typing. Make this a reusable dumb feature.

Use this tag management form in the pages/meta features for adding/editing learning content and flashcards, and allow the lists of flashcards and learning content to be filtered by tags, using the same tag manage input to select which tags to filter for, and several lines of filter, each with their own filter:
- Contains any of the following tags
- Contains all of the following tags
- Does not contain any of the following tags

- Stick to `agents.md` always!!
- refer to `doc/how-to-design.md` for UI design.