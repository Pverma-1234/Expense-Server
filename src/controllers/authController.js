// const userDao = require('../dao/userDao');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const { OAuth2Client } = require('google-auth-library');
// const { validationResult } = require('express-validator');
// const { ADMIN_ROLE } = require('../utility/userRoles');

// const authController = {

//     // LOGIN
//     login: async (request, response) => {
//         try {
//             const errors = validationResult(request);
//             if (!errors.isEmpty()) {
//                 return response.status(400).json({
//                     errors: errors.array()
//                 });
//             }

//             const { email, password } = request.body;

//             const user = await userDao.findByEmail(email);

//             // Check if user exists
//             if (!user) {
//                 return response.status(400).json({
//                     message: 'Invalid email or password'
//                 });
//             }

//             const isPasswordMatched = await bcrypt.compare(password, user?.password);

//             if (!isPasswordMatched) {
//                 return response.status(400).json({
//                     message: 'Invalid email or password'
//                 });
//             }

//             // Default role/adminId handling
//             user.role = user.role || ADMIN_ROLE;
//             user.adminId = user.adminId || user._id;

//             const token = jwt.sign({
//                 name: user.name,
//                 email: user.email,
//                 _id: user._id,
//                 role: user.role,
//                 adminId: user.adminId
//             }, process.env.JWT_SECRET, { expiresIn: '1h' });

//             // Cookie setup (safe for localhost)
//             response.cookie('jwtToken', token, {
//                 httpOnly: true,
//                 secure: false
//             });

//             return response.status(200).json({
//                 message: 'User authenticated',
//                 user: user
//             });

//         } catch (error) {
//             console.log(error);
//             return response.status(500).json({
//                 message: 'Internal server error'
//             });
//         }
//     },

//     // REGISTER
//     register: async (request, response) => {
//         try {
//             const { name, email, password } = request.body;

//             if (!name || !email || !password) {
//                 return response.status(400).json({
//                     message: 'Name, Email, Password are required'
//                 });
//             }

//             // Check if user already exists
//             const existingUser = await userDao.findByEmail(email);
//             if (existingUser) {
//                 return response.status(400).json({
//                     message: 'User with this email already exists'
//                 });
//             }

//             const salt = await bcrypt.genSalt(10);
//             const hashedPassword = await bcrypt.hash(password, salt);

//             const user = await userDao.create({
//                 name,
//                 email,
//                 password: hashedPassword,
//                 role: ADMIN_ROLE
//             });

//             return response.status(200).json({
//                 message: 'User registered',
//                 user: { id: user._id }
//             });

//         } catch (error) {
//             console.log(error);
//             return response.status(500).json({
//                 message: "Internal server error"
//             });
//         }
//     },

//     // CHECK LOGIN STATUS
//     isUserLoggedIn: async (request, response) => {
//         try {
//             const token = request.cookies?.jwtToken;

//             if (!token) {
//                 return response.status(401).json({
//                     message: 'Unauthorized access'
//                 });
//             }

//             const decoded = jwt.verify(token, process.env.JWT_SECRET);

//             return response.json({
//                 user: decoded
//             });

//         } catch (error) {
//             console.log(error);
//             return response.status(401).json({
//                 message: 'Invalid or expired token'
//             });
//         }
//     },

//     // LOGOUT
//     logout: async (request, response) => {
//         try {
//             response.clearCookie('jwtToken', {
//                 httpOnly: true
//             });

//             return response.json({
//                 message: 'Logout successful'
//             });

//         } catch (error) {
//             console.log(error);
//             return response.status(500).json({
//                 message: 'Internal server error'
//             });
//         }
//     },

//     // GOOGLE SSO LOGIN
//     googleSso: async (request, response) => {
//         try {
//             const { idToken } = request.body;

//             if (!idToken) {
//                 return response.status(401).json({
//                     message: 'Invalid request'
//                 });
//             }

//             const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//             const googleResponse = await googleClient.verifyIdToken({
//                 idToken: idToken,
//                 audience: process.env.GOOGLE_CLIENT_ID
//             });

//             const payload = googleResponse.getPayload();
//             const { sub: googleId, name, email } = payload;

//             let user = await userDao.findByEmail(email);

//             if (!user) {
//                 user = await userDao.create({
//                     name,
//                     email,
//                     googleId,
//                     role: ADMIN_ROLE
//                 });
//             }

//             user.role = user.role || ADMIN_ROLE;
//             user.adminId = user.adminId || user._id;

//             const token = jwt.sign({
//                 name: user.name,
//                 email: user.email,
//                 googleId: user.googleId,
//                 _id: user._id,
//                 role: user.role,
//                 adminId: user.adminId
//             }, process.env.JWT_SECRET, { expiresIn: '1h' });

