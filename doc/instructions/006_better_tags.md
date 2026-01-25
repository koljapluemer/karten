Let's improve the tag system.

- add an extra component to [the tag page](src/pages/tags-list) that shows a button "Copy Tags from Learning Content to Related Flashcards" that does exactly that: for all learning-content in the db, make sure that their child flashcards have the same tags
- convert the flashcard stats on the [stats page](src/pages/stats) as follows
    - simple count how many flashcards we have
    - then a sort of "stacked bar chart", but made from a single block without any axes or whatever, showing how many cards we have in each of the following categories (these should be exhaustive and non-overlapping, tell me if this isn't so):
        - unseen and blocked
        - unseen and not blocked
        - due but blocked
        - due and not blocked
        - seen but not due (block status irrelevant)
- extract this bar chart into a feature/
- use this feature on the tag page per tag to show the stats for flashcards with this tag
- for each tag on the tag page, allow setting its `priority` (we're currently calling it `importance` in [here](src/db/Tag.ts), change that to `priority`)
    - UI should be "icon button down", render number (NOT an input!), "icon button up"
    - the lowest setting is zero (disable down button), the highest is 10, upon which the number switches to a "disabled" icon (=this tag is so low prio it's deactivated) and up button is disabled


- then, adapt `src/pages/practice/PagePractice.vue` to the new paradigm:
    - keep the 4-card-cooldown and the randomized pref of unseen or seen
    - however, after deciding whether we want seen or unseen, do the following:
        - roll a random integer from 0 to 9 (inclusive)
            - build this in [here](src/dumb/random.ts)
        - choose a random tag whose priority is at most this number
        - try to pick an eligible card which has this tag
        - if and only if none found, fall back to existing flow of picking any eligible, ignoring tags

- STICK TO EVERY SINGLE INSTRUCTION  IN `agents.md` and `doc/how-to-design.md` AT ALL POINTS!!!!!!! BEfore building anything, summarize agents.md.