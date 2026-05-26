import { normalizeQuerySchema } from '@shapeshift-labs/frontier-query';
export { normalizeQuerySchema } from '@shapeshift-labs/frontier-query';
export function querySchemaToFrontierSchema(schema, options = {}) {
    const normalized = normalizeQuerySchema(schema);
    if (normalized.tables.length === 0)
        throw new TypeError('query schema must contain at least one table');
    const schemas = new Array(normalized.tables.length);
    for (let i = 0; i < normalized.tables.length; i++) {
        schemas[i] = queryTableToFrontierSchema(normalized.tables[i], options);
    }
    return schemas.length === 1 ? schemas[0] : { schemas };
}
export function querySchemaToDiffProfile(schema, options = {}) {
    const frontierSchema = querySchemaToFrontierSchema(schema, options);
    const schemas = 'schemas' in frontierSchema ? frontierSchema.schemas : [frontierSchema];
    const profile = {
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
    const quantization = cloneQuantizationRules(options.quantization);
    if (quantization !== undefined)
        profile.settings = { quantization };
    return profile;
}
function queryTableToFrontierSchema(table, options) {
    if (!table.stableRowShape && options.allowUnstable !== true) {
        throw new TypeError('query schema table must have stableRowShape=true for compiled patch profiles');
    }
    const fields = readQueryTableFields(table, options);
    if (fields.length === 0)
        throw new TypeError('query schema table must declare a key or tracked fields');
    const schema = {
        type: 'array',
        path: table.path.slice(),
        item: {
            type: 'object',
            fields
        }
    };
    const key = readQueryTableKey(table);
    if (key !== undefined) {
        schema.key = key;
        schema.item.key = key;
    }
    return schema;
}
function readQueryTableFields(table, options) {
    const root = createFieldNode();
    if (options.includeKey !== false && table.key !== undefined)
        addQueryFieldPath(root, table.key);
    if (options.includeTypedFields !== false) {
        addQueryFieldPaths(root, table.numericFields);
        addQueryFieldPaths(root, table.textFields);
        addQueryFieldPaths(root, table.listFields);
    }
    if (options.includeSelectorFields !== false)
        addQueryFieldPaths(root, table.selectorFields);
    return readFieldNodeFields(root);
}
function readQueryTableKey(table) {
    return table.key !== undefined && table.key.length === 1 ? table.key[0] : undefined;
}
function addQueryFieldPaths(root, paths) {
    for (let i = 0; i < paths.length; i++)
        addQueryFieldPath(root, paths[i]);
}
function addQueryFieldPath(root, path) {
    if (path.length === 0 || isSpecialQueryField(path))
        return;
    let node = root;
    for (let i = 0; i < path.length; i++) {
        const segment = path[i];
        let child = node.children.get(segment);
        if (child === undefined) {
            child = createFieldNode();
            node.children.set(segment, child);
        }
        node = child;
    }
    node.leaf = true;
}
function readFieldNodeFields(root) {
    const fields = [];
    for (const [key, node] of root.children) {
        if (node.leaf || node.children.size === 0) {
            fields[fields.length] = key;
        }
        else {
            fields[fields.length] = {
                key,
                type: 'object',
                fields: readFieldNodeFields(node)
            };
        }
    }
    return fields;
}
function isSpecialQueryField(path) {
    return path.length === 1 && (path[0] === '$key' ||
        path[0] === '$index' ||
        path[0] === '$mapKey');
}
function createFieldNode() {
    return { leaf: false, children: new Map() };
}
function cloneQuantizationRules(value) {
    if (value === undefined)
        return undefined;
    if (!Array.isArray(value))
        throw new TypeError('quantization option must be an array of numeric quantization rules');
    if (value.length === 0)
        return undefined;
    const rules = new Array(value.length);
    for (let i = 0; i < value.length; i++) {
        const rule = value[i];
        if (rule === null || typeof rule !== 'object' || Array.isArray(rule)) {
            throw new TypeError('quantization[' + i + '] must be an object');
        }
        if (typeof rule.step !== 'number' || !Number.isFinite(rule.step) || rule.step <= 0) {
            throw new TypeError('quantization[' + i + '].step must be a positive finite number');
        }
        const cloned = { step: rule.step };
        if (rule.path !== undefined)
            cloned.path = rule.path.slice();
        if (rule.offset !== undefined)
            cloned.offset = rule.offset;
        if (rule.mode !== undefined)
            cloned.mode = rule.mode;
        if (rule.fixedStep !== undefined)
            cloned.fixedStep = rule.fixedStep;
        rules[i] = cloned;
    }
    return rules;
}
//# sourceMappingURL=query.js.map