//             response.cookie('jwtToken', token, {
//                 httpOnly: true,
//                 secure: false
//             });

//             return response.status(200).json({
//                 message: 'User authenticated',
//                 user: user
//             });

//         } catch (error) {
//             console.log(error);
//             return response.status(500).json({
//                 message: 'Internal server error'
//             });
//         }
//     }
// };

// module.exports = authController;


const userDao = require('../dao/userDao');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { validationResult } = require('express-validator');
const { ADMIN_ROLE } = require('../utility/userRoles');

const authController = {

    // LOGIN
    login: async (request, response) => {
        try {
            const errors = validationResult(request);
            if (!errors.isEmpty()) {
                return response.status(400).json({
                    errors: errors.array()
                });
            }

            const { email, password } = request.body;

            const user = await userDao.findByEmail(email);

            // Check if user exists
            if (!user) {
                return response.status(400).json({
                    message: 'Invalid email or password'
                });
            }

            // optional chaining added
            const isPasswordMatched = await bcrypt.compare(password, user?.password);

            if (!isPasswordMatched) {
                return response.status(400).json({
                    message: 'Invalid email or password'
                });
            }

            // role and adminId handling (same logic as screenshot)
            user.role = user.role ? user.role : ADMIN_ROLE;
            user.adminId = user.adminId ? user.adminId : user._id;

            const token = jwt.sign({
                name: user.name,
                email: user.email,
                _id: user._id,
                role: user.role,
                adminId: user.adminId
            }, process.env.JWT_SECRET, { expiresIn: '1h' });

            response.cookie('jwtToken', token, {
                httpOnly: true,
                secure: false
            });

            return response.status(200).json({
                message: 'User authenticated',
                user: user
            });

        } catch (error) {
            console.log(error);
            return response.status(500).json({
                message: 'Internal server error'
            });
        }
    },

    // REGISTER
    register: async (request, response) => {
        try {
            const { name, email, password } = request.body;

            if (!name || !email || !password) {
                return response.status(400).json({
                    message: 'Name, Email, Password are required'
                });
            }

            const existingUser = await userDao.findByEmail(email);
            if (existingUser) {
                return response.status(400).json({
                    message: 'User with this email already exists'
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const user = await userDao.create({
                name,
                email,
                password: hashedPassword,
                role: ADMIN_ROLE
            });

            return response.status(200).json({
                message: 'User registered',
                user: { id: user._id }
            });

        } catch (error) {
            console.log(error);
            return response.status(500).json({
                message: "Internal server error"
            });
        }
    },

    // CHECK LOGIN STATUS
    isUserLoggedIn: async (request, response) => {
        try {
            const token = request.cookies?.jwtToken;

            if (!token) {
                return response.status(401).json({
                    message: 'Unauthorized access'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            return response.json({
                user: decoded
            });

        } catch (error) {
            console.log(error);
            return response.status(401).json({
                message: 'Invalid or expired token'
            });
        }
    },

    // LOGOUT
    logout: async (request, response) => {
        try {
            response.clearCookie('jwtToken', {
                httpOnly: true
            });

            return response.json({
                message: 'Logout successful'
            });

        } catch (error) {
            console.log(error);
            return response.status(500).json({
                message: 'Internal server error'
            });
        }
    },

    // GOOGLE SSO LOGIN
    googleSso: async (request, response) => {
        try {
            const { idToken } = request.body;

            if (!idToken) {
                return response.status(401).json({
                    message: 'Invalid request'
                });
            }

            const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

            const googleResponse = await googleClient.verifyIdToken({
                idToken: idToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = googleResponse.getPayload();
            const { sub: googleId, name, email } = payload;

            let user = await userDao.findByEmail(email);

            if (!user) {
                user = await userDao.create({
                    name,
                    email,
                    googleId,
                    role: ADMIN_ROLE
                });
            }

            user.role = user.role ? user.role : ADMIN_ROLE;
            user.adminId = user.adminId ? user.adminId : user._id;

            const token = jwt.sign({
                name: user.name,
                email: user.email,
                googleId: user.googleId,
                _id: user._id,
                role: user.role,
                adminId: user.adminId
            }, process.env.JWT_SECRET, { expiresIn: '1h' });

            response.cookie('jwtToken', token, {
                httpOnly: true,
                secure: false
            });

            return response.status(200).json({
                message: 'User authenticated',
                user: user
            });

        } catch (error) {
            console.log(error);
            return response.status(500).json({
                message: 'Internal server error'
            });
        }
    }
};

module.exports = authController;
