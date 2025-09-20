import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const PREFIX = "!";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages, // required for message events
    GatewayIntentBits.MessageContent, // required to read message text
  ],
});

// --------------------
// Prefix Commands
// --------------------
client.on(Events.MessageCreate, (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (commandName === "ping") {
    message.reply("🏓 Pong! (prefix)");
  }

  if (commandName === "say") {
    const text = args.join(" ");
    if (!text) return message.reply("❌ You must provide text!");
    message.channel.send(text);
  }
});

// --------------------
// Slash Commands
// --------------------
client.commands = new Collection();

const foldersPath = path.join(process.cwd(), "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = (await import(`file://${filePath}`)).default;
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing "data" or "execute".`);
    }
  }
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`🤖 Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "❌ There was an error executing this command.", ephemeral: true });
    } else {
      await interaction.reply({ content: "❌ There was an error executing this command.", ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);