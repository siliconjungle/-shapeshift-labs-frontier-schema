import { cloneJson } from '@shapeshift-labs/frontier/clone';
import { equalsJson } from '@shapeshift-labs/frontier/equal';
import { assertJsonValue } from '@shapeshift-labs/frontier/validate';
import type {
  DiffProfile,
  JsonPath,
  JsonValue,
  Schema,
  SchemaField,
  SingleSchema
} from './types.js';
import type {
  CompiledSchemaValidator,
  JsonSchemaContract,
  JsonSchemaDefinitionOptions,
  JsonSchemaProfileOptions,
  JsonSchemaQuantizationOptions,
  JsonSchemaTypeName,
  NumericQuantizationRule,
  SchemaValidationIssue,
  SchemaValidationOptions,
  SchemaValidationResult
} from './types.js';
import { addIssue, formatSchemaIssues, isPlainObject, normalizeMaxIssues } from './internal.js';

const SUPPORTED_JSON_SCHEMA_KEYWORDS = new Set([
  'type',
  'properties',
  'required',
  'items',
  'additionalProperties',
  'enum',
  'const',
  'minItems',
  'maxItems',
  'minLength',
  'maxLength',
  'minimum',
  'maximum',
  'multipleOf',
  'pattern'
]);

const JSON_SCHEMA_TYPE_NAMES = new Set(['null', 'boolean', 'number', 'integer', 'string', 'array', 'object']);

export function validateJsonSchemaContract(
  value: unknown,
  schema: JsonSchemaContract,
  options: SchemaValidationOptions = {}
): SchemaValidationResult {
  const maxIssues = normalizeMaxIssues(options.maxIssues);
  const schemaOptions = readSchemaDefinitionOptions(options.strictSchema, options.maxIssues);
  if (schemaOptions !== null) {
    const schemaResult = validateJsonSchemaDefinition(schema, schemaOptions);
    if (!schemaResult.valid) return schemaResult;
  }

  if (options.validateJson) {
    const jsonOptions = options.validateJson === true ? undefined : options.validateJson;
    try {
      assertJsonValue(value, 'value', jsonOptions);
    } catch (error) {
      return {
        valid: false,
        issues: [{
          path: [],
          keyword: 'json',
          message: error instanceof Error ? error.message : 'value must be valid JSON'
        }]
      };
    }
  }

  const issues: SchemaValidationIssue[] = [];
  validateAgainstSchema(value, schema, [], issues, maxIssues);
  return { valid: issues.length === 0, issues };
}

export function validateJsonSchemaDefinition(
  schema: unknown,
  options: JsonSchemaDefinitionOptions = {}
): SchemaValidationResult {
  const issues: SchemaValidationIssue[] = [];
  validateSchemaDefinition(schema, [], issues, normalizeMaxIssues(options.maxIssues), options.allowUnsupportedKeywords === true);
  return { valid: issues.length === 0, issues };
}

export function assertJsonSchemaDefinition<T extends JsonSchemaContract>(
  schema: T,
  options?: JsonSchemaDefinitionOptions
): T {
  const result = validateJsonSchemaDefinition(schema, options);
  if (!result.valid) throw new TypeError(formatSchemaIssues(result.issues));
  return schema;
}

export function assertJsonSchemaContract<T = JsonValue>(
  value: T,
  schema: JsonSchemaContract,
  options?: SchemaValidationOptions
): T {
  const result = validateJsonSchemaContract(value, schema, options);
  if (!result.valid) throw new TypeError(formatSchemaIssues(result.issues));
  return value;
}

export function compileJsonSchemaValidator(
  schema: JsonSchemaContract,
  options?: SchemaValidationOptions
): CompiledSchemaValidator {
  if (!options || options.strictSchema !== false) {
    assertJsonSchemaDefinition(schema, options && typeof options.strictSchema === 'object' ? options.strictSchema : undefined);
  }
  const compiledOptions = options ? { ...options, strictSchema: false } : {};
  const clonedSchema = cloneJson(schema as unknown as JsonValue) as unknown as JsonSchemaContract;
  const validator = ((value: unknown) => validateJsonSchemaContract(value, clonedSchema, compiledOptions)) as CompiledSchemaValidator;
  Object.defineProperty(validator, 'schema', { value: clonedSchema, enumerable: true });
  return validator;
}

