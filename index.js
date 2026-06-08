// ╔══════════════════════════════════════════════════════════════════╗
//   ███████╗███╗  ██╗ ██████╗ ██████╗ ██╗██╗  ██╗
//   ██╔════╝████╗ ██║██╔═══██╗██╔══██╗██║╚██╗██╔╝
//   ███████╗██╔██╗██║██║   ██║██║  ██║██║ ╚███╔╝
//   ╚════██║██║╚████║██║   ██║██║  ██║██║ ██╔██╗
//   ███████║██║ ╚███║╚██████╔╝██████╔╝██║██╔╝ ██╗
//   ╚══════╝╚═╝  ╚══╝ ╚═════╝ ╚═════╝ ╚═╝╚═╝  ╚═╝
//              Ultra Legend v5 ✨ LEGENDARY EDITION
// ╚══════════════════════════════════════════════════════════════════╝
const { Client } = require('discord.js-selfbot-v13');
const commandManager = require('./commands');
const shapesAPI = require('./shapes');
// Panel is now a standalone Discord bot in ./bot/index.js — run separately with PANEL_BOT_TOKEN
require('dotenv').config();

const client = new Client({
    checkUpdate: false,
    autoRedeemNitro: false,
    intents: ['GUILDS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES'],
    patchVoice: false
});

// ─── Safe command getter ───────────────────────────────────────────
function getCmd(name) {
    try { return commandManager.commands.get(name); } catch { return null; }
}

