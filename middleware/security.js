export function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized access.' });
  }
}

export function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
}
