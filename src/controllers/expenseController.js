const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const expenseDao = require('../dao/expenseDao');
const groupDao = require('../dao/groupDao');

const expenseController = {


    createExpense: async (request, response) => {

        try {

            const {
                groupId,
                title,
                amount,
                paidBy
            } = request.body;

           

            if (!groupId || !title || !amount || !paidBy) {
                return response.status(400).json({
                    message: 'groupId, title, amount and paidBy are required'
                });
            }


   

            if (!mongoose.Types.ObjectId.isValid(groupId)) {
                return response.status(400).json({
                    message: 'Invalid group ID'
                });
            }




            const numericAmount = Number(amount);

            if (
                !Number.isFinite(numericAmount) ||
                numericAmount <= 0
            ) {
                return response.status(400).json({
                    message: 'Amount must be greater than 0'
                });
            }


            const group = await groupDao.getGroupById(groupId);

            if (!group) {
                return response.status(404).json({
                    message: 'Group not found'
                });
            }




            const members = group.membersEmail || [];

            if (members.length === 0) {
                return response.status(400).json({
                    message: 'Group has no members'
                });
            }




            const loggedInEmail =
                request.user.email.toLowerCase();

            const normalizedMembers = members.map(
                email => email.toLowerCase()
            );

            if (!normalizedMembers.includes(loggedInEmail)) {
                return response.status(403).json({
                    message: 'You are not a member of this group'
                });
            }



            const normalizedPaidBy =
                paidBy.trim().toLowerCase();

            if (!normalizedMembers.includes(normalizedPaidBy)) {
                return response.status(400).json({
                    message: 'Paid by user must be a member of the group'
                });
            }




            const splitAmount =
                numericAmount / members.length;




            const expense =
                await expenseDao.createExpense({

                    groupId: group._id,

                    title: title.trim(),

                    amount: numericAmount,

                    paidBy: normalizedPaidBy,

                    splitType: 'equal',

                    participants: normalizedMembers,

                    splitAmount: splitAmount,

                    createdBy: loggedInEmail
                });



            return response.status(201).json({

                message: 'Expense added successfully',

                expense: expense
            });


        } catch (error) {

            console.error(
                'createExpense failed:',
                error
            );

            return response.status(500).json({
                message: 'Error creating expense'
            });
        }
    },



    getGroupExpenses: async (request, response) => {

        try {

            const { groupId } = request.params;



            if (!mongoose.Types.ObjectId.isValid(groupId)) {

                return response.status(400).json({
                    message: 'Invalid group ID'
                });
            }




            const group =
                await groupDao.getGroupById(groupId);


            if (!group) {

                return response.status(404).json({
                    message: 'Group not found'
                });
            }




            const loggedInEmail =
                request.user.email.toLowerCase();


            const normalizedMembers =
                (group.membersEmail || []).map(
                    email => email.toLowerCase()
                );


            if (!normalizedMembers.includes(loggedInEmail)) {

                return response.status(403).json({
                    message:
                        'You are not a member of this group'
                });
            }



            const expenses =
                await expenseDao.getExpensesByGroupId(
                    groupId
                );




            return response.status(200).json({

                group: {
                    _id: group._id,
                    name: group.name,
                    description: group.description,
                    adminEmail: group.adminEmail,
                    membersEmail: group.membersEmail
                },

                expenses: expenses
            });


        } catch (error) {

            console.error(
                'getGroupExpenses failed:',
                error
            );

            return response.status(500).json({
                message: 'Error fetching group expenses'
            });
        }
    }

};


module.exports = expenseController;