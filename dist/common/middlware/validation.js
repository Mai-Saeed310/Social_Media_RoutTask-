"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validation = void 0;
const global_error_handling_1 = require("../utiliti/global-error-handling");
const Validation = (schema) => {
    return (req, res, next) => {
        const validationError = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            const result = schema[key].safeParse(req[key]);
            if (!result.success) {
                validationError.push(result.error.message);
            }
        }
        if (validationError.length > 0) {
            throw new global_error_handling_1.AppError(JSON.parse(validationError), 400);
        }
        next();
    };
};
exports.Validation = Validation;
