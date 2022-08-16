
/**
 * @typedef {import("express").Request} request
 * @typedef {import("express").Response} response
 * @typedef {import("express").NextFunction} nextFunction

 * @typedef {object}  user
 * @typedef {object}  body
 * @property {string} body.name The name of the email
 * @property  {string} body.password 
 * 
 *  */

  

      
  
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const User = require('../models/User');



/**
 * 
 * @param {request & user} req
 * @param {response} res 
 * @param {nextFunction} next
 * @returns {void} hash le mot de passe et l'attribue avec l'email
 */
exports.signup = (req, res, next) => {
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new User({
        email: req.body.email,
        password: hash
      });
      user.save()
        .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};


/**
 * 
 * @param {request} req  req.body.email
 * @param {response} res req.body.password
 * @param {nextFunction} next 
 * @returns {void} compare le mot de passe avec le user.password
 */
exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
  .then( user => {
    if(!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé !'});
    }
    bcrypt.compare(req.body.password, user.password)
    .then(valid =>{
      if(!valid) {
        return res.status(401).json({ error: 'Mot de passe incorrect !'});
      }
      console.log(user)
      res.status(200).json({
        userId: user._id,
        token: jwt.sign(
          { userId: user._id },
          process.env["JWT_PASS"],
          { expiresIn: '24h' }
        )
      })
    })
    .catch(error => res.status(500).json({ error }));
  })
  .catch(error => res.status(500).json({ error }));
};