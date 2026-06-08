// Uptime Plus — معلومات النظام الكاملة
module.exports = {
    name: 'uptimeplus',
    aliases: ['uptime', 'system', 'sysinfo2', 'utp', 'stats2'],
    description: 'معلومات النظام والبوت التفصيلية',
    category: 'نظام',

    execute(message, args, commandManager) {
        const uptime = process.uptime();
        const h = Math.floor(uptime / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const s = Math.floor(uptime % 60);
        const uptimeStr = `${h}h ${m}m ${s}s`;

        const mem = process.memoryUsage();
        const heapUsed = (mem.heapUsed / 1024 / 1024).toFixed(2);
        const heapTotal = (mem.heapTotal / 1024 / 1024).toFixed(2);
        const rss = (mem.rss / 1024 / 1024).toFixed(2);

        const guilds = message.client.guilds.cache;
        const totalMembers = guilds.reduce((s, g) => s + g.memberCount, 0);
        const totalChannels = guilds.reduce((s, g) => s + g.channels.cache.size, 0);

        const cmds = commandManager.commands.size;
        const prefix = commandManager.getMainPrefix();

        let version = '5.0.0';
        try { version = require('../package.json').version; } catch {}

        const ramBar = '█'.repeat(Math.floor(heapUsed / heapTotal * 10)) + '░'.repeat(10 - Math.floor(heapUsed / heapTotal * 10));

        message.reply([
            `**🚀 Snodix Ultra v${version} — System Info**`,
            `\`\`\``,
            `⏱️ وقت التشغيل  : ${uptimeStr}`,
            `🧠 RAM المستخدم : ${heapUsed} MB / ${heapTotal} MB`,
            `   [${ramBar}]`,
            `💾 RSS Memory   : ${rss} MB`,
            `💻 Node.js       : ${process.version}`,
            `🌐 Platform      : ${process.platform}`,
            `🔢 أوامر         : ${cmds} أمر`,
            `🎯 البادئة        : ${prefix}`,
            ``,
            `🏠 السيرفرات     : ${guilds.size}`,
            `👥 إجمالي أعضاء  : ${totalMembers.toLocaleString()}`,
            `📢 إجمالي شاتات  : ${totalChannels.toLocaleString()}`,
            `\`\`\``,
            `✨ **Snodix Ultra Legend v5 — LEGENDARY EDITION**`
        ].join('\n'));
    }
};
