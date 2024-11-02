const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const IntegrationModel = require('../models/integrationModel')

class IntegrationFunctions {
    // both jira and clickup tested

    async addJiraKeys({ userId, key, domain, apiToken }) {
        console.log("IntegrationFunctions: addJiraKeys");
        try {

            const jiraKeys = await IntegrationModel.create({
                id: `i-${uuidv4()}`,
                integrationName: 'JIRA',
                auth: {
                    jiraToken: apiToken,
                    jiraDomain: domain,
                    jiraKey: key,
                },
                userId
            })

            return {
                status: 200,
                json: {
                    success: true
                },
            }

        } catch (error) {
            console.log(error)
            return {
                status: 500,
                json: {
                    success: false,
                    error: "Unable to upload CSV and analyze feedbacks",
                },
            }

        }
    }

    async addClickupKeys({ userId, listId, apiKey }) {
        console.log("IntegrationFunctions: addClickupKeys");

        try {

            const clickupKeys = await IntegrationModel.create({
                id: `i-${uuidv4()}`,
                integrationName: 'CLICKUP',
                auth: {
                    clickupAPIKey: apiKey,
                    clickupListId: listId,
                },
                userId
            })

            return {
                status: 200,
                json: {
                    success: true,
                },
            }

        } catch (error) {
            console.log(error)
            return {
                status: 500,
                json: {
                    success: false,
                    error: "Unable to upload CSV and analyze feedbacks",
                },
            }
        }
    }

    async createJiraIssue({ userId, email, feedback }) {
        console.log("IntegrationFunctions: createJiraIssue");
        try {

            const getAuthKeys = await IntegrationModel.findOne({
                userId: userId,
                integrationName: 'JIRA'
            })

            if (!getAuthKeys) {
                return {
                    status: 400,
                    json: {
                        success: false,
                        error: 'Please integrate JIRA firstly!',
                    },
                }
            }

            const jiraBaseUrl = getAuthKeys?.auth?.jiraDomain;
            const apiEndpoint = `${jiraBaseUrl}/rest/api/2/issue`;

            const issueData = {
                fields: {
                    project: {
                        key: getAuthKeys?.auth?.jiraKey
                    },
                    issuetype: {
                        name: "Task"
                    },
                    summary: `User feedback: ${feedback.summary}`,
                    description: feedback.description
                }
            };

            const response = await axios.post(apiEndpoint, issueData, {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${email}:${getAuthKeys?.auth?.jiraToken}`).toString("base64")}`,
                    "Content-Type": "application/json"
                }
            });

            return {
                status: 201,
                json: {
                    success: true,
                    data: response.data.key
                },
            }
        } catch (error) {
            console.log(error)
            return {
                status: 500,
                json: {
                    success: false,
                    error: "Unable to create issue in JIRA",
                },
            }
        }
    }

    async createClickUpTask({ userId, feedback }) {
        console.log("IntegrationFunctions: createClickUpTask");

        try {

            const getAuthKeys = await IntegrationModel.findOne({
                userId: userId,
                integrationName: 'CLICKUP'
            })

            if (!getAuthKeys) {
                return {
                    status: 400,
                    json: {
                        success: false,
                        error: 'Please integrate CLICKUP firstly!',
                    },
                }
            }

            const url = `https://api.clickup.com/api/v2/list/${getAuthKeys?.auth?.clickupListId}/task`;

            const body = {
                name: feedback.summary,
                description: feedback.description,
            };

            const response = await axios.post(url, body, {
                headers: {
                    'Authorization': getAuthKeys?.auth?.clickupAPIKey,
                    'Content-Type': 'application/json'
                }
            });

            return {
                status: 201,
                json: {
                    success: true,
                    data: response.data,
                },
            }
        } catch (error) {
            console.log('Error creating task:', error);
            return {
                status: 500,
                json: {
                    success: false,
                    error: "Unable to create task in Clickup",
                },
            }
        }
    }

    async getIntegrationData({ userId }) {
        console.log("IntegrationFunctions: getIntegrationData");

        try {
            const data = await IntegrationModel.find({ userId })
            return {
                status: 200,
                json: {
                    success: true,
                    data
                },
            }

        } catch (error) {
            console.log(error)
            return {
                status: 500,
                json: {
                    success: false,
                    error: "Unable to get integration data",
                },
            }
        }
    }

}

module.exports = IntegrationFunctions
