import type {Compiler} from "@rspack/core";
import {registerExternals} from "../../src/externals";
import type {TagObject} from "../../src/types";

const compilerWith = (externals?: unknown): Compiler => ({options: {externals}}) as unknown as Compiler;

const reactScript: TagObject[] = [{path: "react.js", external: {packageName: "react", variableName: "React"}}];

describe("registerExternals", () => {
    it("creates an object when externals is undefined", () => {
        const compiler = compilerWith(undefined);
        registerExternals(compiler, reactScript);
        expect(compiler.options.externals).toEqual({react: "React"});
    });

    it("merges into an existing object", () => {
        const compiler = compilerWith({lodash: "_"});
        registerExternals(compiler, reactScript);
        expect(compiler.options.externals).toEqual({lodash: "_", react: "React"});
    });

    it("appends to an existing array without clobbering it", () => {
        const compiler = compilerWith([{lodash: "_"}]);
        registerExternals(compiler, reactScript);
        expect(compiler.options.externals).toEqual([{lodash: "_"}, {react: "React"}]);
    });

    it("wraps a function externals without losing it", () => {
        const fn = () => undefined;
        const compiler = compilerWith(fn);
        registerExternals(compiler, reactScript);
        expect(compiler.options.externals).toEqual([fn, {react: "React"}]);
    });

    it("wraps a string externals without losing it", () => {
        const compiler = compilerWith("jquery");
        registerExternals(compiler, reactScript);
        expect(compiler.options.externals).toEqual(["jquery", {react: "React"}]);
    });

    it("leaves externals untouched when no script declares an external", () => {
        const compiler = compilerWith({lodash: "_"});
        registerExternals(compiler, [{path: "plain.js"}]);
        expect(compiler.options.externals).toEqual({lodash: "_"});
    });
});
