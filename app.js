//const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')
//const multer = require('multer')
const helmet = require('helmet')
const compression = require('compression')

// const auth = require('./middleware/is-Auth')
// const deleteFile = require('./utility/deleteFile')

const app = express()

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'images')
//     },
//     filename: (req, file, cb) => {
//         cb(null, new Date().toISOString() + '-' + file.originalname)
//     },
// })

// const fileFilter = (req, file, cb) => {
//     if (
//         file.mimetype === 'image/png' ||
//         file.mimetype === 'image/jpg' ||
//         file.mimetype === 'image/jpeg'
//     ) {
//         cb(null, true)
//     } else {
//         cb(null, false)
//     }
// }

app.use(bodyParser.json())
// app.use(multer({ storage, fileFilter }).single('image'))
// app.use('/images', express.static(path.join(__dirname, 'images')))

app.use(helmet())

app.use(compression())

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader(
        'Access-Control-Allow-Methods',
        'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    )
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200)
    }
    next()
})


app.use((error, req, res, next) => {
    console.log(error, error.errorMessage)

    const status = error.statusCode || 500
    const message = error.message
    res.status(status).json({ message: message })
})

const PORT = process.env.PORT || 3030


app.listen(PORT)

console.log('listening to port', PORT)