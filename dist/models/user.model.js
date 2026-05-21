"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const user_enum_1 = require("../common/enum/user.enum");
const hash_security_1 = require("../common/utiliti/security/hash.security");
const mini_1 = require("zod/mini");
const userSchema = new mongoose_1.default.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        min: 3,
        max: 25
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        min: 3,
        max: 25
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: function () {
            return this.provider == user_enum_1.providerEnum.Google ? false : true;
        },
        trim: true,
        min: 3,
        max: 25
    },
    age: {
        type: Number,
        required: function () {
            return this.provider == user_enum_1.providerEnum.Google ? false : true;
        },
        trim: true,
        min: 18,
        max: 60
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    gender: {
        type: String,
        enum: user_enum_1.GenderEnum,
        default: user_enum_1.GenderEnum.female
    },
    role: {
        type: String,
        enum: user_enum_1.RoleEnum,
        default: user_enum_1.RoleEnum.user
    },
    confirmed: Boolean,
    changeCredential: Date,
    provider: {
        type: String,
        enum: Object.values(user_enum_1.providerEnum),
        default: user_enum_1.providerEnum.System
    },
    deletedAt: Date,
    profilePic: mini_1.string,
    friends: [{ type: mongoose_1.Types.ObjectId, ref: "userModel" }]
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
userSchema.virtual("userName")
    .get(function () {
    return this.firstName + " " + this.lastName;
})
    .set(function (v) {
    const [firstName, lastName] = v.split(" ");
    this.set({ firstName, lastName });
});
userSchema.pre("save", function () {
    if (this.isModified("password") && this.password) {
        this.password = (0, hash_security_1.Hash)({ plainText: this.password });
    }
});
userSchema.pre("findOne", function () {
    const { paranoid, ...rest } = this.getQuery();
    if (paranoid === false) {
        this.setQuery({ ...rest });
    }
    else {
        this.setQuery({
            ...rest,
            deletedAt: { $exists: false }
        });
    }
});
exports.userModel = mongoose_1.default.model("userModel", userSchema);
