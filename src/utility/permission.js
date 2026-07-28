const {
    ADMIN_ROLE,
    VIEWER_ROLE,
    MANAGER_ROLE
} = require("./userRoles");

const permissions = {

    [ADMIN_ROLE]: [
        'user:create',
        'user:update',
        'user:delete',
        'user:view',

        'group:create',
        'group:update',
        'group:delete',
        'group:view',

        // Allow admin to make payments
        'payment:create'
    ],

    [VIEWER_ROLE]: [
        'user:view',
        'group:view',

        // Allow viewer to purchase credits
        'payment:create'
    ],

    [MANAGER_ROLE]: [
        'user:view',

        'group:create',
        'group:update',
        'group:view',

        // Allow manager to make payments
        'payment:create'
    ]
};

module.exports = permissions;