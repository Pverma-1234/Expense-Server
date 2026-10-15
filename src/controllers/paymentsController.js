



















































const Razorpay = require('razorpay');
const crypto = require('crypto');

const {
    CREDIT_TO_PAISA_MAPPING
} = require('../constants/paymentConstants');

const Users = require('../model/user');


// --------------------------------------------------
// Razorpay Client
// --------------------------------------------------

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




const paymentsController = {



    createOrder: async (request, response) => {

        try {

            if (!razorpayClient) {

                console.log("Razorpay keys are missing");

                return response.status(500).json({
                    message: "Razorpay not configured"
                });
            }


            const { credits } = request.body;


            if (!CREDIT_TO_PAISA_MAPPING[credits]) {

                return response.status(400).json({
                    message: "Invalid credit value"
                });
            }


            const amountInPaise =
                CREDIT_TO_PAISA_MAPPING[credits];


            const order =
                await razorpayClient.orders.create({

                    amount: amountInPaise,

                    currency: "INR",

                    receipt: `receipt_${Date.now()}`

                });


            console.log(
                "Razorpay order created:",
                order.id
            );


            return response.status(200).json({
                order: order
            });


        } catch (error) {

            console.log(
                "Razorpay create order error:",
                error
            );


            return response.status(500).json({
                message: "Unable to create Razorpay order"
            });
        }
    },




    verifyOrder: async (request, response) => {

        try {

            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                credits
            } = request.body;



            if (
                !razorpay_order_id ||
                !razorpay_payment_id ||
                !razorpay_signature
            ) {

                return response.status(400).json({
                    message: "Payment information is missing"
                });
            }


            const body =
                razorpay_order_id +
                "|" +
                razorpay_payment_id;


            const expectedSignature = crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(body)
                .digest("hex");


            if (
                expectedSignature !==
                razorpay_signature
            ) {

                return response.status(400).json({
                    message: "Invalid transaction"
                });
            }


            if (!CREDIT_TO_PAISA_MAPPING[credits]) {

                return response.status(400).json({
                    message: "Invalid credit value"
                });
            }


            const user =
                await Users.findById(
                    request.user._id
                );


            if (!user) {

                return response.status(404).json({
                    message: "User not found"
                });
            }


            user.credits += Number(credits);


            await user.save();


            console.log(
                `Payment verified. ${credits} credits added to ${user.email}`
            );


            return response.status(200).json({
                message: "Payment verified successfully",
                user: user
            });


        } catch (error) {

            console.log(
                "Verify payment error:",
                error
            );


            return response.status(500).json({
                message: "Internal server error"
            });
        }
    },



    createSubscription: async (request, response) => {

        try {

            if (!razorpayClient) {

                return response.status(500).json({
                    message: "Razorpay not configured"
                });
            }


           

            return response.status(501).json({
                message:
                    "Subscription feature is not implemented yet"
            });


        } catch (error) {

            console.log(error);

            return response.status(500).json({
                message: "Internal server error"
            });
        }
    },



    captureSubscription: async (request, response) => {

        try {

            if (!razorpayClient) {

                return response.status(500).json({
                    message: "Razorpay not configured"
                });
            }


            const {
                subscriptionId
            } = request.body;


            if (!subscriptionId) {

                return response.status(400).json({
                    message:
                        "Subscription ID is required"
                });
            }


            const subscription =
                await razorpayClient
                    .subscriptions
                    .fetch(subscriptionId);


            const user =
                await Users.findById(
                    request.user._id
                );


            if (!user) {

                return response.status(404).json({
                    message: "User not found"
                });
            }


            user.subscription = {

                subscriptionId:
                    subscriptionId,

                planId:
                    subscription.plan_id,

                status:
                    subscription.status
            };


            await user.save();


            return response.status(200).json({
                user: user
            });


        } catch (error) {

            console.log(
                "Capture subscription error:",
                error
            );


            return response.status(500).json({
                message: "Internal server error"
            });
        }
    }
};


module.exports = paymentsController;