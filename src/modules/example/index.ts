// Public interface — other modules may ONLY import from this file.
// Internal implementation lives in ./example.ts, contract in ./example.contract.ts.
export type { ExampleId, ExampleRecord } from './example.contract.js'
export { createExample, findExample } from './example.js'
