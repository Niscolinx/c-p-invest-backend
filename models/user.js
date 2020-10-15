const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
    },

    status: {
        type: String,
        default: 'I am new',
        required: true,
    },

    password: {
        type: String,
        required: true,
    },
    fullname: {
        type: String,
        required: true,
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

    posts: [
        {
            type: Schema.Types.ObjectId,
            ref: 'posts',
        },
    ],
})

module.exports = mongoose.model('users', userSchema)
