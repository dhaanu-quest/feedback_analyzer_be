const express = require('express');
const UserRouter = express.Router();

const UserFunctions = require('../functions/userFunctions')
const userFunctions = new UserFunctions()


UserRouter.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { status, json } = await userFunctions.createNewUser({ email, password })
        return res.status(status).json(json);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Unable to upload feedback data via csv",
        });
    }
});

UserRouter.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { status, json } = await userFunctions.checkUserSignIn({ email, password })
        return res.status(status).json(json);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Unable to upload feedback data via csv",
        });
    }
});

module.exports = UserRouter;
