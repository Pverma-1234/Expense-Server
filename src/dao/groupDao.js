const Group = require('../model/group');
const groupDao = {
    createGroup: async (data) => {
        const newGroup = new Group(data);
        return await newGroup.save();
    },
<<<<<<< HEAD
    updateGroup: async (groupId,data) => {
=======
    updateGroup: async (data) => {
>>>>>>> 0edac7fcac93e712791cc2e891396da2c45d9bb9
        const {name, description, thumbnail, adminEmail, paymentStatus} = data;
        return await Group.findByIdAndUpdate(groupId, {
            name,description,thumbnail,adminEmail,paymentStatus,

        },{new: true});
    },
    
    addMembers: async (groupId,...membersEmails) => {
        return await Group.findByIdAndUpdate(groupId,{
            $addToSet: {membersEmail: {$each: membersEmails}}
        },{new: true});
    },

<<<<<<< HEAD
    removeMembers: async (groupId, ...membersEmail) => {
        return await Group.findByIdAndUpdate(
            groupId,
            {
                $pull: {
                    membersEmail: { $in: membersEmail }
                }
            },
            { new: true }
        );

=======
    removeMembers: async (...membersEmail) => {
>>>>>>> 0edac7fcac93e712791cc2e891396da2c45d9bb9
        

    },  
    getGroupByEmail: async (email) => {
        return await Group.find({membersEmail: email});

    },
    getGroupByStatus: async (status) => {
<<<<<<< HEAD
        return await Group.find({ status });

    },

    getAuditLog: async (groupId) => {
        const group = await Group.findById(groupId).select('createdAt updatedAt');
        return {
            createdAt: group.createdAt,
            lastUpdatedAt: group.updatedAt
        };
    }
};

=======

    },

>>>>>>> 0edac7fcac93e712791cc2e891396da2c45d9bb9
    /**
     *We'll only return when was the last time group
     * was settled to begin with,
     * In future, we can move this to separate entity!
     * @param {*} group
     */

<<<<<<< HEAD

=======
};
>>>>>>> 0edac7fcac93e712791cc2e891396da2c45d9bb9

module.exports = groupDao;