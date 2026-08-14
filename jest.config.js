/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                isolatedModules: true,
                tsconfig: {
                    module: "CommonJS",
                    moduleResolution: "Node",
                    allowImportingTsExtensions: false,
                    verbatimModuleSyntax: false,
                    esModuleInterop: true,
                },
            },
        ],
    },
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
};
