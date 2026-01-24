const User = require('../model/user');

const userDao = {
    findByEmail: async (email) => {
        const user = await User.findOne({ email });
        return user;
    },
    // asynchronous
    create: async (userData) => {
        const newUser = new User(userData);
        return await newUser.save();

    }
};

module.exports = userDao;   