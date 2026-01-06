Let's try another UI approach to this app.

Bring back a global nav in [here](src/app/App.vue), in footer, just a simple collection to navigate between pages.
Let's add pages:

## Topic-Based CMS

Let's add a new entity `Topic`.
It has the following props:
- `name`: str[]
- `materials`: str[], a flat list of strings (markdown-interpreted)
- `levels`: str[][], an ordered list of arrays, where each array is an array of strings referring to flashcard ids

### Topics Overview

A simple daisy table list of the topics we have, allowing CRUD operations via icon buttons and what not.
One icon should redirect to *topic manage*
We simply show/allow editing the `name` of topics, we ignore all the array stuff completely on this page.
To add topics, simply have an <input> below the table for the `name` of the new topic.


### Topic Manage

Multiple sections.
First section: Materials.
A side-scrollable card-based overview of the attached materials.
Render each material as a sort of card with just a front.
Allow editing/adding materials with the known markdown flow (textarea though, not <input>), using modal and icon buttons.

Next section: Levels
Each level should be a card (not a white card) stretching the width of the screen.
Empty levels can be deleted via an icon button.
It should be possible to add levels at every point (new first level, new last level, levels between existing levels).
Within levels, we can add flashcards (both declarative flashcard and procedural goals).
It should both be possible to append existing flashcards as well as add new ones.
Create/use existing reusable features.
Show the flashcards per level as scaled down previews in a grid layout.
It should be possible to drag-and-drop them to other levels, and disattach them by dragging them outside of the levels.
Use an appropriate library if needed, and make sure this works on mobile too. 

## Topic-Based Practice

Similar to the current `practice`, but way simpler:
Simply pick a random topic.
Then:
1) see if any goals or declarative cards are due (*not* unseen; cards that have been practiced before and are due again now (for declarative that means recall % below 0.9)). If more than 15 cards are due, randomly select 15.
2) add unseen cards. Per default, add them from first level. If all cards are > 0.9 or `isAchieved` in the first level (the attached `src/entities/progress/LearningProgress.ts`), you may pick from the second level, and so on. As for the number of unseen cards to add:
    - if there *are* legal unseen cards, add at least two
    - at most add so many unseen cards that we have 17 cards picked overall for the topic
Run through tasks; we're only using `src/pages/practice/screens/PracticeGoalScreen.vue` `src/pages/practice/screens/PracticeFlashcardScreen.vue` (these must be moved and refactored to conform to architecture guidelines!). 
If a declarative card is new, use a "try to memorize this"-task inspired by [this](doc/MEMORIZATION_TASK.md).
After done, show a short evaluation (for now, just a stub like "practiced x cards, n declarative (of that % correct) m goals" or whatever).
Then, next.