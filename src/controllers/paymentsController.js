const Razorpay = require('razorpay');
const crypto = require('crypto');

const { CREDIT_TO_PAISA_MAPPING } = require('../constants/paymentConstants');
const Users = require('../model/user');

// const razorpayClient = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET,
// });
let razorpayClient = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayClient = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
}

const paymentsController = {

    // Step-2 from sequence diagram
    createOrder: async (request, response) => {
        try {

            if (!razorpayClient) {
            return response.status(500).json({
                message: "Razorpay not configured"
            });
        }
            const { credits } = request.body;



            if (!CREDIT_TO_PAISA_MAPPING[credits]) {
                return response.status(400).json({
                    message: 'Invalid credit value'
                });
            }

            const amountInPaise = CREDIT_TO_PAISA_MAPPING[credits];

            // const order = await razorpayClient.orders.create({
            //     amount: amountInPaise,
            //     currency: 'INR',
            //     receipt: `receipt_${Date.now()}`
            // });

            // Fake order (for testing without Razorpay)
            const order = {
                id: "order_" + Date.now(),
                amount: amountInPaise,
                currency: "INR"
            };

            return response.json({ order: order });

        } catch (error) {
            return response.status(500).json({
                message: 'Internal server error'
            });
        }
    },

    // Step-8 from sequence diagram
    verifyOrder: async (request, response) => {
        try {

            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                credits
            } = request.body;

            const body = razorpay_order_id + "|" + razorpay_payment_id;

            const expectedSignature = crypto
                // Create unique digital fingerprint (HMAC) of the secret key.
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                 // Feed both HMAC and body into hashing function.
                .update(body.toString())
                // Convert the hashed string into hexadecimal
                .digest("hex");

            if (expectedSignature !== razorpay_signature) {
                return response.status(400).json({
                    message: "Invalid transaction"
                });
            }

            const user = await Users.findById({ _id: request.user._id });

            user.credits += Number(credits);
            await user.save();

            return response.json({ user: user });

        } catch (error) {
            return response.status(500).json({
                message: 'Internal server error'
            });
        }
    },
    createSubscription: async (request,response)=> {
        try{
            const {plan_name} = request.body;

            if(!PLAN_IDS[plan_name]){
                return response.status(400).json({
                    message: "Invalid plan selected"
                });
            }

            const plan = PLAN_IDS[plan_name];
            const subscription = await razorpayClient.subscriptions.create({
                plan_id: plan.id,
                customer_notify: 1,
                total_count: plan.totalBillingCycleCount,
                notes:{
                    userId: request.user._id
                }
            });

            return response.json({subscription: subscription});

        } catch (error){
            console.log(error);
            return response.status(500).json({message: "Internal server error"});
        }
    },
    handleWebhookEvents: async (request,response) => {
        try{

        } catch 
    }
};

module.exports = paymentsController;
