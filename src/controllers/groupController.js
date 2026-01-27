const groupDao = require('../dao/groupDao');

const groupController = {
    createGroup: async (req, res) => {
        try{
            const {
                name, description, adminEmail,
                membersEmail,thumbnail,
            } = req.body;

            let allMembers = [adminEmail];
            if(membersEmail && Array.isArray(membersEmail)){
                allMembers = [...new Set([...allMembers,...membersEmail])];
            }

            const newGroup = await groupDao.createGroup({
                name,description,adminEmail,allMembers,thumbnail,
                PaymentAddress: {
                    amount: 0,
                    currency: 'INR',
                    date: Date.now(),
                    isPaid: false,
                }
            });

            res.status(200).json({
                message: 'Group created successfully',
                groupId: newGroup._id
            });

        }catch(error){
            console.log(error);
            res.status(500).json({
                message: 'Internal Server Error'
            });
        }
    }

};

module.exports = groupController;