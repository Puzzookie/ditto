import express from 'express';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Client, Events, GatewayIntentBits, ActivityType } from 'discord.js';

let client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});

const app = express();
const port = process.env.PORT || 3000;

let person = "";

app.use(express.json()); // For parsing JSON bodies

app.get('/', async (req, res) => {
  try {
    res.json({
      message: 'Hello World',
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

async function reset()
{     


    client.on(Events.MessageCreate, async message => { 
        if (message.author.bot) return;

        if (message.content.toLowerCase().startsWith("ditto, ")) 
        {
          console.log(person);
          const split = message.content.toLowerCase().split("ditto, ");
          console.log(split);
          if (split.length > 1) {
            const question = split[1].trim();
            if (question.length > 0) {
              try {
                const apiKey = process.env.GEMINI_API_KEY;
                const genAI = new GoogleGenerativeAI(apiKey);

                const model = genAI.getGenerativeModel({
                  model: "gemini-2.0-flash-exp",
                });

                const generationConfig = {
                  temperature: 1,
                  topP: 0.95,
                  topK: 40,
                  maxOutputTokens: 8192,
                  responseMimeType: "text/plain",
                };

                const chatSession = model.startChat({
                  generationConfig,
                  history: [
                  ],
                });

                const result = await chatSession.sendMessage("Pretend as though you are " + person + ". Response to this in a couple paragraphs (without assuming their gender)" + question);

                let response = result.response.text().toString().trim();
                //console.log(response);
                
                await message.channel.send(`${response}`);
              } 
              catch (error) {
                  console.log(error);
                  await message.channel.send(`Try again later`);
              }

            }
          }
        }
        else if(message.content.toLowerCase().startsWith('$'))
        {
          const commandQuery = message.content.toLowerCase().slice(1).trim();
          if(commandQuery.length > 0)
          {
            person = commandQuery;
            //console.log(person);

            try{
              client.user.setPresence({
                activities: [{ name: "I'm " + person, type: ActivityType.Custom }],
                status: 'online',
              });
            }
            catch(err)
            {
              console.log(err);
            }
          }
        }
    });
    
    await client.login(process.env.DISCORD_TOKEN);    
}

await reset();

app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
