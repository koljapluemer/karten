Let's build out `src/pages/practice/PagePractice.vue`.
We want to practice [flashcards](src/entities/flashcard/Flashcard.ts), tracking the progress via `src/entities/learning-progress/LearningProgress.ts` via [fsrs](doc/FSRS_README.md).

You will find plenty code relating to this in `_legacy`.
Use a very simple, infinite flow:

1. In 1/10th of cases, prefer an unseen flashcard over a seen flashcard (=no matching learning progress object, all `blockedBy` cards must be not unseen and not due, otherwise card can't be picked)
2. Otherwise, pick a due flashcard (learning progress object attached, due according to ts-fsrs, also all `blockedBy` cards must be not unseen and not due, otherwise card can't be picked)

For new cards, use the try-to-remember flow from the legacy code.
For not-new cards, use the front-reveal-front+back-score flow from the legacy code.