import express from "express";
import cors from 'cors';
import fetch from 'node-fetch';
import {ChatOpenAI} from "@langchain/openai";

const app = express();
const port = 8000;

app.use(cors()); // Schakel CORS in
app.use(express.json());

const model = new ChatOpenAI({
    temperature: 0.0,
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiVersion: process.env.OPENAI_API_VERSION,
    azureOpenAIApiInstanceName: process.env.INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.ENGINE_NAME,
    maxRetries: 10,
    callbacks: [
        {
            handleLLMEnd(output) {
                console.log(JSON.stringify(output, null, 2));
            },
        },
    ],
});

let chatLog = [];

//post method 
app.post("/question", async (req, res) => {
    try {
        //get user question
        const prompt = req.body.prompt;

        //process user question and get AI response
        const response = await processPrompt(prompt);

        if (response.filteredData) 
        {
            //send answer with catData if present + chatHistory
            res.json({ content: response.content, filteredData: response.filteredData, fact: response.fact, chatLog: chatLog });
        } 
        else
        {
            //send answer back + chat history
            res.json({ content: response.content, chatLog: chatLog });
        }
    } 
    catch (error) 
    {
        console.error("Error processing chat query:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

async function processPrompt(prompt) { //prompt engineering
    const messages = [...chatLog, ["system", "You are a game developer Assistant trying to give the best explanations to the questions you get. Keep explanations short and simple! but dont skip out on the important parts, when Referencing game engines try to reference the latest game engine versions (for example Unreal Engine 5, Unity 2022.3 LTS, or Godot 4.2.1 when necessary) unless told different. When asked to show a cat respond with only : 'hmmmmm, okay' dont explain that you are a language model because the chat allows the user to see a actual image of a random cat. "], ["human", prompt]];

    const response = await model.invoke(messages, {
        temperature: 0.0,
        maxTokens: 100,
    });

    chatLog.push(["human", prompt]) // save the human prompt to chat history
    chatLog.push(["assistant", response.content]) // save the Ai answer to chat history;
    //console.log(chatLog) //-- log chat history with roles saved on server

    try {
        if (prompt.toLowerCase().includes("cat")) //add catdata to answer when talking about a cat
        {
            const cat = await fetch("https://api.thecatapi.com/v1/images/search?has_breeds=1&api_key=" + process.env.CAT_API_KEY);
            const catData = await cat.json();
            const filteredData = { url: catData[0].url, width: catData[0].width, height: catData[0].height, breed: catData[0].breeds[0].name };

            const fact = await catFact(filteredData.breed);

            return { content: response.content + "\n\n Speaking of a cat, here is a beautiful cat :) ", filteredData, fact };
        } 
        else 
        {
            return { content: response.content };
        }
    } catch (error) { // catch error
        console.error("Error processing chat :", error);
        return { content: "An error occurred while processing the question, sorry :(." };
    }
}

//get fun cat fact from openAI 
async function catFact(breed) {
    const response = await model.invoke("tell me a fun cat fact about the " + breed + " breed", {
        temperature: 0.5,
    })

    return "This cat is a " + breed + ". " + response.content;
}

//console log server port
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});