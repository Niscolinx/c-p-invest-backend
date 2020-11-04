const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
        },

        email: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            default: 'Customer',
            required: true,
        },

        status: {
            type: String,
            required: true,
            default: 'Active',
        },

        password: {
            type: String,
            required: true,
        },
        fullname: {
            type: String,
            required: true,
        },
        country: {
            type: String,
        },
        phoneNumber: {
            type: String,
        },
        city: {
            type: String,
        },
        secretQuestion: {
            type: String,
            required: true,
        },
        secretAnswer: {
            type: String,
            required: true,
        },
        bitcoinAccount: {
            type: String,
        },
        ethereumAccount: {
            type: String,
        },
        notification: {
            type: String,
        },

        fundAccount: [
            {
                type: Schema.Types.ObjectId,
                ref: 'fundAccount',
            },
        ],
        pendingDeposits: [
            {
                type: Schema.Types.ObjectId,
                ref: 'pendingDeposit',
            },
        ],
        pendingWithdrawal: [
            {
                type: Schema.Types.ObjectId,
                ref: 'pendingWithdrawal',
            },
        ],
        totalDeposits: [
            {
                type: Schema.Types.ObjectId,
                ref: 'deposit',
            },
        ],
        totalWithdrawals: [
            {
                type: Schema.Types.ObjectId,
                ref: 'withdraw',
            },
        ],
        totalEarnings: [
            {
                type: Schema.Types.ObjectId,
                ref: 'earning',
            },
        ],

        totalBonus: [
            {
                type: Schema.Types.ObjectId,
                ref: 'bonus'
            },
        ],
        totalPenalty: [
            {
                type: Schema.Types.ObjectId,
                ref: 'penalty'
            },
        ],

        accountBalance: {
            type: Number,
            required: true,
            default: '0',
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('users', userSchema)
