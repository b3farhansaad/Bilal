const https = require('https');

function discordReq(token, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'discord.com',
      path: '/api/v9' + path,
      method,
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    };
    if (payload) options.headers['Content-Length'] = Buffer.byteLength(payload);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const HOUSES = {
  'احمر': { id: 2, name: 'HypeSquad Brilliance 💡', color: '🔴', desc: 'البيت الأحمر — الذكاء والإبداع' },
  'بنفسجي': { id: 1, name: 'HypeSquad Bravery 🏅', color: '🟣', desc: 'البيت البنفسجي — الشجاعة والجرأة' },
  'اخضر': { id: 3, name: 'HypeSquad Balance ⚖️', color: '🟢', desc: 'البيت الأخضر — التوازن والتعاون' },
};

module.exports = [
  {
    name: 'pyp',
    aliases: ['hypesquad', 'hs', 'هايب', 'بيت'],
    async execute(message, args, cm) {
      const prefix = (cm && typeof cm.getMainPrefix === 'function') ? cm.getMainPrefix() : '!';
      const sub = args[1]?.toLowerCase();

      if (!sub || sub === 'help') {
        return message.reply(`**🏠 أوامر HypeSquad:**\n\`${prefix}pyp احمر\` | \`بنفسجي\` | \`اخضر\`\n\`${prefix}pyp remove\` (إزالة) | \`${prefix}pyp current\` (حالتي)`);
      }

      // عرض الشارة الحالية
      if (sub === 'current') {
        try {
          const { data } = await discordReq(message.client.token, 'GET', '/users/@me');
          const flags = data.public_flags || 0;
          let house = 'لا يوجد ⚪';
          if (flags & (1 << 6)) house = '🟣 HypeSquad Bravery';
          else if (flags & (1 << 7)) house = '🔴 HypeSquad Brilliance';
          else if (flags & (1 << 8)) house = '🟢 HypeSquad Balance';
          return message.reply(`**🏠 شارتك الحالية:**\n> ${house}`);
        } catch (e) { return message.reply(`❌ خطأ: \`${e.message}\``); }
      }

      // إزالة الشارة (تم تغيير المسار هنا)
      if (['remove', 'del', 'ازالة'].includes(sub)) {
        const msg = await message.reply('⏳ جاري الإزالة...');
        try {
          const { status } = await discordReq(message.client.token, 'DELETE', '/hypesquad/online');
          return msg.edit(status === 204 || status === 200 ? '✅ تم الإزالة!' : `❌ فشل (كود: ${status})`);
        } catch (e) { return msg.edit(`❌ خطأ: \`${e.message}\``); }
      }

      // تغيير الشارة (تم تغيير المسار هنا)
      const house = HOUSES[sub] || Object.values(HOUSES).find(h => h.name.toLowerCase().includes(sub));
      if (!house) return message.reply('❌ خيار غير صحيح! (احمر، بنفسجي، اخضر)');

      const msg = await message.reply(`⏳ جاري التغيير إلى ${house.color}...`);
      try {
        const { status, data } = await discordReq(message.client.token, 'POST', '/hypesquad/online', { house_id: house.id });
        if (status === 204 || status === 200) {
          return msg.edit(`✅ **تم التغيير بنجاح!**\n${house.color} **${house.name}**\n> ${house.desc}`);
        }
        return msg.edit(`❌ فشل (كود: ${status})\n\`${JSON.stringify(data)}\``);
      } catch (e) { return msg.edit(`❌ خطأ: \`${e.message}\``); }
    }
  }
];