const Expense = require('../model/expense');

const expenseDao = {

    
    createExpense: async (expenseData) => {

        const expense = new Expense(expenseData);

        return await expense.save();
    },


   
    getExpensesByGroupId: async (groupId) => {

        return await Expense.find({
            groupId: groupId
        }).sort({
            createdAt: -1
        });
    },


 
    getExpenseById: async (expenseId) => {

        return await Expense.findById(expenseId);
    },


    deleteExpense: async (expenseId) => {

        return await Expense.findByIdAndDelete(expenseId);
    },
    deleteExpensesByGroupId: async (groupId) => {
    return await Expense.deleteMany({
        groupId: groupId
    });
},

};

module.exports = expenseDao;