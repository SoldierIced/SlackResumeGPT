// import { Configuration, OpenAIApi } from "openai";
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
    apiKey: process.env.CHAT_GPT_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = async function (sayWord, message) {
    if (!configuration.apiKey) {
        console.log("configuration no has api key (chatgpt)")
        return "";
    }
    try {
        let completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            // model: "davinci",
            messages: [{ role: "system", content: "Realiza un resumen de la siguiente conversacion, sabiendo que los mensajes de cada mensaje es <nombre usuario " + sayWord + " : >" }, { role: "user", content: message }],
        });

        return completion.data.choices[0].message;
    } catch (error) {
        console.log(error);
        // Consider adjusting the error handling logic for your use case
        if (error.response) {
            console.error(error.response.status, error.response.data);
            return error.response.data;
        } else {
            console.error(`Error with OpenAI API request: ${error.message}`);
            return 'An error occurred during your request.';

        }
    }
}

// function generatePrompt(animal) {

//     return `Realiza un resumen de la siguiente conversacion :
//     U05B30WBP8X dijo :' <@U05B30WBP8X> se ha unido al canal' U05BHD892KV dijo :' <@U05BHD892KV> se ha unido al canal' U05B30WBP8X dijo :' buenas' U05B30WBP8X dijo :' prueba 1' U05BW871XS5 dijo :' <@U05BW871XS5> se ha unido al canal' U05B30WBP8X dijo :' hoy voy a contar que estoy probando la logica
//     `;
// }