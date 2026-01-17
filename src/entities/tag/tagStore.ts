import { db } from '@/db/db'
import type { Tag } from '@/db/Tag'

const buildTagId = (): string => `tag:${crypto.randomUUID()}`

export const loadTags = async (): Promise<Tag[]> => {
  return await db.tags.toArray()
}

export const createTag = async (
  content: string,
  importance: number = 5
): Promise<Tag> => {
  const id = buildTagId()

  const tag: Tag = {
    id,
    content,
    importance
  }

  await db.tags.add(tag)
  return tag
}

export const getOrCreateTag = async (content: string): Promise<Tag> => {
  const existing = await db.tags.where('content').equals(content).first()
  if (existing) {
    return existing
  }
  return await createTag(content)
}

export const deleteTag = async (id: string): Promise<void> => {
  await db.tags.delete(id)
}

export const getTagById = async (id: string): Promise<Tag | undefined> => {
  return await db.tags.get(id)
}
