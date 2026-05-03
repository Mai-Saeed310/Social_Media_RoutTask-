"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.store_enum = exports.multer_enum = void 0;
exports.multer_enum = {
    image: ["image/png", "image/jpeg"],
    video: ["video/mp4"],
    pdf: ["application/pdf"]
};
var store_enum;
(function (store_enum) {
    store_enum["disk"] = "disk";
    store_enum["memory"] = "memory";
})(store_enum || (exports.store_enum = store_enum = {}));
