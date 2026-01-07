import type {
  DeclarativeLearningProgressDoc,
  LearningProgressDoc,
  ProceduralLearningProgressDoc
} from './LearningProgress'
import { fsrs } from 'ts-fsrs'

const fsrsEngine = fsrs()

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

const hasDeclarativeReview = (entry: DeclarativeLearningProgressDoc | null): boolean => {
  if (!entry?.card) return false
  return (entry.card.reps ?? 0) > 0
}

export const getRecall = (
  entry: DeclarativeLearningProgressDoc | null,
  nowMs = Date.now()
): number => {
  if (!entry?.card) return 0
  const recall = fsrsEngine.get_retrievability(entry.card, nowMs, false)
  return Number.isFinite(recall) ? recall : 0
}

export const getRecallPercent = (
  entry: DeclarativeLearningProgressDoc | null,
  nowMs = Date.now()
): number | null => {
  if (!hasDeclarativeReview(entry)) return null
  return Math.round(getRecall(entry, nowMs) * 100)
}

export const isDeclarativeDue = (
  entry: DeclarativeLearningProgressDoc | null,
  nowMs = Date.now()
): boolean => {
  if (!hasDeclarativeReview(entry)) return false
  return getRecall(entry, nowMs) < 0.9
}

export const isProceduralDue = (
  entry: ProceduralLearningProgressDoc | null,
  nowMs = Date.now()
): boolean => {
  if (!entry) return false
  const nextAt = entry.practiceNextAt ? Date.parse(entry.practiceNextAt) : undefined
  return !nextAt || nextAt <= nowMs
}

export const isDeclarativeMastered = (
  entry: DeclarativeLearningProgressDoc | null,
  nowMs = Date.now()
): boolean => {
  if (!hasDeclarativeReview(entry)) return false
  return getRecall(entry, nowMs) >= 0.9
}

export const isProceduralMastered = (entry: ProceduralLearningProgressDoc | null): boolean => {
  return Boolean(entry?.isAchieved)
}
