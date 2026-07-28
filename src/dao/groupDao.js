const mongoose = require('mongoose');
const Group = require("../model/group");

const inMemoryGroups = [];

const isDbReady = () => mongoose.connection.readyState === 1;

const normalizeGroup = (group) => ({
    ...group,
    _id: group._id || new mongoose.Types.ObjectId().toString(),
    createdAt: group.createdAt || new Date().toISOString(),
});

const inMemoryGroupDao = {
    createGroup: (data) => {
        const newGroup = normalizeGroup({
            ...data,
            _id: new mongoose.Types.ObjectId().toString(),
            createdAt: new Date(),
        });
        inMemoryGroups.unshift(newGroup);
        return newGroup;
    },

    updateGroup: (data) => {
        const { groupId, name, description, thumbnail, adminEmail, paymentStatus } = data;
        const index = inMemoryGroups.findIndex((group) => group._id.toString() === (groupId || '').toString());
        if (index === -1) {
            return null;
        }

        const updatedGroup = normalizeGroup({
            ...inMemoryGroups[index],
            name: name ?? inMemoryGroups[index].name,
            description: description ?? inMemoryGroups[index].description,
            thumbnail: thumbnail ?? inMemoryGroups[index].thumbnail,
            adminEmail: adminEmail ?? inMemoryGroups[index].adminEmail,
            paymentStatus: paymentStatus ?? inMemoryGroups[index].paymentStatus,
        });
        inMemoryGroups[index] = updatedGroup;
        return updatedGroup;
    },

    addMembers: (groupId, membersEmails) => {
        const index = inMemoryGroups.findIndex((group) => group._id.toString() === (groupId || '').toString());
        if (index === -1) {
            return null;
        }

        const existing = new Set(inMemoryGroups[index].membersEmail || []);
        membersEmails.forEach((email) => existing.add(email));
        const updatedGroup = normalizeGroup({
            ...inMemoryGroups[index],
            membersEmail: Array.from(existing),
        });
        inMemoryGroups[index] = updatedGroup;
        return updatedGroup;
    },

    removeMembers: (groupId, membersEmails) => {
        const index = inMemoryGroups.findIndex((group) => group._id.toString() === (groupId || '').toString());
        if (index === -1) {
            return null;
        }

        const updatedMembers = (inMemoryGroups[index].membersEmail || []).filter((email) => !membersEmails.includes(email));
        const updatedGroup = normalizeGroup({
            ...inMemoryGroups[index],
            membersEmail: updatedMembers,
        });
        inMemoryGroups[index] = updatedGroup;
        return updatedGroup;
    },

    getGroupByEmail: (email) => {
        return inMemoryGroups.filter((group) => (group.membersEmail || []).includes(email));
    },

    getGroupByStatus: (status) => {
        return inMemoryGroups.filter((group) => group.paymentStatus?.isPaid === status);
    },

    getAuditLog: (groupId) => {
        const group = inMemoryGroups.find((item) => item._id.toString() === (groupId || '').toString());
        return group ? group.paymentStatus?.date : null;
    },

    getGroupsPaginated: (email, limit, skip, sortOptions = { createdAt: -1 }) => {
        const filteredGroups = inMemoryGroups
            .filter((group) => (group.membersEmail || []).includes(email))
            .sort((left, right) => {
                const field = Object.keys(sortOptions)[0] || 'createdAt';
                const leftValue = left[field];
                const rightValue = right[field];
                const direction = sortOptions[field] === 1 ? 1 : -1;
                if (leftValue < rightValue) return -1 * direction;
                if (leftValue > rightValue) return 1 * direction;
                return 0;
            });

        return {
            groups: filteredGroups.slice(skip, skip + limit),
            totalCount: filteredGroups.length,
        };
    }
};

const groupDao = {
    createGroup: async (data) => {
        if (!isDbReady()) {
            return inMemoryGroupDao.createGroup(data);
        }
        try {
            const newGroup = new Group(data);
            return await newGroup.save();
        } catch (error) {
            console.warn('Falling back to in-memory group creation:', error.message);
            return inMemoryGroupDao.createGroup(data);
        }
    },

    updateGroup: async (data) => {
        if (!isDbReady()) {
            return inMemoryGroupDao.updateGroup(data);
        }
        try {
            return await Group.findByIdAndUpdate(data.groupId, {
                name: data.name,
                description: data.description,
                thumbnail: data.thumbnail,
                adminEmail: data.adminEmail,
                paymentStatus: data.paymentStatus,
            }, { new: true });
        } catch (error) {
            console.warn('Falling back to in-memory group update:', error.message);
            return inMemoryGroupDao.updateGroup(data);
        }
    },

    addMembers: async (groupId, ...membersEmails) => {
        if (!isDbReady()) {
            return inMemoryGroupDao.addMembers(groupId, membersEmails);
        }
        try {
            return await Group.findByIdAndUpdate(groupId, {
                $addToSet: { membersEmail: { $each: membersEmails } }
            }, { new: true });
        } catch (error) {
            console.warn('Falling back to in-memory addMembers:', error.message);
            return inMemoryGroupDao.addMembers(groupId, membersEmails);
        }
    },

    removeMembers: async (groupId, ...membersEmails) => {
        if (!isDbReady()) {
            return inMemoryGroupDao.removeMembers(groupId, membersEmails);
        }
        try {
            return await Group.findByIdAndUpdate(groupId, {
                $pull: { membersEmail: { $in: membersEmails } }
            }, { new: true });
        } catch (error) {
            console.warn('Falling back to in-memory removeMembers:', error.message);
            return inMemoryGroupDao.removeMembers(groupId, membersEmails);
        }
    },

    getGroupByEmail: async (email) => {
        if (!isDbReady()) {
            return inMemoryGroupDao.getGroupByEmail(email);
        }
        try {
            return await Group.find({ membersEmail: email });
        } catch (error) {
            console.warn('Falling back to in-memory getGroupByEmail:', error.message);
            return inMemoryGroupDao.getGroupByEmail(email);
        }
    },

    getGroupByStatus: async (status) => {
        if (!isDbReady()) {
            return inMemoryGroupDao.getGroupByStatus(status);
        }
        try {
            return await Group.find({ "paymentStatus.isPaid": status });
        } catch (error) {
            console.warn('Falling back to in-memory getGroupByStatus:', error.message);
            return inMemoryGroupDao.getGroupByStatus(status);
        }
    },

    getAuditLog: async (groupId) => {
        if (!isDbReady()) {
            return inMemoryGroupDao.getAuditLog(groupId);
        }
        try {
            const group = await Group.findById(groupId).select('paymentStatus.date');
            return group ? group.paymentStatus.date : null;
        } catch (error) {
            console.warn('Falling back to in-memory getAuditLog:', error.message);
            return inMemoryGroupDao.getAuditLog(groupId);
        }
    },

    getGroupsPaginated: async (email, limit, skip, sortOptions = { createdAt: -1 }) => {
        if (!isDbReady()) {
            return inMemoryGroupDao.getGroupsPaginated(email, limit, skip, sortOptions);
        }
        try {
            const [groups, totalCount] = await Promise.all([
                Group.find({ membersEmail: email })
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limit),
                Group.countDocuments({ membersEmail: email }),
            ]);
            return { groups, totalCount };
        } catch (error) {
            console.warn('Falling back to in-memory getGroupsPaginated:', error.message);
            return inMemoryGroupDao.getGroupsPaginated(email, limit, skip, sortOptions);
        }
    },
};

module.exports = groupDao;