Let's build on the changes made [here](doc/instructions/001_better_relationships.md).

Stick to `agents.md`!

Establish a new page, linked in [header](src/dumb/AppHeader.vue) for goal management.

List the goals as nested collapsibles, where each goal is shown in a LEAN!! row (NOT a fat card), only its `title`, and we can expand it to see its children (as in recursively resolve `requiresLearning`).
For now, let's simply show as top level goals any goal that does not show up in any other goal's `requiresLearning`.

In each such row, have icon buttons for viewing the goal (e.g. title and content, rendered as md), editing the goal, adding a child goal and deleting the goal.
Above all rows should also be a button to add a new top-level goal.

Adding or editing goals works via a modal; the modal content should be reusable and live in `features/learning-goal-add/`.

Ignore goal's references to tasks and flashcards for now.

When editing goals, use the [milkdown](doc/MILKDOWN_VUE.md) strategy same as for editing flashcards. 