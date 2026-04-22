"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerEnum = exports.RoleEnum = exports.GenderEnum = void 0;
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["male"] = "Male";
    GenderEnum["female"] = "Female";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["user"] = "User";
    RoleEnum["admin"] = "Admin";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
exports.providerEnum = {
    System: "System",
    Google: "Google"
};
