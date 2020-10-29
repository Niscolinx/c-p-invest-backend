const mongoose = require('mongoose')
const Schema = mongoose.Schema

const withdrawalSchema = new Schema(
    {
        amount: {
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

module.exports = mongoose.model('deposit', withdrawalSchema)
