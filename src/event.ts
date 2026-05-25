import { cloneJson } from '@shapeshift-labs/frontier/clone';
import { assertJsonValue } from '@shapeshift-labs/frontier/validate';
import type { JsonObject } from '@shapeshift-labs/frontier/types';
import type {
  CloudEventEnvelope,
  CloudEventEnvelopeInput,
  JsonValue,
  SchemaValidationIssue,
  SchemaValidationResult
} from './types.js';
import { addIssue, formatSchemaIssues, isPlainObject } from './internal.js';

const RESERVED_CLOUD_EVENT_ATTRIBUTES = new Set([
  'specversion',
  'id',
  'source',
  'type',
  'subject',
  'time',
  'datacontenttype',
  'dataschema',
  'data',
  'data_base64'
]);

export function createCloudEventEnvelope<T extends JsonValue = JsonValue>(
  input: CloudEventEnvelopeInput<T>
): CloudEventEnvelope<T> {
  if (input === null || typeof input !== 'object') throw new TypeError('CloudEvent input must be an object');
  const envelope: JsonObject = {
    specversion: '1.0',
    id: requireNonEmptyString(input.id, 'CloudEvent id'),
    source: requireNonEmptyString(input.source, 'CloudEvent source'),
    type: requireNonEmptyString(input.type, 'CloudEvent type')
  };

  if (input.subject !== undefined) envelope.subject = requireNonEmptyString(input.subject, 'CloudEvent subject');
  if (input.time !== undefined) {
    envelope.time = input.time instanceof Date ? input.time.toISOString() : requireNonEmptyString(input.time, 'CloudEvent time');
  }
  if (input.datacontenttype !== undefined) envelope.datacontenttype = requireNonEmptyString(input.datacontenttype, 'CloudEvent datacontenttype');
  if (input.dataschema !== undefined) envelope.dataschema = requireNonEmptyString(input.dataschema, 'CloudEvent dataschema');
  if (input.data !== undefined) envelope.data = cloneJson(input.data);

  if (input.extensions !== undefined) {
    const keys = Object.keys(input.extensions);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      validateCloudEventExtensionName(key);
      if (RESERVED_CLOUD_EVENT_ATTRIBUTES.has(key)) throw new TypeError('CloudEvent extension must not overwrite ' + key);
      envelope[key] = cloneJson(input.extensions[key]);
    }
  }

  assertCloudEventEnvelope(envelope);
  return envelope as CloudEventEnvelope<T>;
}

export function validateCloudEventEnvelope(value: unknown): SchemaValidationResult {
  const issues: SchemaValidationIssue[] = [];
  if (!isPlainObject(value)) {
    addIssue(issues, [], 'type', 'CloudEvent envelope must be an object');
    return { valid: false, issues };
  }

  requireStringField(value, 'specversion', issues);
  requireStringField(value, 'id', issues);
  requireStringField(value, 'source', issues);
  requireStringField(value, 'type', issues);

  if (value.specversion !== '1.0') addIssue(issues, ['specversion'], 'const', 'CloudEvent specversion must be 1.0');
  for (const name of ['id', 'source', 'type']) {
    if (typeof value[name] === 'string' && value[name].length === 0) addIssue(issues, [name], 'minLength', 'CloudEvent ' + name + ' must not be empty');
  }
  for (const name of ['subject', 'datacontenttype', 'dataschema']) {
    if (value[name] !== undefined && typeof value[name] !== 'string') addIssue(issues, [name], 'type', 'CloudEvent ' + name + ' must be a string');
  }
  if (value.time !== undefined) {
    if (typeof value.time !== 'string') {
      addIssue(issues, ['time'], 'type', 'CloudEvent time must be a string');
    } else if (Number.isNaN(Date.parse(value.time))) {
      addIssue(issues, ['time'], 'format', 'CloudEvent time must be an RFC3339-compatible timestamp string');
    }
  }
  if (value.data !== undefined) {
    try {
      assertJsonValue(value.data, 'CloudEvent data');
    } catch (error) {
      addIssue(issues, ['data'], 'json', error instanceof Error ? error.message : 'CloudEvent data must be JSON');
    }
  }
  if (value.data_base64 !== undefined && typeof value.data_base64 !== 'string') {
    addIssue(issues, ['data_base64'], 'type', 'CloudEvent data_base64 must be a string');
  }
  if (value.data !== undefined && value.data_base64 !== undefined) {
    addIssue(issues, ['data_base64'], 'mutualExclusion', 'CloudEvent data and data_base64 must not both be present');
  }

  const keys = Object.keys(value);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!RESERVED_CLOUD_EVENT_ATTRIBUTES.has(key)) {
      try {
        validateCloudEventExtensionName(key);
      } catch (error) {
        addIssue(issues, [key], 'extension', error instanceof Error ? error.message : 'invalid CloudEvent extension name');
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

export function assertCloudEventEnvelope<T extends JsonObject = CloudEventEnvelope>(
  value: T
): T & CloudEventEnvelope {
  const result = validateCloudEventEnvelope(value);
  if (!result.valid) throw new TypeError(formatSchemaIssues(result.issues));
  return value as T & CloudEventEnvelope;
}

function requireStringField(value: JsonObject, key: string, issues: SchemaValidationIssue[]): void {
  if (typeof value[key] !== 'string') addIssue(issues, [key], 'required', 'CloudEvent ' + key + ' must be a string');
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new TypeError(label + ' must be a non-empty string');
  return value;
}

function validateCloudEventExtensionName(name: string): void {
  if (!/^[a-z][a-z0-9]{0,19}$/.test(name)) {
    throw new TypeError('CloudEvent extension name must match ^[a-z][a-z0-9]{0,19}$');
  }
}
