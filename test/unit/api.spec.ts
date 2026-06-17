import {getValidatedMainOptions, getValidatedOptions} from "../../src/options/validate";
import {IS} from "../../src/options/guards";

describe("api", () => {
    it("exports the IS predicates", () => {
        expect(typeof IS).toBe("object");
        expect(typeof IS.isDefined).toBe("function");
    });

    it("exports getValidatedMainOptions", () => {
        expect(typeof getValidatedMainOptions).toBe("function");
    });

    describe("getValidatedOptions", () => {
        it("should throw with the right error for bad options", () => {
            expect(() => getValidatedOptions({append: "123"}, "pluginName.options")).toThrow(
                /(pluginName.options.append should be a boolean)/
            );
        });

        it("should return the right options for valid options", () => {
            const theFunction = () => getValidatedOptions({append: true}, "pluginName.options", {});
            expect(theFunction).not.toThrow();
            expect(theFunction()).toEqual({append: true});
        });
    });

    it("should throw with the right error for bad links options", () => {
        expect(() => getValidatedOptions({links: ["a", true, "false"]}, "pluginName.options")).toThrow(
            /(pluginName.options.links items must be an object or string)/
        );
    });

    it("should throw with the right error for links with external", () => {
        expect(() =>
            getValidatedOptions(
                {links: ["a", {path: "b", external: {packageName: "b", variableName: "B"}}, "c"]},
                "pluginName.options"
            )
        ).toThrow(/(pluginName.options.links.external should not be used on non script tags)/);
    });

    it("should throw with the right error for scripts with bad external", () => {
        expect(() =>
            getValidatedOptions({scripts: ["a", {path: "b", external: "abc"}, "c"]}, "pluginName.options")
        ).toThrow(/(pluginName.options.scripts.external should be an object)/);
    });

    it("should return the right options for valid links and scripts", () => {
        const theFunction = () =>
            getValidatedOptions({append: false, links: ["a", "b", "c"], scripts: []}, "pluginName.options", {});
        expect(theFunction).not.toThrow();
        const result = theFunction();
        expect(result.links).toEqual([{path: "a"}, {path: "b"}, {path: "c"}]);
        expect(result.scripts).toEqual([]);
    });

    it("should return the right options for scripts with valid external", () => {
        const scriptsExpected = [
            {path: "a"},
            {path: "b", external: {variableName: "B", packageName: "b"}},
            {path: "c"},
        ];
        const theFunction = () =>
            getValidatedOptions(
                {scripts: ["a", {path: "b", external: {variableName: "B", packageName: "b"}}, "c"]},
                "pluginName.options",
                {append: false}
            );
        expect(theFunction).not.toThrow();
        expect(theFunction()).toEqual({
            append: false,
            scripts: scriptsExpected,
            scriptsPrepend: scriptsExpected,
            scriptsAppend: [],
        });
    });

    it("should return the passthrough options for valid options", () => {
        const scripts = ["a", {path: "b", bar: "456", external: {variableName: "B", packageName: "b"}}, "c"];
        const scriptsExpected = [
            {path: "a"},
            {path: "b", bar: "456", external: {variableName: "B", packageName: "b"}},
            {path: "c"},
        ];
        const theFunction = () => getValidatedOptions({scripts, foo: "123"}, "pluginName.options", {append: false});
        expect(theFunction).not.toThrow();
        expect(theFunction()).toEqual({
            append: false,
            foo: "123",
            scripts: scriptsExpected,
            scriptsPrepend: scriptsExpected,
            scriptsAppend: [],
        });
    });
});