export function jsonSchemaToFrontierSchema(
  schema: JsonSchemaContract,
  options: JsonSchemaProfileOptions = {}
): Schema {
  assertJsonSchemaDefinition(schema);
  const path = options.path ? options.path.slice() : undefined;
  if (schema.type === 'array' && schema.items && schema.items.type === 'object') {
    return {
      type: 'array',
      path,
      key: options.arrayKey,
      item: {
        type: 'object',
        key: options.arrayKey,
        fields: readSchemaFields(schema.items)
      }
    };
  }
  if (schema.type === 'object' || schema.properties) {
    return {
      type: 'object',
      path,
      fields: readSchemaFields(schema)
    };
  }
  throw new TypeError('JSON schema profile conversion requires an object schema or an array schema with object items');
}

export function jsonSchemaToDiffProfile(
  schema: JsonSchemaContract,
  options: JsonSchemaProfileOptions = {}
): DiffProfile {
  const frontierSchema = jsonSchemaToFrontierSchema(schema, options);
  const schemas = isMultiSchema(frontierSchema) ? frontierSchema.schemas : [frontierSchema];
  const profile: DiffProfile = {
    version: 1,
    plans: {
      diff: {
        strategy: 'schema',
        schemaCount: schemas.length,
        paths: schemas.map((entry) => entry.path || [])
      },
      equality: { strategy: 'schema' }
    },
    schema: schemas.length === 1 ? schemas[0] : undefined,
    schemas: schemas.length > 1 ? schemas : undefined
  };
  const quantization = collectJsonSchemaQuantizationRules(schema, options);
  if (quantization !== undefined) profile.settings = { quantization } as DiffProfile['settings'];
  return profile;
}

