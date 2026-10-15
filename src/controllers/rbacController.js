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
            const rawName  = (req.body.name  || '').trim();
            const rawEmail = (req.body.email || '').trim().toLowerCase();
            const role     = (req.body.role  || '').trim();

            // Validate individual fields for clear error messages
            if (!rawName) {
                return res.status(400).json({ message: 'Name is required' });
            }

            if (!rawEmail) {
                return res.status(400).json({ message: 'Email is required' });
            }

            // Basic email format check
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(rawEmail)) {
                return res.status(400).json({ message: 'Please provide a valid email address' });
            }

            if (!role) {
                return res.status(400).json({ message: 'Role is required' });
            }

            // Validate role — only non-admin roles can be assigned by the admin
            const allowedRoles = USER_ROLES.filter(r => r !== 'admin');
            if (!allowedRoles.includes(role)) {
                return res.status(400).json({
                    message: `Invalid role. Allowed values: ${allowedRoles.join(', ')}`
                });
            }

            // Check duplicate email (case-insensitive, normalised)
            const existingUser = await rbacDao.findByEmail(rawEmail);
            if (existingUser) {
                return res.status(400).json({
                    message: `A user with the email "${rawEmail}" already exists`
                });
            }

            // Generate temporary password
            const tempPassword = generateTemporaryPassword(8);

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(tempPassword, salt);

            // Create user in DB
            const user = await rbacDao.create(
                rawEmail,
                rawName,
                role,
                hashedPassword,
                adminUser._id
            );

            // Send email (non-fatal)
            try {
                await emailService.send(
                    rawEmail,
                    'Temporary Password',
                    `Your temporary password is: ${tempPassword}`
                );
            } catch (emailErr) {
                console.log(
                    `Error sending email, temporary password is ${tempPassword}`,
                    emailErr
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
            const adminUser = req.user;
            const { name, role, userId } = req.body;

            if (!userId) {
                return res.status(400).json({
                    message: "User ID is required"
                });
            }

            if (!name || name.trim().length === 0) {
                return res.status(400).json({
                    message: "Name is required"
                });
            }

            if (!role || !USER_ROLES.includes(role)) {
                return res.status(400).json({
                    message: "Invalid role specified"
                });
            }

            // Prevent admin from changing their own role
            if (userId === String(adminUser._id) && role !== 'admin') {
                return res.status(400).json({
                    message: "You cannot remove your own administrator role"
                });
            }

            // Verify the target user belongs to this admin
            const existing = await rbacDao.findById(userId);
            if (!existing || String(existing.adminId) !== String(adminUser._id)) {
                return res.status(403).json({
                    message: "Forbidden: you can only update users you created"
                });
            }

            const user = await rbacDao.update(userId, name.trim(), role);

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
            const adminUser = req.user;
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({
                    message: "User ID is required"
                });
            }

            // Prevent admin from deleting themselves
            if (userId === String(adminUser._id)) {
                return res.status(400).json({
                    message: "You cannot delete your own account"
                });
            }

            // Verify the target user belongs to this admin
            const existing = await rbacDao.findById(userId);
            if (!existing || String(existing.adminId) !== String(adminUser._id)) {
                return res.status(403).json({
                    message: "Forbidden: you can only delete users you created"
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
