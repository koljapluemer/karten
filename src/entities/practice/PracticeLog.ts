export type PracticeLogDoc = {
  _id: string
  _rev?: string
  type: 'practice-log'
  cardId: string
  occurredAt: string
  day: string
}
