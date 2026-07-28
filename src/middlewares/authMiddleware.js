const jwt = require('jsonwebtoken');

const getJwtSecret = () => process.env.JWT_SECRET || 'dev-secret';
const verifyToken = (token) => {
    try {
        return jwt.verify(token, getJwtSecret());
    } catch (error) {
        return jwt.verify(token, 'dev-secret');
    }
};

const authMiddleware  = {
    protect: async (request, response, next) => {
        try {
            console.log('authMiddleware: incoming', request.method, request.path, 'cookies', request.cookies, 'authorization', request.headers.authorization);
            const tokenFromCookie = request.cookies?.jwtToken;
            const tokenFromHeader = request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : null;
            const token = tokenFromCookie || tokenFromHeader;

            if (!token) {
                console.warn('authMiddleware: missing token');
                return response.status(401).json({
                    error: 'Unauthorized access'
                });
            }

            try {
                const user = verifyToken(token);
                request.user = user;
                console.log('authMiddleware: authenticated user', user.email);
                next();
            } catch (error) {
                console.warn('authMiddleware: invalid token', error.message);
                return response.status(401).json({
                    error: 'Unauthorized access'
                });
            }

        } catch (error) {
            console.log(error);
            response.status(500).json({
                message: 'Internal server error'
            });
        }
    },
};

module.exports = authMiddleware;