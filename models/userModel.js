const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        email: { type: String, required: true },
        password: { type: String }
    },
    {
        timestamps: true
    }
)

const UserModel = mongoose.model('UserModel', UserSchema)

module.exports = UserModel