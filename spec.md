This is a learning app, copied over from another project.
See `README.md` and `agents.md` for general contexts. 
EVERY LINE AND EVERY INSTRUCTION IN `agents.md` MUST BE ADHERED TO AT ALL TIMES!!!!!!!!!!!!

This template contains many useful parts, but we want to use it to build something different.
Feel free to delete leftovers not needed by this spec (yes, DELETE, not "keep around for legacy purposes").

## Core Idea

This is an app for flashcard-based learning app, with LLM support

## Entities

All entities are stored as `PouchDB` documents (for now, simple in-browser local pouch, no sync, no accounts)

### Card

Each card has an id, a cardType, a front, and optionally a back, as well as parents[] which contains ids of other cards.
Since a card has `parents`, we can also compute its children, although this is not explicitly stored (would be redundant).

For now, there will be the following types of cards. Data-wise, they are largely the same, the differences are *mostly* semantic.

#### FlashCard

A classic spaced-repetition guided flashcard with a front and a back.

An example may be:
- `front`: "The capital of France is ___"
- `back`: "Paris"

#### TaskCard

Kinda similar to flashcard, but it's not guided by spaced repetition.
It usually represents a sort of test whether something is understood, or a sort of learning goal.
They are often just done once, albeit the user may choose that they want to repeat them.

An example:
- `front`: "Hold a 1-minute adhoc presentation about the fall of the Roman empire"

#### ContentCard

This "card" is not used directly for learning, but rather contains some kind of learning content the user wants to practice;
it may be the name of a textbook or a copy-pasted text excerpt.
It's used to generate flashcards or tasks *from it*.

### Learning Progress

An object representing the learning progress (or other similar data) with a one-to-one relationship to flashcards.
Kept as a separate concept so at a later point we can share card decks not polluted by personal progress  

## Pages

### Stats

Minimal user stats for now, see the existing logic.
Keep one bar chart + streak for how many cards seen per day.
Add some quick descriptive stats, such as cards overall, how many of each card type, how much due & so on.

### Practice

The main page. Basically everything happens here.
Make sure to avoid god components, as described in `agents.md`.
Instead, make `pages/practice/PracticePage.vue` a component pulling in other components from the same folder (mostly).

*I will right now only describe some of the screens which can happen in practice, it will be more later, keep that in mind when architecting.*
*That's also why we're kind of ignoring some functionality/entity stuff from above for now*.

Here is the screens we need:

#### Screens

##### Choose

A screen where the user chooses what they want to do next, e.g.
- Practice Existing
- Add Flashcard

##### Flashcard Practice

Takes a `Card` of type `FlashCard`. 

Shows the front, and a Reveal button below.
Once reveal button is clicked, show the front, the back, and a widget "Did you Remember correctly?" with buttons "No" "Kind Of" "Yes" "Easily".
Upsert a learning progress object using [ebisu](doc/EBISU_README.md) (yes, ebisu, as described in this document, not some hallucinated sm2 garbage or whatever)

*Render front+back as markdown*

##### Flashcard Add

A SIMPLE form to create a new flashcard.
Front + Back.

For each, use milkdown [as described here](doc/MILKDOWN_VUE.md) to allow the user to edit front and back as markdown. 

#### Flow

Implement extensible state machine(s) for representing this (it will get more complex in the future)

1. Check if we have unseen flashcards or due flashcards (% of recall below 0.9) in storage
  - if not, immediately go *Adding Flashcards Flow*
  - if yes, go to *Practice or Add*

##### Practice or Add

See `Choose`.
If `Practice Existing`, go to `Practice Lesson`

##### Adding Flashcards Flow

Have 3 screens of `Flashcard Add`, then go back to `Practice or Add`

##### Practice Lesson

Choose a random nr from 3-15.
Pick as many random due or unseen flashcards (if we have less than the target, also fine)
Go through them with `Flashcard Practice`.
When done, go back to `Practice or Add`.