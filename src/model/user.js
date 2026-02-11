const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    subscriptionId: {type: String}, //Razorpay subscription id
    planId: {type: String},
    status: {type: String},
    start: {type: Date},
    end: {type: Date},
    lastBillDate: {type: Date},  // the date when user made the last payment
    nextBillDate: {type:Date},    // the next date on which will be charged again
    paymentsMade: {type: Number},  // Number of payments made in the subscription
    paymentsRemaining: {type: Number}  // NUmber of payments remaining in the subscription
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true},
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    googleId: { type: String, required: false },
    role: { type: String, required: true,default: 'admin'},
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: false },
    // Default to 1 to give free trail of creating 1 group
    credits: { type: Number, default: 1 },
    subscription: {type: subscriptionSchema, required: false}
});

module.exports = mongoose.model('User', userSchema);