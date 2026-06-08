const https = require('https');

function nekosGet(category) {
    return new Promise((res, rej) => {
        https.get({ hostname: 'nekos.life', path: '/api/v2/img/' + category, headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }, r => {
            let d = ''; r.on('data', c => d += c);
            r.on('end', () => { try { res(JSON.parse(d)); } catch { res({}); } });
        }).on('error', rej);
    });
}

const CATS2 = ['neko', 'meow', 'hug', 'kiss', 'slap', 'pat', 'smug', 'tickle', 'feed', 'cuddle', 'poke', 'spank', 'wink', 'baka', 'ngif', 'gecg'];

module.exports = {
    name: 'waifu2', aliases: ['nekos2', 'animegif'],
    description: 'صور وGIFs أنمي SFW (nekos.life)', category: 'أنمي',
    async execute(message, args, cm) {
        const cat = args[1]?.toLowerCase();
        const prefix = cm.getMainPrefix();
        if (!cat || cat === 'list') {
            return message.reply('**🎨 فئات Waifu2:**\n`' + CATS2.join('` `') + '`\n\nالاستخدام: `' + prefix + 'waifu2 <فئة>`');
        }
        if (!CATS2.includes(cat)) return message.reply('❌ فئة غير معروفة.');
        const msg = await message.reply('🎨 جاري الجلب...');
        try {
            const data = await nekosGet(cat);
            if (!data.url) return msg.edit('❌ فشل جلب الصورة.');
            await msg.edit('**🎨 ' + cat + '**\n' + data.url);
        } catch (e) { await msg.edit('❌ فشل: `' + e.message + '`'); }
    }
};
