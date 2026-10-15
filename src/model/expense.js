const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({

    // Group this expense belongs to
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },

    // Example: Dinner, Taxi, Hotel
    title: {
        type: String,
        required: true,
        trim: true
    },

    // Example: 1200
    amount: {
        type: Number,
        required: true,
        min: 0
    },

    // Email of person who paid
    paidBy: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    // For now we are implementing equal splitting
    splitType: {
        type: String,
        enum: ['equal'],
        default: 'equal'
    },

    // Members included in this expense
    participants: [
        {
            type: String,
            trim: true,
            lowercase: true
        }
    ],

    // Amount each participant owes
    splitAmount: {
        type: Number,
        required: true
    },

    // User who created the expense
    createdBy: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model('Expense', expenseSchema);