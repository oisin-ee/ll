## Contract-Driven Modules

Every module has an explicit contract file defining:
- Exported types (what callers see)
- Pre/postconditions (in docstrings)
- Invariants (what must always be true)
- Example usage (executable via test runner)

**Structure:**
```
src/modules/trip/
  index.ts          # Public interface — the ONLY thing other modules import
  trip.ts           # Implementation (internal)
  trip.contract.ts  # Type contract: exported types, invariants, pre/postconditions
  trip.test.ts      # Tests that verify the contract
```

**Rules:**
- Never import from another module's internals. Only import from its public interface.
- Before adding behavior to a module, update its contract first.
- Changing a module's public contract is a breaking change — bump the version and document it.
