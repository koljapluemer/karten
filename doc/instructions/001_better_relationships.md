Previously, we implemented [the spec](spec.md).
Works fine.

However, I noticed some problems with the relationships and entities. Let's change our model to the following:

*make `FlashCard`, `TaskCard` and `LearningGoal` three different entities*.

- `FlashCard` and `TaskCard` track *no* relationships. They must have `front` and `back`. The `cardType` is no longer needed, remove.
- `LearningGoal` has:
    - `title` and optional `content` (both string, both interpreted as markdown [not too relevant for now, as we're only building structure]). 
    - `requiresLearning[]`, tracking ids of other `LearningGoal`s
    - `flashcards[]`, tracking ids of `FlashCard`s
    - `tasks[]`, trackings ids of `TaskCard`s

DELETE!!! dead code. No migrations, no backwards compatibility, no parallel legacy implementations. This is early development. Simply implement CLEANLY as described above