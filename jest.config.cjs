/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: "node",
    roots: ["<rootDir>/test"],
    testMatch: ["**/*.spec.ts"],
    setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
    testTimeout: 60000,
    transformIgnorePatterns: ["/node_modules/(?!(@exodus/bytes|encoding-sniffer)/)"],
    transform: {
        "^.+\\.(t|j)sx?$": [
            "@swc/jest",
            {
                sourceMaps: true,
                module: {type: "commonjs"},
                jsc: {
                    target: "es2022",
                    parser: {syntax: "typescript", tsx: false},
                },
            },
        ],
    },
};
