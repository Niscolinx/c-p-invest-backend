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

    posts: [
        {
            type: Schema.Types.ObjectId,
            ref: 'posts',
        },
    ],
})

module.exports = mongoose.model('users', userSchema)
