import { describe, expect, it } from 'vitest'
import { createExample, findExample } from './index.js'

describe('example module contract', () => {
  it('creates and retrieves a record', () => {
    const record = createExample('hello')
    expect(findExample(record.id)).toEqual(record)
  })

  it('rejects empty names', () => {
    expect(() => createExample('')).toThrow()
  })

  it('rejects names longer than 128 characters', () => {
    expect(() => createExample('x'.repeat(129))).toThrow()
  })
})
