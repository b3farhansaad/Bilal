
const https = require('https');
function discordGET(token, p) {
  return new Promise((res, rej) => {
    const req = https.request({ hostname: 'discord.com', path: '/api/v9' + p, method: 'GET', headers: { Authorization: token, 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res({ status: r.statusCode, data: JSON.parse(d) }); } catch { res({ status: r.statusCode, data: {} }); } });
    }); req.on('error', rej); req.on('timeout', () => { req.destroy(); rej(new Error('timeout')); }); req.end();
  });
}
function parseBadges(f) {
  const b = []; f = f || 0;
  if (f & 1) b.push('👨‍💼 Staff'); if (f & 2) b.push('🤝 Partner'); if (f & 4) b.push('🏅 HypeSquad Events');
  if (f & 8) b.push('🐛 Bug Hunter L1'); if (f & 64) b.push('🏠 HypeSquad Bravery'); if (f & 128) b.push('💫 HypeSquad Brilliance');
  if (f & 256) b.push('⚖️ HypeSquad Balance'); if (f & 512) b.push('⭐ Early Supporter'); if (f & 16384) b.push('🐛 Bug Hunter L2');
  if (f & 131072) b.push('👾 Early Verified Developer'); if (f & 4194304) b.push('🛡️ Active Developer');
  return b;
}
module.exports = [
  {
    name: 'whoami', aliases: ['me2', 'myself'], description: 'ملخص سريع عن حسابك', category: 'حساب',
    execute(message) {
      const u = message.client.user;
      const age = Math.floor((Date.now() - new Date(u.createdAt)) / 86400000);
      message.reply('**⚡ ' + u.username + '**\n🆔 `' + u.id + '`\n📅 عمر الحساب: **' + age + ' يوم** (' + (age / 365).toFixed(1) + ' سنة)\n🔗 ' + u.displayAvatarURL({ size: 256 }));
    }
  },
  {
    name: 'avatar2', aliases: ['av2', 'pfp2'], description: 'صورة بروفايل أي مستخدم', category: 'حساب',
    async execute(message, args, cm) {
      const target = message.mentions?.users?.first();
      const uid = target?.id || args[1] || message.client.user.id;
      const user = await message.client.users.fetch(uid, { force: true }).catch(() => null);
      if (!user) return message.reply('❌ مش لاقي المستخدم.');
      const base64 = user.displayAvatarURL({ size: 4096 }).replace(/\.(webp|png|jpg|gif).*$/, '');
      const links = ['webp', 'png', 'jpg'].map(f => '[' + f.toUpperCase() + '](' + base64 + '.' + f + '?size=2048)').join(' | ');
      message.reply('**🖼️ صورة ' + user.username + '**\n' + user.displayAvatarURL({ size: 2048 }) + '\n' + links);
    }
  },
  {
    name: 'banner2', aliases: ['userbanner2', 'profilebanner2'], description: 'بانر حساب أي مستخدم', category: 'حساب',
    async execute(message, args, cm) {
      const target = message.mentions?.users?.first();
      const uid = target?.id || args[1] || message.client.user.id;
      const msg = await message.reply('🔍 جاري جلب البانر...');
      try {
        const { data } = await discordGET(message.client.token, '/users/' + uid);
        if (!data.id) return msg.edit('❌ مش لاقي المستخدم.');
        if (!data.banner) return msg.edit('❌ **' + data.username + '** ما عندوش بانر.');
        const ext = data.banner.startsWith('a_') ? 'gif' : 'png';
        const url = 'https://cdn.discordapp.com/banners/' + uid + '/' + data.banner + '.' + ext + '?size=2048';
        await msg.edit('**🎨 بانر ' + data.username + ':**\n' + url);
      } catch (err) { await msg.edit('❌ فشل: `' + err.message + '`'); }
    }
  },
  {
    name: 'badges2', aliases: ['mybadges2', 'flags2'], description: 'شارات وبادجات حسابك', category: 'حساب',
    async execute(message) {
      const msg = await message.reply('🏆 جاري جلب الشارات...');
      try {
        const { data } = await discordGET(message.client.token, '/users/@me');
        const badges = parseBadges(data.flags || 0);
        if (!badges.length) return msg.edit('😕 مش عندك أي شارات مميزة.');
        await msg.edit('**🏆 شاراتك (' + badges.length + '):**\n' + badges.join('\n'));
      } catch (err) { await msg.edit('❌ فشل: `' + err.message + '`'); }
    }
  },
  {
    name: 'accountage', aliases: ['age2', 'created2', 'createdat'], description: 'عمر حسابك بالتفصيل', category: 'حساب',
    execute(message, args) {
      const target = message.mentions?.users?.first() || message.client.user;
      const created = new Date(target.createdAt); const now = new Date(); const diffMs = now - created;
      const days = Math.floor(diffMs / 86400000); const years = Math.floor(days / 365); const months = Math.floor((days % 365) / 30); const remDays = days % 30;
      message.reply('**📅 عمر حساب ' + target.username + ':**\n```\n📆 الإنشاء    : ' + created.toLocaleDateString('ar-EG') + '\n⏳ العمر       : ' + years + ' سنة، ' + months + ' شهر، ' + remDays + ' يوم\n📊 بالأيام     : ' + days.toLocaleString() + ' يوم\n```');
    }
  },
  {
    name: 'nitroinfo', aliases: ['nitro2', 'mynitro'], description: 'معلومات النيترو الخاصة بك', category: 'حساب',
    async execute(message) {
      const msg = await message.reply('💎 جاري جلب بيانات النيترو...');
      try {
        const { data } = await discordGET(message.client.token, '/users/@me');
        const nitro = { 0: '❌ لا يوجد', 1: '📦 Nitro Classic', 2: '💎 Nitro', 3: '🌟 Nitro Basic' }[data.premium_type || 0];
        await msg.edit('**💎 معلومات النيترو**\n```\n📦 النوع   : ' + nitro + '\n📱 2FA     : ' + (data.mfa_enabled ? '✅ مفعّل' : '❌ معطّل') + '\n🌍 اللغة  : ' + (data.locale || '?') + '\n```');
      } catch (err) { await msg.edit('❌ فشل: `' + err.message + '`'); }
    }
  },
  {
    name: 'connections2', aliases: ['conn2', 'linkedaccounts2'], description: 'الحسابات المرتبطة (Spotify, Steam...)', category: 'حساب',
    async execute(message) {
      const msg = await message.reply('🔗 جاري جلب الاتصالات...');
      try {
        const { data } = await discordGET(message.client.token, '/users/@me/connections');
        if (!Array.isArray(data) || !data.length) return msg.edit('❌ لا توجد حسابات مرتبطة.');
        const em = { spotify: '🎵', steam: '🎮', youtube: '▶️', twitter: '🐦', github: '💻', twitch: '📺', reddit: '🤖', xbox: '🎮', instagram: '📸' };
        const list = data.map(c => (em[c.type] || '🔗') + ' **' + c.type + '**: `' + c.name + '` ' + (c.verified ? '✅' : '⚠️')).join('\n');
        await msg.edit('**🔗 حساباتك المرتبطة (' + data.length + '):**\n' + list);
      } catch (err) { await msg.edit('❌ فشل: `' + err.message + '`'); }
    }
  },
  {
    name: 'mytoken', aliases: ['token2', 'gettoken'], description: 'عرض توكنك (مشفّر جزئياً)', category: 'حساب',
    execute(message) {
      const t = message.client.token;
      const parts = t.split('.');
      const safe = parts.map((p, i) => i === 0 ? p : '●'.repeat(Math.min(p.length, 10))).join('.');
      message.reply('🔑 **توكنك (مشفّر):**\n`' + safe + '`\n⚠️ لا تعطي أي شخص توكنك!');
    }
  }
];
