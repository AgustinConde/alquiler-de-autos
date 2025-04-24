/**
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function isAdmin(req, res, next) {
    if (!req.session?.clientId) {
        return res.redirect('/auth/login');
    }
    
    if (req.session.userRole !== 'admin') {
        req.flash('error', 'Access denied: Admin privileges required');
        return res.redirect('/');
    }
    
    next();
}

function isAuthenticated(req, res, next) {
    if (!isStaticResource(req.path)) {
        console.log('🔒 Auth check for:', req.path);
        console.log('📍 Session:', {
            clientId: req.session?.clientId,
            auth: req.session?.auth,
            role: req.session?.userRole
        });
    }

    res.locals.isAuthenticated = !!req.session?.auth;
    res.locals.auth = req.session?.auth;
    res.locals.user = req.session?.auth;

    const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/logout', '/cars'];
    
    if (publicPaths.includes(req.path) || isStaticResource(req.path)) {
        return next();
    }

    if (!req.session?.auth) {
        if (!req.path.startsWith('/auth/') && !isStaticResource(req.path)) {
            req.session.returnTo = req.originalUrl;
            console.log('💾 Saved return URL:', req.originalUrl);
        }
        
        req.flash('error', 'Please login to continue');
        return res.redirect('/auth/login');
    }

    next();
}


function isStaticResource(path) {
    const staticExtensions = ['.ico', '.jpg', '.jpeg', '.png', '.gif', 
                            '.svg', '.css', '.js', '.map', '.woff', 
                            '.woff2', '.ttf', '.eot', '.webp'];
    
    const staticDirs = ['/favicon.ico', '/css/', '/js/', '/images/', 
                      '/assets/', '/fonts/', '/uploads/'];
    
    return staticExtensions.some(ext => path.endsWith(ext)) || 
           staticDirs.some(dir => path === dir || path.startsWith(dir));
}

module.exports = { isAdmin, isAuthenticated };
