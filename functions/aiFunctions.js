const axios = require('axios');

class AIFunctions {
    async askAI({ model, messages, max_tokens, temperature, response_format, headers }) {
        console.log("AIFunctions: askAI");

        try {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model,
                    messages,
                    max_tokens,
                    temperature,
                    response_format,
                },
                { headers }
            );

            return {
                status: 200,
                json: {
                    success: true,
                    data: response?.data?.choices[0]?.message?.content
                },
            }
        } catch (error) {
            console.log(error);
            if (error?.response?.data) console.log(JSON.stringify(error?.response?.data, null, 2));

            return {
                status: 500,
                json: {
                    success: false,
                    error: "Unable to analyze feedbacks",
                },
            }
        }
    }
}


module.exports = AIFunctions



