import HtmlRspackTagsPlugin from "../../src";
import type {Options} from "../../src";
import {FIXTURES_PATH} from "../helpers/paths";

// Most of these cases deliberately pass invalid option shapes to assert the
// runtime validation, so we funnel construction through a thunk that casts.
const plugin =
    (options?: unknown): (() => HtmlRspackTagsPlugin) =>
    () =>
        new HtmlRspackTagsPlugin(options as Options);

describe("option validation", () => {
    it("should throw an error if no options are provided", () => {
        expect(plugin()).toThrow(/(options should be an object)/);
    });

    it("should throw an error if the options are not an object", () => {
        expect(plugin("hello")).toThrow(/(options should be an object)/);
    });

    it("should not throw an error if the options is an empty object", () => {
        expect(plugin({})).not.toThrow();
    });

    describe("options.jsExtensions", () => {
        it("should throw an error if the jsExtensions is not an array or string", () => {
            expect(plugin({tags: [], append: false, jsExtensions: 123})).toThrow(
                /(options\.jsExtensions should be a string or array of strings)/
            );
        });

        it("should throw an error if any of the jsExtensions are not a string", () => {
            expect(plugin({tags: [], append: false, jsExtensions: ["a", 123, "b"]})).toThrow(
                /(options\.jsExtensions array should only contain strings)/
            );
        });
    });

    describe("options.cssExtensions", () => {
        it("should throw an error if the cssExtensions is not an array or string", () => {
            expect(plugin({tags: [], append: false, cssExtensions: 123})).toThrow(
                /(options\.cssExtensions should be a string or array of strings)/
            );
        });

        it("should throw an error if any of the cssExtensions are not a string", () => {
            expect(plugin({tags: [], append: false, cssExtensions: ["a", 123, "b"]})).toThrow(
                /(options\.cssExtensions array should only contain strings)/
            );
        });
    });

    describe("options.append", () => {
        it("should not throw an error if the append flag is not provided", () => {
            expect(plugin({tags: []})).not.toThrow();
        });

        it("should throw an error if the append flag is not a boolean", () => {
            expect(plugin({tags: [], append: "hello"})).toThrow(/(options.append should be a boolean)/);
        });
    });

    describe("options.publicPath", () => {
        it("should throw an error if the publicPath option is not a boolean or string or a function", () => {
            expect(plugin({publicPath: 123})).toThrow(
                /(options.publicPath should be a boolean or a string or a function)/
            );
        });

        it("should throw an error if the usePublicPath flag is not a boolean", () => {
            expect(plugin({usePublicPath: 123})).toThrow(/(options.usePublicPath should be a boolean)/);
        });

        it("should throw an error if the addPublicPath option is not a function", () => {
            expect(plugin({addPublicPath: 123})).toThrow(/(options.addPublicPath should be a function)/);
        });

        it("should throw an error if publicPath and usePublicPath are specified together", () => {
            expect(plugin({publicPath: true, usePublicPath: false})).toThrow(
                /(options.publicPath should not be used with either usePublicPath or addPublicPath)/
            );
        });

        it("should throw an error if publicPath and addPublicPath are specified together", () => {
            expect(plugin({publicPath: true, addPublicPath: () => ""})).toThrow(
                /(options.publicPath should not be used with either usePublicPath or addPublicPath)/
            );
        });
    });

    describe("options.hash", () => {
        it("should throw an error if the hash option is not a boolean or string or a function", () => {
            const nonBooleanCheck = [123, /regex/, [], {}];
            nonBooleanCheck.forEach(val => {
                expect(plugin({tags: [], append: true, publicPath: true, hash: val})).toThrow(
                    /(options.hash should be a boolean or a string or a function that returns a string)/
                );
            });
        });

        it("should throw an error if the hash is a number", () => {
            expect(plugin({hash: 123})).toThrow(
                /(options.hash should be a boolean or a string or a function that returns a string)/
            );
        });

        it("should throw an error if the useHash flag is not a boolean", () => {
            expect(plugin({useHash: 123})).toThrow(/(options.useHash should be a boolean)/);
        });

        it("should throw an error if the addHash option is not a function", () => {
            expect(plugin({addHash: 123})).toThrow(/(options.addHash should be a function that returns a string)/);
        });

        it("should throw an error if hash and useHash are specified together", () => {
            expect(plugin({hash: true, useHash: false})).toThrow(
                /(options.hash should not be used with either useHash or addHash)/
            );
        });

        it("should throw an error if hash and addHash are specified together", () => {
            expect(plugin({hash: true, addHash: () => ""})).toThrow(
                /(options.hash should not be used with either useHash or addHash)/
            );
        });
    });

    describe("options.prependExternals", () => {
        it("should throw an error if prependExternals is not a boolean", () => {
            const nonBooleanCheck = [123, "true", /regex/, {}];
            nonBooleanCheck.forEach(val => {
                expect(plugin({prependExternals: val})).toThrow(/(options\.prependExternals should be a boolean)/);
            });
        });

        it("should not throw an error if prependExternals is true", () => {
            expect(plugin({prependExternals: true})).not.toThrow();
        });

        it("should not throw an error if prependExternals is false", () => {
            expect(plugin({prependExternals: false})).not.toThrow();
        });
    });

    describe("options.files", () => {
        it("should throw an error if the files option is not a string", () => {
            const nonStringCheck = [123, true, /regex/, {}];
            nonStringCheck.forEach(val => {
                expect(plugin({tags: [], append: true, publicPath: true, files: val})).toThrow(
                    /(options\.files should be a string or array of strings)/
                );
            });
        });

        it("should throw an error if any of the files options are not strings", () => {
            expect(plugin({tags: ["foo.js", "bar.css"], append: false, files: ["abc", true, "def"]})).toThrow(
                /(options\.files should be a string or array of strings)/
            );
        });
    });

    describe("options.metas", () => {
        it("should throw an error if metas is a string", () => {
            expect(plugin({metas: "a string"})).toThrow(/(options.metas should be an object or array)/);
        });

        it("should throw an error if metas is an object without attributes", () => {
            expect(plugin({metas: {path: "abc"}})).toThrow(
                /(options.metas object must have an object attributes property)/
            );
        });

        it("should throw an error if metas is an object with non string path", () => {
            expect(plugin({metas: {attributes: {a: "b"}, path: 123}})).toThrow(
                /(options.metas object should have a string path property)/
            );
        });

        it("should throw an error if metas is an array containing a string", () => {
            expect(plugin({metas: [{attributes: {a: 1}, path: "a"}, "", {attributes: {b: 2}, path: "b"}]})).toThrow(
                /(options.metas items must be an object)/
            );
        });

        it("should throw an error if metas is an object with empty attributes", () => {
            expect(plugin({metas: {attributes: {}, path: "b"}})).toThrow(
                /(options.metas object must have a non empty object attributes property)/
            );
        });

        it("should throw an error if metas is an array containing an object with empty attributes", () => {
            expect(
                plugin({
                    metas: [
                        {attributes: {a: 1}, path: "a"},
                        {attributes: {}, path: "b"},
                    ],
                })
            ).toThrow(/(options.metas object must have a non empty object attributes property)/);
        });

        it("should throw an error if metas has glob without path", () => {
            expect(plugin({metas: {attributes: {a: 1}, glob: "a"}})).toThrow(
                /(options.metas object must have a path property when glob is used)/
            );
        });
    });

    describe("options[tags|links|scripts]", () => {
        runTestsForOption("tags", false, runTestsForAssetType);
        runTestsForOption("tags", true, runTestsForAssetType);
        runTestsForOption("links", false);
        runTestsForOption("scripts", true);
    });
});

