import { fc, test } from '@fast-check/vitest'
import { describe, expect } from 'vitest'

// Property-based test example.
// fast-check generates hundreds of random inputs to find edge cases.
// Replace with properties relevant to your own code.

describe('reverse reverse is identity', () => {
  test.prop([fc.array(fc.integer())])('reverse twice returns original', (arr) => {
    expect([...arr].reverse().reverse()).toEqual(arr)
  })
})
