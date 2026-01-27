const groupDao = require('../dao/groupDao');

const groupController = {
    createGroup: async (req, res) => {
        try{
<<<<<<< HEAD
            const user = req.user;
            const {
                name, description,
                membersEmail,thumbnail,
            } = req.body;

            let allMembers = [user.email];
=======
            const {
                name, description, adminEmail,
                membersEmail,thumbnail,
            } = req.body;

            let allMembers = [adminEmail];
>>>>>>> 0edac7fcac93e712791cc2e891396da2c45d9bb9
            if(membersEmail && Array.isArray(membersEmail)){
                allMembers = [...new Set([...allMembers,...membersEmail])];
            }

            const newGroup = await groupDao.createGroup({
<<<<<<< HEAD
                name,description,adminEmail: user.email,allMembers,thumbnail,
=======
                name,description,adminEmail,allMembers,thumbnail,
>>>>>>> 0edac7fcac93e712791cc2e891396da2c45d9bb9
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
<<<<<<< HEAD
    },
    updateGroup: async (req, res) => {
        try {
            const updatedGroup = await groupDao.updateGroup(req.body);
            res.status(200).json(updatedGroup);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    addMembers: async (req, res) => {
        try {
            const { groupId, membersEmail } = req.body;
            const group = await groupDao.addMembers(groupId, ...membersEmail);
            res.status(200).json(group);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    removeMembers: async (req, res) => {
        try {
            const { groupId, membersEmail } = req.body;
            const group = await groupDao.removeMembers(groupId, ...membersEmail);
            res.status(200).json(group);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    getGroupByEmail: async (req, res) => {
        try {
            const { email } = req.params;
            const groups = await groupDao.getGroupByEmail(email);
            res.status(200).json(groups);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    getGroupByEmail: async (req, res) => {
        try {
            const { email } = req.params;
            const groups = await groupDao.getGroupByEmail(email);
            res.status(200).json(groups);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    getGroupByStatus: async (req, res) => {
        try {
            const { status } = req.params;
            const groups = await groupDao.getGroupByStatus(status);
            res.status(200).json(groups);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    getAuditLog: async (req, res) => {
        try {
            const { groupId } = req.params;
            const auditLog = await groupDao.getAuditLog(groupId);
            res.status(200).json(auditLog);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }





=======
    }

>>>>>>> 0edac7fcac93e712791cc2e891396da2c45d9bb9
};

module.exports = groupController;