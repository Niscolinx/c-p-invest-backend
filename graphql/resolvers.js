const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

//const nodeMailer = require('nodemailer')

const User = require('../models/user')
const Deposit = require('../models/deposit')
const Withdrawal = require('../models/withdrawal')
const PendingDeposit = require('../models/pendingDeposit')
const PendingWithdrawal = require('../models/pendingWithdrawal')
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
            { expiresIn: '3hr' }
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
        const user = await User.findById(req.userId).populate('fundAccount')
        const userPendingDeposits = await User.findById(req.userId).populate(
            'pendingDeposits'
        )

        if (!user) {
            const error = new Error('User not found')
            error.statusCode = 404
            throw error
        }

        const userFundAccount = []
        const userPendingDeposit = []
        let theUser = {}

        try {
            user._doc.fundAccount.map((p, i) => {
                userFundAccount.push({
                    _id: p._id.toString(),
                    creator: p.creator,
                    status: p.status,
                    amount: p.amount,
                    currency: p.currency,
                    createdAt: p.createdAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                    updatedAt: p.updatedAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                })
            })
            userPendingDeposits._doc.pendingDeposits.map((p, i) => {
                userPendingDeposit.push({
                    _id: p._id.toString(),
                    creator: userPendingDeposits.username,
                    planName: p.planName,
                    status: p.status,
                    amount: p.amount,
                    fundNO: i + 1,
                    currency: p.currency,
                    createdAt: p.createdAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                    updatedAt: p.updatedAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                })
            })

            theUser = {
                ...user._doc,
                _id: user._id.toString(),
            }

            return {
                user: theUser,
                userFundAccount,
                userPendingDeposit,
                // userTotalDeposits: user._doc.totalDeposits,
                // userTotalWithdrawals: user._doc.totalWithdrawals,
                // userAccountBalance: user._doc.lastWithdrawal,
            }
        } catch (err) {
            console.log('the error of get user', err)
        }
    },

    getUsers: async function (arg, req) {
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }
        const getUsers = await User.find({ role: 'Customer' })

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
    getAdmin: async function (arg, req) {
        console.log('the admin')
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }
        const getAdmin = await User.findOne({ role: 'Admin' })

        if (!getAdmin) {
            const error = new Error('Admin not found')
            error.statusCode = 404
            throw error
        }

        console.log('the admin', getAdmin)

        return {
            ...p._doc,
            _id: p._id.toString(),
            createdAt: p.createdAt.toLocaleString('en-GB', {
                hour12: true,
            }),
            updatedAt: p.updatedAt.toLocaleString('en-GB', {
                hour12: true,
            })
        }
    },
    getUserHistory: async function (arg, req) {
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }
        const user = await User.findById(req.userId)
        const withdrawal = await Withdrawal.find({creator: req.userId}).populate('creator')
        const deposit = await Deposit.find({creator: req.userId}).populate('creator')

        if (!user) {
            const error = new Error('User not found!')
            error.statusCode = 404
            throw error
        }


        try {
            return {
                getDepositHistory: deposit.map((p, i) => {
                    return {
                        ...p._doc,
                        _id: p._id.toString(),
                        historyNO: i + 1,
                        createdAt: p.createdAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                        updatedAt: p.updatedAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                    }
                }),
                getWithdrawalHistory: withdrawal.map((p, i) => {
                    return {
                        ...p._doc,
                        _id: p._id.toString(),
                        historyNO: i + 1,
                        createdAt: p.createdAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                        updatedAt: p.updatedAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                    }
                }),
            }
        } catch (err) {
            console.log(err)
        }
    },

    createWithdrawNow: async function ({ withdrawNowData }, req) {

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
        const checkPassword = await bcrypt.compare(
            withdrawNowData.password,
            user.password
        )

        if (!checkPassword) {
            const err = new Error('Wrong Password')
            err.statusCode = 422
            throw err
        }

        try {
            const PendingWithdrawalNow = new PendingWithdrawal({
                amount: withdrawNowData.amount,
                currency: withdrawNowData.currency,
                creator: user,
            })

            const savePendingWithdrawNow = await PendingWithdrawalNow.save()

            user.pendingWithdrawal.push(savePendingWithdrawNow)

            await user.save()

            return {
                ...savePendingWithdrawNow._doc,
                _id: savePendingWithdrawNow._id.toString(),
                createdAt: savePendingWithdrawNow.createdAt.toLocaleString(
                    'en-GB',
                    {
                        hour12: true,
                    }
                ),
                updatedAt: savePendingWithdrawNow.updatedAt.toLocaleString(
                    'en-GB',
                    {
                        hour12: true,
                    }
                ),
            }
        } catch (err) {
            console.log('err', err)
            throw new Error(err)
        }
    },

    createInvestNow: async function ({ investNowData }, req) {

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

        try {
            const investNow = new PendingDeposit({
                amount: investNowData.amount,
                planName: investNowData.selectedPlan,
                currency: investNowData.currency,
                creator: user,
            })

            const saveInvestNow = await investNow.save()

            user.pendingDeposits.push(saveInvestNow)

            const userPendingInvest = await user.save()


            return {
                ...saveInvestNow._doc,
                _id: saveInvestNow._id.toString(),
                createdAt: saveInvestNow.createdAt.toLocaleString('en-GB', {
                    hour12: true,
                }),
                updatedAt: saveInvestNow.updatedAt.toLocaleString('en-GB', {
                    hour12: true,
                }),
            }
        } catch (err) {
            console.log('err', err)
            throw new Error(err)
        }
    },
    createFundAccount: async function ({ fundData }, req) {

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

        try {
            const fundAccount = new FundAccount({
                amount: fundData.amount,
                currency: fundData.currency,
                creator: user,
            })

            await fundAccount.save()
            const saveFundAccount = await fundAccount.save()

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

        try {
            const getFunds = await FundAccount.find().populate('creator')

            const pendingDeposit = await PendingDeposit.find().populate(
                'creator'
            )

            const pendingWithdrawal = await PendingWithdrawal.find().populate(
                'creator'
            )
            const allUsersDeposit = await Deposit.find().populate(
                'creator'
            )
            const allUsersWithdrawal = await Withdrawal.find().populate(
                'creator'
            )

            if (!getFunds) {
                const err = new Error('No Funds for Funding')
                err.statusCode = 422
                throw err
            }
            if (!pendingDeposit) {
                const err = new Error('No pending deposit')
                err.statusCode = 422
                throw err
            }
            if (!pendingWithdrawal) {
                const err = new Error('No pending withdrawal')
                err.statusCode = 422
                throw err
            }
            if (!allUsersDeposit) {
                const err = new Error('No Users deposit')
                err.statusCode = 422
                throw err
            }
            if (!allUsersWithdrawal) {
                const err = new Error('No Users withdrawal')
                err.statusCode = 422
                throw err
            }
            const theCreator = []
            const thePendingDeposit = []
            const thePendingWithdrawal = []
            const theAllUsersDeposit = []
            const theAllUsersWithdrawal = []

            return {
                getFund: getFunds.map((p, i) => {
                    theCreator.push({
                        _id: p._id.toString(),
                        creator: p.creator.username,
                        status: p._doc.status,
                        amount: p._doc.amount,
                        currency: p._doc.currency,
                        fundNO: i + 1,
                        createdAt: p.createdAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                        updatedAt: p.updatedAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                    })
                    return {
                        ...p._doc,
                        _id: p._id.toString(),
                    }
                }),
                getPendingDeposit: pendingDeposit.map((p, i) => {
                    thePendingDeposit.push({
                        _id: p._id.toString(),
                        creator: p.creator.username,
                        status: p._doc.status,
                        planName: p._doc.planName,
                        amount: p._doc.amount,
                        currency: p._doc.currency,
                        fundNO: i + 1,
                        createdAt: p.createdAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                        updatedAt: p.updatedAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                    })
                    return {
                        ...p._doc,
                        _id: p._id.toString(),
                    }
                }),
                getPendingWithdrawal: pendingWithdrawal.map((p, i) => {
                    thePendingWithdrawal.push({
                        _id: p._id.toString(),
                        creator: p.creator.username,
                        status: p._doc.status,
                        planName: p._doc.planName,
                        amount: p._doc.amount,
                        currency: p._doc.currency,
                        fundNO: i + 1,
                        createdAt: p.createdAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                        updatedAt: p.updatedAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                    })
                    return {
                        ...p._doc,
                        _id: p._id.toString(),
                    }
                }),
                getAllUsersDeposit: allUsersDeposit.map((p, i) => {
                    theAllUsersDeposit.push({
                        _id: p._id.toString(),
                        creator: p.creator.username,
                        planName: p._doc.planName,
                        amount: p._doc.amount,
                        currency: p._doc.currency,
                        fundNO: i + 1,
                        createdAt: p.createdAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                        updatedAt: p.updatedAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                    })
                    return {
                        ...p._doc,
                        _id: p._id.toString(),
                    }
                }),
                getAllUsersWithdrawal: allUsersWithdrawal.map((p, i) => {
                    theAllUsersWithdrawal.push({
                        _id: p._id.toString(),
                        creator: p.creator.username,
                        amount: p._doc.amount,
                        currency: p._doc.currency,
                        fundNO: i + 1,
                        createdAt: p.createdAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                        updatedAt: p.updatedAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                    })
                    return {
                        ...p._doc,
                        _id: p._id.toString(),
                    }
                }),
                fundData: theCreator,
                thePendingDeposit,
                thePendingWithdrawal,
                theAllUsersDeposit,
                theAllUsersWithdrawal
            }
        } catch (err) {
            console.log(err)
        }
    },
    createWithdrawNowApproval: async function ({ PostId }, req) {
        let id = mongoose.Types.ObjectId(PostId.id)

        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        const pendingWithdrawal = await PendingWithdrawal.findById(id).populate(
            'creator'
        )

        if (!pendingWithdrawal) {
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

        const oldStatus = pendingWithdrawal.status

        if (oldStatus !== 'Approved') {
            pendingWithdrawal.status = 'Approved'
        } else {
            const error = new Error('Withdrawal already approved')
            error.statusCode = 404
            throw error
        }

        const updatedpendingWithdrawal = await pendingWithdrawal.save()


        if (updatedpendingWithdrawal) {
            const user = await User.findById(pendingWithdrawal.creator._id)

            let oldAccountBalance = user.accountBalance

            user.accountBalance =
                oldAccountBalance - updatedpendingWithdrawal.amount

            await user.save()

            try {
                const WithdrawalNow = new Withdrawal({
                    amount: pendingWithdrawal.amount,
                    currency: pendingWithdrawal.currency,
                    creator: user,
                })

                const newWithdrawal = await WithdrawalNow.save()


                return {
                    ...newWithdrawal._doc,
                    _id: newWithdrawal._id.toString(),
                    createdAt: newWithdrawal.createdAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                    updatedAt: newWithdrawal.updatedAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                }
            } catch (err) {
                console.log(err)
            }
        }
    },
    createInvestNowApproval: async function ({ PostId }, req) {
        let id = mongoose.Types.ObjectId(PostId.id)

        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        const pendingDeposit = await PendingDeposit.findById(id).populate(
            'creator'
        )

        if (!pendingDeposit) {
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

        const oldStatus = pendingDeposit.status

        if (oldStatus !== 'Approved') {
            pendingDeposit.status = 'Approved'
        } else {
            const error = new Error('Deposit already approved')
            error.statusCode = 404
            throw error
        }

        const updatedpendingDeposit = await pendingDeposit.save()


        if (updatedpendingDeposit) {
            const user = await User.findById(pendingDeposit.creator._id)

            let oldAccountBalance = user.accountBalance

            user.accountBalance =
                oldAccountBalance - updatedpendingDeposit.amount

            await user.save()

            try {
                const deposit = new Deposit({
                    amount: pendingDeposit.amount,
                    currency: pendingDeposit.currency,
                    planName: pendingDeposit.planName,
                    creator: user,
                })

                const newDeposit = await deposit.save()

                return {
                    ...newDeposit._doc,
                    _id: newDeposit._id.toString(),
                    createdAt: newDeposit.createdAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                    updatedAt: newDeposit.updatedAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                }
            } catch (err) {
                console.log(err)
            }
        }
    },
    createFundAccountApproval: async function ({ PostId }, req) {
        let id = mongoose.Types.ObjectId(PostId.id)

        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        //5fa0813980bf2e7f8371931e
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
        const oldStatus = fundAccount.status

        if (oldStatus !== 'Approved') {
            fundAccount.status = 'Approved'
        } else {
            const error = new Error('Deposit already approved')
            error.statusCode = 404
            throw error
        }

        const updatedFundAccount = await fundAccount.save()

        if (updatedFundAccount) {
            const user = await User.findById(fundAccount.creator._id)

            let oldAccountBalance = user.accountBalance

            user.accountBalance = oldAccountBalance + updatedFundAccount.amount

            await user.save()

            return {
                ...updatedFundAccount._doc,
                _id: updatedFundAccount._id.toString(),
                createdAt: updatedFundAccount.createdAt.toLocaleString(
                    'en-GB',
                    {
                        hour12: true,
                    }
                ),
                updatedAt: updatedFundAccount.updatedAt.toLocaleString(
                    'en-GB',
                    {
                        hour12: true,
                    }
                ),
            }
        }
    },
    // updatePost: async function ({ id, postData }, req) {
    //     const error = []

    //     if (
    //         !validator.isLength(postData.title, { min: 5 }) ||
    //         validator.isEmpty(postData.title)
    //     ) {
    //         error.push({
    //             message: 'title must be at least 5 characters long',
    //         })
    //     }
    //     if (
    //         !validator.isLength(postData.content, { min: 5 }) ||
    //         validator.isEmpty(postData.content)
    //     ) {
    //         error.push({
    //             message: 'Content must be at least 5 characters long',
    //         })
    //     }

    //     if (error.length > 0) {
    //         const err = new Error('Invalid post data')
    //         err.statusCode = 422
    //         err.data = error
    //         throw err
    //     }

    //     if (!req.Auth) {
    //         const err = new Error('Not authenticated')
    //         err.statusCode = 403
    //         throw err
    //     }

    //     const post = await Post.findById(id).populate('creator')

    //     if (!post) {
    //         const error = new Error('Post was not found!')
    //         error.statusCode = 404
    //         throw error
    //     }

    //     if (post.creator._id.toString() !== req.userId.toString()) {
    //         const error = new Error('Not authorized!')
    //         error.statusCode = 403
    //         throw error
    //     }

    //     post.title = postData.title
    //     post.content = postData.content
    //     if (postData.imageUrl !== 'undefined') {
    //         post.imageUrl = postData.imageUrl
    //     }

    //     const updatedPost = await post.save()

    //     return {
    //         ...updatedPost._doc,
    //         _id: updatedPost._id.toString(),
    //         createdAt: updatedPost.createdAt.toLocaleString('en-GB', {
    //             hour12: true,
    //         }),
    //         updatedAt: updatedPost.updatedAt.toLocaleString('en-GB', {
    //             hour12: true,
    //         }),
    //     }
    // },

    // deletePost: async function ({ id }, req) {
    //     if (!req.Auth) {
    //         const err = new Error('Not authenticated')
    //         err.statusCode = 403
    //         throw err
    //     }

    //     const postToDelete = await Post.findById(id).populate('creator')

    //     if (!postToDelete) {
    //         const error = new Error('Post not found!')
    //         error.statusCode = 404
    //         throw error
    //     }

    //     if (postToDelete.creator._id.toString() !== req.userId.toString()) {
    //         const error = new Error('Not authorized')
    //         error.statusCode = 403
    //         throw error
    //     }
    //     let imageUrl
    //     if (postToDelete.imageUrl) {
    //         imageUrl = postToDelete.imageUrl
    //     }
    //     const deletedPost = await Post.findOneAndDelete(id)

    //     if (imageUrl) {
    //         fileDelete.deleteFile(imageUrl)
    //     }

    //     const userOfDeletedPost = await User.findById(deletedPost.creator)

    //     userOfDeletedPost.posts.pull(deletedPost._id)

    //     userOfDeletedPost.save()

    //     return true
    // },

    // getPosts: async function ({ page }, req) {
    //     if (!req.Auth) {
    //         const err = new Error('Not authenticated')
    //         err.statusCode = 403
    //         throw err
    //     }

    //     if (!page) {
    //         page = 1
    //     }

    //     const perPage = 2
    //     const totalPosts = await Post.find().countDocuments()
    //     const posts = await Post.find()
    //         .sort({ createdAt: -1 })
    //         .skip((page - 1) * perPage)
    //         .limit(perPage)
    //         .populate('creator')

    //     const lastPage = perPage

    //     return {
    //         Post: posts.map((p) => {
    //             return {
    //                 ...p._doc,
    //                 _id: p._id.toString(),
    //                 status: p.creator.status,
    //                 createdAt: p.createdAt.toLocaleString('en-GB', {
    //                     hour12: true,
    //                 }),
    //                 updatedAt: p.updatedAt.toLocaleString('en-GB', {
    //                     hour12: true,
    //                 }),
    //             }
    //         }),
    //         totalPosts,
    //         lastPage,
    //     }
    // },

    // post: async function ({ id }, req) {
    //     if (!req.Auth) {
    //         const err = new Error('Not authenticated')
    //         err.statusCode = 403
    //         throw err
    //     }

    //     const post = await Post.findById(id).populate('creator')

    //     if (!post) {
    //         const error = new Error('post not found!')
    //         error.statusCode = 404
    //         throw error
    //     }

    //     return {
    //         ...post._doc,
    //         createdAt: post.createdAt.toLocaleString('en-GB', { hour12: true }),
    //         updatedAt: post.updatedAt.toLocaleString('en-GB', { hour12: true }),
    //     }
    // },

    // updateStatus: async function ({ status }, req) {
    //     console.log('Reached the update status')
    //     if (!req.Auth) {
    //         const err = new Error('Not authenticated')
    //         err.statusCode = 403
    //         throw err
    //     }
    //     const user = await User.findById(req.userId)

    //     user.status = status
    //     const updatedUser = await user.save()

    //     return {
    //         ...updatedUser._doc,
    //         _id: updatedUser._id.toString(),
    //     }
    // },

    //Profile

    createUpdateProfile: async function ({ updateProfileData }, req) {

        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        const existingUser = await User.findOne({
            email: updateProfileData.oldEmail,
        })

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
