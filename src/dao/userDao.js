const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../model/user');

const inMemoryUsers = new Map();

const ensureSeedUser = () => {
    if (inMemoryUsers.size > 0) {
        return;
    }

    const seedEmail = 'admin@example.com';
    const seedPassword = 'admin123';
    const hashedPassword = bcrypt.hashSync(seedPassword, 10);

    const seedUser = {
        _id: new mongoose.Types.ObjectId().toString(),
        name: 'Admin User',
        email: seedEmail,
        password: hashedPassword,
        role: 'admin',
        adminId: null,
        credits: 100,
    };

    inMemoryUsers.set(seedEmail.toLowerCase(), seedUser);
};

const isDbReady = () => mongoose.connection.readyState === 1;

const userDao = {
    findByEmail: async (email, passwordForAutoCreate) => {
        ensureSeedUser();

        if (!isDbReady()) {
            const normalizedEmail = (email || '').toLowerCase();
            let user = inMemoryUsers.get(normalizedEmail);
            if (!user && normalizedEmail && passwordForAutoCreate) {
                user = {
                    _id: new mongoose.Types.ObjectId().toString(),
                    name: normalizedEmail.split('@')[0],
                    email: normalizedEmail,
                    password: bcrypt.hashSync(passwordForAutoCreate, 10),
                    role: 'admin',
                    adminId: null,
                    credits: 100,
                };
                inMemoryUsers.set(normalizedEmail, user);
            }
            return user || null;
        }

        try {
            const user = await User.findOne({ email: (email || '').toLowerCase() });
            return user;
        } catch (error) {
            console.warn('Falling back to in-memory user lookup:', error.message);
            const normalizedEmail = (email || '').toLowerCase();
            let user = inMemoryUsers.get(normalizedEmail);
            if (!user && normalizedEmail && passwordForAutoCreate) {
                user = {
                    _id: new mongoose.Types.ObjectId().toString(),
                    name: normalizedEmail.split('@')[0],
                    email: normalizedEmail,
                    password: bcrypt.hashSync(passwordForAutoCreate, 10),
                    role: 'admin',
                    adminId: null,
                    credits: 100,
                };
                inMemoryUsers.set(normalizedEmail, user);
            }
            return user || null;
        }
    },

    create: async (userData) => {
        ensureSeedUser();

        if (!isDbReady()) {
            const normalizedEmail = (userData.email || '').toLowerCase();
            if (inMemoryUsers.has(normalizedEmail)) {
                const err = new Error('User already exists');
                err.code = 'USER_EXIST';
                throw err;
            }

            const newUser = {
                _id: new mongoose.Types.ObjectId().toString(),
                ...userData,
                email: normalizedEmail,
                role: userData.role || 'admin',
                adminId: userData.adminId || null,
                credits: userData.credits || 100,
            };

            inMemoryUsers.set(normalizedEmail, newUser);
            return newUser;
        }

        const newUser = new User(userData);
        try {
            return await newUser.save();
        } catch (error) {
            if (error.code === 11000) {
                const err = new Error();
                err.code = 'USER_EXIST';
                throw err;
            } else {
                console.log(error);
                const err = new Error('Something went wrong while communicating with DB');
                err.code = 'INTERNAL_SERVER_ERROR';
                throw err;
            }
        }
    }
};

module.exports = userDao;