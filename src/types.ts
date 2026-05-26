import type {
  JsonObject,
  JsonPath,
  JsonValidationOptions,
  JsonValue,
  ObjectKey
} from '@shapeshift-labs/frontier/types';
import type {
  DiffProfile,
  Schema,
  SchemaField,
  SingleSchema
} from '@shapeshift-labs/frontier-engine/types';

export type {
  DiffProfile,
  JsonObject,
  JsonPath,
  JsonValidationOptions,
  JsonValue,
  ObjectKey,
  Schema,
  SchemaField,
  SingleSchema
};

export type JsonSchemaTypeName = 'null' | 'boolean' | 'number' | 'integer' | 'string' | 'array' | 'object';

export type NumericQuantizationMode = 'nearest' | 'floor' | 'ceil';

export interface NumericQuantizationRule {
  path?: JsonPath;
  step: number;
  offset?: number;
  mode?: NumericQuantizationMode;
  fixedStep?: boolean;
}

export interface JsonSchemaContract {
  type?: JsonSchemaTypeName | JsonSchemaTypeName[];
  properties?: Record<string, JsonSchemaContract>;
  required?: string[];
  items?: JsonSchemaContract;
  additionalProperties?: boolean | JsonSchemaContract;
  enum?: JsonValue[];
  const?: JsonValue;
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
  pattern?: string;
}

export interface SchemaValidationIssue {
  path: JsonPath;
  keyword: string;
  message: string;
  expected?: JsonValue;
  actual?: string;
}

export interface SchemaValidationResult {
  valid: boolean;
  issues: SchemaValidationIssue[];
}

export interface JsonSchemaDefinitionOptions {
  maxIssues?: number;
  allowUnsupportedKeywords?: boolean;
}

export interface SchemaValidationOptions {
  maxIssues?: number;
  validateJson?: boolean | JsonValidationOptions;
  strictSchema?: boolean | JsonSchemaDefinitionOptions;
}

export type CompiledSchemaValidator<T = unknown> = {
  (value: T): SchemaValidationResult;
  readonly schema: JsonSchemaContract;
};

export interface JsonSchemaProfileOptions {
  path?: JsonPath;
  arrayKey?: ObjectKey;
  quantization?: boolean | JsonSchemaQuantizationOptions;
}

export interface JsonSchemaQuantizationOptions {
  mode?: NumericQuantizationMode;
  fixedStep?: boolean;
}

export interface CloudEventEnvelope<T extends JsonValue = JsonValue> extends JsonObject {
  specversion: '1.0';
  id: string;
  source: string;
  type: string;
  subject?: string;
  time?: string;
  datacontenttype?: string;
  dataschema?: string;
  data?: T;
}

export interface CloudEventEnvelopeInput<T extends JsonValue = JsonValue> {
  id: string;
  source: string;
  type: string;
  subject?: string;
  time?: string | Date;
  datacontenttype?: string;
  dataschema?: string;
  data?: T;
  extensions?: JsonObject;
}
