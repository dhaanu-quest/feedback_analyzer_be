const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const csv = require('fast-csv');
const config = require('../config/config');
const FeedbackModel = require('../models/feedbackModel');

class FeedbackFunctions {
    aiFunctions = {};

    constructor({ aiFunctions }) {
        this.aiFunctions = aiFunctions;
    }

    async uploadFeedbackCSV({ file, userId }) {
        console.log('FeedbackFunctions: uploadFeedbackCSV')
        try {
            if (!file) {
                return {
                    status: 400,
                    json: {
                        success: false,
                        error: 'Missing required fields'
                    }
                }
            }

            const parseCSVResponse = await new Promise((resolve, reject) => {
                try {
                    const results = [];
                    // create read stream, then pipe - parse, then on -> get data, then on -> end - resolve
                    fs.createReadStream(file.path)
                        .pipe(csv.parse())
                        .on('data', (data) => {
                            results.push(data)
                        })
                        .on('end', () => {
                            resolve({
                                success: true,
                                data: results
                            })
                        })
                        .on('error', (error) => {
                            reject({
                                success: false,
                                error: error
                            })
                        })

                } catch (error) {
                    reject({
                        success: false,
                        error
                    })
                }
            })

            if (!parseCSVResponse?.success) {
                return {
                    status: 400,
                    json: {
                        success: false,
                        error: parseCSVResponse.error,
                    }
                }
            }

            if (parseCSVResponse?.data?.length > 500) {
                return {
                    status: 400,
                    json: {
                        success: false,
                        error: "File too large",
                    },
                }
            }

            const stringifiedData = await this.analyzeFeedbacks({ data: parseCSVResponse?.data });

            const analyzedData = stringifiedData.json?.data;

            const newFeedback = await FeedbackModel.create({
                id: `f-${uuidv4()}`,
                jsonData: JSON.stringify(parseCSVResponse?.data),
                promptResults: analyzedData,
                userId,
                fileName: file?.originalname
            })

            return {
                status: 200,
                json: {
                    success: true,
                    data: analyzedData, // stringified
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

    async getAllFeedbackAnalysis({ userId }) {
        console.log('FeedbackFunctions: getFeedbackAnalysis')

        try {
            const feedbackData = await FeedbackModel.find({ userId })

            return {
                status: 200,
                json: {
                    success: true,
                    data: feedbackData, // includes csv data & prompt results both stringified
                },
            }

        } catch (error) {
            console.log(error)
            return {
                status: 500,
                json: {
                    success: false,
                    error: "Unable to get feedbacks analysis",
                },
            }
        }
    }

    async getFeedbackAnalysis({ id }) {
        console.log('FeedbackFunctions: getFeedbackAnalysis')

        try {
            const feedbackData = await FeedbackModel.findOne({ id })

            return {
                status: 200,
                json: {
                    success: true,
                    data: feedbackData.promptResults, // includes csv data & prompt results both stringified
                },
            }

        } catch (error) {
            console.log(error)
            return {
                status: 500,
                json: {
                    success: false,
                    error: "Unable to get feedbacks analysis",
                },
            }
        }
    }

    async analyzeFeedbacks({ data }) {
        console.log('FeedbackFunctions: analyzeFeedbacks')

        try {
            // let data = [
            //     { "userId": "user1", "feedback": "The reports are too slow to load." },
            //     { "userId": "user2", "feedback": "I would love a dark mode option." },
            //     { "userId": "user3", "feedback": "The onboarding process is confusing." },
            //     { "userId": "user4", "feedback": "Customer support is slow to respond." },
            //     { "userId": "user5", "feedback": "The app crashes every time I try to export." },
            //     { "userId": "user6", "feedback": "Great new UI, it looks amazing!" },
            //     { "userId": "user7", "feedback": "I dont understand what primarily this app solves the issue" },
            //     { "userId": "user8", "feedback": "price is high" },
            //     { "userId": "user9", "feedback": "many places, I find your app getting stuck or crashing" },
            //     { "userId": "user10", "feedback": "your feedback component is too good" },
            //     { "userId": "user11", "feedback": "confusing platform, make it easier for users" },
            //     { "userId": "user12", "feedback": "just want to say, congratulations for the launch" },
            //     { "userId": "user13", "feedback": "add tutorials please" },
            //     { "userId": "user14", "feedback": "improve AI features" },
            //     { "userId": "user15", "feedback": "components are not easy to use as you advertise, i spent long time to integrate" },
            //     { "userId": "user16", "feedback": "few features are not easy to understand, usability needs to be improved" },
            //     { "userId": "user17", "feedback": "poor usability" },
            //     { "userId": "user18", "feedback": "poor features overall, not worthy" },
            //     { "userId": "user19", "feedback": "Great app" },
            //     { "userId": "user20", "feedback": "how can i reach support???" },
            //     { "userId": "user21", "feedback": "Good" },
            //     { "userId": "user22", "feedback": "GREATTTT" }
            // ]

            const systemPrompt = `You are an AI feedback analyzer for a SaaS company. Your task is to analyze an array of customer feedback data ${JSON.stringify(data)} and 
            provide the following findings in a detailed, structured format. 
            The feedback contains text from multiple users, and you will process and classify the data into meaningful insights. 
            Here's what I need:

Sentiment Analysis: 
Classify each piece of feedback as Positive, Neutral, or Negative. 
Provide a summary of the total number of feedback entries in each category.

Key Themes: 
Categorize feedback into:
Performance Issues
Feature Requests
Onboarding and Usability
Customer Support
Pricing Include details of specific issues within each theme.

Prioritization: 
Assign each issue a priority (High, Moderate, Low) based on its impact on user satisfaction, and explain briefly.

Feature Requests: 
Highlight feature requests and their priority based on user need and frequency.

Key Problems: 
Identify the most urgent problems that need to be addressed to improve user satisfaction. 

Churn Prediction and Retention Opportunity:
For users who left negative feedback, identify potential churn risks. Provide reasons for churn risk and specific users who might be at risk.
Suggest retention strategies for these users based on their feedback, prioritizing the most critical retention opportunities.

Report Summary: Conclude with a high-level summary of sentiment, top issues, feature requests, churn prediction, and retention strategies.
            `

            let responseFormat = {
                type: "json_schema",
                json_schema: {
                    name: "feedback_analysis_schema",
                    schema: {
                        type: "object",
                        properties: {
                            sentiment_analysis: {
                                type: "object",
                                description: "Summary of feedback entries by category",
                                properties: {
                                    positive: {
                                        type: "object",
                                        properties: {
                                            count: { type: "number" },
                                            userIds: { type: "array", items: { type: "string" } }
                                        }
                                    },
                                    negative: {
                                        type: "object",
                                        properties: {
                                            count: { type: "number" },
                                            userIds: { type: "array", items: { type: "string" } }
                                        }
                                    },
                                    neutral: {
                                        type: "object",
                                        properties: {
                                            count: { type: "number" },
                                            userIds: { type: "array", items: { type: "string" } }
                                        }
                                    }
                                }
                            },
                            theme_category: {
                                type: "object",
                                description: "Categorized themes in feedback",
                                properties: {
                                    performance_issues: { type: "array", items: { type: "string" } },
                                    feature_requests: { type: "array", items: { type: "string" } },
                                    onboarding_and_usability: { type: "array", items: { type: "string" } },
                                    customer_support: { type: "array", items: { type: "string" } },
                                    pricing: { type: "array", items: { type: "string" } }
                                }
                            },
                            priority: {
                                type: "object",
                                description: "Priority classification of issues",
                                properties: {
                                    high: { type: "array", items: { type: "string" } },
                                    moderate: { type: "array", items: { type: "string" } },
                                    low: { type: "array", items: { type: "string" } }
                                }
                            },
                            feature_requests: {
                                type: "array",
                                description: "Feature requests categorized by priority",
                                items: {
                                    type: "object",
                                    properties: {
                                        request: { type: "string" },
                                        priority: { type: "string" }
                                    }
                                }
                            },
                            key_problems: {
                                type: "array",
                                description: "Most urgent issues to improve satisfaction",
                                items: { type: "string" }
                            },
                            churn_prediction: {
                                type: "array",
                                description: "Churn risks with reasons",
                                items: {
                                    type: "object",
                                    properties: {
                                        userId: { type: "string" },
                                        reason: { type: "string" }
                                    }
                                }
                            },
                            retention_strategies: {
                                type: "array",
                                description: "Retention strategies for at-risk users",
                                items: { type: "string" }
                            }
                        },
                        required: ["sentiment_analysis", "theme_category", "priority", "feature_requests", "key_problems", "churn_prediction", "retention_strategies"],
                        additionalProperties: false
                    }
                }
            }


            const promptResponse = await this.aiFunctions.askAI({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt,
                    }
                ],
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${config.OPENAI_API_KEY}`,
                },
                response_format: responseFormat
            });

            return promptResponse;

        } catch (error) {
            console.log(error)
            return {
                status: 200,
                json: {
                    success: false,
                    error: "Unable to analyze feedbacks",
                }
            }
        }
    }
}


module.exports = FeedbackFunctions


// data: {
//     "sentiment_analysis": { "positive": 1, "negative": 5, "neutral": 0 },
//     "theme_category": {
//         "performance_issues": ["The reports are too slow to load.", "The app crashes every time I try to export."],
//         "feature_requests": ["I would love a dark mode option."],
//         "onboarding_and_usability": ["The onboarding process is confusing."],
//         "customer_support": ["Customer support is slow to respond."],
//         "pricing": []
//     },
//     "priority": {
//         "high": ["The app crashes every time I try to export.", "Customer support is slow to respond."],
//         "moderate": ["The reports are too slow to load.", "The onboarding process is confusing."],
//         "low": ["I would love a dark mode option."]
//     },
//     "feature_requests": [{ "request": "Dark mode option", "priority": "Low" }],
//     "key_problems": ["The app crashes every time I try to export.", "Customer support is slow to respond.", "The reports are too slow to load."],
//     "churn_prediction": ["Users who reported issues with the app crashing or slow customer support may be at risk of churn."],
//     "retention_strategies": ["Improve the stability of the app to prevent crashes during exports.", "Accelerate response times for customer support requests."]
// },
// data: {
//     "sentiment_analysis": {
//         "positive": { "count": 3, "userIds": ["user6", "user10", "user12"] },
//         "negative": { "count": 8, "userIds": ["user1", "user3", "user4", "user5", "user7", "user9", "user11", "user8"] },
//         "neutral": { "count": 0, "userIds": [] }
//     },
//     "theme_category": {
//         "performance_issues": ["The reports are too slow to load.", "The app crashes every time I try to export.", "many places, I find your app getting stuck or crashing."],
//         "feature_requests": ["I would love a dark mode option."],
//         "onboarding_and_usability": ["The onboarding process is confusing.", "confusing platform, make it easier for users.", "I dont understand what primarily this app solves the issue"],
//         "customer_support": ["Customer support is slow to respond."],
//         "pricing": ["price is high"]
//     },
//     "priority": {
//         "high": ["The app crashes every time I try to export.", "many places, I find your app getting stuck or crashing.", "Customer support is slow to respond.", "The onboarding process is confusing."],
//         "moderate": ["The reports are too slow to load.", "I would love a dark mode option.", "confusing platform, make it easier for users.", "I dont understand what primarily this app solves the issue.", "price is high"]
//     },
//     "low": [],
//     "feature_requests": [{ "request": "dark mode option", "priority": "moderate" }],
//     "key_problems": ["App crashes on export", "Performance issues with loading reports and crashes",
//         "Confusion during onboarding and usability", "Slow customer support response times", "High pricing concerns"],
//     "churn_prediction": [
//         { "userId": "user1", "reason": "Negative feedback about slow loading reports could lead to frustration and abandonment." },
//         { "userId": "user3", "reason": "Confusion during onboarding may result in users not fully engaging with the platform." },
//         { "userId": "user4", "reason": "Slow customer support can lead to dissatisfaction and possibly churn." },
//         { "userId": "user5", "reason": "Frequent app crashes make for a frustrating user experience." },
//         { "userId": "user11", "reason": "Confusion with platform usage suggests a lack of clarity in its functionality." },
//         { "userId": "user9", "reason": "Repeated issues with the app crashing and getting stuck might drive users to seek alternatives." },
//         { "userId": "user8", "reason": "Pricing concerns can lead to dissatisfaction, especially if users feel they aren't receiving enough value." }],
//     "retention_strategies":
//         ["Improve app stability to reduce crashes during exporting and loading.",
//             "Enhance onboarding tutorials and support to clarify app functionalities.",
//             "Increase responsiveness of customer support to address user queries promptly.",
//             "Consider pricing adjustments or provide flexible subscription options to appeal to budget-conscious users."]
// },
// data: {
//     "sentiment_analysis":
//     {
//         "positive": { "count": 7, "userIds": ["user6", "user10", "user12", "user19", "user21", "user22"] },
//         "negative": { "count": 15, "userIds": ["user1", "user3", "user4", "user5", "user7", "user8", "user9", "user11", "user14", "user15", "user16", "user17", "user18", "user20"] }, "neutral": {
//             "count": 0,
//             "userIds": []
//         }
//     }, "theme_category": {
//         "performance_issues": ["The reports are too slow to load.",
//             "The app crashes every time I try to export.", "many places, I find your app getting stuck or crashing.",
//             "poor usability", "poor features overall, not worthy"],
//         "feature_requests": ["I would love a dark mode option.",
//             "add tutorials please.", "improve AI features."],
//         "onboarding_and_usability": ["The onboarding process is confusing.",
//             "I dont understand what primarily this app solves the issue.", "confusing platform, make it easier for users.",
//             "few features are not easy to understand, usability needs to be improved.",
//             "components are not easy to use as you advertise, i spent long time to integrate."],
//         "customer_support": ["Customer support is slow to respond.", "how can i reach support???"],
//         "pricing": ["price is high"]
//     }, "priority":
//     {
//         "high": ["The app crashes every time I try to export.", "poor usability",
//             "confusing platform, make it easier for users.", "Customer support is slow to respond."],
//         "moderate": ["The reports are too slow to load.", "The onboarding process is confusing.", "improve AI features.",
//             "few features are not easy to understand, usability needs to be improved."],
//         "low": ["I would love a dark mode option.", "add tutorials please.", "price is high.", "Great new UI, it looks amazing!", "Good", "GREATTTT"]
//     }, "feature_requests":
//         [{ "request": "I would love a dark mode option.", "priority": "Low" },
//         { "request": "add tutorials please.", "priority": "Moderate" },
//         { "request": "improve AI features.", "priority": "Moderate" }],
//     "key_problems": ["Frequent crashes during export and general app instability.", "Confusing onboarding process hurts user experience.", "Slow response times from customer support."],
//     "churn_prediction": [{ "userId": "user1", "reason": "Frustration due to slow report loading affecting usage." },
//     { "userId": "user4", "reason": "Dissatisfaction with customer support response times." },
//     { "userId": "user5", "reason": "Repeated crashes deter from app reliability." },
//     { "userId": "user11", "reason": "Confusion surrounding app usability impacting effectiveness." },
//     { "userId": "user18", "reason": "Overall feeling of poor feature quality not aligning with expectations." }],
//     "retention_strategies": ["Enhance crash resolution mechanisms and performance monitoring to improve app stability.",
//         "Revamp onboarding experience with guided tours and intuitive UI changes.",
//         "Strengthen customer support by reducing response time through extra staffing or streamlined processes."]
// }

// properties: {
//     positive: { type: "number", description: "Count of positive feedback" },
//     negative: { type: "number", description: "Count of negative feedback" },
//     neutral: { type: "number", description: "Count of neutral feedback" }
// }