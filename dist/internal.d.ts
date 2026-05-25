import type { JsonObject, JsonPath, JsonValue } from '@shapeshift-labs/frontier/types';
import type { SchemaValidationIssue } from './types.js';
export declare function addIssue(issues: SchemaValidationIssue[], path: JsonPath, keyword: string, message: string, expected?: JsonValue, actual?: string): void;
export declare function formatSchemaIssues(issues: SchemaValidationIssue[]): string;
export declare function isPlainObject(value: unknown): value is JsonObject;
export declare function normalizeMaxIssues(value: number | undefined): number;
//# sourceMappingURL=internal.d.ts.map