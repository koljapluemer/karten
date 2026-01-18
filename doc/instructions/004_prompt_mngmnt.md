The user can do some AI generation in this app, currently [here](src/pages/practice/PreviousKnowledgeGeneratorModal.vue) and [here](src/meta/learning-content-manage/AIFlashcardGeneratorModal.vue).

Let's allow the user to do some prompt management and to reuse prompt.

Make `prompt` an entity (c.f. `agents.md`) and allow managing it, for now, on a single page, `page-prompt-manage`.
A prompt, next to the dexie boilerplate, should have the following props

- `name`, `str`
- `content`, `str` usually managed via a textarea.

On the manage page, show a simple daisy table with the prompt names, and allow adding new ones via a modal triggered by a button, and editing prompts via a modal triggered by a per-row icon button. There should also be an icon button for deletion.

The prop `content` is simply a string, but we allow a mustache-like syntax to use certain magic keywords:
- `{{flashcard}}` (a rendered flashcard, front, then a line with "---", then back)
- `{{front}}`
- `{{back}}`
- `{{learningcontent}}`

The semiotics of these will become clear in a second.

Based on these, in the AI generation flows, instead of simply letting the user adapt the prompt in a textarea, give the user a dropdown to select which saved prompt they want to use.
Display this prompt, replacing the magic values with the correct context within a `<mark>` tag.
Save the last selected prompt in localstorage so it can be picked as default value the next time an AI gen is started.
Below the prompt text, there should be a button "Adapt" that switches the prompt to a textarea, now editable.
These edits are *not* saved back to the prompt, they are just for this run.

For ease of use, simplify the AI generation to not use a fixed instruction mode.
If an AI prompt (or the prompt management page) is opened and there are currently no prompts, generate some sensibly named default prompts
based on the hardcoded prompts we're currently using.

Stick to `doc/how-to-design.md` and `agents.md`. Do NOT, under ANY circumstance, violate the architecture rules of `agents.md`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!