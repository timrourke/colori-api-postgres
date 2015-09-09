"use strict";

var debug = require('debug')('app:routes:users' + process.pid),
    _ = require("lodash"),
    util = require('util'),
    path = require('path'),
    async = require('async'),
    Router = require("express").Router;

module.exports = function (Models) {

  var User = Models.User;
  var UserProfile = Models.UserProfile;

  var router = new Router();

  router.route('/').get(function(req, res, next) {

    User.findAll({ attributes: ['id', 'username', 'email', 'is_admin', 'createdAt', 'updatedAt'] }).then(function(users) {

      if (!users) {
        res.status(404).json({ success: false, message: 'No users found.' });
      }

      var userResults = [];

      async.each(users, function(user, callback) {

        userResults.push(user.get({
          plain: true
        }));

        callback();

      }, function(err) {

        if (err) {
          return next(err);
        } else {
          res.json({
            success: true,
            message: userResults.length + ' users found.',
            foundUsers: userResults
          });   
        }

      });
      
    }).catch(function(err){
      return next(err);
    });
  });

  var findUserByUsername = function(username, callback) {
    User.findOne({ 
      username: username, 
      include: { model: UserProfile }, 
      attributes: ['id', 'username', 'email', 'is_admin', 'createdAt', 'updatedAt'] }).then(function(user) {

      if (!user) {
        return callback(null, null);        
      } else {
        return callback(null, user)
      }

    }).catch(function(err) {
      return callback(err);
    });
  }

  var isUserInReqBodySelfOrAdmin = function(user, req, res, next){
    if (req.user.id != user.id && req.user.is_admin != true) {
      return next(new UnauthorizedAccessError('not_authorized', 'You do not have access privileges to edit this resource.'));
    } else if (req.user.id == user.id || req.user.is_admin == true) {
      next();
    }
  }

  var findUserByUsernameAndUpdate = function(username, updatedUserProperties, req, res, callback) {
    User.findOne({ username: username }).then(function(user) {

      if (!user) {
        return callback(null, null);        
      } else {

        isUserInReqBodySelfOrAdmin(user, req, res, function(){

          if (updatedUserProperties.password && updatedUserProperties.password != updatedUserProperties.confirmpassword) {
            res.status(449).json({ success: false, message: "Password not changed. New password must match the confirmation password." })
          }

          user.update(updatedUserProperties, { fields: [ 'username', 'email', 'password' ] }).then(function(updatedUser) {
      
            if (!updatedUser || updatedUser == null) {
              return callback(null, null);
            } else {
              return callback(null, updatedUser);
            }

          }).catch(function(err){
            return callback(err);
          });
        });
      }

    }).catch(function(err) {
      return callback(err);
    });
  }

  router.route('/:username').get(function(req, res, next) {
    findUserByUsername(req.params.username, function(err, user) {
      if (err) {
        return next(err);
      } else if (!user || user == null) {
        res.status(404).json({ success: false, message: 'No users found.' }); 
      } else {
        
        //foundUser includes user, should also include their user profile.
        res.json({
          success: true,
          message: 'User found by username ' + req.params.username + '.',
          foundUser: user.get({
            plain: true
          })
        }); 
        
      }
      
    });
  });

  router.route('/:username').put(function(req, res, next) {
    findUserByUsernameAndUpdate(req.params.username, req.body, req, res, function(err, updatedUser) {
      if (err) {
        return next(err);
      } else if (!updatedUser || updatedUser == null) {
        res.status(404).json({ success: false, message: 'No users found.' }); 
      } else {

        var returnedUpdatedUser = updatedUser.get({
            plain: true
          });

        res.json({
          success: true,
          message: 'User ' + updatedUser.username + ' successfully updated.',
          updatedUser: _.omit(returnedUpdatedUser, ['password', 'email_verified', 'email_verification_uuid', 'password_reset_uuid'])
        }); 
        
      }
      
    });
  });

  router.unless = require("express-unless");

  return router;
};

debug("Loaded");