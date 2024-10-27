const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const IntegrationModel = require('../models/integrationModel')

class IntegrationFunctions {
    // both jira and clickup tested

    async addJiraKeys({ userId, key, domain, apiToken }) {
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

            console.log("JIRA integration is successful");

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

            console.log("CLICKUP integration is successful");

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
        try {

            const getAuthKeys = await IntegrationModel.findOne({
                userId: userId
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

            const jiraBaseUrl = getAuthKeys?.jiraDomain;
            const apiEndpoint = `${jiraBaseUrl}/rest/api/2/issue`;

            const issueData = {
                fields: {
                    project: {
                        key: getAuthKeys?.jiraKey
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
                    Authorization: `Basic ${Buffer.from(`${email}:${getAuthKeys?.jiraToken}`).toString("base64")}`,
                    "Content-Type": "application/json"
                }
            });

            console.log("Issue created:", response.data.key);
            return response.data.key;
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
        try {

            const getAuthKeys = await IntegrationModel.findOne({
                userId: userId
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

            const url = `https://api.clickup.com/api/v2/list/${getAuthKeys?.listId}/task`;

            const body = {
                name: feedback.summary,
                description: feedback.description,
            };

            const response = await axios.post(url, body, {
                headers: {
                    'Authorization': getAuthKeys?.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Task created successfully:', response.data);
            return response.data;
        } catch (error) {
            console.log('Error creating task:', error.response ? error.response.data : error.message);
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
        try {
            console.log(userId)
            const data = await IntegrationModel.find({ userId })
            console.log(data)
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
