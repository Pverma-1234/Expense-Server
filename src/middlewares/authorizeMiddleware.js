const permission = require('../utility/permission');

const authorizeMiddleware = (requiredPermission) => {
    return (req, res, next) => {
        try {
            console.log('authorizeMiddleware: requiredPermission', requiredPermission, 'user', req.user);
            const user = req.user;

            if (!user) {
                return res.status(401).json({ message: 'Unauthorized access' });
            }

            const userPermissions = permission[user.role] || [];
            console.log('authorizeMiddleware: role', user.role, 'permissions', userPermissions);

            if (!userPermissions.includes(requiredPermission)) {
                return res.status(403).json({
                    message: 'Forbidden: Insufficient permissions'
                });
            }

            next();
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Internal server error", error: error.message });
        }
    };
};

module.exports = authorizeMiddleware;
