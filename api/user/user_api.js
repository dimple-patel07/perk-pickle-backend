const userDbService = require("../../services/db/user_db_service");
const commonUtils = require("../../services/utils/common_utils");
const userMailer = require("../../mailer/user_mailer");
const authMailer = require("../../mailer/auth_mailer");

// create user
async function createUser(req, res) {
	let result = null;
	try {
		res.statusCode = 500;
		const params = req.body;
		if (params && params.email) {
			// required parameter - email
			const data = await userDbService.getUserByEmail(params.email);
			if (data && data.email && data.is_signup_completed) {
				// email already exist
				result = { error: "email already exist" };
			} else if (data && data.email && data.is_verified) {
				// user is verified but signup process pending
				res.statusCode = 200;
				result = { is_signup_completed: false, is_verified: true, message: "user is verified but signup process pending" };
			} else if (data && data.email) {
				// only email added but verification & signup process pending
				params.otp = commonUtils.generateRandomNumber();
				const isUpdated = await userDbService.updateUser(params);
				if (isUpdated) {
					// success
					res.statusCode = 200;
					result = { is_signup_completed: false, message: "otp sent successfully" };
					// send email
					userMailer.sendUserEmail(params.email, params.otp);
				}
			} else {
				params.otp = commonUtils.generateRandomNumber();
				const isCreated = await userDbService.createUser(params);
				if (isCreated) {
					// success
					res.statusCode = 201;
					result = { email: params.email, message: "otp sent successfully" };
					// send email
					userMailer.sendUserEmail(params.email, params.otp);
				}
			}
		} else {
			res.statusCode = 400;
		}
	} catch (error) {
		console.error("create user api failed :: ", error);
	} finally {
		return result;
	}
}
// verify user
async function verifyUser(req, res) {
	let result = null;
	try {
		const params = req.body;
		res.statusCode = 500;
		if (params && params.email && params.otp) {
			// required parameters - email, otp
			const data = await userDbService.getUserByEmailAndOtp(params.email, params.otp);
			if (data) {
				data.is_verified = true;
				data.otp = null;
				const isUpdated = await userDbService.updateUser(data);
				if (isUpdated) {
					res.statusCode = 200;
					result = { email: params.email };
				}
			} else {
				res.statusCode = 404;
			}
		} else {
			res.statusCode = 400;
		}
	} catch (error) {
		console.error("verify user api failed :: ", error);
	} finally {
		return result;
	}
}

// update user
async function updateUser(req, res) {
	let result = null;
	try {
		const params = req.body;
		res.statusCode = 500;
		if (params && params.email) {
			// required parameters - email, otp
			const data = await userDbService.getUserByEmail(params.email);
			if (data) {
				params.is_verified = params.is_verified ? params.is_verified : data.is_verified; // it is only updated by verify email / explicit value
				if (!params.secret_key) {
					// applicable on profile updated
					params.secret_key = data.secret_key;
				}
				if (params.is_signup_completed === undefined) {
					// is_signup_completed only update once while signup form submitted
					params.is_signup_completed = data.is_signup_completed;
				}
				const isUpdated = await userDbService.updateUser(params);
				if (isUpdated) {
					res.statusCode = 200;
					result = { email: params.email, message: "user updated successfully" };
				}
			} else {
				res.statusCode = 404;
			}
		} else {
			res.statusCode = 400;
		}
	} catch (error) {
		console.error("update user api failed :: ", error);
	} finally {
		return result;
	}
}

// get user by email & password (secret_key)
async function getUserByEmailAndPassword(req, res) {
	let result = null;
	try {
		const params = req.body;
		res.statusCode = 500;
		if (params && params.email && params.password) {
			// required parameters - email, password
			const data = await userDbService.getUserByEmailAndPassword(params.email, params.password);
			if (data) {
				res.statusCode = 200;
				delete data.secret_key;
				result = data;
			} else {
				res.statusCode = 404;
			}
		} else {
			res.statusCode = 400;
		}
	} catch (error) {
		console.error("get user by email and password api failed :: ", error);
	} finally {
		return result;
	}
}

// get user by email
async function getUserByEmail(req, res) {
	let result = null;
	try {
		const params = req.body;
		res.statusCode = 500;
		if (params && params.email) {
			// required parameter - email
			const data = await userDbService.getUserByEmail(params.email);
			if (data) {
				res.statusCode = 200;
				delete data.secret_key;
				delete data.otp;
				result = data;
			} else {
				res.statusCode = 404;
			}
		} else {
			res.statusCode = 400;
		}
	} catch (error) {
		console.error("get user by email api failed :: ", error);
	} finally {
		return result;
	}
}
// resend opt
async function resendOtp(req, res) {
	let result = null;
	try {
		const params = req.body;
		res.statusCode = 500;
		if (params && params.email) {
			// required parameter - email
			const data = await userDbService.getUserByEmail(params.email);
			if (data) {
				data.is_verified = false;
				data.otp = commonUtils.generateRandomNumber();
				const isUpdated = await userDbService.updateUser(data);
				if (isUpdated) {
					// success
					res.statusCode = 200;
					result = { email: data.email, message: "otp sent successfully" };
					// send email
					if (params.isUserCreation) {
						userMailer.sendUserEmail(data.email, data.otp);
					} else {
						authMailer.sendForgotPasswordEmail(data.email, data.otp);
					}
				}
			} else {
				res.statusCode = 404;
			}
		} else {
			res.statusCode = 400;
		}
	} catch (error) {
		console.error("resend otp api failed :: ", error);
	} finally {
		return result;
	}
}
// update user cards
async function updateUserCards(req, res) {
	let result = null;
	try {
		const params = req.body;
		res.statusCode = 500;
		if (params && params.email) {
			// required parameters - email, otp
			const data = await userDbService.getUserByEmail(params.email);
			if (data) {
				data.card_keys = params.cardKeys;
				const isUpdated = await userDbService.updateUser(data);
				if (isUpdated) {
					res.statusCode = 200;
					result = { email: data.email };
				} else {
					console.error("update user cards failed");
				}
			} else {
				res.statusCode = 404;
			}
		} else {
			res.statusCode = 400;
		}
	} catch (error) {
		console.error("update user cards api failed :: ", error);
	} finally {
		return result;
	}
}
module.exports = { createUser, verifyUser, updateUser, getUserByEmailAndPassword, getUserByEmail, resendOtp, updateUserCards };
