const Settlement = require('../model/settlement');

const settlementDao = {


    createSettlement: async (settlementData) => {

        const settlement = new Settlement(settlementData);

        return await settlement.save();
    },


   

    getSettlementsByGroupId: async (groupId) => {

        return await Settlement.find({
            groupId: groupId
        }).sort({
            createdAt: -1
        });
    },




    getSettlementById: async (settlementId) => {

        return await Settlement.findById(settlementId);
    },
    deleteSettlementsByGroupId: async (groupId) => {
    return await Settlement.deleteMany({
        groupId: groupId
    });
},

};

module.exports = settlementDao;