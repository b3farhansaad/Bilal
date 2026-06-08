const fs = require('fs');
const path = require('path');
const dataDir = require('../utils/dataDir');

const afkFile = () => dataDir('afk.json');

function loadAFK() {
    const f = afkFile();
    try { if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8')); } catch {}
    return {};
}
function saveAFK(data) {
    const f = afkFile();
    try { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(data, null, 2)); }
    catch (err) { console.error('Error saving AFK:', err); }
}

module.exports = {
    name: 'afk',
    description: 'ضبط وضع الغياب (AFK)',
    category: 'حالة',
    execute(message, args, commandManager) {
        const afkData = loadAFK();
        const userId = message.author.id;
        if (args[1] === 'off' || args[1] === 'إيقاف') {
            if (afkData[userId]) { delete afkData[userId]; saveAFK(afkData); message.reply('✅ تم إيقاف وضع الغياب.'); }
            else message.reply('❌ أنت مش في وضع الغياب أصلاً.');
            return;
        }
        const reason = args.slice(1).join(' ') || 'مش موجود حالياً';
        afkData[userId] = { reason, since: Date.now() };
        saveAFK(afkData);
        if (!commandManager.config.afkUsers) commandManager.config.afkUsers = {};
        commandManager.config.afkUsers[userId] = { reason, since: Date.now() };
        commandManager.saveConfig();
        message.reply(`💤 **وضع الغياب مفعّل**\nالسبب: \`${reason}\`\nحد يذكرك هيوصله رسالة إنك غايب.`);
    },
    handleMention(message, commandManager) {
        const afkData = loadAFK();
        const mentionedUsers = message.mentions?.users;
        if (!mentionedUsers) return;
        mentionedUsers.forEach((user) => {
            const afk = afkData[user.id];
            if (afk) {
                const mins = Math.floor((Date.now() - afk.since) / 60000);
                const timeStr = mins < 1 ? 'دلوقتي' : `من ${mins} دقيقة`;
                message.reply(`💤 **${user.username}** غايب ${timeStr}\nالسبب: \`${afk.reason}\``);
            }
        });
    }
};
