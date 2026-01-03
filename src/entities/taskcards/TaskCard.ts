export type TaskCardDoc = {
  _id: string
  _rev?: string
  type: 'taskcard'
  front: string
  back: string
  createdAt: string
  updatedAt: string
}
