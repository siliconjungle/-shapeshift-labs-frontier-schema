import assert from 'node:assert';
import { createDiffEngine } from '@shapeshift-labs/frontier-engine';
import {
  assertCloudEventEnvelope,
  assertJsonSchemaContract,
  assertJsonSchemaDefinition,
  compileJsonSchemaValidator,
  createCloudEventEnvelope,
  jsonSchemaToDiffProfile,
  jsonSchemaToFrontierSchema,
  normalizeQuerySchema,
  querySchemaToDiffProfile,
  querySchemaToFrontierSchema,
  validateCloudEventEnvelope,
  validateJsonSchemaContract,
  validateJsonSchemaDefinition
} from '../dist/index.js';
import {
  validateJsonSchemaDefinition as validateJsonSchemaDefinitionSubpath
} from '../dist/json-schema.js';
import {
  createCloudEventEnvelope as createCloudEventEnvelopeSubpath
} from '../dist/event.js';
import {
  normalizeQuerySchema as normalizeQuerySchemaSubpath,
  querySchemaToDiffProfile as querySchemaToDiffProfileSubpath
} from '../dist/query.js';

{
  const schema = {
    type: 'object',
    required: ['id', 'score'],
    additionalProperties: false,
    properties: {
      id: { type: 'string', minLength: 1 },
      score: { type: 'number', minimum: 0 },
      tag: { enum: ['a', 'b'] }
    }
  };

  assert.strictEqual(validateJsonSchemaContract({ id: 'x', score: 1, tag: 'a' }, schema).valid, true);
  const missing = validateJsonSchemaContract({ id: 'x' }, schema);
  assert.strictEqual(missing.valid, false);
  assert.strictEqual(missing.issues[0].keyword, 'required');
  const extra = validateJsonSchemaContract({ id: 'x', score: 1, extra: true }, schema);
  assert.strictEqual(extra.valid, false);
  assert.strictEqual(extra.issues[0].keyword, 'additionalProperties');
  assert.throws(() => assertJsonSchemaContract({ id: '', score: -1 }, schema), /schema validation failed/);
  assert.strictEqual(validateJsonSchemaContract({ id: 'x', score: 1 }, schema, { strictSchema: true }).valid, true);
}

{
  const schema = {
    type: 'object',
    properties: {
      tick: { type: 'number', multipleOf: 0.1 }
    }
  };
  assert.strictEqual(validateJsonSchemaContract({ tick: 0.3 }, schema).valid, true);
  const result = validateJsonSchemaContract({ tick: 0.31 }, schema);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.issues[0].keyword, 'multipleOf');
  assert.throws(() => assertJsonSchemaDefinition({
    type: 'object',
    properties: { tick: { type: 'number', multipleOf: 0 } }
  }), /multipleOf/);
}

{
  const invalidSchema = {
    type: 'object',
    required: ['id', 'missing'],
    properties: {
      id: { type: 'string', typoKeyword: true }
    }
  };
  const definition = validateJsonSchemaDefinition(invalidSchema);
  assert.strictEqual(definition.valid, false);
  assert.strictEqual(definition.issues[0].keyword, 'unsupportedKeyword');
  assert.throws(() => assertJsonSchemaDefinition(invalidSchema), /unsupported JSON schema keyword/);
  assert.throws(() => compileJsonSchemaValidator(invalidSchema), /unsupported JSON schema keyword/);
  assert.strictEqual(validateJsonSchemaDefinition(invalidSchema, { allowUnsupportedKeywords: true }).valid, false);
  assert.strictEqual(validateJsonSchemaDefinitionSubpath(invalidSchema).valid, false);
}

{
  const schema = {
    type: 'array',
    items: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
        score: { type: 'integer' }
      }
    }
  };
  const validate = compileJsonSchemaValidator(schema);
  schema.items.properties.score.type = 'string';
  assert.strictEqual(validate([{ id: 'a', score: 1 }]).valid, true);
  assert.strictEqual(validate([{ id: 'a', score: 1.5 }]).valid, false);
}

