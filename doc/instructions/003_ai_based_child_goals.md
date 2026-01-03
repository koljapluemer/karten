Let's add a feature to add child learning goals to a learning goal in the [UI](src/pages/learning-goals) with an LLM.

For now, let's simply use OpenAI with an hardcoded cheap but reasonably good model.
Add an icon button for this generation.

If OpenAI key is not set, instantly redirect to a settings page (you need to make it) where we can set the llm key and save it to localstorage (yes, just plain localstorage).

If key is set, open a modal.
First, in a textarea, let the user edit the prompt.
It should be prefilled with something reasonable (goal title, content if exists, bullet list of direct child goals) but be completely editable.
Allow also to set how many child goal (`requiresLearning` entries) should be generated.

Have a button "Generate" switching into a loading state when model starts.
Make sure the model returns STRUCTURED OUTPUT!!!! (yes, ACTUAL, UNIRONIC structured output).

Let the user decide which of the returned goals to keep and attach (simple daisy table with checkmarks, all selected by default). Buttons: "Discard All", "Accept", "Accept and Generate Again" (which redirects to first modal screen again).

Make sure to ACTUALLY, UNIRONICALLY, COMPLETELY STICK TO [THE GUIDELINES](agents.md)