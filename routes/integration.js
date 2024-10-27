const express = require('express');
const IntegrationRouter = express.Router();

const IntegrationFunctions = require('../functions/integrationFunctions')
const integrationFunctions = new IntegrationFunctions()


IntegrationRouter.post('/connect-jira', async (req, res) => {
    const { userId, key, domain, apiToken } = req.body;
    try {
        const { status, json } = await integrationFunctions.addJiraKeys({ userId, key, domain, apiToken })
        return res.status(status).json(json);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Unable to connect JIRA",
        });
    }
});

IntegrationRouter.post('/connect-clickup', async (req, res) => {
    const { userId, listId, apiKey } = req.body;
    try {
        const { status, json } = await integrationFunctions.addClickupKeys({ userId, listId, apiKey })
        return res.status(status).json(json);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Unable to connect CLICKUP",
        });
    }
});

IntegrationRouter.post('/create-jira-issue', async (req, res) => {
    const { userId, email, feedback } = req.body;
    try {
        const { status, json } = await integrationFunctions.createJiraIssue({ userId, email, feedback })
        return res.status(status).json(json);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Unable to add tasks to JIRA",
        });
    }
});

IntegrationRouter.post('/create-clickup-task', async (req, res) => {
    const { userId, feedback } = req.body;
    try {
        const { status, json } = await integrationFunctions.createClickUpTask({ userId, feedback })
        return res.status(status).json(json);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Unable to add issues to CLICKUP",
        });
    }
});

IntegrationRouter.get('/get-integration-data', async (req, res) => {
    const { userId } = req.query;
    try {
        const { status, json } = await integrationFunctions.getIntegrationData({ userId })
        return res.status(status).json(json);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Unable to add issues to CLICKUP",
        });
    }
});

module.exports = IntegrationRouter;
