const https = require('https');

function githubGet(url) {
    return new Promise((res, rej) => {
        https.get(url, { headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Discord-Selfbot' } }, r => {
            let d = ''; r.on('data', c => d += c);
            r.on('end', () => { try { res({ status: r.statusCode, data: JSON.parse(d) }); } catch { res({ status: r.statusCode, data: {} }); } });
        }).on('error', rej);
    });
}

module.exports = {
    name: 'gituser', aliases: ['ghuser', 'githubuser'],
    description: 'معلومات مستخدم GitHub', category: 'GitHub',
    async execute(message, args, cm) {
        if (args.length < 2) return message.reply('❌ `' + cm.getMainPrefix() + 'gituser <username>`');
        const username = args[1];
        const msg = await message.reply('🔍 جاري جلب بيانات **' + username + '** من GitHub...');
        try {
            const { status, data } = await githubGet('https://api.github.com/users/' + encodeURIComponent(username));
            if (status === 404) return msg.edit('❌ المستخدم **' + username + '** غير موجود على GitHub.');
            if (status !== 200) return msg.edit('❌ خطأ. Status: ' + status);
            const created = new Date(data.created_at).toLocaleDateString('ar-EG');
            await msg.edit([
                '**🐙 GitHub: ' + data.login + '**',
                '```',
                '👤 الاسم      : ' + (data.name || 'غير محدد'),
                '📝 Bio        : ' + (data.bio?.slice(0,80) || 'غير محدد'),
                '📍 الموقع     : ' + (data.location || 'غير محدد'),
                '🏢 الشركة     : ' + (data.company || 'غير محدد'),
                '📦 المستودعات : ' + data.public_repos,
                '👥 Followers  : ' + data.followers,
                '➡️ Following  : ' + data.following,
                '📅 تاريخ الإنشاء: ' + created,
                '```',
                '🔗 ' + data.html_url,
                data.avatar_url ? '🖼️ ' + data.avatar_url : ''
            ].filter(Boolean).join('\n'));
        } catch (e) { await msg.edit('❌ فشل: `' + e.message + '`'); }
    }
};
