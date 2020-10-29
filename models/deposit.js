import { Schema as _Schema, model } from 'mongoose'
const Schema = _Schema

const depositSchema = new Schema(
    {
        amount: {
            type: String,
            required: true,
        },
        packageName: {
            type: String,
            required: true,
        },
        expiryTime: {
            type: String,
            required: true,
        },
        currency: {
            type: String,
            required: true,
        },
        creator: {
            type: Schema.Types.ObjectId,
            ref: 'users',
            required: true,
        },
    },
    { timestamps: true }
)

export default model('deposit', depositSchema)