function runTestsForOption(
    optionName: "tags" | "links" | "scripts",
    isScript: boolean,
    runExtraTests?: (ext: string) => void
): void {
    const ext = isScript ? ".js" : ".css";
    describe(`options.${optionName}`, () => {
        it(`should throw an error if the ${optionName} are not an array or string or object`, () => {
            expect(plugin({[optionName]: 123})).toThrow(
                new RegExp(`(options.${optionName} should be a string, object, or array)`)
            );
        });

        it(`should throw an error if the ${optionName} contains objects and a boolean`, () => {
            expect(plugin({[optionName]: [{path: `a${ext}`}, false, {path: `b${ext}`}]})).toThrow(
                new RegExp(`(options.${optionName} items must be an object or string)`)
            );
        });

        it(`should throw an error if the ${optionName} contains string and a boolean`, () => {
            expect(plugin({[optionName]: [`foo${ext}`, true, `bar${ext}`]})).toThrow(
                new RegExp(`(options.${optionName} items must be an object or string)`)
            );
        });

        it(`should not throw an error if the ${optionName} contains strings and objects`, () => {
            expect(plugin({[optionName]: [`foo${ext}`, {path: `file${ext}`}, `bar${ext}`]})).not.toThrow();
        });
    });

    describe(`options.${optionName} path`, () => {
        it(`should throw an error if the ${optionName} contains an element that is an empty object`, () => {
            expect(plugin({[optionName]: [{path: `a${ext}`}, {}, {path: `b${ext}`}]})).toThrow(
                new RegExp(`(options.${optionName} object must have a string path property)`)
            );
        });

        it(`should throw an error if the ${optionName} contains an element that is an object with a non string path`, () => {
            expect(plugin({[optionName]: [{path: `a${ext}`}, {path: 123, type: "js"}, {path: `c${ext}`}]})).toThrow(
                new RegExp(`(options.${optionName} object must have a string path property)`)
            );
        });

        it(`should not throw an error if the ${optionName} contains elements that are all objects that have a path`, () => {
            expect(plugin({[optionName]: [{path: `a${ext}`}, {path: `b${ext}`}, {path: `c${ext}`}]})).not.toThrow();
        });
    });

    describe(`options.${optionName} append`, () => {
        it(`should throw an error if the ${optionName} contains an element that is an object with a non boolean append`, () => {
            expect(
                plugin({[optionName]: [{path: `a${ext}`}, {path: `b${ext}`, append: 123}, {path: `c${ext}`}]})
            ).toThrow(new RegExp(`(options.${optionName}.append should be a boolean)`));
        });

        it(`should not throw an error if the ${optionName} contains elements that are all objects that have a boolean append`, () => {
            expect(
                plugin({
                    [optionName]: [
                        {path: `a${ext}`, append: true},
                        {path: `b${ext}`, append: false},
                        {path: `c${ext}`, append: true},
                    ],
                })
            ).not.toThrow();
        });
    });

    describe(`options.${optionName} publicPath`, () => {
        it(`should not throw an error if the ${optionName} contains an element that is an object with publicPath set to string`, () => {
            expect(
                plugin({
                    [optionName]: [
                        {path: `a${ext}`},
                        {path: `b${ext}`, publicPath: "my-public-path"},
                        {path: `c${ext}`},
                    ],
                })
            ).not.toThrow();
        });

        it(`should throw an error if the ${optionName} contains an element that is an object with publicPath set to object`, () => {
            expect(
                plugin({[optionName]: [{path: `a${ext}`}, {path: `b${ext}`, publicPath: {}}, {path: `c${ext}`}]})
            ).toThrow(
                new RegExp(
                    `(options.${optionName}.publicPath should be a boolean or a string or a function that returns a string)`
                )
            );
        });

        it(`should throw an error if the ${optionName} contains an element that is an object with publicPath set to number`, () => {
            expect(
                plugin({[optionName]: [{path: `a${ext}`}, {path: `b${ext}`, publicPath: 0}, {path: `c${ext}`}]})
            ).toThrow(
                new RegExp(
                    `(options.${optionName}.publicPath should be a boolean or a string or a function that returns a string)`
                )
            );
        });

        it(`should throw an error if the ${optionName} contains an element that is an object with publicPath set to array`, () => {
            expect(
                plugin({[optionName]: [{path: `a${ext}`}, {path: `b${ext}`, publicPath: []}, {path: `c${ext}`}]})
            ).toThrow(
                new RegExp(
                    `(options.${optionName}.publicPath should be a boolean or a string or a function that returns a string)`
                )
            );
        });

        it(`should not throw an error if the ${optionName} contains an element that is an object with publicPath set to true`, () => {
            expect(
                plugin({[optionName]: [{path: `a${ext}`, publicPath: true}, {path: `b${ext}`}, {path: `c${ext}`}]})
            ).not.toThrow();
        });
    });

    describe(`options.${optionName} attributes`, () => {
        it(`should throw an error if the ${optionName} contains an element that is an object with non object string attributes`, () => {
            expect(
                plugin({[optionName]: [{path: `a${ext}`}, {path: `b${ext}`, attributes: ""}, {path: `c${ext}`}]})
            ).toThrow(new RegExp(`(options.${optionName} object should have an object attributes property)`));
        });

        it(`should throw an error if the ${optionName} contains an element that is an object with array attributes`, () => {
            expect(
                plugin({[optionName]: [{path: `a${ext}`}, {path: `b${ext}`, attributes: []}, {path: `c${ext}`}]})
            ).toThrow(new RegExp(`(options.${optionName} object should have an object attributes property)`));
        });

        it(`should throw an error if the ${optionName} contains an element that is an object with number attributes`, () => {
            expect(
                plugin({[optionName]: [{path: `a${ext}`}, {path: `b${ext}`, attributes: 0}, {path: `c${ext}`}]})
            ).toThrow(new RegExp(`(options.${optionName} object should have an object attributes property)`));
        });

        it(`should throw an error if the ${optionName} contains an element that is an object with boolean attributes`, () => {
            expect(
                plugin({[optionName]: [{path: `a${ext}`}, {path: `b${ext}`, attributes: true}, {path: `c${ext}`}]})
            ).toThrow(new RegExp(`(options.${optionName} object should have an object attributes property)`));
        });

        it(`should not throw an error if the ${optionName} contains an element that is an object with empty object attributes`, () => {
            expect(
                plugin({[optionName]: [{path: `a${ext}`}, {path: `b${ext}`, attributes: {}}, {path: `c${ext}`}]})
            ).not.toThrow();
        });

        it("should throw an error if any of the tags options are objects with an attributes property that is not an object", () => {
            expect(
                plugin({tags: [`foo${ext}`, {path: `pathWithExtension${ext}`, attributes: "foobar"}, `bar${ext}`]})
            ).toThrow(/(options\.tags object should have an object attributes property)/);
        });

        it("should throw an error if any of the tags options are objects with an attributes property with non string or boolean values", () => {
            expect(
                plugin({
                    tags: [
                        `foo${ext}`,
                        {
                            path: `pathWithExtension${ext}`,
                            attributes: {crossorigin: "crossorigin", id: null, enabled: true},
                        },
                        `bar${ext}`,
                    ],
                })
            ).toThrow(/(options\.tags object attribute values should be strings, booleans or numbers)/);
        });

        it("should not throw an error if any of the tags options are objects with an attributes property with string or boolean values", () => {
            expect(
                plugin({
                    tags: [
                        `foo${ext}`,
                        {
                            path: `pathWithExtension${ext}`,
                            attributes: {crossorigin: "crossorigin", id: "test", enabled: true},
                        },
                        `bar${ext}`,
                    ],
                })
            ).not.toThrow();
        });

        it("should not throw an error if any of the tags options are objects without an attributes property", () => {
            expect(plugin({tags: [`foo${ext}`, {path: `pathWithExtension${ext}`}, `bar${ext}`]})).not.toThrow();
        });
    });

    describe(`options.${optionName} glob`, () => {
        it(`should throw an error if any of the ${optionName} options are objects with a glob property that is not a string`, () => {
            expect(
                plugin({[optionName]: [`foo${ext}`, {path: `a${ext}`, glob: 123, type: "js"}, `bar${ext}`]})
            ).toThrow(new RegExp(`(options.${optionName} object should have a string glob property)`));
        });

        it(`should throw an error if any of the ${optionName} options are objects with a globPath property that is not a string`, () => {
            expect(
                plugin({[optionName]: [`foo${ext}`, {path: `a${ext}`, globPath: 123, type: "js"}, `bar${ext}`]})
            ).toThrow(new RegExp(`(options.${optionName} object should have a string glob property)`));
        });

        it(`should throw an error if any of the ${optionName} options are objects with a globFlatten property that is not a boolean`, () => {
            expect(
                plugin({
                    [optionName]: [
                        `foo${ext}`,
                        {path: "", globPath: FIXTURES_PATH, glob: `*${ext}`, globFlatten: 123},
                        `bar${ext}`,
                    ],
                })
            ).toThrow(new RegExp(`(options.${optionName} object should have a boolean globFlatten property)`));
        });

        it(`should throw an error if any of the ${optionName} options are objects with glob specified but globPath missing`, () => {
            expect(
                plugin({
                    [optionName]: [
                        `foo${ext}`,
                        {path: `pathWithExtension${ext}`, glob: "withoutExtensions*"},
                        `bar${ext}`,
                    ],
                    append: false,
                })
            ).toThrow(new RegExp(`(options.${optionName} object should have a string globPath property)`));
        });

        it(`should throw an error if any of the ${optionName} options are objects with globPath specified but glob missing`, () => {
            expect(
                plugin({
                    [optionName]: [
                        `foo${ext}`,
                        {path: `pathWithExtension${ext}`, globPath: "withoutExtensions*"},
                        `bar${ext}`,
                    ],
                    append: false,
                })
            ).toThrow(new RegExp(`(options.${optionName} object should have a string glob property)`));
        });

        it(`should throw an error if any of the ${optionName} options are objects with glob that does not match any files`, () => {
            expect(
                plugin({
                    [optionName]: [{path: "assets/", globPath: FIXTURES_PATH, glob: `nonexistant*${ext}`}],
                    append: true,
                })
            ).toThrow(new RegExp(`(options.${optionName} object glob found no files)`));
        });
    });

    describe(`options.${optionName} sourcePath`, () => {
        it(`should throw an error if any of the ${optionName} options are objects with an sourcePath property that is not a string`, () => {
            expect(
                plugin({[optionName]: [`foo${ext}`, {path: `a${ext}`, sourcePath: 123, type: "js"}, `bar${ext}`]})
            ).toThrow(new RegExp(`(options.${optionName} object should have a string sourcePath property)`));
        });
    });

    describe(`options.${optionName} external`, () => {
        it(`should throw an error if any of the ${optionName} options are objects with external property that is not an object`, () => {
            const theFunction = plugin({[optionName]: [`foo${ext}`, {path: `a${ext}`, external: 123}, `bar${ext}`]});
            if (isScript) {
                expect(theFunction).toThrow(new RegExp(`(options.${optionName}.external should be an object)`));
            } else {
                expect(theFunction).toThrow(
                    new RegExp(`(options.${optionName}.external should not be used on non script tags)`)
                );
            }
        });

        if (isScript) {
            it(`should not throw an error if any of the ${optionName} options are objects with valid external objects`, () => {
                expect(
                    plugin({
                        [optionName]: [
                            `foo${ext}`,
                            {path: `a${ext}`, external: {packageName: "a", variableName: "A"}},
                            `bar${ext}`,
                        ],
                    })
                ).not.toThrow();
            });

            it(`should throw an error if any of the ${optionName} options are objects with external that is an empty object`, () => {
                expect(plugin({[optionName]: [`foo${ext}`, {path: `a${ext}`, external: {}}, `bar${ext}`]})).toThrow(
                    new RegExp(
                        `(options.${optionName}.external should have a string packageName and variableName property)`
                    )
                );
            });

            it(`should throw an error if any of the ${optionName} options are objects with external that has packageName but not variableName string properties`, () => {
                expect(
                    plugin({[optionName]: [`foo${ext}`, {path: `a${ext}`, external: {packageName: "a"}}, `bar${ext}`]})
                ).toThrow(new RegExp(`(options.${optionName}.external should have a string variableName property)`));
            });

            it(`should throw an error if any of the ${optionName} options are objects with external that has variableName but not packageName string properties`, () => {
                expect(
                    plugin({[optionName]: [`foo${ext}`, {path: `a${ext}`, external: {variableName: "A"}}, `bar${ext}`]})
                ).toThrow(new RegExp(`(options.${optionName}.external should have a string packageName property)`));
            });
        }
    });

    if (runExtraTests) {
        runExtraTests(ext);
    }
}

