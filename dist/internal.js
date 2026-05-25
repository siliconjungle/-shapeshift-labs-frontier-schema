export function addIssue(issues, path, keyword, message, expected, actual) {
    const issue = { path, keyword, message };
    if (expected !== undefined)
        issue.expected = expected;
    if (actual !== undefined)
        issue.actual = actual;
    issues[issues.length] = issue;
}
export function formatSchemaIssues(issues) {
    if (issues.length === 0)
        return 'schema validation failed';
    const first = issues[0];
    return 'schema validation failed at ' + formatPath(first.path) + ': ' + first.message;
}
export function isPlainObject(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value))
        return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}
export function normalizeMaxIssues(value) {
    if (value === undefined)
        return Number.POSITIVE_INFINITY;
    if (!Number.isSafeInteger(value) || value < 1)
        throw new TypeError('maxIssues option must be a positive safe integer');
    return value;
}
function formatPath(path) {
    if (path.length === 0)
        return '$';
    let out = '$';
    for (let i = 0; i < path.length; i++)
        out += typeof path[i] === 'number' ? '[' + path[i] + ']' : '.' + path[i];
    return out;
}
//# sourceMappingURL=internal.js.map