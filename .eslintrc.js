module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "commonjs" : true,
        "node" : true,
        "jquery" : true,
        "mongo" : true
    },
    "parserOptions": {
        "ecmaVersion": 6,
        "sourceType": "module",
        "ecmaFeatures": {
            "jsx": true,
            "experimentalObjectRestSpread": true
        }
    },
    rules: {
        // overrides
        "linebreak-style": ["error", "windows"],
        "require-jsdoc": ["error", {
            "require": {
                "FunctionDeclaration": false,
                "MethodDefinition": false,
                "ClassDeclaration": false,
                "ArrowFunctionExpression": false,
                "FunctionExpression": false
            }
        }],
        "max-len": ["error", { "code": 'off' }],
        'no-console': 'off',
        "indent": ["error", 4, { ImportDeclaration: 1 }],
        "prefer-const": ["error", {"destructuring": "all"}]
    },
    "extends": ["eslint:recommended", "google"]
};