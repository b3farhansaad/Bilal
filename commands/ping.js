const os = require('os');

module.exports = {
    name: 'ping',
    description: 'فحص الـ latency والأداء',
    category: 'نظام',
    async execute(message, args, commandManager) {
        if (!commandManager.isAllowedUser(message.author.id)) return;

        const latency = Date.now() - message.createdTimestamp;
        const uptime = commandManager.formatUptime();
        const cpuModel = os.cpus()[0]?.model || 'غير معروف';
        const cpuCores = os.cpus().length;
        const totalMem = (os.totalmem() / 1073741824).toFixed(2);
        const freeMem = (os.freemem() / 1073741824).toFixed(2);
        const usedMem = (totalMem - freeMem).toFixed(2);
        const memPercent = ((usedMem / totalMem) * 100).toFixed(1);

        const latencyEmoji = latency < 100 ? '🟢' : latency < 300 ? '🟡' : '🔴';

        message.reply(`🏓 **بونج!**

**⚡ الأداء:**
${latencyEmoji} الـ Latency: \`${latency}ms\`
⌚ وقت التشغيل: \`${uptime}\`

**💻 النظام:**
🔲 المعالج: \`${cpuModel} (${cpuCores} أنوية)\`
🧠 الذاكرة: \`${usedMem} GB / ${totalMem} GB (${memPercent}%)\`
🖥️ النظام: \`${os.platform()} (${os.release()})\``);
    }
};
