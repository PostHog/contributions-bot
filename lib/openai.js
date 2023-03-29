const { Configuration, OpenAIApi } = require("openai");

class OpenAI {
    constructor() {
        this.openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));
    }

    async summarize(prompt) {
        const request = {
            model: "gpt-3.5-turbo",
            messages: [{role: "user", content: "Please summarize this conversation and include sections on main topic, important discussion points, a list of commenters, and the resolution so far: " + prompt}],
        };

        const response = await this.openai.createChatCompletion(request);
        return response.data.choices[0].message.content;
    }
}

module.exports = {
    OpenAI,
}