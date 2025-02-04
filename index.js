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

let person = "Ditto";

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

async function handleInteraction(interaction) {
  
    try {

      const { commandName, options } = interaction;
      person = options.getString("into");
      
      client.user.setPresence({
        activities: [{ name: "I'm " + person, type: ActivityType.Custom }],
        status: 'online',
      });
      
      await interaction.reply({
        content: `Transformed into '${person}' successfully`,
      });
    }
    catch (error) {
      await interaction.reply({
          content: `An error occurred. Try again later`,
          ephemeral: true
      });
    }
}

async function reset()
{     
  client.on(Events.InteractionCreate, async interaction => {
        if(!interaction.isCommand()) 
        {
            return;
        }
    
        await handleInteraction(interaction);
    });
  
    client.on(Events.MessageCreate, async message => { 
        if (message.author.bot) return;

        if (message.content.toLowerCase().startsWith("ditto, ")) 
        {
          const split = message.content.toLowerCase().split("ditto, ");
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

                const result = await chatSession.sendMessage("Pretend as though you are " + person + ". Respond to this in a paragraph or two (without assuming their gender)" + question);

                let response = result.response.text().toString().trim();
                
                await message.channel.send(`${person}: ${response}`);
              } 
              catch (error) {
                  console.log(`An error occurred. Try again later`);
                  await message.channel.send(`An error occurred. Try again later`);
              }

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
