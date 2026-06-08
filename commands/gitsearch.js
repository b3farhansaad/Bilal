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
    name: 'gitsearch', aliases: ['ghsearch', 'searchgit'],
    description: 'البحث في GitHub عن مستودعات', category: 'GitHub',
    async execute(message, args, cm) {
        if (args.length < 2) return message.reply('❌ `' + cm.getMainPrefix() + 'gitsearch <اسم المستودع>`');
        const query = args.slice(1).join(' ');
        const msg = await message.reply('🔍 جاري البحث في GitHub عن **' + query + '**...');
        try {
            const { status, data } = await githubGet('https://api.github.com/search/repositories?q=' + encodeURIComponent(query) + '&sort=stars&per_page=5');
            if (status !== 200) return msg.edit('❌ خطأ في الاتصال بـ GitHub. Status: ' + status);
            if (!data.items?.length) return msg.edit('❌ لا يوجد نتائج لـ **' + query + '**');
            const repos = data.items.slice(0, 3);
            let text = '**🐙 نتائج GitHub لـ "' + query + '" (من ' + data.total_count.toLocaleString() + '):**\n\n';
            repos.forEach((repo, i) => {
                text += '**' + (i+1) + '. ' + repo.full_name + '**\n';
                text += (repo.description ? '> ' + repo.description.slice(0, 100) + '\n' : '');
                text += '⭐ ' + repo.stargazers_count.toLocaleString() + ' | 🍴 ' + repo.forks_count.toLocaleString() + ' | 💻 ' + (repo.language || 'N/A') + '\n';
                text += '🔗 ' + repo.html_url + '\n\n';
            });
            await msg.edit(text.slice(0, 1900));
        } catch (e) { await msg.edit('❌ فشل: `' + e.message + '`'); }
    }
};
