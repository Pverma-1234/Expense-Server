const Group = require('../model/group');
const groupDao = {
    createGroup: async (data) => {
        const newGroup = new Group(data);
        return await newGroup.save();
    },
    updateGroup: async (data) => {
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

    removeMembers: async (...membersEmail) => {
        

    },  
    getGroupByEmail: async (email) => {
        return await Group.find({membersEmail: email});

    },
    getGroupByStatus: async (status) => {

    },

    /**
     *We'll only return when was the last time group
     * was settled to begin with,
     * In future, we can move this to separate entity!
     * @param {*} group
     */

};

module.exports = groupDao;