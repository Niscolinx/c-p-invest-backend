// const mongoose = require('mongoose')
// const Schema = mongoose.Schema

// switch (selectedPlan) {
//             case 'ruby':
//                 setPlanDetails({
//                     name: 'ruby',
//                     percent: 20,
//                     hours: 24,
//                     minimum: 20,
//                     maximum: 499,
//                 })
//                 break
//             case 'sapphire':
//                 setPlanDetails({
//                     name: 'sapphire',
//                     percent: 30,
//                     hours: 24,
//                     minimum: 500,
//                     maximum: 999,
//                 })
//                 break
//             case 'coral':
//                 setPlanDetails({
//                     name: 'coral',
//                     percent: 50,
//                     hours: 24,
//                     minimum: 999,
//                     maximum: 1000000,
//                 })
//                 break
//             case 'emerald':
//                 setPlanDetails({
//                     name: 'emerald',
//                     percent: 80,
//                     hours: 48,
//                     minimum: 2000,
//                     maximum: 1000000,
//                 })
//                 break
//             case 'gold':
//                 setPlanDetails({
//                     name: 'gold',
//                     percent: 150,
//                     hours: 72,
//                     minimum: 4000,
//                     maximum: 1000000,
//                 })
//                 break
//             case 'diamond':
//                 setPlanDetails({
//                     name: 'diamond',
//                     percent: 200,
//                     hours: 96,
//                     minimum: 6000,
//                     maximum: 1000000,
//                 })
//                 break

//             default:
//                 setPlanDetails({})
//                 break
//         }

// const packageSchema = new Schema(
//     {
//         name: {
//             type: String,
//             required: true,
//         },
//         perfect: {
//             type: String,
//             required: true,
//         },
//         hours: {
//             type: Number,
//             required: true,
//         },
//         minimum: {
//             type: Number
//         },
//         maximum: {
//             type: Number
//         },
//     },
//     { timestamps: true }
// )

// module.exports = mongoose.model('fundAccount', packageSchema)
