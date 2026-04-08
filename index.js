const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  Events
} = require("discord.js");

const config = require("./config.json");

function normalizeName(s) {
  return (s || "").toLowerCase();
}

function isTicketChannel(channel) {
  const match = normalizeName(config.ticketNameMatch || "ticket");
  const name = normalizeName(channel?.name);
  return !!name && name.includes(match);
}

/**
 * Detect ticket opener from permission overwrites:
 * pick the first member overwrite that allows ViewChannel and isn't the bot.
 */
function detectOpenerId(channel, botUserId) {
  try {
    const overwrites = channel.permissionOverwrites?.cache;
    if (!overwrites) return null;

    for (const [id, ow] of overwrites) {
      if (ow.type !== 1) continue; // 1 = member
      if (id === botUserId) continue;
      if (ow.allow?.has(PermissionsBitField.Flags.ViewChannel)) return id;
    }
    return null;
  } catch {
    return null;
  }
}

async function ensurePreClaimPermissions(channel, openerId) {
  const guild = channel.guild;
  const staffRoleId = config.staffRoleId;

  // Hide from everyone
  await channel.permissionOverwrites.edit(guild.roles.everyone.id, {
    ViewChannel: false
  }).catch(() => {});

  // Opener full access
  if (openerId) {
    await channel.permissionOverwrites.edit(openerId, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
      EmbedLinks: true
    }).catch(() => {});
  }

  // Staff view only, no chat
  if (staffRoleId) {
    await channel.permissionOverwrites.edit(staffRoleId, {
      ViewChannel: true,
      ReadMessageHistory: true,
      SendMessages: false
    }).catch(() => {});
  }
}

function buildClaimMessage(openerId) {
  const openerLine = openerId
    ? `صاحب التكت: <@${openerId}>`
    : `صاحب التكت: غير معروف (السيستم مش مدي صلاحيات للمستخدم مباشرة)`;

  const embed = new EmbedBuilder()
    .setTitle("🎫 تكت جديد - استلام")
    .setDescription(
      `${openerLine}\n\n` +
      `اضغط **استلام ✅** عشان التكت يبقى ليك لوحدك (إنت + صاحب التكت).\n` +
      `قبل الاستلام: الإدارة تشوف بس من غير كتابة.`
    )
    .setFooter({ text: "Ticket System • Claim" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`claim_ticket:${openerId || "unknown"}`)
      .setLabel("استلام ✅")
      .setStyle(ButtonStyle.Success)
  );

  return { embeds: [embed], components: [row] };
}

function isAlreadyClaimed(channel) {
  const topic = channel.topic || "";
  return topic.includes("CLAIMED_BY=");
}

async function markClaimed(channel, openerId, claimerId) {
  const current = channel.topic || "";
  const base = current.length ? current : `TICKET_OPENER=${openerId || "unknown"}`;
  const newTopic = `${base} | CLAIMED_BY=${claimerId}`;
  await channel.setTopic(newTopic).catch(() => {});
}

async function applyPostClaimPermissions(channel, openerId, claimerId) {
  const guild = channel.guild;
  const staffRoleId = config.staffRoleId;

  // Hide from staff role
  if (staffRoleId) {
    await channel.permissionOverwrites.edit(staffRoleId, { ViewChannel: false }).catch(() => {});
  }

  // Hide from everyone
  await channel.permissionOverwrites.edit(guild.roles.everyone.id, { ViewChannel: false }).catch(() => {});

  // Allow claimer full
  await channel.permissionOverwrites.edit(claimerId, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
    AttachFiles: true,
    EmbedLinks: true
  }).catch(() => {});

  // Allow opener full if known
  if (openerId && openerId !== "unknown") {
    await channel.permissionOverwrites.edit(openerId, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
      EmbedLinks: true
    }).catch(() => {});
  }
}

async function disableClaimButton(interaction) {
  const msg = interaction.message;
  const oldRow = msg.components?.[0];
  const oldBtn = oldRow?.components?.[0];
  const customId = oldBtn?.customId || "claim_ticket:unknown";

  const disabledRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel("تم الاستلام ✅")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );

  await msg.edit({ components: [disabledRow] }).catch(() => {});
}

// ---------------- Client ----------------
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Optional slash commands
async function registerCommandsIfEnabled() {
  if (!config.enableSlashCommands) return;
  const guildId = (config.guildIdForSlashCommands || "").trim();
  if (!guildId) {
    console.log("Slash commands enabled but guildIdForSlashCommands is empty. Skipping.");
    return;
  }

  const commands = [
    new SlashCommandBuilder().setName("ping").setDescription("تأكد إن البوت شغال")
  ];

  const rest = new REST({ version: "10" }).setToken(config.token);

  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, guildId),
      { body: commands.map(c => c.toJSON()) }
    );
    console.log("Slash commands registered.");
  } catch (e) {
    console.error("Failed to register commands (likely Missing Access / wrong guildId / bot not invited):", e?.rawError || e);
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await registerCommandsIfEnabled();
});

// Auto-detect created ticket channels
client.on(Events.ChannelCreate, async (channel) => {
  try {
    if (!channel || channel.type !== ChannelType.GuildText) return;
    if (!isTicketChannel(channel)) return;
    if (!config.sendIntroMessageOnCreate) return;

    const openerId = detectOpenerId(channel, client.user.id);

    if (config.enforcePreClaimPermissions) {
      await ensurePreClaimPermissions(channel, openerId);
    }

    await channel.send(buildClaimMessage(openerId)).catch(() => {});
  } catch (e) {
    console.error("ChannelCreate error:", e);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isButton()) return;

    const [action, openerIdRaw] = interaction.customId.split(":");
    if (action !== "claim_ticket") return;

    const channel = interaction.channel;
    const guild = interaction.guild;
    if (!channel || !guild) return;

    // must be staff
    const staffRoleId = config.staffRoleId;
    const member = await guild.members.fetch(interaction.user.id);

    if (!member.roles.cache.has(staffRoleId)) {
      return interaction.reply({ content: "❌ الزر ده للإدارة بس.", ephemeral: true });
    }

    if (isAlreadyClaimed(channel)) {
      return interaction.reply({ content: "⚠️ التكت ده متستلم بالفعل.", ephemeral: true });
    }

    // openerId from button or detect or topic
    let openerId = (openerIdRaw && openerIdRaw !== "unknown") ? openerIdRaw : null;

    if (!openerId) openerId = detectOpenerId(channel, client.user.id);

    if (!openerId) {
      const topic = channel.topic || "";
      const m = topic.match(/TICKET_OPENER=([0-9]+)/);
      openerId = m ? m[1] : "unknown";
    }

    const claimerId = interaction.user.id;

    await markClaimed(channel, openerId, claimerId);
    await applyPostClaimPermissions(channel, openerId, claimerId);
    await disableClaimButton(interaction);

    await interaction.reply({
      content: `✅ تم استلام التكت بواسطة <@${claimerId}>.\nدلوقتي الروم ظاهرة بس ليك ولصاحب التكت.`,
      ephemeral: false
    });
  } catch (e) {
    console.error("InteractionCreate error:", e);
    if (interaction?.isRepliable?.()) {
      try {
        await interaction.reply({ content: "حصل خطأ غير متوقع.", ephemeral: true });
      } catch {}
    }
  }
});

client.login(config.token);
