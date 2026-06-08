const https = require('https');

function waifuGet(category) {
    return new Promise((res, rej) => {
        const body = JSON.stringify({ type: 'sfw', category });
        const req = https.request({
            hostname: 'api.waifu.pics', path: '/sfw/' + category, method: 'GET',
            headers: { 'Content-Type': 'application/json' }, timeout: 8000
        }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch { res({}); } }); });
        req.on('error', rej); req.on('timeout', () => { req.destroy(); rej(new Error('timeout')); });
        req.end();
    });
}

const CATEGORIES = ['waifu','neko','shinobu','megumin','blush','smile','wave','happy','wink','poke','dance','cringe','smug','bonk','yeet','pat','hug','kiss'];

module.exports = {
    name: 'waifu', aliases: ['neko', 'anime', 'pat', 'hug', 'kiss'],
    description: 'صور أنمي SFW عشوائية', category: 'أنمي',
    async execute(message, args, cm) {
        const cat = args[1]?.toLowerCase();
        const prefix = cm.getMainPrefix();
        if (!cat || cat === 'list') {
            return message.reply('**🎨 فئات Waifu:**\n`' + CATEGORIES.join('` `') + '`\n\nالاستخدام: `' + prefix + 'waifu <فئة>`');
        }
        if (!CATEGORIES.includes(cat)) return message.reply('❌ فئة غير معروفة.\nالفئات: `' + CATEGORIES.join('`, `') + '`');
        const msg = await message.reply('🎨 جاري جلب صورة...');
        try {
            const data = await waifuGet(cat);
            if (!data.url) return msg.edit('❌ فشل جلب الصورة.');
            await msg.edit('**🎨 ' + cat.charAt(0).toUpperCase() + cat.slice(1) + '**\n' + data.url);
        } catch (e) { await msg.edit('❌ فشل: `' + e.message + '`'); }
    }
};
