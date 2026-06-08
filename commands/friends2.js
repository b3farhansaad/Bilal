
const https = require('https');
const sleep = ms => new Promise(r => setTimeout(r, ms));
function discordAPI(token, method, p, body) {
  return new Promise((res, rej) => {
    const d = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'discord.com', path: '/api/v9' + p, method,
      headers: { Authorization: token, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0', ...(d ? { 'Content-Length': Buffer.byteLength(d) } : {}) },
      timeout: 8000
    }, r => {
      let data = ''; r.on('data', c => data += c);
      r.on('end', () => { try { res({ status: r.statusCode, data: JSON.parse(data) }); } catch { res({ status: r.statusCode, data: {} }); } });
    }); req.on('error', rej); req.on('timeout', () => { req.destroy(); rej(new Error('timeout')); });
    if (d) req.write(d); req.end();
  });
}
module.exports = [
  {
    name: 'removefriend', aliases: ['rf2', 'unfriend'], description: 'إزالة صديق بـ ID أو mention', category: 'اصدقاء',
    async execute(message, args, cm) {
      const target = message.mentions?.users?.first();
      const uid = target?.id || args[1];
      if (!uid) return message.reply('❌ `' + cm.getMainPrefix() + 'removefriend @يوزر`');
      const msg = await message.reply('🗑️ جاري الإزالة...');
      try {
        const { status } = await discordAPI(message.client.token, 'DELETE', '/users/@me/relationships/' + uid);
        await msg.edit(status === 204 ? '✅ **تم إزالة الصديق!**' : '❌ فشل. Status: ' + status);
      } catch (err) { await msg.edit('❌ خطأ: `' + err.message + '`'); }
    }
  },
  {
    name: 'acceptfriend', aliases: ['accf', 'accept2'], description: 'قبول طلب صداقة بالـ ID', category: 'اصدقاء',
    async execute(message, args, cm) {
      const uid = args[1];
      if (!uid) return message.reply('❌ `' + cm.getMainPrefix() + 'acceptfriend <user_id>`');
      const msg = await message.reply('✅ جاري القبول...');
      try {
        const { status } = await discordAPI(message.client.token, 'PUT', '/users/@me/relationships/' + uid, null);
        await msg.edit((status === 204 || status === 200) ? '✅ **تم قبول طلب الصداقة!**' : '❌ فشل. Status: ' + status);
      } catch (err) { await msg.edit('❌ خطأ: `' + err.message + '`'); }
    }
  },
  {
    name: 'declinefriend', aliases: ['df2', 'rejectfriend'], description: 'رفض طلب صداقة بالـ ID', category: 'اصدقاء',
    async execute(message, args, cm) {
      const uid = args[1];
      if (!uid) return message.reply('❌ `' + cm.getMainPrefix() + 'declinefriend <user_id>`');
      const msg = await message.reply('🚫 جاري الرفض...');
      try {
        const { status } = await discordAPI(message.client.token, 'DELETE', '/users/@me/relationships/' + uid);
        await msg.edit(status === 204 ? '✅ **تم رفض الطلب.**' : '❌ فشل. Status: ' + status);
      } catch (err) { await msg.edit('❌ خطأ: `' + err.message + '`'); }
    }
  },
  {
    name: 'pendingrequests', aliases: ['pending2', 'pr2', 'requests2'], description: 'الطلبات الواردة والصادرة', category: 'اصدقاء',
    async execute(message) {
      const msg = await message.reply('📨 جاري جلب الطلبات...');
      try {
        const { data } = await discordAPI(message.client.token, 'GET', '/users/@me/relationships');
        if (!Array.isArray(data)) return msg.edit('❌ فشل جلب البيانات.');
        const incoming = data.filter(r => r.type === 3), outgoing = data.filter(r => r.type === 4);
        let text = '**📨 طلبات الصداقة**\n\n**📥 واردة (' + incoming.length + '):**\n';
        if (incoming.length) incoming.slice(0,10).forEach(r => text += '  • `' + (r.user?.username||r.user?.id) + '` — `' + r.user?.id + '`\n');
        else text += '  لا يوجد طلبات واردة\n';
        text += '\n**📤 صادرة (' + outgoing.length + '):**\n';
        if (outgoing.length) outgoing.slice(0,10).forEach(r => text += '  • `' + (r.user?.username||r.user?.id) + '`\n');
        else text += '  لا يوجد طلبات صادرة\n';
        await msg.edit(text.slice(0, 1900));
      } catch (err) { await msg.edit('❌ خطأ: `' + err.message + '`'); }
    }
  },
  {
    name: 'friendcount', aliases: ['fc2', 'friendstats2'], description: 'إحصائيات علاقاتك كاملة', category: 'اصدقاء',
    async execute(message) {
      const msg = await message.reply('📊 جاري جلب الإحصائيات...');
      try {
        const { data } = await discordAPI(message.client.token, 'GET', '/users/@me/relationships');
        if (!Array.isArray(data)) return msg.edit('❌ فشل.');
        const friends = data.filter(r => r.type === 1), blocked = data.filter(r => r.type === 2);
        const incoming = data.filter(r => r.type === 3), outgoing = data.filter(r => r.type === 4);
        await msg.edit('**👥 إحصائيات علاقاتك**\n```\n✅ أصدقاء       : ' + friends.length + '\n📥 طلبات واردة  : ' + incoming.length + '\n📤 طلبات صادرة  : ' + outgoing.length + '\n🚫 محجوبين       : ' + blocked.length + '\n📊 الإجمالي     : ' + data.length + '\n```');
      } catch (err) { await msg.edit('❌ خطأ: `' + err.message + '`'); }
    }
  },
  {
    name: 'myblockedlist', aliases: ['blockedlist', 'myblocked'], description: 'قائمة المحجوبين منك', category: 'اصدقاء',
    async execute(message) {
      const msg = await message.reply('🚫 جاري جلب القائمة...');
      try {
        const { data } = await discordAPI(message.client.token, 'GET', '/users/@me/relationships');
        if (!Array.isArray(data)) return msg.edit('❌ فشل.');
        const blocked = data.filter(r => r.type === 2);
        if (!blocked.length) return msg.edit('✅ قائمة المحجوبين فارغة!');
        const list = blocked.map((r, i) => '**' + (i+1) + '.** `' + (r.user?.username||'?') + '` — `' + r.user?.id + '`').join('\n');
        await msg.edit('**🚫 المحجوبون (' + blocked.length + '):**\n' + list.slice(0, 1800));
      } catch (err) { await msg.edit('❌ خطأ: `' + err.message + '`'); }
    }
  },
  {
    name: 'friendsonline', aliases: ['fo2', 'friendslist2'], description: 'أصدقاؤك الأونلاين الآن', category: 'اصدقاء',
    async execute(message) {
      const msg = await message.reply('👥 جاري جلب الأصدقاء...');
      try {
        const { data } = await discordAPI(message.client.token, 'GET', '/users/@me/relationships');
        if (!Array.isArray(data)) return msg.edit('❌ فشل.');
        const friends = data.filter(r => r.type === 1);
        const em = { online: '🟢', idle: '🌙', dnd: '🔴', offline: '⚫' };
        const sorted = friends.map(r => {
          const u = message.client.users.cache.get(r.user?.id);
          const s = u?.presence?.status || 'offline';
          return { name: r.user?.username || '?', id: r.user?.id, status: s, e: em[s] || '⚫' };
        }).sort((a, b) => (a.status === 'offline' ? 1 : -1));
        let text = '**👥 الأصدقاء (' + friends.length + ')**\n```\n';
        sorted.slice(0, 20).forEach(f => { text += f.e + ' ' + f.name.padEnd(20) + ' ' + f.id + '\n'; });
        if (friends.length > 20) text += '... و' + (friends.length-20) + ' أكتر\n';
        text += '```';
        await msg.edit(text);
      } catch (err) { await msg.edit('❌ خطأ: `' + err.message + '`'); }
    }
  },
  {
    name: 'mutualservers', aliases: ['mutual2', 'shared2'], description: 'السيرفرات المشتركة مع شخص', category: 'اصدقاء',
    async execute(message, args, cm) {
      const target = message.mentions?.users?.first();
      const uid = target?.id || args[1];
      if (!uid) return message.reply('❌ `' + cm.getMainPrefix() + 'mutualservers @يوزر`');
      const msg = await message.reply('🔍 جاري البحث...');
      try {
        const { data } = await discordAPI(message.client.token, 'GET', '/users/' + uid + '/profile');
        const mutuals = data.mutual_guilds || [];
        if (!mutuals.length) return msg.edit('❌ لا توجد سيرفرات مشتركة.');
        const names = mutuals.map(g => message.client.guilds.cache.get(g.id)?.name || g.id);
        await msg.edit('**🤝 السيرفرات المشتركة (' + mutuals.length + '):**\n' + names.map(n => '• ' + n).join('\n').slice(0, 1800));
      } catch (err) { await msg.edit('❌ خطأ: `' + err.message + '`'); }
    }
  }
];
