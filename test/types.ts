import {
  assertJsonSchemaContract,
  createCloudEventEnvelope,
  jsonSchemaToDiffProfile,
  normalizeQuerySchema,
  type CloudEventEnvelope,
  type DiffProfile,
  type JsonSchemaContract,
  type NormalizedQuerySchema,
  type SchemaValidationResult
} from '../dist/index.js';
import { validateJsonSchemaContract } from '../dist/json-schema.js';
import { validateCloudEventEnvelope } from '../dist/event.js';
import { normalizeQuerySchema as normalizeQuerySchemaSubpath } from '../dist/query.js';

const schema: JsonSchemaContract = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' }
  }
};

const result: SchemaValidationResult = validateJsonSchemaContract({ id: 'x' }, schema);
const value = assertJsonSchemaContract({ id: 'x' }, schema);
const profile: DiffProfile = jsonSchemaToDiffProfile(schema);
const event: CloudEventEnvelope = createCloudEventEnvelope({
  id: 'evt-1',
  source: '/types',
  type: 'frontier.schema.types',
  data: value
});
const eventResult: SchemaValidationResult = validateCloudEventEnvelope(event);
const querySchema: NormalizedQuerySchema = normalizeQuerySchema([{ path: '/todos', key: 'id' }]);
const querySchemaFromSubpath: NormalizedQuerySchema = normalizeQuerySchemaSubpath([{ path: '/users', key: 'id' }]);

void result;
void profile;
void eventResult;
void querySchema;
void querySchemaFromSubpath;
