import type {TypeString} from "../types";
import {ASSET_TYPE_CSS, ASSET_TYPES} from "./defaults";

type AnyFunction = (...args: unknown[]) => unknown;

/**
 * Runtime type predicates. Kept as an object (and re-exported individually)
 * because the original public `.api` surface exposed `IS`.
 */
export const IS = {
    isDefined: (v: unknown): boolean => v !== undefined,
    isObject: (v: unknown): v is Record<string, unknown> =>
        v !== null && v !== undefined && typeof v === "object" && !Array.isArray(v),
    isBoolean: (v: unknown): v is boolean => v === true || v === false,
    isNumber: (v: unknown): v is number =>
        v !== undefined && (typeof v === "number" || v instanceof Number) && isFinite(v as number),
    isString: (v: unknown): v is string =>
        v !== null && v !== undefined && (typeof v === "string" || v instanceof String),
    isArray: (v: unknown): v is unknown[] => Array.isArray(v),
    isFunction: (v: unknown): v is AnyFunction => typeof v === "function",
};

export const {isDefined, isObject, isBoolean, isNumber, isString, isArray, isFunction} = IS;

export const isValidAttributeValue = (v: unknown): v is string | boolean | number =>
    isString(v) || isBoolean(v) || isNumber(v);

export const isType = (type: unknown): type is TypeString => ASSET_TYPES.indexOf(type as TypeString) !== -1;

export const isTypeCss = (type: unknown): boolean => type === ASSET_TYPE_CSS;

export const isFunctionReturningString = (v: unknown): boolean => isFunction(v) && isString(v("", ""));

export const isArrayOfString = (v: unknown): v is string[] => isArray(v) && v.every(i => isString(i));
