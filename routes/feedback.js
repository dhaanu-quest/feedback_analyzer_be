const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/', limits: { fileSize: 102400 } });
const AIFunctions = require('../functions/aiFunctions');
const FeedbackFunctions = require('../functions/feedbackFunctions');

const aiFunctions = new AIFunctions();
const feedbackFunctions = new FeedbackFunctions({ aiFunctions });

const feedbackRouter = express.Router();

feedbackRouter.post('/csv/upload-feedback', upload.single('file'), async (req, res) => {
    try {
        const { status, json } = await feedbackFunctions.uploadFeedbackCSV({
            file: req?.file,
            userId: req.body.userId
        });

        return res.status(status).json(json);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: "Unable to upload feedback data via csv",
        });
    }
})


feedbackRouter.get('/get-feedback', async (req, res) => {
    try {
        const { status, json } = await feedbackFunctions.getAllFeedbackAnalysis({ userId: req.query.userId});

        return res.status(status).json(json);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: "Unable to get feedback analysis",
        });
    }
})

module.exports = feedbackRouter;