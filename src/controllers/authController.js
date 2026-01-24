const users = require('../dao/userDb');

const authController = {
    login: async(req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and Password are required!!'
            });
        }

        const user = await userDao.findByEmail(email);
        if (user && user.password === password) {
            return res.status(200).json({
                message: 'User Authenticated',
                user: { id: user.id, name: user.name, email: user.email }
            });
        } else {
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }
    },
    register: (req, res) => {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, Email, Password are required!!'
            });
        }

        const user = users.find(user => user.email === email);
        if (user) {
            return res.status(400).json({
                message: `User with this email already exists: ${email}`
            });
        }

        const newUser = {
            id: users.length + 1,
            name: name,
            email: email,
            password: password
        };

        users.push(newUser);

        return res.status(200).json({
            message: 'User registered',
            user: { id: newUser.id }
        });
    }
};

module.exports = authController;