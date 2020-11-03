const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
//const nodeMailer = require('nodemailer')

const User = require('../models/user')
const FundAccount = require('../models/fundAccount')

const fileDelete = require('../utility/deleteFile')

// const mailTransport = nodeMailer.createTransport({
//     host: 'smtp.mailtrap.io',
//     port: 2525,
//     auth: {
//         user: '3d41967e762911',
//         pass: '36b27c6a4a7d02',
//     },
// })

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
            !validator.isLength(userData.username, { min: 3 }) ||
            validator.isEmpty(userData.username)
        ) {
            error.push({
                message: 'Username must be at least 6 characters long',
            })
        }
        if (
            !validator.isLength(userData.password, { min: 6 }) ||
            validator.isEmpty(userData.password)
        ) {
            error.push({
                message: 'Password must be at least 6 characters long',
            })
        }

        if (error.length > 0) {
            const err = new Error('Invalid User Input')
            err.statusCode = 422
            err.data = error
            throw err
        }

        const existingUser = await User.findOne({ email: userData.email })
        const existingUsername = await User.findOne({
            username: userData.username,
        })

        console.log('exiting', existingUser, existingUsername)

        if (existingUser) {
            const error = new Error('User already exists')
            throw error
        }

        if (existingUsername) {
            throw new Error('Username already taken')
        }
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 12)

            if (hashedPassword) {
                const newUser = new User({
                    username: userData.username,
                    email: userData.email,
                    password: hashedPassword,
                    fullname: userData.fullname,
                    secretQuestion: userData.secretQuestion,
                    secretAnswer: userData.secretAnswer,
                    bitcoinAccount: userData.bitcoinAccount,
                    ethereumAccount: userData.ethereumAccount,
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
            !validator.isLength(password, { min: 6 }) ||
            validator.isEmpty(password)
        ) {
            error.push({
                message: 'Password must be at least 6 characters long',
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
            { expiresIn: '2hr' }
        )

        // const mailSent = await mailTransport.sendMail({
        //     to: email,
        //     from: 'support@coinperfectinvestment.com',
        //     subject: 'Successful sign up',
        //     html: '<h3>We welcome you to the home of the best cryto trading and investment!!</h3>'

        // })

        return {
            ...userExits._doc,
            userId: userExits._id.toString(),
            role: userExits._doc.role,
            email: userExits._doc.email,
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

    getUsers: async function (arg, req) {
        console.log('the get users', req.Auth)
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }
        const getUsers = await User.find({ role: 'Customer' })

        console.log('the getUsers', getUsers)

        if (!getUsers) {
            const error = new Error('No Users')
            error.statusCode = 404
            throw error
        }

        return {
            getUser: getUsers.map((p, i) => {
                return {
                    ...p._doc,
                    _id: p._id.toString(),
                    userNO: i + 1,
                    createdAt: p.createdAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                    updatedAt: p.updatedAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                }
            }),
        }
    },

    createFundAccount: async function ({ fundData }, req) {
        console.log('fund account', fundData, req.userId)

        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        const user = await User.findById(req.userId)

        console.log('user', user)

        if (!user) {
            const err = new Error('Invalid User')
            err.statusCode = 422
            throw err
        }

        try {
            const fundAccount = new FundAccount({
                amount: fundData.amount,
                currency: fundData.currency,
                proofUrl: fundData.proofUrl,
                creator: user,
            })

            await fundAccount.save()
            const saveFundAccount = await fundAccount.save()
            console.log('saveAccount', saveFundAccount)

            user.fundAccount.push(saveFundAccount)

            await user.save()

            return {
                ...saveFundAccount._doc,
                _id: saveFundAccount._id.toString(),
                createdAt: saveFundAccount.createdAt.toLocaleString('en-GB', {
                    hour12: true,
                }),
                updatedAt: saveFundAccount.updatedAt.toLocaleString('en-GB', {
                    hour12: true,
                }),
            }
        } catch (err) {
            console.log('err', err)
            throw new Error(err)
        }
    },
    getFunds: async function (arg, req) {
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        const getFunds = await FundAccount.find().populate('creator')

        console.log('getFunds', getFunds)

        if (!getFunds) {
            const err = new Error('Empty Funds')
            err.statusCode = 422
            throw err
        }
        let theCreator = []

        return {
            getFund: getFunds.map((p, i) => {
                theCreator.push({
                    _id: p._id.toString(),
                    creator: p.creator.username,
                    status: p._doc.status,
                    amount: p._doc.amount,
                    currency: p._doc.currency,
                    proofUrl: p._doc.proofUrl,
                    fundNO: i + 1,
                    createdAt: p.createdAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                    updatedAt: p.updatedAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                })
                // return {
                //     ...p._doc,
                //     _id: p._id.toString(),
                //     creator: p.creator,
                //     fundNO: i + 1,
                //     createdAt: p.createdAt.toLocaleString('en-GB', {
                //         hour12: true,
                //     }),
                //     updatedAt: p.updatedAt.toLocaleString('en-GB', {
                //         hour12: true,
                //     }),
                // }
            }),
            fundData: theCreator,
        }
    },
    createApproveFundAccount: async function ({ id }, req) {

        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        const fundAccount = await FundAccount.findById(id).populate('creator')

        if (!fundAccount) {
            const error = new Error('Funds not found!')
            error.statusCode = 404
            throw error
        }

        //Delete Picture
        // post.title = postData.title
        // post.content = postData.content
        // if (postData.imageUrl !== 'undefined') {
        //     post.imageUrl = postData.imageUrl
        // }

        fundAccount.status = 'Approved'

        const updatedFundAccount = await fundAccount.save()

        return {
            ...updatedFundAccount._doc,
            _id: updatedFundAccount._id.toString(),
            createdAt: updatedFundAccount.createdAt.toLocaleString('en-GB', {
                hour12: true,
            }),
            updatedAt: updatedFundAccount.updatedAt.toLocaleString('en-GB', {
                hour12: true,
            }),
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
            createdAt: updatedPost.createdAt.toLocaleString('en-GB', {
                hour12: true,
            }),
            updatedAt: updatedPost.updatedAt.toLocaleString('en-GB', {
                hour12: true,
            }),
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
                    createdAt: p.createdAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                    updatedAt: p.updatedAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
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
            createdAt: post.createdAt.toLocaleString('en-GB', { hour12: true }),
            updatedAt: post.updatedAt.toLocaleString('en-GB', { hour12: true }),
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

    //Profile

    createUpdateProfile: async function ({ updateProfileData }, req) {
        console.log('the create user', updateProfileData)

        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        const existingUser = await User.findOne({
            email: updateProfileData.oldEmail,
        })

        console.log('exiting user', existingUser)

        try {
            // if(updateProfileData.password !== ''){
            //     console.log("to update password")
            //     const hashedPassword = await bcrypt.hash(updateProfileData.password, 12)
            //     exitingUser.password = hashedPassword

            // }
            existingUser.username = updateProfileData.username
            existingUser.email = updateProfileData.email
            existingUser.fullname = updateProfileData.fullname
            existingUser.city = updateProfileData.city
            existingUser.country = updateProfileData.country
            existingUser.phone = updateProfileData.phone
            existingUser.bitcoinAccount = updateProfileData.bitcoinAccount
            existingUser.ethereumAccount = updateProfileData.ethereumAccount

            const updatedUser = await existingUser.save()
            console.log('updated the user', updatedUser)

            if (updatedUser) {
                return {
                    ...updatedUser._doc,
                    _id: updatedUser._id.toString(),
                    updatedAt: updatedUser.updatedAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                    createdAt: updatedUser.createdAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                }
            }
        } catch (err) {
            console.log('update failed', err)
        }
    },
}
