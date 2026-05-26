# Frontier Schema

JSON Schema validation, Frontier profile generation, CloudEvent envelopes, and table-schema helpers.

This package is the authoring and conversion layer for schema-shaped Frontier workflows. It validates lightweight JSON Schema contracts, turns object and record-array schemas into `@shapeshift-labs/frontier-engine` diff profiles, exposes CloudEvent JSON envelopes, and re-exports query/table schema normalization from `@shapeshift-labs/frontier-query`.

- npm: [`@shapeshift-labs/frontier-schema`](https://www.npmjs.com/package/@shapeshift-labs/frontier-schema)
- source: [`siliconjungle/-shapeshift-labs-frontier-schema`](https://github.com/siliconjungle/-shapeshift-labs-frontier-schema)
- license: MIT

## Related Packages

- [`@shapeshift-labs/frontier-state-cache-idb`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-idb): IndexedDB persistence adapter for Frontier state-cache snapshots.
- [`@shapeshift-labs/frontier-state-cache-file`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-file): Structured file persistence adapter for Frontier state-cache snapshots and change logs.
- [`@shapeshift-labs/frontier-state-cache-sql`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-sql): SQL persistence adapter for Frontier state-cache snapshots and change logs.
- [`@shapeshift-labs/frontier`](https://www.npmjs.com/package/@shapeshift-labs/frontier): core JSON diff/apply primitives.
- [`@shapeshift-labs/frontier-query`](https://www.npmjs.com/package/@shapeshift-labs/frontier-query): shared query-key, selector path, condition, identity, and table-schema primitives.
- [`@shapeshift-labs/frontier-codec`](https://www.npmjs.com/package/@shapeshift-labs/frontier-codec): patch serialization, binary frames, canonical JSON, and patch-history codecs.
- [`@shapeshift-labs/frontier-engine`](https://www.npmjs.com/package/@shapeshift-labs/frontier-engine): planned diff engine that executes profiles produced by this package.
- [`@shapeshift-labs/frontier-state`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state): patch-routed app-state subscriptions and maintained views.
- [`@shapeshift-labs/frontier-state-cache`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache): normalized query-result cache.
- [`@shapeshift-labs/frontier-mutation`](https://www.npmjs.com/package/@shapeshift-labs/frontier-mutation): explicit mutation and selector plans.

Package source repositories:

- [`siliconjungle/-shapeshift-labs-frontier-state-cache-idb`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-idb)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-file`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-file)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-sql`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-sql)
- [`siliconjungle/-shapeshift-labs-frontier`](https://github.com/siliconjungle/-shapeshift-labs-frontier)
- [`siliconjungle/-shapeshift-labs-frontier-query`](https://github.com/siliconjungle/-shapeshift-labs-frontier-query)
- [`siliconjungle/-shapeshift-labs-frontier-codec`](https://github.com/siliconjungle/-shapeshift-labs-frontier-codec)
- [`siliconjungle/-shapeshift-labs-frontier-engine`](https://github.com/siliconjungle/-shapeshift-labs-frontier-engine)
- [`siliconjungle/-shapeshift-labs-frontier-state`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache)
- [`siliconjungle/-shapeshift-labs-frontier-mutation`](https://github.com/siliconjungle/-shapeshift-labs-frontier-mutation)

## Install

```sh
npm install @shapeshift-labs/frontier @shapeshift-labs/frontier-query @shapeshift-labs/frontier-engine @shapeshift-labs/frontier-schema
```

## Usage

```ts
import { applyPatchImmutable } from '@shapeshift-labs/frontier';
import { createDiffEngine } from '@shapeshift-labs/frontier-engine';
import {
  createCloudEventEnvelope,
  jsonSchemaToDiffProfile,
  validateJsonSchemaContract
} from '@shapeshift-labs/frontier-schema';

const rowSchema = {
  type: 'object',
  required: ['id', 'done'],
  properties: {
    id: { type: 'string' },
    done: { type: 'boolean' },
    title: { type: 'string' }
  }
} as const;

const result = validateJsonSchemaContract(
  { id: 't1', done: false, title: 'Draft' },
  rowSchema
);

const engine = createDiffEngine({
  profile: jsonSchemaToDiffProfile(rowSchema)
});

const before = { id: 't1', done: false, title: 'Draft' };
const after = { id: 't1', done: true, title: 'Draft' };
const patch = engine.diff(before, after);
const next = applyPatchImmutable(before, patch);

const event = createCloudEventEnvelope({
  id: 'evt-1',
  source: '/todos',
  type: 'frontier.patch',
  data: { patch }
});

console.log(result.valid, next, event.type);
```

## API

```ts
import {
  assertCloudEventEnvelope,
  assertJsonSchemaContract,
  assertJsonSchemaDefinition,
  compileJsonSchemaValidator,
  createCloudEventEnvelope,
  jsonSchemaToDiffProfile,
  jsonSchemaToFrontierSchema,
  normalizeQuerySchema,
  validateCloudEventEnvelope,
  validateJsonSchemaContract,
  validateJsonSchemaDefinition,
  type JsonSchemaContract
} from '@shapeshift-labs/frontier-schema';
```

### JSON Schema

- `validateJsonSchemaDefinition(schema, options?)` validates the supported JSON Schema subset.
- `assertJsonSchemaDefinition(schema, options?)` throws on invalid schema definitions.
- `validateJsonSchemaContract(value, schema, options?)` validates a JSON value against a schema contract.
- `assertJsonSchemaContract(value, schema, options?)` throws on contract failures.
- `compileJsonSchemaValidator(schema, options?)` clones and reuses schema validation options.

Supported keywords: `type`, `properties`, `required`, `items`, `additionalProperties`, `enum`, `const`, `minItems`, `maxItems`, `minLength`, `maxLength`, `minimum`, `maximum`, `multipleOf`, and `pattern`.

### Frontier Profiles

- `jsonSchemaToFrontierSchema(schema, options?)` converts object and array-of-object JSON Schema contracts into Frontier engine schema hints.
- `jsonSchemaToDiffProfile(schema, options?)` returns a `DiffProfile` for `createDiffEngine({ profile })`.

Pass `quantization: true` or `{ fixedStep: true }` to `jsonSchemaToDiffProfile()` to turn numeric `multipleOf` fields into optional engine quantization rules. This is profile metadata for deterministic/replay workloads; generic JSON validation and core diff semantics remain exact.

Schema package output is declarative. Runtime diff planning and cache execution stay in `@shapeshift-labs/frontier-engine`.

### Query/Table Schemas

- `normalizeQuerySchema(schema, label?)` normalizes table/entity shape hints from `@shapeshift-labs/frontier-query`.

This keeps table/entity schema authoring visible from `frontier-schema`, while query-key hashing, condition matching, and selector vocabulary stay owned by `frontier-query`.

### CloudEvents

- `createCloudEventEnvelope(input)` creates a JSON CloudEvent 1.0 envelope.
- `validateCloudEventEnvelope(value)` validates a CloudEvent envelope.
- `assertCloudEventEnvelope(value)` throws on invalid CloudEvent envelopes.

## Subpath Imports

```ts
import { validateJsonSchemaContract } from '@shapeshift-labs/frontier-schema/json-schema';
import { createCloudEventEnvelope } from '@shapeshift-labs/frontier-schema/event';
import { normalizeQuerySchema } from '@shapeshift-labs/frontier-schema/query';
import type { JsonSchemaContract } from '@shapeshift-labs/frontier-schema/types';
```

## Package Scope

This package owns schema authoring and conversion:

- lightweight JSON Schema validation,
- JSON Schema to Frontier engine schema/profile conversion,
- query/table schema normalization re-exports,
- CloudEvent JSON envelope helpers.

It does not own:

- stateless diff/apply primitives,
- executing schema/profile plans,
- query-result cache storage,
- mutation planning,
- patch/history byte formats,
- CRDT actors, heads, branches, sync, awareness, or rich text.

## TypeScript

The package ships ESM JavaScript plus `.d.ts` declarations for the root export and public subpaths. The package-local TypeScript source lives in `src/` and compiles directly to `dist/`.

## Validation

```sh
npm test
npm run fuzz
npm run bench
npm run pack:dry
```

## Benchmarks

Run the package-local benchmark:

```sh
npm run bench
```

Latest local package benchmark on Node v26.1.0, darwin arm64, 15 rounds:

| Fixture | Median | p95 |
| --- | ---: | ---: |
| JSON schema contract validate | 0.99 us | 1.21 us |
| Compiled schema validator | 0.95 us | 1.10 us |
| JSON schema to diff profile | 6.89 us | 7.11 us |
| JSON schema to quantized profile | 7.85 us | 8.29 us |
| Query table schema normalize | 0.36 us | 0.63 us |
| Query schema to diff profile | 0.67 us | 0.89 us |
| Query schema to quantized profile | 0.71 us | 0.87 us |
| CloudEvent create and validate | 0.99 us | 1.26 us |

These are Frontier-only package measurements, not competitor comparisons.

## License

MIT. See [LICENSE](./LICENSE).
