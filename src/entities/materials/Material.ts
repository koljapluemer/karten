export type MaterialDoc = {
  _id: string
  _rev?: string
  type: 'material'
  content: string
  format?: 'text' | 'markdown'
  createdAt: string
  updatedAt: string
}
