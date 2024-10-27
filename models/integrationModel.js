const mongoose = require('mongoose')

const IntegrationSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        integrationName: { type: String, required: true },
        auth: {
            jiraToken: { type: String },
            jiraDomain: { type: String },
            jiraKey: { type: String },
            clickupListId: { type: String },
            clickupAPIKey: { type: String }
        },
        userId: { type: String }
    },
    {
        timestamps: true
    }
)

const IntegrationModel = mongoose.model('IntegrationModel', IntegrationSchema)

module.exports = IntegrationModel