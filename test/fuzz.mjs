import assert from 'node:assert';
import {
  createCloudEventEnvelope,
  validateCloudEventEnvelope,
  validateJsonSchemaContract
} from '../dist/index.js';

const args = parseArgs(process.argv.slice(2));
const cases = readPositiveInt(args.cases, 500);
const seed = readPositiveInt(args.seed, 0x5c1eaa);
const rng = mulberry32(seed);

for (let id = 0; id < cases; id++) runCase(id, mulberry32((rng() * 0xffffffff) >>> 0));

console.log('frontier-schema fuzz passed cases=' + cases + ' seed=' + seed);

function runCase(caseId, rng) {
  const fieldCount = 1 + randomInt(rng, 5);
  const required = [];
  const properties = {};
  const value = {};
  const expectedIssues = [];

  for (let i = 0; i < fieldCount; i++) {
    const key = 'f' + i;
    const type = ['string', 'number', 'boolean'][randomInt(rng, 3)];
    properties[key] = { type };
    if (randomInt(rng, 2) === 0) required.push(key);
    const mode = randomInt(rng, 4);
    if (mode === 0) {
      if (required.includes(key)) expectedIssues.push(key);
      continue;
    }
    value[key] = mode === 1 ? valueForType(type, i) : valueForWrongType(type, i);
    if (mode !== 1) expectedIssues.push(key);
  }

  if (randomInt(rng, 4) === 0) {
    value.extra = true;
    expectedIssues.push('extra');
  }

  const schema = {
    type: 'object',
    required,
    additionalProperties: false,
    properties
  };
  const result = validateJsonSchemaContract(value, schema, { maxIssues: 100 });
  assert.strictEqual(result.valid, expectedIssues.length === 0);
  if (!result.valid) assert.ok(result.issues.length > 0);

  const event = createCloudEventEnvelope({
    id: 'case-' + caseId,
    source: '/schema/fuzz',
    type: 'frontier.schema.case',
    data: value
  });
  assert.strictEqual(validateCloudEventEnvelope(event).valid, true);
}

function valueForType(type, i) {
  if (type === 'string') return 'v' + i;
  if (type === 'number') return i;
  return (i & 1) === 0;
}

function valueForWrongType(type, i) {
  if (type === 'string') return i;
  if (type === 'number') return 'v' + i;
  return 'not-boolean';
}

function randomInt(rng, max) {
  return max <= 0 ? 0 : Math.floor(rng() * max);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--cases') out.cases = argv[++i];
    else if (arg === '--seed') out.seed = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node test/fuzz.mjs [--cases 500] [--seed 6037162]');
      process.exit(0);
    } else {
      throw new Error('unknown argument: ' + arg);
    }
  }
  return out;
}

function readPositiveInt(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function mulberry32(seedValue) {
  let state = seedValue >>> 0;
  return function next() {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
