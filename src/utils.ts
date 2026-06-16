/**
 * Normalize a filesystem path to use forward slashes (posix style), matching
 * the behaviour of the `slash` package this plugin used to depend on:
 * extended-length Windows paths (`\\?\...`) are intentionally left untouched.
 */
export function toPosix(filePath: string): string {
    const isExtendedLengthPath = /^\\\\\?\\/.test(filePath);
    if (isExtendedLengthPath) {
        return filePath;
    }
    return filePath.replace(/\\/g, "/");
}

/**
 * Minimal assertion helper used for option validation. Throws a plain `Error`
 * (whose `message` is matched by the test suite) when the condition is falsy.
 */
export function assert(condition: unknown, message: string): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}
