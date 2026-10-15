const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const groupDao = require('../dao/groupDao');
const expenseDao = require('../dao/expenseDao');
const settlementDao = require('../dao/settlementDao');

let razorpayClient = null;

if (
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET
) {
    razorpayClient = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
}



const normalizeEmail = (email) => {
    return String(email || '').trim().toLowerCase();
};




const roundMoney = (amount) => {
    return Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
};




const calculateGroupBalances = async (group) => {

    const expenses =
        await expenseDao.getExpensesByGroupId(group._id);

    const settlements =
        await settlementDao.getSettlementsByGroupId(group._id);


  

    const balances = {};

    (group.membersEmail || []).forEach((email) => {

        balances[normalizeEmail(email)] = 0;

    });


   

    expenses.forEach((expense) => {

        const payer = normalizeEmail(expense.paidBy);

        const participants =
            expense.participants || [];

        const amount = Number(expense.amount);

        if (
            !payer ||
            !Number.isFinite(amount) ||
            amount <= 0 ||
            participants.length === 0
        ) {
            return;
        }


       

        if (balances[payer] === undefined) {
            balances[payer] = 0;
        }


        

        balances[payer] += amount;


        

        const share =
            amount / participants.length;


        participants.forEach((participant) => {

            const email =
                normalizeEmail(participant);

            if (!email) {
                return;
            }

            if (balances[email] === undefined) {
                balances[email] = 0;
            }


            balances[email] -= share;

        });

    });


    
    settlements
        .filter((settlement) =>
            settlement.status === 'paid'
        )
        .forEach((settlement) => {

            const from =
                normalizeEmail(settlement.from);

            const to =
                normalizeEmail(settlement.to);

            const amount =
                Number(settlement.amount);


            if (
                !from ||
                !to ||
                !Number.isFinite(amount) ||
                amount <= 0
            ) {
                return;
            }


            if (balances[from] === undefined) {
                balances[from] = 0;
            }

            if (balances[to] === undefined) {
                balances[to] = 0;
            }


      

            balances[from] += amount;


        
            balances[to] -= amount;

        });


    // Round final balances

    Object.keys(balances).forEach((email) => {

        balances[email] =
            roundMoney(balances[email]);

        // Avoid values such as -0

        if (Math.abs(balances[email]) < 0.01) {
            balances[email] = 0;
        }

    });


    return {
        balances,
        expenses,
        settlements
    };
};



const createSettlementSuggestions = (balances) => {

    const creditors = [];
    const debtors = [];


    Object.entries(balances).forEach(
        ([email, balance]) => {

            const value = roundMoney(balance);


            // Should receive money

            if (value > 0.009) {

                creditors.push({
                    email,
                    amount: value
                });

            }


            // Owes money

            if (value < -0.009) {

                debtors.push({
                    email,
                    amount: Math.abs(value)
                });

            }

        }
    );


    const suggestions = [];

    let debtorIndex = 0;
    let creditorIndex = 0;


    while (
        debtorIndex < debtors.length &&
        creditorIndex < creditors.length
    ) {

        const debtor =
            debtors[debtorIndex];

        const creditor =
            creditors[creditorIndex];


        const amount = roundMoney(
            Math.min(
                debtor.amount,
                creditor.amount
            )
        );


        if (amount > 0) {

            suggestions.push({

                from: debtor.email,

                to: creditor.email,

                amount: amount

            });

        }


        debtor.amount =
            roundMoney(debtor.amount - amount);

        creditor.amount =
            roundMoney(creditor.amount - amount);


        if (debtor.amount < 0.01) {
            debtorIndex++;
        }


        if (creditor.amount < 0.01) {
            creditorIndex++;
        }

    }


    return suggestions;
};


const settlementController = {


  

    getSettlementSummary: async (request, response) => {

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
                normalizeEmail(request.user?.email);


            const members =
                (group.membersEmail || [])
                    .map(normalizeEmail);


            if (!members.includes(loggedInEmail)) {

                return response.status(403).json({
                    message:
                        'You are not a member of this group'
                });

            }


          

            const {
                balances,
                settlements
            } = await calculateGroupBalances(group);


          

            const suggestions =
                createSettlementSuggestions(
                    balances
                );


            

            const memberBalances =
                members.map((email) => {

                    const balance =
                        roundMoney(
                            balances[email] || 0
                        );


                    let status = 'settled';


                    if (balance > 0.009) {
                        status = 'gets';
                    }

                    if (balance < -0.009) {
                        status = 'owes';
                    }


                    return {

                        email,

                        balance,

                        status

                    };

                });


            return response.status(200).json({

                group: {
                    _id: group._id,
                    name: group.name,
                    membersEmail:
                        group.membersEmail
                },

                balances: memberBalances,

                suggestions,

                settlements

            });


        } catch (error) {

            console.error(
                'getSettlementSummary failed:',
                error
            );


            return response.status(500).json({
                message:
                    'Error calculating settlement summary'
            });

        }

    },
