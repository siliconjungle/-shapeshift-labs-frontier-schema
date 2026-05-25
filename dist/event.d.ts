import type { JsonObject } from '@shapeshift-labs/frontier/types';
import type { CloudEventEnvelope, CloudEventEnvelopeInput, JsonValue, SchemaValidationResult } from './types.js';
export declare function createCloudEventEnvelope<T extends JsonValue = JsonValue>(input: CloudEventEnvelopeInput<T>): CloudEventEnvelope<T>;
export declare function validateCloudEventEnvelope(value: unknown): SchemaValidationResult;
export declare function assertCloudEventEnvelope<T extends JsonObject = CloudEventEnvelope>(value: T): T & CloudEventEnvelope;
//# sourceMappingURL=event.d.ts.map