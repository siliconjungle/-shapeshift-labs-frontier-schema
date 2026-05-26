import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import {
  compileJsonSchemaValidator,
  createCloudEventEnvelope,
  jsonSchemaToDiffProfile,
  normalizeQuerySchema,
  querySchemaToDiffProfile,
  validateCloudEventEnvelope,
  validateJsonSchemaContract
} from '../dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const args = parseArgs(process.argv.slice(2));
const rounds = readPositiveInt(args.rounds, 3);
const outPath = args.out ? path.resolve(rootDir, args.out) : null;

const rowSchema = {
  type: 'object',
  required: ['id', 'score', 'active'],
  additionalProperties: false,
  properties: {
    id: { type: 'string', minLength: 1 },
    score: { type: 'number', minimum: 0 },
    active: { type: 'boolean' },
    owner: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        team: { type: 'string' }
      }
    }
  }
};
const quantizedRowSchema = {
  ...rowSchema,
  properties: {
    ...rowSchema.properties,
    score: { type: 'number', minimum: 0, multipleOf: 0.25 }
  }
};
const row = { id: 'row-1', score: 42, active: true, owner: { id: 'u1', team: 'core' } };
const compiled = compileJsonSchemaValidator(rowSchema);
const querySchema = {
  tables: [{
    path: '/rows',
    key: 'id',
    stableRowShape: true,
    numericFields: ['score'],
    textFields: ['owner.team'],
    selectorFields: ['active', 'owner.id']
  }]
};
const fixtures = [
  {
    name: 'JSON schema contract validate',
    iterations: 10000,
    fn() {
      validateJsonSchemaContract(row, rowSchema);
    }
  },
  {
    name: 'Compiled schema validator',
    iterations: 10000,
    fn() {
      compiled(row);
    }
  },
  {
    name: 'JSON schema to diff profile',
    iterations: 10000,
    fn() {
      jsonSchemaToDiffProfile(rowSchema, { path: ['rows'], arrayKey: 'id' });
    }
  },
  {
    name: 'JSON schema to quantized profile',
    iterations: 10000,
    fn() {
      jsonSchemaToDiffProfile(quantizedRowSchema, { path: ['rows'], arrayKey: 'id', quantization: { fixedStep: true } });
    }
  },
  {
    name: 'Query table schema normalize',
    iterations: 10000,
    fn() {
      normalizeQuerySchema(querySchema);
    }
  },
  {
    name: 'Query schema to diff profile',
    iterations: 10000,
    fn() {
      querySchemaToDiffProfile(querySchema);
    }
  },
  {
    name: 'Query schema to quantized profile',
    iterations: 10000,
    fn() {
      querySchemaToDiffProfile(querySchema, { quantization: [{ path: ['rows', '*', 'score'], step: 0.25 }] });
    }
  },
  {
    name: 'CloudEvent create and validate',
    iterations: 10000,
    fn() {
      const event = createCloudEventEnvelope({
        id: 'evt-1',
        source: '/frontier/schema',
        type: 'frontier.schema.bench',
        data: row,
        extensions: { frontierseq: 1 }
      });
      validateCloudEventEnvelope(event);
    }
  }
];

const rows = fixtures.map((fixture) => measureFixture(fixture, rounds));
const report = {
  package: '@shapeshift-labs/frontier-schema',
  version: readPackageVersion(),
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform + ' ' + process.arch,
  rounds,
  rows
};
if (outPath !== null) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
}

console.log('Frontier Schema package benchmark');
console.log('node=' + process.version + ' platform=' + process.platform + ' arch=' + process.arch + ' rounds=' + rounds);
console.log(padRight('fixture', 36) + padLeft('median', 12) + padLeft('p95', 12));
for (const row of rows) {
  console.log(padRight(row.fixture, 36) + padLeft(formatUs(row.medianUs), 12) + padLeft(formatUs(row.p95Us), 12));
}
if (outPath !== null) console.log('wrote ' + path.relative(rootDir, outPath));

function measureFixture(fixture, rounds) {
  const samples = [];
  for (let i = 0; i < rounds; i++) {
    fixture.fn();
    const start = performance.now();
    for (let j = 0; j < fixture.iterations; j++) fixture.fn();
    const elapsed = performance.now() - start;
    samples.push((elapsed * 1000) / fixture.iterations);
  }
  samples.sort((left, right) => left - right);
  return {
    fixture: fixture.name,
    medianUs: percentile(samples, 0.5),
    p95Us: percentile(samples, 0.95)
  };
}

function percentile(values, q) {
  if (values.length === 0) return 0;
  const index = Math.min(values.length - 1, Math.max(0, Math.ceil(values.length * q) - 1));
  return values[index];
}

function readPackageVersion() {
  return JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')).version;
}

function formatUs(value) {
  return value.toFixed(2) + ' us';
}

function padRight(value, width) {
  const text = String(value);
  return text.length >= width ? text.slice(0, width) : text + ' '.repeat(width - text.length);
}

function padLeft(value, width) {
  const text = String(value);
  return text.length >= width ? text : ' '.repeat(width - text.length) + text;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--rounds') out.rounds = argv[++i];
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node benchmarks/package-bench.mjs [--rounds 3] [--out benchmarks/results/package-bench.json]');
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
