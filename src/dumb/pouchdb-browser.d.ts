declare module 'pouchdb-browser' {
  export type AllDocsOptions = {
    include_docs?: boolean
    startkey?: string
    endkey?: string
  }

  export type AllDocsRow<T> = {
    doc?: T | null
  }

  export type AllDocsResponse<T> = {
    rows: AllDocsRow<T>[]
  }

  export type PutResponse = {
    rev: string
  }

  export default class PouchDB<T = unknown> {
    constructor(name: string)
    allDocs(options?: AllDocsOptions): Promise<AllDocsResponse<T>>
    put(doc: T): Promise<PutResponse>
    get<U = T>(id: string): Promise<U>
  }
}
