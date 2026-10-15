const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({

    // Group this settlement belongs to
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },

    // Person who owes money
    from: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    // Person who should receive money
    to: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    // Amount being settled
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },

    // pending / paid
    status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'paid'
    },

    // Who recorded the settlement
    recordedBy: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    paidAt: {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    'Settlement',
    settlementSchema
);