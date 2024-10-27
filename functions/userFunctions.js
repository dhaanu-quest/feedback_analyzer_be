require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const { v4: uuidv4 } = require('uuid');

class UserFunctions {

    async createNewUser({ email, password }) {
        console.log("UserFunctions: createNewUser");

        try {
            const existingUser = await UserModel.findOne({ email });
            if (existingUser) {
                return {
                    status: 400,
                    json: {
                        success: false,
                        message: 'User already exists'
                    },
                }
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await UserModel.create({
                userId: `u-${uuidv4()}`,
                email,
                password: hashedPassword
            })

            return {
                status: 201,
                json: {
                    success: true,
                    data: newUser,
                },
            }

        } catch (error) {
            console.log(error)
            return {
                status: 500,
                json: {
                    success: false,
                    error: "Unable to create new user",
                },
            }
        }
    }

    async checkUserSignIn({ email, password }) {
        console.log("UserFunctions: checkUserSignIn");

        try {
            const user = await UserModel.findOne({ email });
            if (!user) {
                return {
                    status: 400,
                    json: {
                        success: false,
                        error: 'User didnt exist',
                    },
                }
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return {
                    status: 400,
                    json: {
                        success: false,
                        error: 'Invalid credentials',
                    },
                }
            }

            const token = jwt.sign({ userId: user.userId, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7h' });

            return {
                status: 200,
                json: {
                    success: true,
                    userId: user.userId,
                    email: user.email,
                    data: token,
                },
            }
        } catch (error) {
            console.log(error)
            return {
                status: 500,
                json: {
                    success: false,
                    error: "Unable to signin",
                },
            }
        }
    }

}

module.exports = UserFunctions