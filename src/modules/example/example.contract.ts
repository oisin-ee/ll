// Contract: types, invariants, pre/post-conditions.
// This file is the source of truth for what this module promises.

/** Branded ID type — prevents mixing with other string IDs. */
export type ExampleId = string & { readonly __brand: 'ExampleId' }

/** An example record as exposed to consumers. */
export interface ExampleRecord {
  readonly id: ExampleId
  readonly name: string
  readonly createdAt: Date
}

/**
 * Invariants:
 * - id is non-empty and unique within the store
 * - name is 1..128 characters after trimming
 * - createdAt is not in the future
 */
