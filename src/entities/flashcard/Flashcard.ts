export type FlashCardDoc = {
  _id: string
  _rev?: string
  docType: 'F'
  instruction: string
  front: string
  back: string
  blockedBy: string[]
}
