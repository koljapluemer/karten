This repo is a flashcard learning app with lots of legacy garbage.
I moved the old version into `_legacy/`.
Lets rebuild the app cleanly in `src/`, using only REQUIRED features, and ACTUALLY sticking to `agents.md`, not just "sometimes sticking to some of `agents.md` which you love doing". As a first task, read `agents.md` and restate what it says, ENTIRELY!

I already mocked a lot of files.
These are not for decoration, but TO BE USED.
Please USE AND FILL THEM instead of building parallel file and folders with worse names alongside.

## First Required Features

Let's start building; handling learning content. 
The [interface](src/entities/learning-content/LearningContent.ts) is already set and may NOT in ANY WAY be changed.
Build a basic [CRUD store](src/entities/learning-content/learningContentStore.ts) here, using pouchdb as before.

[This](src/pages/learning-content-list/PageLearningContentList.vue) should become a daisy table (yes, table), where the first column
is the learning content as raw text (use ellipsis if it would exceed column width, we want only one line) and then a column with action buttons.

We want an icon button for editing, redirecting [here](src/pages/learning-content-edit/PageLearningContentEdit.vue).
Above the table itself should also be a button "Add Learning Content" redirecting [here](src/pages/learning-content-add/PageLearningContentAdd.vue).

Both of these should utilize [this dumb form](src/features/learning-content-manage/LearningContentManager.vue) (only emit/props, no entity storage).

There should also be an icon button to show the full learning content in a modal using [this](src/entities/learning-content/LearningContentRenderer.vue) which in turn should use [this](src/dumb/MarkdownContent.vue).

There should also be an icon button for deletion.

Do not concern yourself with any other features or code except what is actually described in this very file. STICK TO `agents.md`!!!!!!!!!!