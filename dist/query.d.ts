import type { QuerySchemaInput } from '@shapeshift-labs/frontier-query';
import type { DiffProfile, NumericQuantizationRule, Schema } from './types.js';
export { normalizeQuerySchema, type NormalizedQuerySchema, type NormalizedQueryTableSchema, type QuerySchemaInput, type QueryShapeSchema, type QueryTableSchema } from '@shapeshift-labs/frontier-query';
export interface QuerySchemaProfileOptions {
    includeKey?: boolean;
    includeSelectorFields?: boolean;
    includeTypedFields?: boolean;
    allowUnstable?: boolean;
    quantization?: readonly NumericQuantizationRule[];
}
export declare function querySchemaToFrontierSchema(schema: QuerySchemaInput, options?: QuerySchemaProfileOptions): Schema;
export declare function querySchemaToDiffProfile(schema: QuerySchemaInput, options?: QuerySchemaProfileOptions): DiffProfile;
//# sourceMappingURL=query.d.ts.map