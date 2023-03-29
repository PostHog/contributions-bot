const { Configuration, OpenAIApi } = require("openai");

class OpenAI {
    constructor() {
        this.openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));
    }

    async summarize(prompt, maxTokens = 100) {
        const request = {
            prompt: "Please summarize this conversation: " + prompt,
            maxTokens,
            model: "gpt-3.5-turbo",
        };

        const response = await openai.createCompletion(request);
        return response.choices[0].text;
    }
}

module.exports = {
    OpenAI,
}