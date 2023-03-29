const { Configuration, OpenAIApi } = require("openai");

class OpenAI {
    constructor() {
        this.openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));
    }

    async complete(prompt, maxTokens = 100, temperature = 0.5, topP = 1, frequencyPenalty = 0, presencePenalty = 0) {
        const request = {
            prompt: "Please summarize this conversion: " + prompt,
            maxTokens,
            temperature,
            topP,
            frequencyPenalty,
            presencePenalty,
        };
        const response = await this.openai.completions(request);
        return response.data.choices[0].text;
    }
}

module.exports = {
    OpenAI,
}