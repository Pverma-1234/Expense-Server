const bcrypt = require('bcryptjs');
const rbacDao = require('../dao/rbacDao');

const { generateTemporaryPassword } = require('../utility/passwordUtil');
const emailService = require('../services/emailService');
const { USER_ROLES } = require('../utility/userRoles');

const rbacController = {

    // CREATE USER
    create: async (req, res) => {
        try {
            const adminUser = req.user; // Logged-in admin
            const { name, email, role } = req.body;

            // Validate fields
            if (!name || !email || !role) {
                return res.status(400).json({
                    message: "All fields are required"
                });
            }

            // Validate role
            if (!USER_ROLES.includes(role)) {
                return res.status(400).json({
                    message: 'Invalid role specified'
                });
            }

            // Check duplicate email
            const existingUser = await rbacDao.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    message: "User with this email already exists"
                });
            }

            // Generate temporary password
            const tempPassword = generateTemporaryPassword(8);

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(tempPassword, salt);

            // Create user in DB
            const user = await rbacDao.create(
                email,
                name,
                role,
                hashedPassword,
                adminUser._id
            );

            // Send email
            try {
                await emailService.send(
                    email,
                    'Temporary Password',
                    `Your temporary password is: ${tempPassword}`
                );
            } catch (error) {
                console.log(
                    `Error sending email, temporary password is ${tempPassword}`,
                    error
                );
            }

            return res.status(200).json({
                message: 'User created successfully',
                user: user
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: 'Internal Server Error'
            });
        }
    },

    // UPDATE USER
    update: async (req, res) => {
        try {
            const { name, role, userId } = req.body;

            if (!userId) {
                return res.status(400).json({
                    message: "User ID is required"
                });
            }

            const user = await rbacDao.update(userId, name, role);

            return res.status(200).json({
                message: 'User updated successfully',
                user: user
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: 'Internal Server Error'
            });
        }
    },

    // DELETE USER
    delete: async (req, res) => {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({
                    message: "User ID is required"
                });
            }

            await rbacDao.delete(userId);

            return res.status(200).json({
                message: 'User deleted successfully'
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: 'Internal Server Error'
            });
        }
    },

    // GET ALL USERS CREATED BY ADMIN
    getAllUsers: async (req, res) => {
        try {
            const adminId = req.user._id;

            const users = await rbacDao.getUsersByAdminId(adminId);

            return res.status(200).json({
                users: users
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: 'Internal Server Error'
            });
        }
    }
};

module.exports = rbacController;
