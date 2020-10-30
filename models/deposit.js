const mongoose = require('mongoose')
const Schema = mongoose.Schema

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

module.exports = mongoose.model('deposit', depositSchema)
