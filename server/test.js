import { ChatOpenAI } from "@langchain/openai"
const model = new ChatOpenAI({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiVersion: process.env.OPENAI_API_VERSION,
    azureOpenAIApiInstanceName: process.env.INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.ENGINE_NAME,
})
const joke = await model.invoke("vertel mij een goede motivational quote met betrekking tot fortnite")
console.log(joke.content)