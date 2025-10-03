import { Client, GatewayIntentBits, Events, EmbedBuilder } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const PREFIX = "!";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`🤖 Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (commandName === "ping") {
    const latency = Date.now() - message.createdTimestamp;
    const embed = new EmbedBuilder()
      .setDescription(`Ping latency: \`${latency}ms\`\n-# If hosted through terminal, expect higher latency.`)
      .setColor(2895667);
    await message.reply({ embeds: [embed] });
  }
});

client.login(process.env.DISCORD_TOKEN);