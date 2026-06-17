// Registers the custom `toBeTag` matcher (ported from the upstream jasmine
// `add-matchers` helper) so e2e specs can assert on cheerio-parsed HTML.

interface TagProperties {
    tagName: string;
    attributes?: Record<string, string | boolean | number>;
}

expect.extend({
    toBeTag(received: unknown, tagProperties: TagProperties) {
        const selection = received as {length?: number; [index: number]: unknown} | undefined;
        const node = (selection && (selection.length ?? 0) > 0 ? selection[0] : selection) as
            | {tagName?: string; attribs?: Record<string, string>}
            | undefined;

        let pass = true;
        if (!node || node.tagName !== tagProperties.tagName) {
            pass = false;
        } else if (tagProperties.attributes) {
            const tagAttrs = tagProperties.attributes;
            const nodeAttrs = node.attribs || {};
            pass = !Object.keys(tagAttrs).some(tagAttr => tagAttrs[tagAttr] !== nodeAttrs[tagAttr]);
        }

        return {
            pass,
            message: () =>
                `expected element ${pass ? "not " : ""}to match tag ${JSON.stringify(tagProperties)}` +
                (node
                    ? `, received <${node.tagName ?? "?"}> with attributes ${JSON.stringify(node.attribs ?? {})}`
                    : ", received nothing"),
        };
    },
});
