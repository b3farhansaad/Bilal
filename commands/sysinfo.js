const os = require('os');

module.exports = {
    name: 'sysinfo',
    description: 'معلومات تفصيلية عن النظام',
    category: 'نظام',
    async execute(message, args, commandManager) {
        const cpus = os.cpus();
        const cpuModel = cpus[0]?.model || 'غير معروف';
        const cpuCores = cpus.length;
        const cpuSpeed = cpus[0]?.speed || 0;

        const totalMem = (os.totalmem() / 1073741824).toFixed(2);
        const freeMem = (os.freemem() / 1073741824).toFixed(2);
        const usedMem = (totalMem - freeMem).toFixed(2);
        const memPercent = ((usedMem / totalMem) * 100).toFixed(1);
        const memBar = buildBar(memPercent);

        const platform = os.platform();
        const arch = os.arch();
        const nodeVersion = process.version;
        const uptimeSec = os.uptime();
        const d = Math.floor(uptimeSec / 86400);
        const h = Math.floor((uptimeSec % 86400) / 3600);
        const m = Math.floor((uptimeSec % 3600) / 60);
        const uptimeStr = `${d}d ${h}h ${m}m`;

        const loadAvg = os.loadavg().map(l => l.toFixed(2)).join(' | ');
        const hostname = os.hostname();

        const networkInterfaces = os.networkInterfaces();
        let ip = 'غير متاح';
        for (const iface of Object.values(networkInterfaces)) {
            for (const alias of iface) {
                if (alias.family === 'IPv4' && !alias.internal) {
                    ip = alias.address;
                    break;
                }
            }
            if (ip !== 'غير متاح') break;
        }

        const reply = `🖥️ **معلومات النظام**

🔲 **المعالج:**
  ├ الموديل: \`${cpuModel}\`
  ├ الأنوية: \`${cpuCores} نواة\`
  └ السرعة: \`${cpuSpeed} MHz\`

🧠 **الذاكرة:**
  ├ المستخدم: \`${usedMem} GB / ${totalMem} GB (${memPercent}%)\`
  └ ${memBar}

💻 **النظام:**
  ├ النظام: \`${platform} (${arch})\`
  ├ الاسم: \`${hostname}\`
  ├ الـ IP: \`${ip}\`
  ├ وقت التشغيل: \`${uptimeStr}\`
  └ Node.js: \`${nodeVersion}\`

📊 **الحمل:** \`${loadAvg}\``;

        message.reply(reply);
    }
};

function buildBar(percent, length = 10) {
    const filled = Math.round((percent / 100) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percent}%`;
}
