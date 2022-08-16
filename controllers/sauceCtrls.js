/**
 * @typedef {import("express").Request} request
 * @typedef {import("express").Response} response
 * @typedef {import("express").NextFunction} nextFunction
 * @typedef {import("../middleware/auth").authentifiedRequest} authentifiedRequest
 * @typedef {import("../middleware/multer-config").multerRequest} multerRequest
 * 
 * @typedef {Object} idSauceInParams
 * @property {Object} params
 * @property {String} params.id   l'id de la sauce
 * 
 * @typedef {Object} idlike
 * @property {object} body
 * @property {Number} body.like   Si like = 1, l'utilisateur aime (= like) la sauce. Si like = 0, l'utilisateur annule son like ou son dislike. Si like = -1, l'utilisateur n'aime pas
 * 
 */

const fs = require('fs');
const Sauce = require('../models/Sauce');

/**
 * ajoute une sauce
 *
 * @param {authentifiedRequest & multerRequest} req
 * @param {response} res
 * @param {nextFunction} next
 *
 * @return  {Promise.<void>}
 */
exports.createSauce = async (req, res, next) => {
  try {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;

    const sauce = new Sauce({
      ...sauceObject,
      userId: req.authentifiedUserId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${
        req.file.filename
      }`,
      likes: 0,
      dislikes: 0,
      usersLiked: [],
      usersDisliked: [],
    });
    await sauce.save();
    res.status(201).json({ message: 'Objet enregistré !' });
  } catch (error) {
    res.status(500).json(error);
  }
};

/**
 * obtenir les propriétés de la sauce
 *
 * @param   {request & idSauceInParams}  req 
 * @param   {response}  res 
 * @param   {nextFunction}  next 
 *
 * @return  {Promise.<void>}       retourne  les informations  de la sauce
 */
exports.getOneSauce = async (req, res, next) => {
  try {
    const sauce = await Sauce.findOne({
      _id: req.params.id,
    });
    res.status(200).json(sauce);
  } catch (error) {
    res.status(404).json({
      error: error,
    });
  }
};

/**
 * modifie une sauce
 *
 * @param {request & idSauceInParams & multerRequest} req
 * @param {response} res
 * @param {nextFunction} next
 *
 * @return  {void}
 */
exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };
  Sauce.updateOne(
    { _id: req.params.id },
    { ...sauceObject, _id: req.params.id }
  )
    .then(() => res.status(200).json({ message: 'Objet modifié !' }))
    .catch((error) => res.status(400).json({ error }));
};

/**
 * 
 * @param {request & idSauceInParams & multerRequest} req
 * @param {response} res 
 * @param {nextFunction} next 
 * @return {void}
 */
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((Sauce) => {
      const filename = Sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet supprimé !' }))
          .catch((error) => res.status(400).json({ error }));
      });
    })
    .catch((error) => res.status(500).json({ error }));
};
/**
 * 
 * @param {idSauceInParams} req 
 * @param {response} res 
 * @param  {nextFunction} next 
 * 
 * @return {void} retourne la liste des sauces
 */
exports.getAllSauce = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};


/**
 *  gestion des likes
 * @param  {authentifiedRequest & idlike & idSauceInParams} req
 * @param {response} res 
 * @param {nextFunction} next 
 * @return {void} 
 */
exports.likeDislike = (req, res, next) => {

  // Pour la route READ = Ajout/suppression d'un like / dislike à une sauce
  // Like présent dans le body
  let like = req.body.like
  // On prend le userID
  let userId = req.authentifiedUserId
  // On prend l'id de la sauce
  let sauceId = req.params.id

  console.log(like,userId, sauceId)

  if (like === 1) { // Si il s'agit d'un like
    Sauce.updateOne({
        _id: sauceId
      }, {
        // On push l'utilisateur et on incrémente le compteur de 1
        $push: {
          usersLiked: userId
        },
        $inc: {
          likes: +1
        }, // On incrémente de 1
      })
      .then(() => res.status(200).json({
        message: 'j\'aime ajouté !'
      }))
      .catch((error) => res.status(400).json({
        error
      }))
  }
  if (like === -1) {
    Sauce.updateOne( // S'il s'agit d'un dislike
        {
          _id: sauceId
        }, {
          $push: {
            usersDisliked: userId
          },
          $inc: {
            dislikes: +1
          }, // On incrémente de 1
        }
      )
      .then(() => {
        res.status(200).json({
          message: 'Dislike ajouté !'
        })
      })
      .catch((error) => res.status(400).json({
        error
      }))
  }
  if (like === 0) { // Si il s'agit d'annuler un like ou un dislike
    Sauce.findOne({
        _id: sauceId
      })
      .then((sauce) => {
        if (sauce.usersLiked.includes(userId)) { // Si il s'agit d'annuler un like
          Sauce.updateOne({
              _id: sauceId
            }, {
              $pull: {
                usersLiked: userId
              },
              $inc: {
                likes: -1
              }, // On décrémente de -1
            })
            .then(() => res.status(200).json({
              message: 'Like retiré !'
            }))
            .catch((error) => res.status(400).json({
              error
            }))
        }
        if (sauce.usersDisliked.includes(userId)) { // Si il s'agit d'annuler un dislike
          Sauce.updateOne({
              _id: sauceId
            }, {
              $pull: {
                usersDisliked: userId
              },
              $inc: {
                dislikes: -1
              }, // On décrémente de -1
            })
            .then(() => res.status(200).json({
              message: 'Dislike retiré !'
            }))
            .catch((error) => res.status(400).json({
              error
            }))
        }
      })
      .catch((error) => res.status(404).json({
        error
      }))
  }
}