const mongoose = require('mongoose')
const Schema = mongoose.Schema

const activitiesSchema = new Schema(
    {
        onlineDays: {
            type: Number,
            required: true,
        },
        totalMembers: {
            type: Number,
            required: true,
        },
        totalPaidOut: {
            type: Number,
            required: true,
        },
        totalInvestments: {
            type: Number,
            required: true,
        },
        lastDepositName: {
            type: String,
            required: true,
        },

        lastDepositAmount: {
            type: Number,
            required: true,
        },
      
        newestMemberName: {
            type: String,
            required: true,
        },
        newestMemberAmount: {
            type: Number,
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

module.exports = mongoose.model('activities', activitiesSchema)
