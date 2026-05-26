# Frontier Schema

JSON Schema validation, Frontier profile generation, CloudEvent envelopes, and table-schema helpers.

This package is the authoring and conversion layer for schema-shaped Frontier workflows. It validates lightweight JSON Schema contracts, turns object and record-array schemas into `@shapeshift-labs/frontier-engine` diff profiles, exposes CloudEvent JSON envelopes, and re-exports query/table schema normalization from `@shapeshift-labs/frontier-query`.

- npm: [`@shapeshift-labs/frontier-schema`](https://www.npmjs.com/package/@shapeshift-labs/frontier-schema)
- source: [`siliconjungle/-shapeshift-labs-frontier-schema`](https://github.com/siliconjungle/-shapeshift-labs-frontier-schema)
- license: MIT

## Related Packages

The published Frontier package family is generated from one shared package catalog so READMEs stay in sync across packages:

- [`@shapeshift-labs/frontier`](https://www.npmjs.com/package/@shapeshift-labs/frontier): Core JSON diff/apply, compact patch tuples, JSON Pointer, equality, clone, validation, Unicode helpers.
- [`@shapeshift-labs/frontier-query`](https://www.npmjs.com/package/@shapeshift-labs/frontier-query): Shared query-key, selector path, condition, entity identity, and table-shape primitives.
- [`@shapeshift-labs/frontier-codec`](https://www.npmjs.com/package/@shapeshift-labs/frontier-codec): Patch serialization, binary frames, canonical JSON, and patch-history codecs.
- [`@shapeshift-labs/frontier-engine`](https://www.npmjs.com/package/@shapeshift-labs/frontier-engine): Stateful planned diff engine, adaptive profiles, schema plans, and engine-level history helpers.
- [`@shapeshift-labs/frontier-state`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state): Patch-routed app-state subscriptions, owned commits, maintained views, and path mapping.
- [`@shapeshift-labs/frontier-state-cache`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache): Normalized query-result cache with entity/query watchers, persistence, change logs, optimistic layers, and mutation bridge.
- [`@shapeshift-labs/frontier-state-cache-idb`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-idb): IndexedDB persistence adapter for Frontier state-cache snapshots.
- [`@shapeshift-labs/frontier-state-cache-file`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-file): Structured file persistence adapter for Frontier state-cache snapshots and change logs.
- [`@shapeshift-labs/frontier-state-cache-sql`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-sql): SQL persistence adapter for Frontier state-cache snapshots and change logs.
- [`@shapeshift-labs/frontier-event-log`](https://www.npmjs.com/package/@shapeshift-labs/frontier-event-log): Bounded event logs, replay cursors, consumer acknowledgements, keyed compaction, checkpoints, and Frontier patch event records.
- [`@shapeshift-labs/frontier-logging`](https://www.npmjs.com/package/@shapeshift-labs/frontier-logging): Opt-in structured logging, browser telemetry, file sinks, exporters, benchmark traces, and Frontier patch/update summaries.
- [`@shapeshift-labs/frontier-mutation`](https://www.npmjs.com/package/@shapeshift-labs/frontier-mutation): Explicit mutation and selector plans compiled to Frontier patches or CRDT operations.
- [`@shapeshift-labs/frontier-crdt`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt): Native CRDT documents, update tooling, awareness, branches, conflict introspection, version frames, and undo.
- [`@shapeshift-labs/frontier-crdt-sync`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt-sync): CRDT sync endpoints, repo/storage/provider contracts, document URLs, local networks, model checking, forensics, and text binding contracts.
- [`@shapeshift-labs/frontier-crdt-websocket`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt-websocket): WebSocket client/server transports for Frontier CRDT sync providers.
- [`@shapeshift-labs/frontier-react`](https://www.npmjs.com/package/@shapeshift-labs/frontier-react): React external-store hooks and adapters for Frontier state, cache, and CRDT surfaces.
- [`@shapeshift-labs/frontier-richtext`](https://www.npmjs.com/package/@shapeshift-labs/frontier-richtext): Rich text Delta normalization/application, marks, embeds, ranges, and cursor/selection transforms for local editor integrations.

Package source repositories:

- [`siliconjungle/-shapeshift-labs-frontier`](https://github.com/siliconjungle/-shapeshift-labs-frontier)
- [`siliconjungle/-shapeshift-labs-frontier-query`](https://github.com/siliconjungle/-shapeshift-labs-frontier-query)
- [`siliconjungle/-shapeshift-labs-frontier-codec`](https://github.com/siliconjungle/-shapeshift-labs-frontier-codec)
- [`siliconjungle/-shapeshift-labs-frontier-engine`](https://github.com/siliconjungle/-shapeshift-labs-frontier-engine)
- [`siliconjungle/-shapeshift-labs-frontier-state`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-idb`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-idb)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-file`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-file)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-sql`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-sql)
- [`siliconjungle/-shapeshift-labs-frontier-schema`](https://github.com/siliconjungle/-shapeshift-labs-frontier-schema)
- [`siliconjungle/-shapeshift-labs-frontier-event-log`](https://github.com/siliconjungle/-shapeshift-labs-frontier-event-log)
- [`siliconjungle/-shapeshift-labs-frontier-logging`](https://github.com/siliconjungle/-shapeshift-labs-frontier-logging)
- [`siliconjungle/-shapeshift-labs-frontier-mutation`](https://github.com/siliconjungle/-shapeshift-labs-frontier-mutation)
- [`siliconjungle/-shapeshift-labs-frontier-crdt`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt)
- [`siliconjungle/-shapeshift-labs-frontier-crdt-sync`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt-sync)
- [`siliconjungle/-shapeshift-labs-frontier-crdt-websocket`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt-websocket)
- [`siliconjungle/-shapeshift-labs-frontier-react`](https://github.com/siliconjungle/-shapeshift-labs-frontier-react)
- [`siliconjungle/-shapeshift-labs-frontier-richtext`](https://github.com/siliconjungle/-shapeshift-labs-frontier-richtext)

## Planned Realtime and Game Packages

The following repositories are reserved placeholders for future realtime and game-facing Frontier packages. They are not production-ready packages and should not be treated as benchmarked or stable npm surfaces yet.

- [`@shapeshift-labs/frontier-realtime`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime): planned realtime command, tick, snapshot, prediction, reconciliation, interpolation, and rollback primitives.
- [`@shapeshift-labs/frontier-realtime-server`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime-server): planned authoritative server runtime for rooms, ticks, validation, lag-compensation history, and replication policy.
- [`@shapeshift-labs/frontier-realtime-websocket`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime-websocket): planned WebSocket transport for realtime commands and snapshots.
- [`@shapeshift-labs/frontier-game`](https://github.com/siliconjungle/-shapeshift-labs-frontier-game): planned game-facing entity, component, player, room, ownership, and replication vocabulary above realtime.

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
