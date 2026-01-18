import { db } from '@/db/db'
import type { Prompt } from '@/db/Prompt'

const buildPromptId = (): string => `prompt:${crypto.randomUUID()}`

export const loadPrompts = async (): Promise<Prompt[]> => {
  return await db.prompts.toArray()
}

export const createPrompt = async (
  name: string,
  content: string
): Promise<Prompt> => {
  const id = buildPromptId()

  const prompt: Prompt = {
    id,
    name,
    content
  }

  await db.prompts.add(prompt)
  return prompt
}

export const updatePrompt = async (
  id: string,
  name: string,
  content: string
): Promise<void> => {
  await db.prompts.update(id, { name, content })
}

export const deletePrompt = async (id: string): Promise<void> => {
  await db.prompts.delete(id)
}

export const getPromptById = async (id: string): Promise<Prompt | undefined> => {
  return await db.prompts.get(id)
}