client.on('ready', async () => {
    const tag = client.user.tag || client.user.username;
    const servers = client.guilds.cache.size;
    const prefix = commandManager.getMainPrefix();

    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  ✨ ✨   Snodix Ultra Legend v5 — LEGENDARY EDITION   ✨ ✨  ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  👤 Account   : ${tag.slice(0,40).padEnd(44)}║`);
    console.log(`║  🏠 Servers   : ${String(servers).padEnd(44)}║`);
    console.log(`║  🎯 Prefix    : ${prefix.padEnd(44)}║`);
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  ⚡ Features Loaded:                                          ║');
    console.log('║  🎮 Rich Presence  👻 Ghost Mode   🕵️  Spy System            ║');
    console.log('║  🤖 AutoRespond    ❤️  AutoReact   🎮 XO Game               ║');
    console.log('║  🧩 Trivia/Guess   🔐 AES Encrypt  🌐 World Clock            ║');
    console.log('║  🔄 RPC Rotation   📊 Analytics    ✅ btn1 Bug FIXED!        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    commandManager.loadCommands();

    // Load optional systems
    for (const s of ['clone', 'reaction']) {
        try {
            const cmd = getCmd(s);
            if (cmd?.initialize) { await cmd.initialize(client); console.log(`  ✅ ${s} ready`); }
        } catch (e) { console.error(`  ⚠️  ${s}:`, e.message); }
    }

    // Load RPC (restore saved config on start)
    try {
        const rpc = require('./commands/rpc');
        const cfg = rpc.loadRPC();
        if (cfg.enabled) {
            await rpc.applyRPC(client, cfg);
            if (cfg.rotate?.length >= 2) rpc.startRotation(client, cfg);
            console.log(`  ✅ RPC مُفعَّل: [${cfg.type}] ${cfg.name}`);
        }
        // ✅ لا يوجد status تلقائي — الحساب يبقى كما هو بدون تغيير
    } catch (e) {
        console.error('  ⚠️  RPC:', e.message);
    }

    const cmdCount = commandManager.commands.size;
    console.log(`\n  🚀 جاهز! ${cmdCount} أمر محمّل\n`);
    console.log(`  👉 اكتب ${prefix}help لقائمة الأوامر الكاملة\n`);
    console.log('══════════════════════════════════════════════════════════════\n');

    // 💡 لتشغيل لوحة التحكم: cd bot && node index.js (يحتاج PANEL_BOT_TOKEN في .env)
});

// ─── Message Update → Spy ──────────────────────────────────────────
client.on('messageUpdate', (oldMsg, newMsg) => {
    try { getCmd('spy')?.onMessageUpdate?.(oldMsg, newMsg); } catch {}
});

// ─── Message Delete → Spy + Snipe + AntiDelete ────────────────────
client.on('messageDelete', (msg) => {
    try { getCmd('snipe')?.onMessageDelete?.(msg); } catch {}
    try { getCmd('spy')?.onMessageDelete?.(msg); } catch {}
    try { getCmd('antidelete')?.onMessageDelete?.(msg); } catch {}
});

// ─── Main Message Handler ──────────────────────────────────────────
client.on('messageCreate', async (message) => {

    // Messages from others
    if (message.author.id !== client.user.id) {

        // AFK mention handling
        if (message.mentions?.users?.size > 0) {
            try { getCmd('afk')?.handleMention?.(message, commandManager); } catch {}
        }

        // Nitro Sniper
        try { getCmd('nitrosnipe')?.handleNitroSnipe?.(message, client); } catch {}

        // Auto Respond
        try { getCmd('autorespond')?.handleAutoRespond?.(message); } catch {}

        // Auto React
        try { getCmd('autoreact')?.handleAutoReact?.(message); } catch {}

        // Auto Reply 2
        try {
            const ar2 = getCmd('autoreply2');
            if (ar2) {
                const fs_=require('fs'),path_=require('path');
                const f=path_.join(__dirname,'data','autoreply2.json');
                if(fs_.existsSync(f)){
                    const data=JSON.parse(fs_.readFileSync(f,'utf8'));
                    const low=message.content.toLowerCase();
                    for(const [trigger,reply] of Object.entries(data)){
                        if(low.includes(trigger)){message.reply(reply).catch(()=>{});break;}
                    }
                }
            }
        } catch {}

        // Watch Keywords
        try {
            const fs_=require('fs'),path_=require('path');
            const f=path_.join(__dirname,'data','watchkw.json');
            if(fs_.existsSync(f)){
                const kws=JSON.parse(fs_.readFileSync(f,'utf8'));
                const low=message.content.toLowerCase();
                const hit=kws.find(k=>low.includes(k));
                if(hit) {
                    const owner=message.client.user;
                    const ch=message.channel;
                    ch.send('🔍 **تنبيه كلمة محفوظة:** `'+hit+'`\n**المستخدم:** '+message.author.tag+'\n**الرسالة:** '+message.content.slice(0,200)).catch(()=>{});
                }
            }
        } catch {}

        // AI system
        if (commandManager.isStealthMode()) return;
        if (commandManager.isUserBlocked(message.author.id)) return;
        // ❌ منع الـ AI من الرد في الـ DMs تلقائياً
        if (!message.guild) return;
        if (!commandManager.isAIEnabled(message.channel.id, message.guild?.id)) return;
        if (commandManager.isTagRequired(message.channel.id) &&
            !message.mentions.users.has(client.user.id)) return;

        try {
            await message.channel.sendTyping();
            let response;
            if (message.attachments.size > 0) {
                const att = message.attachments.first();
                if (att.contentType?.startsWith('image/')) {
                    response = await shapesAPI.processImageMessage(
                        message.content || 'إيه في الصورة دي؟',
                        att.url, message.author.id, message.author.tag
                    );
                }
            } else {
                response = await shapesAPI.generateResponse(
                    message.content, message.author.id,
                    message.author.tag, message.channel.id
                );
            }
            if (response) {
                await message.reply(response);
                commandManager.updateStats(message.author.id);
            }
        } catch (err) { console.error('❌ AI Error:', err.message); }
        return;
    }

    // My own messages — command processing
    const content = message.content.toLowerCase();
    if (!commandManager.startsWithPrefix(content)) return;
    if (!commandManager.isAllowedUser(message.author.id)) return;

    // Ghost mode auto-delete
    try { getCmd('ghost')?.handleGhostDelete?.(message); } catch {}

    if (!commandManager.isStealthMode()) {
        try { await message.channel.sendTyping(); } catch {}
    }

    const prefix = commandManager.getMainPrefix();
    const shapeCmds = ['reset', 'sleep', 'dashboard', 'info', 'web', 'imagine', 'wack'];
    const isShape = shapeCmds.some(c => content.startsWith(`${prefix}${c}`));

    if (commandManager.isStealthMode()) {
        if (!isShape) commandManager.handleCommand(message);
        return;
    }

    if (isShape) {
        try {
            const res = await shapesAPI.handleCommand(message.content, message.author.id);
            if (res) await message.reply(res);
            else commandManager.handleCommand(message);
        } catch (e) {
            console.error('❌ Shapes:', e.message);
            commandManager.handleCommand(message);
        }
        return;
    }

    commandManager.handleCommand(message);
});

client.on('error', err => console.error('❌ Client error:', err.message));
client.on('warn', info => console.warn('⚠️ Warn:', info));
process.on('unhandledRejection', err => console.error('❌ Rejection:', err?.message || err));
process.on('uncaughtException', err => {
    console.error('❌ Exception:', err?.message || err);
    // Don't exit on uncaught exceptions — keep bot alive
});

client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('\n❌ فشل تسجيل الدخول:', err.message);
    console.error('   تأكد إن DISCORD_TOKEN صح في ملف .env\n');
    process.exit(1);
});