function validateSchemaDefinition(
  value: unknown,
  path: JsonPath,
  issues: SchemaValidationIssue[],
  maxIssues: number,
  allowUnsupportedKeywords: boolean
): void {
  if (issues.length >= maxIssues) return;
  if (!isPlainObject(value)) {
    addIssue(issues, path, 'schema', 'schema must be an object');
    return;
  }

  const schema = value as JsonSchemaContract;
  const record = value as Record<string, unknown>;
  if (!allowUnsupportedKeywords) {
    const keys = Object.keys(record);
    for (let i = 0; i < keys.length && issues.length < maxIssues; i++) {
      const key = keys[i];
      if (!SUPPORTED_JSON_SCHEMA_KEYWORDS.has(key)) addIssue(issues, path.concat(key), 'unsupportedKeyword', 'unsupported JSON schema keyword');
    }
  }
  if (issues.length >= maxIssues) return;

  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (types.length === 0) addIssue(issues, path.concat('type'), 'type', 'schema type array must not be empty');
    for (let i = 0; i < types.length && issues.length < maxIssues; i++) {
      if (typeof types[i] !== 'string' || !JSON_SCHEMA_TYPE_NAMES.has(types[i])) {
        addIssue(issues, path.concat('type'), 'type', 'schema type must be a supported JSON schema type name');
        break;
      }
    }
  }
  if (issues.length >= maxIssues) return;

  if (schema.properties !== undefined) {
    if (!isPlainObject(schema.properties)) {
      addIssue(issues, path.concat('properties'), 'properties', 'schema properties must be an object');
    } else {
      const keys = Object.keys(schema.properties);
      for (let i = 0; i < keys.length && issues.length < maxIssues; i++) {
        const key = keys[i];
        validateSchemaDefinition(schema.properties[key], path.concat('properties', key), issues, maxIssues, allowUnsupportedKeywords);
      }
    }
  }
  if (issues.length >= maxIssues) return;

  if (schema.required !== undefined) {
    if (!Array.isArray(schema.required)) {
      addIssue(issues, path.concat('required'), 'required', 'schema required must be an array of property names');
    } else {
      for (let i = 0; i < schema.required.length && issues.length < maxIssues; i++) {
        const key = schema.required[i];
        if (typeof key !== 'string') {
          addIssue(issues, path.concat('required', i), 'required', 'required property name must be a string');
        } else if (schema.properties && !Object.prototype.hasOwnProperty.call(schema.properties, key)) {
          addIssue(issues, path.concat('required', i), 'strictRequired', 'required property should be declared in schema properties');
        }
      }
    }
  }
  if (issues.length >= maxIssues) return;

  if (schema.items !== undefined) validateSchemaDefinition(schema.items, path.concat('items'), issues, maxIssues, allowUnsupportedKeywords);
  if (issues.length >= maxIssues) return;
  if (
    schema.additionalProperties !== undefined &&
    typeof schema.additionalProperties !== 'boolean'
  ) {
    validateSchemaDefinition(schema.additionalProperties, path.concat('additionalProperties'), issues, maxIssues, allowUnsupportedKeywords);
  }
  if (issues.length >= maxIssues) return;

  if (schema.enum !== undefined) {
    if (!Array.isArray(schema.enum)) {
      addIssue(issues, path.concat('enum'), 'enum', 'schema enum must be an array');
    } else {
      for (let i = 0; i < schema.enum.length && issues.length < maxIssues; i++) {
        validateSchemaJsonLiteral(schema.enum[i], path.concat('enum', i), issues);
      }
    }
  }
  if (issues.length >= maxIssues) return;
  if (schema.const !== undefined) validateSchemaJsonLiteral(schema.const, path.concat('const'), issues);
  if (issues.length >= maxIssues) return;

  validateNonNegativeIntegerKeyword(schema.minItems, path.concat('minItems'), 'minItems', issues);
  if (issues.length >= maxIssues) return;
  validateNonNegativeIntegerKeyword(schema.maxItems, path.concat('maxItems'), 'maxItems', issues);
  if (issues.length >= maxIssues) return;
  validateNonNegativeIntegerKeyword(schema.minLength, path.concat('minLength'), 'minLength', issues);
  if (issues.length >= maxIssues) return;
  validateNonNegativeIntegerKeyword(schema.maxLength, path.concat('maxLength'), 'maxLength', issues);
  if (issues.length >= maxIssues) return;
  validateFiniteNumberKeyword(schema.minimum, path.concat('minimum'), 'minimum', issues);
  if (issues.length >= maxIssues) return;
  validateFiniteNumberKeyword(schema.maximum, path.concat('maximum'), 'maximum', issues);
  if (issues.length >= maxIssues) return;
  validatePositiveFiniteNumberKeyword(schema.multipleOf, path.concat('multipleOf'), 'multipleOf', issues);
  if (issues.length >= maxIssues) return;

  if (schema.pattern !== undefined) {
    if (typeof schema.pattern !== 'string') {
      addIssue(issues, path.concat('pattern'), 'pattern', 'schema pattern must be a string');
    } else {
      try {
        new RegExp(schema.pattern);
      } catch {
        addIssue(issues, path.concat('pattern'), 'pattern', 'schema pattern must be a valid regular expression');
      }
    }
  }
}

