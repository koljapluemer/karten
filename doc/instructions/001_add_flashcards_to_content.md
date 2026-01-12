Let's add a property `relatedFlashcards: str[]` to `src/entities/learning-content/LearningContent.ts`.
Semiotically, that means flashcards derived from or teaching this learning content.

In `src/meta/learning-content-manage/LearningContentManager.vue`, allow managing attached flashcards of learning content.
Do this is in a similar way to how we can currently manage `blockedBy` of flashcards.
However, there is one important difference:
It should be possible, within this per-learning-content-flashcard manager to easily denote nested `blockedBy` relationships.

For this, instead of simply having a flat table of `relatedFlashcards`, we need to have a nested view of collapsibles (each still just one row with ellipsed front/back + action buttons). So, on the first level, we have all direct attaches of Flashcards from the `relatedFlashcards` array, but for each of those, we resolve their `blockedBy` recursively.
To avoid infinite recursion, we only resolve `blockedBy` for a given item in this tree rendered if its the first time it shows up in this specific tree.
Via icon buttons, it again should be easy to add existing or new flashcards as `blockedBy` children of any already attached card or on high level, as well as to view, edit, delete and disattach.

Stick to `agents.md` and to `doc/how-to-design.md`