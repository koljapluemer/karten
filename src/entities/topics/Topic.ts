export type TopicDoc = {
  _id: string
  _rev?: string
  type: 'topic'
  name: string[]
  materials: string[]
  levels: string[][]
  createdAt: string
  updatedAt: string
}
