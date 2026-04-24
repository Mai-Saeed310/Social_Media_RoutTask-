"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const user_enum_1 = require("../common/enum/user.enum");
const hash_security_1 = require("../common/utiliti/security/hash.security");
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
exports.userModel = mongoose_1.default.model("userModel", userSchema);
