import type { Tag } from '@/db/Tag'

export const UNTAGGED_TAG_ID = 'tag:untagged'

export const createUntaggedTag = (priority: number): Tag => ({
  id: UNTAGGED_TAG_ID,
  content: 'Untagged',
  priority
})

export const isUntaggedTagId = (id: string): boolean =>
  id === UNTAGGED_TAG_ID
