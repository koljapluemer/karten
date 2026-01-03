import { db } from './db'

type AllDocsRow<T> = { doc?: T | null }

export const loadDocsByPrefix = async <T extends { _id: string }>(prefix: string): Promise<T[]> => {
  const result = await db.allDocs({
    include_docs: true,
    startkey: prefix,
    endkey: `${prefix}\ufff0`
  })

  const rows = result.rows as AllDocsRow<T>[]
  return rows.flatMap((row) => (row.doc ? [row.doc] : []))
}
