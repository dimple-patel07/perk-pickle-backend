const pg = require("pg");
const commonUtils = require("../utils/common_utils");
var client;
function getClient() {
	// expecting db with following credentials
	// CREATE USER perkpickle WITH PASSWORD 'perkpickle123';
	// CREATE DATABASE perkpickle_db OWNER perkpickle;
	// $ psql -h localhost -d perkpickle_db -U perkpickle;

	return new pg.Client({
		host: process.env.DB_HOST,
		database: process.env.DB_NAME,
		user: process.env.DB_OWNER,
		password: process.env.DB_PASSWORD,
	});
}
// connect db
function connectDb() {
	return new Promise((resolve) => {
		client = getClient();
		client.connect((error) => {
			let isConnected = false;
			if (error) {
				console.error("Connection error :: ", error);
			} else {
				isConnected = true;
				console.log("Connected!");
			}
			resolve(isConnected);
		});
	});
}
// disconnect db
function disConnectDb() {
	return new Promise((resolve) => {
		client.end((error) => {
			let isDisconnected = false;
			if (error) {
				console.error("Closing connection error :: ", error);
			} else {
				isDisconnected = true;
				console.log("Disconnected!");
			}
			resolve(isDisconnected);
		});
	});
}
// create user table
async function createUserTable() {
	return new Promise(async (resolve) => {
		const sql = `CREATE TABLE IF NOT EXISTS users (
            id SERIAL,
            email VARCHAR(255) primary key,
            name VARCHAR(255) not null,
            zip_code INT not null,
            address VARCHAR(255),
            phone_number VARCHAR(255) not null,
            secret_key VARCHAR(255) not null,
            is_verified BOOLEAN DEFAULT false,
            otp INT,
            created_date timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
            modified_date timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
        )`;
		const isConnected = await connectDb();
		let isCreated = false;
		if (isConnected) {
			client.query(sql, async (error, result) => {
				if (error) {
					console.error("Table creation error :: ", error);
				} else {
					isCreated = true;
					console.log("Table created");
				}
				await disConnectDb();
				resolve(isCreated);
			});
		} else {
			resolve(isCreated);
		}
	});
}
// create new user
function createUser(data) {
	return new Promise(async (resolve) => {
		const sql = `INSERT INTO users (email, name, zip_code, address, phone_number, secret_key, otp, is_verified) VALUES (
            '${data.email}',
            '${data.name}',
            ${data.zip_code},
            ${data.address ? `'${data.address}'` : null},
            ${data.phone_number ? `'${data.phone_number}'` : null},
            '${data.secret_key}',
            ${data.otp ? data.otp : null},
            ${data.is_verified ? true : false}
        )`;
		const isConnected = await connectDb();
		let isInserted = false;
		if (isConnected) {
			client.query(sql, async (error, result) => {
				if (error) {
					console.error("Insertion error :: ", error);
				} else {
					isInserted = true;
					console.log("New user created");
				}
				await disConnectDb();
				resolve(isInserted);
			});
		} else {
			resolve(isInserted);
		}
	});
}
// update user
function updateUser(data) {
	return new Promise(async (resolve) => {
		const sql = `UPDATE users SET
            email = '${data.email}',
            name = '${data.name}',
            zip_code = ${data.zip_code},
            address = ${data.address ? `'${data.address}'` : null},
            phone_number = '${data.phone_number}',
            secret_key = '${data.secret_key}',
            otp = ${data.otp ? data.otp : null},
            is_verified = ${data.is_verified},
            modified_date = NOW()
            WHERE email = '${data.email}'
        `;
		const isConnected = await connectDb();
		let isUpdated = false;
		if (isConnected) {
			client.query(sql, async (error, result) => {
				if (error) {
					console.error("Updation error :: ", error);
				} else {
					isUpdated = true;
					console.log("User updated");
				}
				await disConnectDb();
				resolve(isUpdated);
			});
		} else {
			resolve(isUpdated);
		}
	});
}
// get user by email and otp
function getUserByEmailAndOtp(email, otp) {
	return new Promise(async (resolve) => {
		const sql = `SELECT * from users where email='${email}' and otp=${otp}`;
		const isConnected = await connectDb();
		let found = null;
		if (isConnected) {
			client.query(sql, async (error, result) => {
				if (error) {
					console.error("User selection error :: ", error);
				} else if (result?.rows?.length > 0) {
					found = result.rows[0];
				}
				await disConnectDb();
				resolve(found);
			});
		} else {
			resolve(found);
		}
	});
}
// get user by email
function getUserByEmail(email) {
	return new Promise(async (resolve) => {
		const sql = `SELECT * from users where email='${email}'`;
		const isConnected = await connectDb();
		let found = null;
		if (isConnected) {
			client.query(sql, async (error, result) => {
				if (error) {
					console.error("User selection error :: ", error);
				} else if (result?.rows?.length > 0) {
					found = result.rows[0];
				}
				await disConnectDb();
				resolve(found);
			});
		} else {
			resolve(found);
		}
	});
}
// get user by email and password
function getUserByEmailAndPassword(email, password) {
	return new Promise(async (resolve) => {
		const secretKey = commonUtils.encryptStr(password);
		const sql = `SELECT * from users where email='${email}' and secret_key='${secretKey}'`;
		const isConnected = await connectDb();
		let found = null;
		if (isConnected) {
			client.query(sql, async (error, result) => {
				if (error) {
					console.error("User selection error :: ", error);
				} else if (result?.rows?.length > 0) {
					found = result.rows[0];
				}
				await disConnectDb();
				resolve(found);
			});
		} else {
			resolve(found);
		}
	});
}
module.exports = { createUser, updateUser, getUserByEmailAndOtp, getUserByEmail, createUserTable, getUserByEmailAndPassword };