Ok. Let's vastly simplify the app.

Remove (yes, remove, not comment out or "leave for legacy reasons") the `learningGoal` entity and related views and the page dedicated to it.
In fact, remove `AppHeader` completely, let's only work in the `Practice` page for now.

Remove the settings page also, if the OpenAI API key is missing, handle that via a modal opening when needed.
Remove the stats page.

We're also going to redesign practice mode itself.

## Entities

On the data side, we're only going to have [flashcards](src/entities/flashcards/FlashCard.ts).
However, on the user side these are split into *(declarative) flashcards* and *(procedural) goals*.
This is syntactially represented with the `cardType` prop which can be "declaritive" or "procedural" (yes, this is a data model change, no migration or backwards compatibility needed)

In the UI, for now, when handling flashcards that are procedural goals always hide the `back` (in editing and in displaying)

## Practice Mode

Right now, practice is a fairly bespoke state machine.
Let's change it to a much more simple paradigm: 
`Practice` is always on a certain "screen", described below.
We can also trigger some modals, which are special and can be overlayed over the screen, whereever we are right now.
After a screen is done with its internal flow, it will emit a signal and possibly what screen it demands to load next.
if there is no such demand, we will pick a random screen according to the available data.

### General UI

1. An icon-button bar (see below)
2. The `Screen`
    1. A standardized looking instruction text (component that `Screens` are importing)
    2. Some flexible bespoke mostly [FlashcardRenderer](src/entities/flashcards/FlashcardRenderer.vue) based stuff
    3. standardized looking action button (dumb component rendering a button row, with props and emits)

### Screens

#### Add Declarative Flashcard

- *instruction:* "Add a Flashcard"
- *can be used if:* Always
    - this is also the default screen when there is nothing yet in the db

Uses reusable flashcard-edit feature (build from current `src/features/flashcard-add`).
Allow buttons "Done" and "Done and Add Another" (communicates controller to load this screen again)

#### Add Procedural Goal

- *instruction:* "Add a Goal"
- *can be used if:* Always

Like above, but for goals.
Also use reusable feature.


#### Add Follow-Up Flashcards to Flashcards

- *instruction:* What knowledge can you memorize now that you know this?
- *can be used if:*
    - relates to a specific flashcard, which must be not-unseen and have a recall > 80%

Shows the parent card, back revealed.
Below that:
A smart multi-form utilizing the reusable form for adding flashcards.
First, a daisy table cards the user has attached just now, to allow disattach, edit and delete.
Simply show the raw `front` content of each card, icon buttons next to it.
Make this is a reusable component.
Below that, the standardized editing/adding flashcard component (which needs to be fairly dumb).
This new flashcard should have the `requiresLearning` already filled with the id of the parent card.

Only one primary button: "Done".


#### Add Follow-Up Goals to Goal

- *instruction:* Randomly picked by practice state manager, options:
    - "Are there harder versions of this goal you want to achieve after you got this?"
    - "Which new goals can you go after once you got this down?"
- *can be used if:*
    - relates to a specific goal (so we can load this for any goal)

Same structure as above, for goals.

#### Add Required Goals to Goal

- *instruction:* What goals do you need to reach before you can attempt this?
- *can be used if:*
    - relates to a specific goal which was not yet practiced

Similar as above, only we show the existing goals in `requiresLearning` in the multi-form table from the beginning so the user has an overview.
Of course, added goals should show up in the `requiresLearning` of the parent goal


#### Add Required Flashcards to Goal

- *instruction:* What declarative knowledge do you need to internalize before attempting this?
- *can be used if:*
    - relates to a specific goal (any)

Similar as above but for the flashcards in the `requiresLearning` of a goal

#### Add Required Flashcards to Flashcard

- *instruction:* Which declarative knowledge would help you memorize this card?
- *can be used if:*
    - relates to any flashcard

Adapt above

#### Add Overlapping Flashcards to Flashcard

Like above, only with instruction "Add flashcards that give additional context to this" and with adding data to `overlapping` instead of `requiresLearning`

#### Add Overlapping Goals to Goal

Same as above, but for goals, with instruction "Add an alternative goal to practice that will help achieving this goal"

#### Practice Flashcard

- *instruction:* "Remember & Reveal"
- *can be used if:*
    - based on any flashcard, as long as all its `requiresLearning` candidates are above 0.9 recall % (if they're declarative) or `isAchieved` is true (if they're procedural) and as long as no existing practice object or recall below 0.9 

Basically the existing practice Reveal-Score flow.
Use `DeclarativeLearningProgressDoc` from `src/entities/progress/LearningProgress.ts`

However, after scoring, do not go to next immediately, instead:
    - if answer was "easily" give options: "Add Follow-Up Flashcard", "Next"
    - if answer was "yes" give options: "Add Overlapping Flashcards", "Next"
    - if answer was "no" or "kind of", give options: "Add Required Flashcards", "Add Overlapping Flashcards", "Next" 

#### Practice Goal

- *instruction:* "Do:"
- *can be used if:*
    - based on any goal, as long as all its `requiresLearning` candidates are above 0.9 recall % (if they're declarative) or `isAchieved` is true (if they're procedural) and `practiceNextAt` of attached progress object does not exist or is in the past

Somewhat similar to above, but different details.

1. Show `front` of the card and a "Done" button
2. When "Done" is pressed, replace instruction with "Did you succeed" with bottom buttons "Yes" and "No"
    - this informs/toggles the `isAchieved` prop of `ProceduralLearningProgressDoc`
3. After yes/no, ask "Do you want to practice this again" with buttons "No", "In a Year", "In a Month", "In a Week", "Tomorrow", "ASAP" and set `practiceNextAt` accordingly.
4. Give options what to do next
    - If practice was successful: "Add Follow-Up Goals", "Next"
    - If practice was not successful: "Add Required Goals", "Add Required Flashcards", "Next"

### Icon Button Bar

#### Open Add Goal Modal

Opens modal UI to add a `procedural` `FlashCard`.
Only front.
Uses reusable goal-edit feature. 


#### Open Add Flashcard Modal

Opens modal UI to add a `declarative` `FlashCard`.
Uses reusable flashcard-edit feature. 

#### Skip

Go to next screen.

#### Edit

Allows editing the currently open flashcard, smartly choosing the correct feature

#### Delete

Delete the currently open flashcard, go to next screen.


## Notes

Stick to `agents.md`!