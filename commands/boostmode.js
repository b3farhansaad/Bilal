// Boost Mode — وضع التعزيز الأسطوري
const fs = require('fs'), path = require('path');

let boostActive = false;
let boostInterval = null;
let boostStats = { activated: 0, messages: 0 };

const BOOST_THEMES = [
    { name: '🔥 طاقة النار', msgs: ['🔥🔥🔥', '⚡ LEGENDARY', '🚀 ULTRA BOOST'] },
    { name: '💎 الألماس', msgs: ['💎💎💎', '✨ DIAMOND', '👑 ROYALTY'] },
    { name: '⚡ البرق', msgs: ['⚡⚡⚡', '🌩️ LIGHTNING', '💥 THUNDER'] },
    { name: '🌌 الكون', msgs: ['🌌🌌🌌', '🪐 COSMIC', '✨ UNIVERSE'] },
];

module.exports = {
    name: 'boostmode',
    aliases: ['boost', 'bm', 'legendary', 'ultra'],
    description: 'وضع التعزيز الأسطوري مع إحصائيات',
    category: 'نظام',

    async execute(message, args, commandManager) {
        const sub = args[1]?.toLowerCase();
        const prefix = commandManager.getMainPrefix();

        if (!sub || sub === 'on') {
            if (boostActive) {
                return message.reply(`⚡ **Boost Mode شغّال بالفعل!**\n📊 رسائل مُرسلة: **${boostStats.messages}**\n💡 \`${prefix}boostmode off\` للإيقاف`);
            }
            boostActive = true;
            boostStats.activated++;
            const theme = BOOST_THEMES[Math.floor(Math.random() * BOOST_THEMES.length)];
            await message.reply([
                `**${theme.name} — BOOST MODE ACTIVATED!**`,
                ``,
                `⚡ تسريع المعالجة: **ON**`,
                `🛡️ حماية فائقة: **ON**`,
                `🎮 RPC Sync: **ON**`,
                `🚀 Ultra Performance: **ON**`,
                `🌐 Network Boost: **ON**`,
                ``,
                `\`\`\``,
                `[SNODIX ULTRA v5] ████████████ 100%`,
                `Status: LEGENDARY ACTIVE ✓`,
                `\`\`\``,
                `💡 \`${prefix}boostmode off\` للإيقاف | \`${prefix}boostmode stats\` للإحصائيات`
            ].join('\n'));
            return;
        }

        if (sub === 'off') {
            if (!boostActive) return message.reply('❌ Boost Mode مش شغّال.');
            boostActive = false;
            if (boostInterval) { clearInterval(boostInterval); boostInterval = null; }
            return message.reply(`⏹️ **Boost Mode** اتوقف.\n📊 جلسة انتهت | رسائل: **${boostStats.messages}**`);
        }

        if (sub === 'stats') {
            const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const uptime = process.uptime();
            const h = Math.floor(uptime / 3600), m = Math.floor((uptime % 3600) / 60), s = Math.floor(uptime % 60);
            return message.reply([
                `**⚡ Boost Mode — إحصائيات**`,
                `\`\`\``,
                `📊 الحالة     : ${boostActive ? '🟢 مفعّل' : '🔴 متوقف'}`,
                `🔢 مرات التفعيل: ${boostStats.activated}`,
                `💬 رسائل مُرسلة: ${boostStats.messages}`,
                `🧠 RAM الحالي : ${mem} MB`,
                `⏱️ وقت التشغيل: ${h}h ${m}m ${s}s`,
                `💻 Node.js    : ${process.version}`,
                `🌐 Platform   : ${process.platform}`,
                `\`\`\``
            ].join('\n'));
        }

        if (sub === 'spam') {
            const count = Math.min(parseInt(args[2]) || 3, 10);
            const text = args.slice(3).join(' ') || '⚡ LEGENDARY BOOST';
            if (boostInterval) return message.reply('⚠️ Spam شغّال بالفعل.');
            let sent = 0;
            boostInterval = setInterval(async () => {
                if (sent >= count) { clearInterval(boostInterval); boostInterval = null; return; }
                await message.channel.send(text).catch(() => {});
                boostStats.messages++;
                sent++;
            }, 1200);
            await message.delete().catch(() => {});
            return;
        }

        return message.reply(`**⚡ Boost Mode**\n\`${prefix}boostmode on\` — تفعيل\n\`${prefix}boostmode off\` — إيقاف\n\`${prefix}boostmode stats\` — إحصائيات\n\`${prefix}boostmode spam <عدد> <نص>\` — إرسال متكرر`);
    }
};
