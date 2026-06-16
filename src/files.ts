import {minimatch} from "minimatch";

export interface SkippableData {
    outputName: string;
}

/**
 * Build the predicate that decides whether a given generated HTML file should
 * be skipped. When `files` is provided, tags are only injected into HTML
 * outputs whose `outputName` matches one of the (minimatch) patterns.
 */
export function getShouldSkip(files?: string[]): (data: SkippableData) => boolean {
    if (files === undefined) {
        return () => false;
    }
    return data => !files.some(file => minimatch(data.outputName, file));
}