function validateAgainstSchema(
  value: unknown,
  schema: JsonSchemaContract,
  path: JsonPath,
  issues: SchemaValidationIssue[],
  maxIssues: number
): void {
  if (issues.length >= maxIssues) return;
  if (!schema || typeof schema !== 'object') {
    addIssue(issues, path, 'schema', 'schema must be an object');
    return;
  }

  if (schema.const !== undefined && !equalsJson(value as JsonValue, schema.const)) {
    addIssue(issues, path, 'const', 'value must equal schema const');
    if (issues.length >= maxIssues) return;
  }
  if (schema.enum !== undefined && !schema.enum.some((entry) => equalsJson(value as JsonValue, entry))) {
    addIssue(issues, path, 'enum', 'value must match one of the schema enum values');
    if (issues.length >= maxIssues) return;
  }
  if (schema.type !== undefined && !matchesSchemaType(value, schema.type)) {
    addIssue(issues, path, 'type', 'value must match schema type ' + schemaTypeLabel(schema.type), schema.type as unknown as JsonValue, typeOfJsonValue(value));
    if (issues.length >= maxIssues) return;
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) addIssue(issues, path, 'minLength', 'string is shorter than minLength');
    if (schema.maxLength !== undefined && value.length > schema.maxLength) addIssue(issues, path, 'maxLength', 'string is longer than maxLength');
    if (schema.pattern !== undefined && !(new RegExp(schema.pattern)).test(value)) addIssue(issues, path, 'pattern', 'string does not match pattern');
    return;
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) addIssue(issues, path, 'minimum', 'number is smaller than minimum');
    if (schema.maximum !== undefined && value > schema.maximum) addIssue(issues, path, 'maximum', 'number is greater than maximum');
    if (schema.multipleOf !== undefined && !isMultipleOf(value, schema.multipleOf)) {
      addIssue(issues, path, 'multipleOf', 'number is not a multiple of schema multipleOf');
    }
    return;
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) addIssue(issues, path, 'minItems', 'array has fewer items than minItems');
    if (schema.maxItems !== undefined && value.length > schema.maxItems) addIssue(issues, path, 'maxItems', 'array has more items than maxItems');
    if (schema.items !== undefined) {
      for (let i = 0; i < value.length && issues.length < maxIssues; i++) {
        validateAgainstSchema(value[i], schema.items, path.concat(i), issues, maxIssues);
      }
    }
    return;
  }

  if (isPlainObject(value)) {
    const properties = schema.properties || {};
    if (schema.required !== undefined) {
      for (let i = 0; i < schema.required.length && issues.length < maxIssues; i++) {
        const key = schema.required[i];
        if (!Object.prototype.hasOwnProperty.call(value, key)) addIssue(issues, path.concat(key), 'required', 'required property is missing');
      }
    }
    const keys = Object.keys(properties);
    for (let i = 0; i < keys.length && issues.length < maxIssues; i++) {
      const key = keys[i];
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        validateAgainstSchema(value[key], properties[key], path.concat(key), issues, maxIssues);
      }
    }
    if (schema.additionalProperties === false) {
      const valueKeys = Object.keys(value);
      for (let i = 0; i < valueKeys.length && issues.length < maxIssues; i++) {
        const key = valueKeys[i];
        if (!Object.prototype.hasOwnProperty.call(properties, key)) {
          addIssue(issues, path.concat(key), 'additionalProperties', 'additional property is not allowed');
        }
      }
    } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      const valueKeys = Object.keys(value);
      for (let i = 0; i < valueKeys.length && issues.length < maxIssues; i++) {
        const key = valueKeys[i];
        if (!Object.prototype.hasOwnProperty.call(properties, key)) {
          validateAgainstSchema(value[key], schema.additionalProperties, path.concat(key), issues, maxIssues);
        }
      }
    }
  }
}

function readSchemaFields(schema: JsonSchemaContract): SchemaField[] {
  const properties = schema.properties || {};
  const keys = Object.keys(properties).sort();
  const fields: SchemaField[] = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const child = properties[key];
    if ((child.type === 'object' || child.properties) && child.properties !== undefined) {
      fields[fields.length] = { key, type: 'object', fields: readSchemaFields(child) };
    } else {
      fields[fields.length] = key;
    }
  }
  return fields;
}

function collectJsonSchemaQuantizationRules(
  schema: JsonSchemaContract,
  options: JsonSchemaProfileOptions
): NumericQuantizationRule[] | undefined {
  const quantization = readJsonSchemaQuantizationOptions(options.quantization);
  if (quantization === null) return undefined;
  const rules: NumericQuantizationRule[] = [];
  const basePath = options.path ? options.path.slice() : [];
  if (schema.type === 'array' && schema.items) {
    collectSchemaQuantizationRules(schema.items, basePath.concat('*'), quantization, rules);
  } else {
    collectSchemaQuantizationRules(schema, basePath, quantization, rules);
  }
  return rules.length === 0 ? undefined : rules;
}

function readJsonSchemaQuantizationOptions(
  value: JsonSchemaProfileOptions['quantization']
): JsonSchemaQuantizationOptions | null {
  if (value === undefined || value === false) return null;
  if (value === true) return {};
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('quantization option must be a boolean or object');
  }
  if (value.mode !== undefined && value.mode !== 'nearest' && value.mode !== 'floor' && value.mode !== 'ceil') {
    throw new TypeError('quantization.mode must be "nearest", "floor", or "ceil"');
  }
  if (value.fixedStep !== undefined && typeof value.fixedStep !== 'boolean') {
    throw new TypeError('quantization.fixedStep must be a boolean');
  }
  const out: JsonSchemaQuantizationOptions = {};
  if (value.mode !== undefined) out.mode = value.mode;
  if (value.fixedStep !== undefined) out.fixedStep = value.fixedStep;
  return out;
}

