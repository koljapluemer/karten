import type {
  DeclarativeLearningProgressDoc,
  LearningProgressDoc,
  ProceduralLearningProgressDoc
} from './LearningProgress'
type ProgressIndexEntry = {
  declarative: DeclarativeLearningProgressDoc | null
  procedural: ProceduralLearningProgressDoc | null
}

export const buildProgressIndex = (
  progress: LearningProgressDoc[]
): Record<string, ProgressIndexEntry> => {
  const map: Record<string, ProgressIndexEntry> = {}
  progress.forEach((entry) => {
    const current = map[entry.cardId] ?? { declarative: null, procedural: null }
    if (entry.type === 'learning-progress-declarative') {
      map[entry.cardId] = { ...current, declarative: entry }
      return
    }
    map[entry.cardId] = { ...current, procedural: entry }
  })
  return map
}

export const hasDeclarativeReview = (entry: DeclarativeLearningProgressDoc | null): boolean => {
  if (!entry?.card) return false
  return (entry.card.reps ?? 0) > 0
}

export const isDeclarativeDue = (
  entry: DeclarativeLearningProgressDoc | null,
  nowMs = Date.now()
): boolean => {
  if (!hasDeclarativeReview(entry)) return false
  const dueMs = entry?.card ? new Date(entry.card.due).getTime() : Number.NaN
  if (Number.isNaN(dueMs)) return false
  return dueMs <= nowMs
}

export const isProceduralDue = (
  entry: ProceduralLearningProgressDoc | null,
  nowMs = Date.now()
): boolean => {
  if (!entry) return false
  const nextAt = entry.practiceNextAt ? Date.parse(entry.practiceNextAt) : undefined
  return !nextAt || nextAt <= nowMs
}

export const isProceduralMastered = (entry: ProceduralLearningProgressDoc | null): boolean => {
  return Boolean(entry?.isAchieved)
}

export const isDeclarativeReady = (
  entry: DeclarativeLearningProgressDoc | null,
  nowMs = Date.now()
): boolean => {
  return hasDeclarativeReview(entry) && !isDeclarativeDue(entry, nowMs)
}

export const formatDueDate = (value: string | number | Date | undefined): string => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export const getDeclarativeDueLabel = (
  entry: DeclarativeLearningProgressDoc | null
): string => {
  if (!entry?.card || (entry.card.reps ?? 0) === 0) return 'Due: New'
  const formatted = formatDueDate(entry.card.due)
  return formatted ? `Due: ${formatted}` : 'Due: New'
}
