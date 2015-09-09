// User model
var bcrypt 				= require('bcryptjs'),
		uuid 					= require('uuid');

module.exports = function(sequelize, Sequelize) {

	var UserProfile = sequelize.define('UserProfile', {
		avatar_url: 							{ type: Sequelize.STRING, defaultValue: null },
		bio: 											{ type: Sequelize.TEXT, defaultValue: '', 
			validate: { 
				len: {
					args: [0, 6000],
					msg: 'Sorry, your bio may not exceed 6000 characters.'
				}
			}},
		website: 									{ type: Sequelize.STRING,
			validate: { 
				isUrl: {
					args: true,
					msg: 'Sorry, that does not appear to be a valid URL. Please check for errors and try again.'
				} 
			}},
		twitter_handle: 					{ type: Sequelize.STRING, defaultValue: null },
		facebook_handle: 					{ type: Sequelize.STRING, defaultValue: null },
		github_handle: 						{ type: Sequelize.STRING,
			validate: { 
				isUrl: {
					args: true,
					msg: 'Sorry, that does not appear to be a valid URL. Please check for errors and try again.'
				} 
			}},
		dribble_handle: 					{ type: Sequelize.STRING, defaultValue: null },
		codepen_handle: 					{ type: Sequelize.STRING, defaultValue: null }
	},{
		hooks: {
			beforeUpdate: function(userProfile, options) {
				userProfile.modified = Sequelize.NOW;
			}
		}
	});

	var User = sequelize.define('User', {
		username: 								{ type: Sequelize.STRING, unique: true, allowNull: false },
		password: 								{ 
			type: Sequelize.STRING, 
			validate: { min: { 
				args: 8, 
				msg: 'For your security, please choose a password of at least 8 characters in length.' }  
			}, 
			set:  function(v) {
	      var salt = bcrypt.genSaltSync(10);
	      var hash = bcrypt.hashSync(v, salt);
	      this.setDataValue('password', hash);
	    }},
		email: 										{ type: Sequelize.STRING, unique: true, allowNull: false, validate: { isEmail: true } },
		email_verified: 					{ type: Sequelize.BOOLEAN, defaultValue: false },
		email_verification_uuid: 	{ type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV4 },
		password_reset_uuid: 			{ type: Sequelize.STRING, unique: true, defaultValue: null },
		is_admin: 								{ type: Sequelize.BOOLEAN, default: false }
	}, {
		instanceMethods: {
			comparePassword: function(passw, cb) {
				bcrypt.compare(passw, this.password, function(err, isMatch) {
					if (err) {
						return cb(err);
					}
					cb(null, isMatch);
				});
			}
		},
		hooks: {
			beforeUpdate: function(user, options) {
				user.modified = Sequelize.NOW;
			}
		}
	});

	User.hasOne(UserProfile);
	UserProfile.belongsTo(User);

	sequelize.sync();

	/*
	 * Use the pattern defined below to create associations.
	 *
	 */


	// User.create({
	// 	username: 'Tim',
	// 	email: 'tim@timrourke.com',
	// 	password: 'password'
	// }).then(function(user){

	// 	UserProfile.create({

	// 	}).then(function(profile){
			
	// 		user.setUserProfile(profile).then(function(){
	// 			console.log('success!');
	// 		}).catch(function(err){
	// 			throw err;
	// 		});

	// 	}).catch(function(err){
	// 		throw err;
	// 	});
		
	// }).catch(function(err){
	// 	throw err;
	// });


	var Models =  {
		User: User,
		UserProfile: UserProfile
	}

	return Models;
}