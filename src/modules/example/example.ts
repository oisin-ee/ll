import type { ExampleId, ExampleRecord } from './example.contract.js'

const store = new Map<ExampleId, ExampleRecord>()

/**
 * Create a new example record.
 * @precondition name.trim().length in [1, 128]
 * @postcondition returned record is retrievable via findExample(result.id)
 */
export function createExample(name: string): ExampleRecord {
  const trimmed = name.trim()
  if (trimmed.length < 1 || trimmed.length > 128) {
    throw new Error('name must be 1..128 characters')
  }
  const id = crypto.randomUUID() as ExampleId
  const record: ExampleRecord = { id, name: trimmed, createdAt: new Date() }
  store.set(id, record)
  return record
}

/** Find an example by id. Returns null if not found. */
export function findExample(id: ExampleId): ExampleRecord | null {
  return store.get(id) ?? null
}
