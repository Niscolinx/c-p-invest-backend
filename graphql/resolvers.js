const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const User = require('../models/user')
const Post = require('../models/post')

const fileDelete = require('../utility/deleteFile')

module.exports = {
    createUser: async function ({ userData }, req) {
        const error = []
        if (
            !validator.isEmail(userData.email) ||
            validator.isEmpty(userData.email)
        ) {
            error.push({ message: 'Invalid Email Field' })
        }
        if (
            !validator.isLength(userData.username, { min: 5 }) ||
            validator.isEmpty(userData.username)
        ) {
            error.push({
                message: 'Username must be at least 5 characters long',
            })
        }
        if (
            !validator.isLength(userData.password, { min: 5 }) ||
            validator.isEmpty(userData.password)
        ) {
            error.push({
                message: 'Password must be at least 5 characters long',
            })
        }

        if (error.length > 0) {
            const err = new Error('Invalid User Input')
            err.statusCode = 422
            err.data = error
            throw err
        }

        const existingUser = await User.findOne({ email: userData.email })

        if (existingUser) {
            const error = new Error('User already exists')
            throw error
        }
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 12)

            if (hashedPassword) {
                const newUser = new User({
                    username: userData.username,
                    email: userData.email,
                    password: hashedPassword,
                })

                const createdUser = await newUser.save()

                if (createdUser) {
                    return {
                        ...createdUser._doc,
                        _id: createdUser._id.toString(),
                    }
                }
            }
        } catch (err) {
            throw new Error(err)
        }
    },

    login: async function ({ email, password }) {
        const error = []
        if (!validator.isEmail(email) || validator.isEmpty(email)) {
            error.push({ message: 'Invalid Email Field' })
        }

        if (
            !validator.isLength(password, { min: 5 }) ||
            validator.isEmpty(password)
        ) {
            error.push({
                message: 'Password must be at least 5 characters long',
            })
        }

        if (error.length > 0) {
            const err = new Error('Invalid User Input')
            err.statusCode = 422
            err.data = error
            throw err
        }

        const userExits = await User.findOne({ email })

        if (!userExits) {
            const error = new Error('User does not exist')
            error.statusCode = 401
            throw error
        }

        const checkPassword = await bcrypt.compare(password, userExits.password)

        if (!checkPassword) {
            const error = new Error('Incorrect Password')
            error.statusCode = 401
            throw error
        }

        const token = jwt.sign(
            { email: userExits.email, userId: userExits._id.toString() },
            'supersecretkey',
            { expiresIn: '1hr' }
        )

        return {
            userId: userExits._id.toString(),
            token,
        }
    },

    getUser: async function (arg, req) {
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }
        const user = await User.findById(req.userId)

        if (!user) {
            const error = new Error('User not found')
            error.statusCode = 404
            throw error
        }

        return {
            ...user._doc,
            _id: user._id.toString(),
        }
    },

    createPost: async function ({ postData }, req) {
        const error = []

        if (
            !validator.isLength(postData.title, { min: 5 }) ||
            validator.isEmpty(postData.title)
        ) {
            error.push({
                message: 'title must be at least 5 characters long',
            })
        }
        if (
            !validator.isLength(postData.content, { min: 5 }) ||
            validator.isEmpty(postData.content)
        ) {
            error.push({
                message: 'Content must be at least 5 characters long',
            })
        }

        if (error.length > 0) {
            const err = new Error('Invalid post data')
            err.statusCode = 422
            err.data = error
            throw err
        }

        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        const user = await User.findById(req.userId)

        if (!user) {
            const err = new Error('Invalid User')
            err.statusCode = 422
            throw err
        }

        const post = new Post({
            title: postData.title,
            content: postData.content,
            imageUrl: postData.imageUrl,
            creator: user,
        })

        const savePost = await post.save()

        user.posts.push(savePost)

        await user.save()

        return {
            ...savePost._doc,
            _id: savePost._id.toString(),
            createdAt: savePost.createdAt.toISOString(),
            updatedAt: savePost.updatedAt.toISOString(),
        }
    },
    updatePost: async function ({ id, postData }, req) {
        const error = []

        if (
            !validator.isLength(postData.title, { min: 5 }) ||
            validator.isEmpty(postData.title)
        ) {
            error.push({
                message: 'title must be at least 5 characters long',
            })
        }
        if (
            !validator.isLength(postData.content, { min: 5 }) ||
            validator.isEmpty(postData.content)
        ) {
            error.push({
                message: 'Content must be at least 5 characters long',
            })
        }

        if (error.length > 0) {
            const err = new Error('Invalid post data')
            err.statusCode = 422
            err.data = error
            throw err
        }

        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        const post = await Post.findById(id).populate('creator')

        if (!post) {
            const error = new Error('Post was not found!')
            error.statusCode = 404
            throw error
        }

        if (post.creator._id.toString() !== req.userId.toString()) {
            const error = new Error('Not authorized!')
            error.statusCode = 403
            throw error
        }

        post.title = postData.title
        post.content = postData.content
        if (postData.imageUrl !== 'undefined') {
            post.imageUrl = postData.imageUrl
        }

        const updatedPost = await post.save()

        return {
            ...updatedPost._doc,
            _id: updatedPost._id.toString(),
            createdAt: updatedPost.createdAt.toISOString(),
            updatedAt: updatedPost.updatedAt.toISOString(),
        }
    },

    deletePost: async function ({ id }, req) {
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        const postToDelete = await Post.findById(id).populate('creator')

        if (!postToDelete) {
            const error = new Error('Post not found!')
            error.statusCode = 404
            throw error
        }

        if (postToDelete.creator._id.toString() !== req.userId.toString()) {
            const error = new Error('Not authorized')
            error.statusCode = 403
            throw error
        }
        let imageUrl
        if (postToDelete.imageUrl) {
            imageUrl = postToDelete.imageUrl
        }
        const deletedPost = await Post.findOneAndDelete(id)

        if (imageUrl) {
            fileDelete.deleteFile(imageUrl)
        }

        const userOfDeletedPost = await User.findById(deletedPost.creator)

        userOfDeletedPost.posts.pull(deletedPost._id)

        userOfDeletedPost.save()

        return true
    },

    getPosts: async function ({ page }, req) {
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        if (!page) {
            page = 1
        }

        const perPage = 2
        const totalPosts = await Post.find().countDocuments()
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .populate('creator')

        const lastPage = perPage

        return {
            Post: posts.map((p) => {
                return {
                    ...p._doc,
                    _id: p._id.toString(),
                    status: p.creator.status,
                    createdAt: p.createdAt.toISOString(),
                    updatedAt: p.updatedAt.toISOString(),
                }
            }),
            totalPosts,
            lastPage,
        }
    },

    post: async function ({ id }, req) {
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        const post = await Post.findById(id).populate('creator')

        if (!post) {
            const error = new Error('post not found!')
            error.statusCode = 404
            throw error
        }

        return {
            ...post._doc,
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
        }
    },

    updateStatus: async function ({ status }, req) {
        console.log('Reached the update status')
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }
        const user = await User.findById(req.userId)

        user.status = status
        const updatedUser = await user.save()

        return {
            ...updatedUser._doc,
            _id: updatedUser._id.toString(),
        }
    },
}
