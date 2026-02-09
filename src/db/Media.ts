export type MediaType = 'image' | 'audio'

export interface Media {
  id: string
  filename: string
  mimeType: string
  mediaType: MediaType
  blob: Blob
  owner?: string
  realmId?: string
}
