const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    const authToken = req.get('Authorization')

    console.log('is auth', authToken)
    console.log('to confirm')


    if (!authToken) {
        req.Auth = false
        return next()
    }

    const gottenToken = authToken.split(' ')[1]

    console.log('gottenToken', gottenToken)

    let verifiedToken

    try {
        verifiedToken = jwt.verify(gottenToken, 'supersecretkey')
    } catch (err) {
        req.Auth = false
        return next()
    }


    if (!verifiedToken) {
        req.Auth = false
        return next()
    }

    req.userId = verifiedToken.userId
    req.Auth = true
    next()
}
