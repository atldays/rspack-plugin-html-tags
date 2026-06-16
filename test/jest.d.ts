interface TagProperties {
    tagName: string;
    // `undefined` is allowed so specs can assert an attribute is absent.
    attributes?: Record<string, string | boolean | number | undefined>;
}

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeTag(expected: TagProperties): R;
        }
    }
}

export {};
