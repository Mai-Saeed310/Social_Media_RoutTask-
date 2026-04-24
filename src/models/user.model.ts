import mongoose, { Types } from "mongoose";
import { GenderEnum, providerEnum, RoleEnum } from "../common/enum/user.enum";
import { Hash } from "../common/utiliti/security/hash.security";



export interface IUser {
    _id: Types.ObjectId,
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    age: number,
    phone?: string,
    address?: string,
    gender?: GenderEnum,
    role?: RoleEnum,
    confirmed?: boolean,
    changeCredential?: Date,
    createdAt: Date,
    updatedAt: Date,
    provider: string
}


const userSchema = new mongoose.Schema<IUser>({
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
    required: function () : boolean{
        return this.provider == providerEnum.Google ? false : true
    },   
    trim: true,
    min: 3,
    max: 25
    },
    age: {
        type: Number,
        required: function () : boolean{
        return this.provider == providerEnum.Google ? false : true
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
        enum: GenderEnum,
        default: GenderEnum.female
    },
    role: {
        type: String,
        enum: RoleEnum,
        default: RoleEnum.user
    },
    confirmed: Boolean,
    changeCredential: Date,
    provider: {
        type: String,
        enum: Object.values(providerEnum),
        default: providerEnum.System
    },

}, {
  timestamps: true,
  strictQuery: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// --- Virtuals ---
userSchema.virtual("userName")
    .get(function () {
        return this.firstName + " " + this.lastName
    })
    .set(function (v: string) {
        const [firstName, lastName] = v.split(" ")
        this.set({ firstName, lastName })
    })



// hooks
userSchema.pre("save", function () {

  // hash password
  if (this.isModified("password") && this.password) {
    this.password = Hash({ plainText: this.password });
  }

});



// create model
export const userModel = mongoose.model<IUser>("userModel", userSchema);

