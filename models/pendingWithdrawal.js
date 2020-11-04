import { Schema as _Schema, model } from 'mongoose'
const Schema = _Schema

const pendingWithdrawal = new Schema(
    {
        amount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            required: true,
            default: 'Pending',
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

module.exports = mongoose.model('pendingWithdrawal', pendingWithdrawal)