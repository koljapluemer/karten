import type { Card } from 'ts-fsrs'

export interface LearningProgressDoc extends Card {
    _id: string
    _rev?: string
    docType: 'P'
}