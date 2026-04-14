// .dependency-cruiser.cjs — enforces contract-driven module boundaries.
// Other modules may only import from a module's index.ts, never internals.
module.exports = {
  forbidden: [
    {
      name: 'no-module-internal-imports',
      severity: 'error',
      comment:
        'Modules may only be imported via their public interface (index.ts). ' +
        'Importing internal files breaks the contract.',
      from: { path: '^src/modules/([^/]+)/' },
      to: {
        path: '^src/modules/([^/]+)/(?!index\\.ts$).+',
        pathNot: '^src/modules/$1/',
      },
    },
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Orphan modules (no one imports them).',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|tsx)$',
          '\\.d\\.ts$',
          '(^|/)tsconfig\\.json$',
          '(^|/)(?:package|pnpm-workspace)\\.(json|ya?ml)$',
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
  },
}