function runTestsForAssetType(ext: string): void {
    describe("options.tags type", () => {
        it("should throw an error if any of the tags options are objects with an invalid type property", () => {
            expect(plugin({tags: [`foo${ext}`, {path: `baz${ext}`, type: "foo"}, `bar${ext}`], append: false})).toThrow(
                /(options\.tags type must be css or js \(foo\))/
            );
        });

        it("should throw an error if any of the tags options do not end with .css or .js", () => {
            expect(plugin({tags: ["foo.css", "bad.txt", "bar.js"], append: false})).toThrow(
                /(options\.tags could not determine asset type for \(bad\.txt\))/
            );
        });

        it("should throw an error if any of the tags options are objects without a type property that cannot be inferred from the path", () => {
            expect(plugin({tags: [`foo${ext}`, {path: "pathWithoutExtension"}, `bar${ext}`], append: false})).toThrow(
                /(options\.tags could not determine asset type for \(pathWithoutExtension\))/
            );
        });

        it("should not throw an error if any of the tags options are objects without a type property that can be inferred from the path", () => {
            expect(
                plugin({tags: [`foo${ext}`, {path: `pathWithExtension${ext}`}, `bar${ext}`], append: false})
            ).not.toThrow();
        });

        it("should not throw an error if any of the tags options are objects without a type property that can be inferred from the glob", () => {
            expect(
                plugin({
                    tags: [`foo${ext}`, {path: "", globPath: FIXTURES_PATH, glob: `glo*${ext}`}, `bar${ext}`],
                    append: false,
                })
            ).not.toThrow();
        });
    });
}
