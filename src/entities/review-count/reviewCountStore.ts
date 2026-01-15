import { format } from 'date-fns'
import { db } from '@/app/storage/db'
import type { ReviewCount } from '@/app/storage/db'
import type { ReviewCountDoc } from './ReviewCount'

const buildReviewCountId = (dateKey: string): string => `review-count:${dateKey}`

export const loadReviewCounts = async (): Promise<ReviewCountDoc[]> => {
  return await db.reviewCounts.toArray()
}

export const incrementReviewCountForToday = async (): Promise<ReviewCountDoc> => {
  const dateKey = format(new Date(), 'yyyy-MM-dd')
  const id = buildReviewCountId(dateKey)
  const existing = await db.reviewCounts.get(id)

  const next: ReviewCount = {
    id,
    date: dateKey,
    count: (existing?.count ?? 0) + 1
  }

  await db.reviewCounts.put(next)
  return next
}
