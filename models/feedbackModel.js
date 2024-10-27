const mongoose = require('mongoose')

const FeedbackSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        jsonData: { type: String, required: true },
        promptResults: { type: String },
        userId: { type: String },
        fileName: { type: String },
    },
    {
        timestamps: true
    }
)

const FeedbackModel = mongoose.model('FeedbackModel', FeedbackSchema)

module.exports = FeedbackModel