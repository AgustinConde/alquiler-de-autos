/**
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function isAdmin(req, res, next) {
    if (!req.session?.auth || req.session.auth.role !== 'admin') {
        console.log('❌ Admin access denied');
        req.flash('error', 'You need administrator permissions to access this area');
        return res.redirect('/');
    }
    console.log('✅ Admin access granted');
    next();
}

function isAuthenticated(req, res, next) {
    console.log('🔒 Auth check for:', req.path);
    console.log('📍 Session:', {
        clientId: req.session?.clientId,
        auth: req.session?.auth,
        role: req.session?.auth?.role
    });

    res.locals.isAuthenticated = !!req.session?.auth;
    res.locals.auth = req.session?.auth;
    res.locals.user = req.session?.auth;

    const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/logout', '/cars'];
    
    if (publicPaths.includes(req.path)) {
        return next();
    }

    if (!req.session?.auth) {
        req.flash('error', 'Please login to continue');
        return res.redirect('/auth/login');
    }

    next();
}

module.exports = { isAdmin, isAuthenticated };
