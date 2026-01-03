export type LearningGoalDoc = {
  _id: string
  _rev?: string
  type: 'learning-goal'
  title: string
  content?: string
  requiresLearning: string[]
  flashcards: string[]
  tasks: string[]
  createdAt: string
  updatedAt: string
}