createSettlementOrder: async (request, response) => {
    try {

      

        if (!razorpayClient) {
            return response.status(500).json({
                message: 'Razorpay is not configured'
            });
        }


      

        const {
            groupId,
            from,
            to
        } = request.body;


        if (!groupId || !from || !to) {
            return response.status(400).json({
                message: 'groupId, from and to are required'
            });
        }


      

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


     

        const members =
            (group.membersEmail || []).map(
                normalizeEmail
            );

        const loggedInEmail =
            normalizeEmail(request.user?.email);

        const fromEmail =
            normalizeEmail(from);

        const toEmail =
            normalizeEmail(to);




        if (!members.includes(loggedInEmail)) {
            return response.status(403).json({
                message:
                    'You are not a member of this group'
            });
        }




        if (
            !members.includes(fromEmail) ||
            !members.includes(toEmail)
        ) {
            return response.status(400).json({
                message:
                    'Payer and receiver must be group members'
            });
        }



        if (loggedInEmail !== fromEmail) {
            return response.status(403).json({
                message:
                    'Only the member who owes this amount can make the payment'
            });
        }


    

        const { balances } =
            await calculateGroupBalances(group);


        const suggestions =
            createSettlementSuggestions(balances);


        

        const suggestion =
            suggestions.find(
                (item) =>
                    item.from === fromEmail &&
                    item.to === toEmail
            );


        if (!suggestion) {
            return response.status(400).json({
                message:
                    'No outstanding payment exists between these members'
            });
        }


        

        const amount =
            roundMoney(suggestion.amount);


        if (amount <= 0) {
            return response.status(400).json({
                message:
                    'Invalid settlement amount'
            });
        }


        

        const amountInPaise =
            Math.round(amount * 100);


       

        const order =
            await razorpayClient.orders.create({

                amount: amountInPaise,

                currency: 'INR',

                receipt: `settle_${Date.now()}`,

                notes: {
                    groupId:
                        group._id.toString(),

                    from:
                        fromEmail,

                    to:
                        toEmail,

                    settlementAmount:
                        amount.toString()
                }
            });




        return response.status(201).json({

            message:
                'Settlement order created successfully',

            order: order,

            settlement: {
                groupId:
                    group._id,

                from:
                    fromEmail,

                to:
                    toEmail,

                amount:
                    amount
            }
        });


    } catch (error) {

        console.error(
            'createSettlementOrder failed:',
            error
        );

        return response.status(500).json({
            message:
                'Unable to create settlement payment'
        });
    }
},
verifySettlementPayment: async (request, response) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            groupId,
            from,
            to
        } = request.body;

        // 1. Check required data
        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature ||
            !groupId ||
            !from ||
            !to
        ) {
            return response.status(400).json({
                message: 'Payment verification data is incomplete'
            });
        }

        // 2. Check Razorpay secret
        if (!process.env.RAZORPAY_KEY_SECRET) {
            return response.status(500).json({
                message: 'Razorpay is not configured'
            });
        }

        // 3. Verify Razorpay signature
        const body =
            razorpay_order_id + '|' + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac(
                'sha256',
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return response.status(400).json({
                message: 'Invalid payment signature'
            });
        }

        // 4. Find group
        const group = await groupDao.getGroupById(groupId);

        if (!group) {
            return response.status(404).json({
                message: 'Group not found'
            });
        }

        const loggedInEmail =
            normalizeEmail(request.user?.email);

        const fromEmail = normalizeEmail(from);
        const toEmail = normalizeEmail(to);

        // 5. Only debtor can make this payment
        if (loggedInEmail !== fromEmail) {
            return response.status(403).json({
                message: 'Only the payer can verify this payment'
            });
        }

        // 6. Get Razorpay order
        const order =
            await razorpayClient.orders.fetch(
                razorpay_order_id
            );

        // 7. Check that this order belongs to this settlement
        if (
            String(order.notes?.groupId) !== String(groupId) ||
            normalizeEmail(order.notes?.from) !== fromEmail ||
            normalizeEmail(order.notes?.to) !== toEmail
        ) {
            return response.status(400).json({
                message: 'Payment does not match this settlement'
            });
        }

        // Razorpay stores amount in paise
        const amountPaid =
            roundMoney(Number(order.amount) / 100);

        // 8. Recalculate current balances
        const { balances } =
            await calculateGroupBalances(group);

        const suggestions =
            createSettlementSuggestions(balances);

        const outstandingPayment =
            suggestions.find(
                item =>
                    item.from === fromEmail &&
                    item.to === toEmail
            );

        if (!outstandingPayment) {
            return response.status(400).json({
                message: 'No outstanding settlement found'
            });
        }

        // 9. Make sure Razorpay amount matches debt
        if (
            Math.abs(
                outstandingPayment.amount - amountPaid
            ) > 0.01
        ) {
            return response.status(400).json({
                message: 'Payment amount does not match outstanding amount'
            });
        }

        // 10. Save settlement as PAID
        const settlement =
            await settlementDao.createSettlement({
                groupId: group._id,
                from: fromEmail,
                to: toEmail,
                amount: amountPaid,
                status: 'paid',
                recordedBy: loggedInEmail,
                paidAt: new Date()
            });

        // 11. Calculate new balances
        const updated =
            await calculateGroupBalances(group);

        const updatedSuggestions =
            createSettlementSuggestions(
                updated.balances
            );

        return response.status(200).json({
            message: 'Payment verified successfully',
            settlement,
            balances: updated.balances,
            suggestions: updatedSuggestions
        });

    } catch (error) {
        console.error(
            'verifySettlementPayment failed:',
            error
        );

        return response.status(500).json({
            message: 'Unable to verify settlement payment'
        });
    }
},

    
    markAsPaid: async (request, response) => {

        try {

            const {
                groupId,
                from,
                to,
                amount
            } = request.body;


           

            if (
                !groupId ||
                !from ||
                !to ||
                amount === undefined ||
                amount === null
            ) {

                return response.status(400).json({
                    message:
                        'groupId, from, to and amount are required'
                });

            }


          

            if (!mongoose.Types.ObjectId.isValid(groupId)) {

                return response.status(400).json({
                    message: 'Invalid group ID'
                });

            }



            const numericAmount =
                roundMoney(Number(amount));


            if (
                !Number.isFinite(numericAmount) ||
                numericAmount <= 0
            ) {

                return response.status(400).json({
                    message:
                        'Settlement amount must be greater than 0'
                });

            }


      

            const group =
                await groupDao.getGroupById(groupId);


            if (!group) {

                return response.status(404).json({
                    message: 'Group not found'
                });

            }


            const members =
                (group.membersEmail || [])
                    .map(normalizeEmail);


            const loggedInEmail =
                normalizeEmail(request.user?.email);

            const fromEmail =
                normalizeEmail(from);

            const toEmail =
                normalizeEmail(to);



            if (!members.includes(loggedInEmail)) {

                return response.status(403).json({
                    message:
                        'You are not a member of this group'
                });

            }



            if (
                !members.includes(fromEmail) ||
                !members.includes(toEmail)
            ) {

                return response.status(400).json({
                    message:
                        'Settlement users must be group members'
                });

            }


            if (fromEmail === toEmail) {

                return response.status(400).json({
                    message:
                        'A user cannot settle with themselves'
                });

            }




            const { balances } =
                await calculateGroupBalances(group);


            const suggestions =
                createSettlementSuggestions(
                    balances
                );




            const suggestion =
                suggestions.find(
                    (item) =>
                        item.from === fromEmail &&
                        item.to === toEmail
                );


            if (!suggestion) {

                return response.status(400).json({
                    message:
                        'No outstanding settlement exists between these members'
                });

            }


            // Prevent overpayment

            if (
                numericAmount >
                suggestion.amount + 0.01
            ) {

                return response.status(400).json({

                    message:
                        `Maximum settlement amount is ₹${suggestion.amount.toFixed(2)}`

                });

            }



            const settlement =
                await settlementDao.createSettlement({

                    groupId: group._id,

                    from: fromEmail,

                    to: toEmail,

                    amount: numericAmount,

                    status: 'paid',

                    recordedBy:
                        loggedInEmail,

                    paidAt: new Date()

                });


            const updated =
                await calculateGroupBalances(group);


            const updatedSuggestions =
                createSettlementSuggestions(
                    updated.balances
                );


            return response.status(201).json({

                message:
                    'Settlement marked as paid',

                settlement,

                suggestions:
                    updatedSuggestions

            });


        } catch (error) {

            console.error(
                'markAsPaid failed:',
                error
            );


            return response.status(500).json({
                message:
                    'Error recording settlement'
            });

        }

    }

};


module.exports = settlementController;