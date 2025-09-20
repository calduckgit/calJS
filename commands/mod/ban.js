import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ComponentType,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server")
    .addUserOption(option =>
      option.setName("target")
        .setDescription("The member to ban")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason for the ban")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false), // disable in DMs

  async execute(interaction) {
    const target = interaction.options.getUser("target");
    const reason = interaction.options.getString("reason") || "No reason provided";

    const confirmEmbed = new EmbedBuilder()
      .setTitle("⚠️ Ban Confirmation")
      .setDescription(`Are you sure you want to ban **${target.username}**?\nReason: \`${reason}\``)
      .setColor(0xFF0000)
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm_ban")
        .setLabel("✅ Confirm")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("cancel_ban")
        .setLabel("❌ Cancel")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [confirmEmbed],
      components: [row],
      ephemeral: true, // only visible to command user
    });

    const collector = interaction.channel.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 15000, // 15 seconds
      filter: i => i.user.id === interaction.user.id,
    });

    collector.on("collect", async i => {
      if (i.customId === "confirm_ban") {
        try {
          const member = await interaction.guild.members.fetch(target.id);
          await member.ban({ reason });
          await i.update({
            embeds: [
              new EmbedBuilder()
                .setTitle("✅ Banned")
                .setDescription(`${target.tag} has been banned.`)
                .setColor(0x00FF00),
            ],
            components: [],
          });
        } catch (error) {
          console.error(error);
          await i.update({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌ Error")
                .setDescription(`Failed to ban ${target.tag}. Do I have the right permissions?`)
                .setColor(0xFF0000),
            ],
            components: [],
          });
        }
      } else if (i.customId === "cancel_ban") {
        await i.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("🚫 Cancelled")
              .setDescription("Ban action has been cancelled.")
              .setColor(0x808080),
          ],
          components: [],
        });
      }
    });

    collector.on("end", async collected => {
      if (collected.size === 0) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("⌛ Timed Out")
              .setDescription("No action taken.")
              .setColor(0x808080),
          ],
          components: [],
        });
      }
    });
  },
};
