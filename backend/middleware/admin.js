function adminOnly(req, res, next) {
  if (!req.isAdmin) {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'Admin access only.'
    });
  }
  next();
}

module.exports = adminOnly;
