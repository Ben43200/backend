/**
 * @typedef {import("express").Request} request
 * @typedef {import("express").Response} response
 * @typedef {import("express").NextFunction} nextFunction
 * 
 * @typedef {Object} authentification
 * @property {Object} headers
 * @property {Number} authentifiedUserId
 * 
 * @typedef {request & authentification} authentifiedRequest
 */

const jwt = require('jsonwebtoken');


module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env["JWT_PASS"]);
    // @ts-ignore
    const userId = decodedToken.userId;
    if (req.body.userId && req.body.userId !== userId) {
      throw 'Invalid user ID';
    } 
    req.authentifiedUserId = userId;
    next();
  } catch {
    res.status(401).json({
      error: new Error('Invalid request!')
    });
  }
};
