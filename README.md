# Frontier Schema

Reserved package name for a future optional Frontier schema helper package.

This package is not ready for production use. It exists so the package and repository names are reserved while schema planning, validation, shape inference, and schema-aware diff/equality boundaries are finalized.

- npm: [`@shapeshift-labs/frontier-schema`](https://www.npmjs.com/package/@shapeshift-labs/frontier-schema)
- source: [`siliconjungle/-shapeshift-labs-frontier-schema`](https://github.com/siliconjungle/-shapeshift-labs-frontier-schema)
- core package: [`@shapeshift-labs/frontier`](https://www.npmjs.com/package/@shapeshift-labs/frontier)
- license: MIT

## Intended Scope

When this package graduates from placeholder status, it is expected to contain:

- schema definitions for Frontier JSON objects, tuples, records, arrays, and scalar maps;
- schema inference and shape profiling helpers;
- schema-driven diff, equality, and patch planning utilities;
- validation and normalization helpers for reusable application schemas;
- TypeScript-friendly schema types and generated helper plans.

It should sit above `@shapeshift-labs/frontier` and feed planning hints into diff/apply/state layers without pulling CRDT, sync, logging, rich text, or storage concepts into the core package.

## Current Status

Use [`@shapeshift-labs/frontier`](https://www.npmjs.com/package/@shapeshift-labs/frontier) for the stable JSON diff/apply core.

The schema package is reserved only. No runtime API is exported yet.

## Package Family

Published or active packages:

- [`@shapeshift-labs/frontier`](https://www.npmjs.com/package/@shapeshift-labs/frontier)
- [`@shapeshift-labs/frontier-codec`](https://www.npmjs.com/package/@shapeshift-labs/frontier-codec)
- [`@shapeshift-labs/frontier-mutation`](https://www.npmjs.com/package/@shapeshift-labs/frontier-mutation)

Reserved future packages:

- `@shapeshift-labs/frontier-engine`
- `@shapeshift-labs/frontier-state`
- `@shapeshift-labs/frontier-crdt`
- `@shapeshift-labs/frontier-crdt-sync`
- `@shapeshift-labs/frontier-richtext`
- `@shapeshift-labs/frontier-logging`
- `@shapeshift-labs/frontier-state-cache`
- `@shapeshift-labs/frontier-event-log`

## License

MIT. See [LICENSE](./LICENSE).
