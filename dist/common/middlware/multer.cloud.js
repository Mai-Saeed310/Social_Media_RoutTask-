"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const multer_enum_1 = require("./../enum/multer.enum");
const node_os_1 = require("node:os");
const global_error_handling_1 = require("../utiliti/global-error-handling");
const multerCloud = ({ store_type = multer_enum_1.store_enum.memory, custome_types = multer_enum_1.multer_enum.image, maxFileSize = 5 * 1024 * 1024 }) => {
    const storage = store_type === multer_enum_1.store_enum.memory ? multer_1.default.memoryStorage() : multer_1.default.diskStorage({
        destination: (0, node_os_1.tmpdir)(),
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + "-" + file.originalname);
        }
    });
    function fileFilter(req, file, cb) {
        if (!custome_types.includes(file.mimetype)) {
            cb(new global_error_handling_1.AppError('InValid file type!'));
        }
        else {
            cb(null, true);
        }
    }
    const upload = (0, multer_1.default)({ storage, fileFilter, limits: { fileSize: maxFileSize } });
    return upload;
};
exports.default = multerCloud;
