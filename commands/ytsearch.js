module.exports = {
    name: 'ytsearch',
    description: 'البحث على YouTube',
    category: 'أدوات',
    async execute(message, args, commandManager) {
        if (args.length < 2) {
            message.reply('❌ الاستخدام: `!ytsearch <البحث>`\nمثال: `!ytsearch اغاني عربي`');
            return;
        }
        const query = args.slice(1).join(' ');
        try {
            const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
            const html = await res.text();
            const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
            const titleMatch = html.match(/"title":{"runs":\[{"text":"([^"]+)"/);
            const channelMatch = html.match(/"ownerText":{"runs":\[{"text":"([^"]+)"/);
            const viewsMatch = html.match(/"viewCountText":{"simpleText":"([^"]+)"/);

            if (!videoIdMatch) {
                message.reply(`❌ مفيش نتايج لـ \`${query}\`.`);
                return;
            }

            const videoId = videoIdMatch[1];
            const title = titleMatch ? titleMatch[1] : 'غير معروف';
            const channel = channelMatch ? channelMatch[1] : 'غير معروف';
            const views = viewsMatch ? viewsMatch[1] : 'غير معروف';

            message.reply(`🎬 **نتيجة YouTube**

🎵 العنوان: **${title}**
📺 القناة: \`${channel}\`
👁️ المشاهدات: \`${views}\`
🔗 الرابط: https://youtube.com/watch?v=${videoId}`);
        } catch {
            message.reply('❌ فشل البحث. حاول تاني.');
        }
    }
};
