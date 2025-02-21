/**
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function isAdmin(req) {
    return req.session.client && req.session.clientRole === 'admin';
}

function isAuthenticated(req, res, next) {
    if (!req.session.clientId) {
        return res.redirect("/login");
    }
    return next();
}

module.exports = { isAdmin, isAuthenticated};
