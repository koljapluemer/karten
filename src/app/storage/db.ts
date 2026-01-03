import PouchDB from 'pouchdb-browser'
import type { DbDocument } from './dbTypes'

export const db = new PouchDB<DbDocument>('karten')