function collectSchemaQuantizationRules(
  schema: JsonSchemaContract,
  path: JsonPath,
  options: JsonSchemaQuantizationOptions,
  rules: NumericQuantizationRule[]
): void {
  if (schema.multipleOf !== undefined && schemaAllowsNumeric(schema.type)) {
    const rule: NumericQuantizationRule = {
      path: path.slice(),
      step: schema.multipleOf
    };
    if (options.mode !== undefined) rule.mode = options.mode;
    if (options.fixedStep !== undefined) rule.fixedStep = options.fixedStep;
    rules[rules.length] = rule;
  }

  if (schema.properties !== undefined) {
    const keys = Object.keys(schema.properties).sort();
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      collectSchemaQuantizationRules(schema.properties[key], path.concat(key), options, rules);
    }
  }
  if (schema.items !== undefined) {
    collectSchemaQuantizationRules(schema.items, path.concat('*'), options, rules);
  }
}

function schemaAllowsNumeric(type: JsonSchemaContract['type']): boolean {
  if (type === undefined) return true;
  if (Array.isArray(type)) return type.indexOf('number') !== -1 || type.indexOf('integer') !== -1;
  return type === 'number' || type === 'integer';
}

function isMultiSchema(schema: Schema): schema is { schemas: SingleSchema[] } {
  return Object.prototype.hasOwnProperty.call(schema, 'schemas');
}

function matchesSchemaType(value: unknown, type: JsonSchemaTypeName | JsonSchemaTypeName[]): boolean {
  if (Array.isArray(type)) {
    for (let i = 0; i < type.length; i++) if (matchesSchemaType(value, type[i])) return true;
    return false;
  }
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return isPlainObject(value);
  if (type === 'integer') return typeof value === 'number' && Number.isInteger(value);
  return typeof value === type;
}

function schemaTypeLabel(type: JsonSchemaTypeName | JsonSchemaTypeName[]): string {
  return Array.isArray(type) ? type.join('|') : type;
}

function typeOfJsonValue(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function validateSchemaJsonLiteral(
  value: unknown,
  path: JsonPath,
  issues: SchemaValidationIssue[]
): void {
  try {
    assertJsonValue(value, 'schema literal');
  } catch (error) {
    addIssue(issues, path, 'json', error instanceof Error ? error.message : 'schema literal must be valid JSON');
  }
}

function validateNonNegativeIntegerKeyword(
  value: unknown,
  path: JsonPath,
  keyword: string,
  issues: SchemaValidationIssue[]
): void {
  if (value !== undefined && (!Number.isSafeInteger(value) || (value as number) < 0)) {
    addIssue(issues, path, keyword, 'schema ' + keyword + ' must be a non-negative safe integer');
  }
}

function validateFiniteNumberKeyword(
  value: unknown,
  path: JsonPath,
  keyword: string,
  issues: SchemaValidationIssue[]
): void {
  if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value))) {
    addIssue(issues, path, keyword, 'schema ' + keyword + ' must be a finite number');
  }
}

function validatePositiveFiniteNumberKeyword(
  value: unknown,
  path: JsonPath,
  keyword: string,
  issues: SchemaValidationIssue[]
): void {
  if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)) {
    addIssue(issues, path, keyword, 'schema ' + keyword + ' must be a positive finite number');
  }
}

function isMultipleOf(value: number, step: number): boolean {
  const quotient = value / step;
  return Math.abs(quotient - Math.round(quotient)) <= 1e-9;
}

function readSchemaDefinitionOptions(
  value: boolean | JsonSchemaDefinitionOptions | undefined,
  fallbackMaxIssues: number | undefined
): JsonSchemaDefinitionOptions | null {
  if (value === undefined || value === false) return null;
  if (value === true) return { maxIssues: fallbackMaxIssues };
  return { maxIssues: value.maxIssues ?? fallbackMaxIssues, allowUnsupportedKeywords: value.allowUnsupportedKeywords };
}