{
  const schema = {
    type: 'object',
    properties: {
      id: { type: 'string' },
      profile: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          state: { type: 'string' }
        }
      }
    }
  };
  assert.deepStrictEqual(jsonSchemaToFrontierSchema(schema), {
    type: 'object',
    path: undefined,
    fields: ['id', { key: 'profile', type: 'object', fields: ['score', 'state'] }]
  });
  const profile = jsonSchemaToDiffProfile(schema);
  const engine = createDiffEngine({ profile });
  assert.deepStrictEqual(
    engine.diff({ id: 'a', profile: { score: 1, state: 'ok' } }, { id: 'a', profile: { score: 2, state: 'ok' } }),
    [[0, ['profile', 'score'], 2]]
  );
}

{
  const schema = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        score: { type: 'number', multipleOf: 0.25 }
      }
    }
  };
  const profile = jsonSchemaToDiffProfile(schema, {
    path: ['rows'],
    arrayKey: 'id',
    quantization: { fixedStep: true }
  });
  assert.deepStrictEqual(profile.settings.quantization, [{
    path: ['rows', '*', 'score'],
    step: 0.25,
    fixedStep: true
  }]);
  const engine = createDiffEngine({ profile });
  assert.deepStrictEqual(
    engine.diff({ rows: [{ id: 'a', score: 1.01 }] }, { rows: [{ id: 'a', score: 1.11 }] }),
    []
  );
}

{
  const event = createCloudEventEnvelope({
    id: 'evt-1',
    source: '/frontier/tests',
    type: 'frontier.patch',
    time: new Date('2026-05-24T00:00:00.000Z'),
    datacontenttype: 'application/json',
    data: { patch: [[0, ['ok'], true]] },
    extensions: { frontierseq: 1 }
  });
  assert.strictEqual(event.specversion, '1.0');
  assert.strictEqual(event.time, '2026-05-24T00:00:00.000Z');
  assert.strictEqual(validateCloudEventEnvelope(event).valid, true);
  assert.strictEqual(assertCloudEventEnvelope(event), event);
  assert.strictEqual(createCloudEventEnvelopeSubpath({ id: 'evt-2', source: '/x', type: 'x' }).type, 'x');
}

{
  assert.strictEqual(validateCloudEventEnvelope({ specversion: '1.0', id: '', source: '/x', type: 'x' }).valid, false);
  assert.throws(() => createCloudEventEnvelope({
    id: 'evt-2',
    source: '/frontier/tests',
    type: 'frontier.patch',
    extensions: { bad_extension_name: true }
  }), /extension name/);
}

{
  const schema = normalizeQuerySchema({
    tables: [{
      path: '/todos',
      key: 'id',
      selectorFields: ['done', 'owner.id']
    }]
  });
  assert.deepStrictEqual(schema.tables[0].path, ['todos']);
  assert.deepStrictEqual(schema.tables[0].key, ['id']);
  assert.deepStrictEqual(schema.tables[0].selectorFields, [['done'], ['owner', 'id']]);
  assert.deepStrictEqual(normalizeQuerySchemaSubpath([{ path: '/users', key: 'id' }]).tables[0].path, ['users']);
}

{
  const queryShape = {
    tables: [{
      path: '/todos',
      key: 'id',
      numericFields: ['count'],
      textFields: ['owner.team'],
      selectorFields: ['done', 'owner.id']
    }]
  };
  assert.deepStrictEqual(querySchemaToFrontierSchema(queryShape), {
    type: 'array',
    path: ['todos'],
    key: 'id',
    item: {
      type: 'object',
      key: 'id',
      fields: ['id', 'count', { key: 'owner', type: 'object', fields: ['team', 'id'] }, 'done']
    }
  });
  const profile = querySchemaToDiffProfile(queryShape);
  const quantizedProfile = querySchemaToDiffProfile(queryShape, {
    quantization: [{ path: ['todos', '*', 'count'], step: 1 }]
  });
  assert.deepStrictEqual(quantizedProfile.settings.quantization, [{ path: ['todos', '*', 'count'], step: 1 }]);
  assert.strictEqual(querySchemaToDiffProfileSubpath(queryShape).schema.path[0], 'todos');
  assert.strictEqual(profile.schema.path[0], 'todos');
}

console.log('frontier-schema smoke tests passed');
