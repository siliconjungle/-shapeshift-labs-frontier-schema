import type { DiffProfile, JsonValue, Schema } from './types.js';
import type { CompiledSchemaValidator, JsonSchemaContract, JsonSchemaDefinitionOptions, JsonSchemaProfileOptions, SchemaValidationOptions, SchemaValidationResult } from './types.js';
export declare function validateJsonSchemaContract(value: unknown, schema: JsonSchemaContract, options?: SchemaValidationOptions): SchemaValidationResult;
export declare function validateJsonSchemaDefinition(schema: unknown, options?: JsonSchemaDefinitionOptions): SchemaValidationResult;
export declare function assertJsonSchemaDefinition<T extends JsonSchemaContract>(schema: T, options?: JsonSchemaDefinitionOptions): T;
export declare function assertJsonSchemaContract<T = JsonValue>(value: T, schema: JsonSchemaContract, options?: SchemaValidationOptions): T;
export declare function compileJsonSchemaValidator(schema: JsonSchemaContract, options?: SchemaValidationOptions): CompiledSchemaValidator;
export declare function jsonSchemaToFrontierSchema(schema: JsonSchemaContract, options?: JsonSchemaProfileOptions): Schema;
export declare function jsonSchemaToDiffProfile(schema: JsonSchemaContract, options?: JsonSchemaProfileOptions): DiffProfile;
//# sourceMappingURL=json-schema.d.ts.map