
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function askConfirm(message, text) {
  const msg = await message.reply('⚠️ **تحذير!** ' + text + '\n\nرد بـ `CONFIRM` خلال 15 ثانية.');
  try {
    const filter = m => m.author.id === message.author.id && m.content === 'CONFIRM';
    const c = await message.channel.awaitMessages({ filter, max: 1, time: 15000 });
    if (!c.size) { await msg.edit('❌ **تم الإلغاء.**'); return false; }
    return msg;
  } catch { await msg.edit('❌ **تم الإلغاء.**'); return false; }
}
module.exports = [
  {
    name: 'nuke3', aliases: ['fullnuke', 'nukechan2'], description: '☢️ حذف كل رسائلك في الشات', category: 'خطير',
    async execute(message, args, cm) {
      const conf = await askConfirm(message, 'هيتحذف **كل** رسائلك في `#' + message.channel.name + '` (آخر 200)');
      if (!conf) return;
      const msgs = await message.channel.messages.fetch({ limit: 200 });
      const mine = [...msgs.values()].filter(m => m.author.id === message.client.user.id && m.id !== conf.id && m.id !== message.id);
      let deleted = 0;
      for (const m of mine) { await m.delete().catch(()=>{}); deleted++; await sleep(350); }
      await conf.edit('☢️ **Nuke تم!** — حُذف **' + deleted + '** رسالة');
      setTimeout(() => conf.delete().catch(()=>{}), 5000);
    }
  },
  {
    name: 'massleave', aliases: ['leaveall', 'leavemulti'], description: '☢️ مغادرة عدة سيرفرات بالـ IDs', category: 'خطير',
    async execute(message, args, cm) {
      const ids = args.slice(1);
      if (!ids.length) return message.reply('❌ `' + cm.getMainPrefix() + 'massleave <id1> <id2> ...`');
      const conf = await askConfirm(message, 'ستغادر **' + ids.length + '** سيرفر');
      if (!conf) return;
      let left = 0, failed = 0;
      for (const id of ids) {
        const g = message.client.guilds.cache.get(id);
        if (!g) { failed++; continue; }
        await g.leave().then(() => left++).catch(() => failed++);
        await sleep(500);
      }
      await conf.edit('✅ غادرت **' + left + '** سيرفر | فشل **' + failed + '**');
    }
  },
  {
    name: 'deleteconvo', aliases: ['deletedm', 'cleardm'], description: '☢️ حذف رسائلك في DM الحالي', category: 'خطير',
    async execute(message, args, cm) {
      if (message.guild) return message.reply('❌ هذا الأمر في الـ DM فقط.');
      const count = Math.min(parseInt(args[1]) || 20, 50);
      const conf = await askConfirm(message, 'هيتحذف آخر **' + count + '** رسالة منك في هذا الـ DM');
      if (!conf) return;
      const msgs = await message.channel.messages.fetch({ limit: 100 });
      const mine = [...msgs.values()].filter(m => m.author.id === message.client.user.id && m.id !== conf.id).slice(0, count);
      let deleted = 0;
      for (const m of mine) { await m.delete().catch(()=>{}); deleted++; await sleep(350); }
      await conf.edit('✅ تم حذف **' + deleted + '** رسالة');
    }
  },
  {
    name: 'wipedata', aliases: ['cleardata', 'resetdata'], description: '☢️ مسح كل بيانات البوت', category: 'خطير',
    async execute(message) {
      const fs2 = require('fs'), path2 = require('path');
      const conf = await askConfirm(message, 'سيُمسح **كل** بيانات البوت (spy، autorespond، autoreact...)');
      if (!conf) return;
      const dataDir = path2.join(__dirname, '../data');
      try {
        if (fs2.existsSync(dataDir)) {
          const files = fs2.readdirSync(dataDir).filter(f => f.endsWith('.json'));
          for (const f of files) fs2.unlinkSync(path2.join(dataDir, f));
          await conf.edit('✅ **تم مسح ' + files.length + ' ملف بيانات!**\n🔄 أعد تشغيل البوت.');
        } else { await conf.edit('ℹ️ لا توجد بيانات لمسحها.'); }
      } catch (err) { await conf.edit('❌ فشل: `' + err.message + '`'); }
    }
  },
  {
    name: 'massblock2', aliases: ['blockall', 'bulkblock'], description: '☢️ حظر عدة مستخدمين بالـ IDs', category: 'خطير',
    async execute(message, args, cm) {
      const https = require('https');
      const ids = args.slice(1).filter(id => /^\d{15,20}$/.test(id));
      if (!ids.length) return message.reply('❌ `' + cm.getMainPrefix() + 'massblock2 <id1> <id2> ...`');
      const conf = await askConfirm(message, 'سيُحظر **' + ids.length + '** مستخدم');
      if (!conf) return;
      let blocked = 0, failed = 0;
      const token = message.client.token;
      for (const id of ids) {
        try {
          await new Promise((res, rej) => {
            const body = JSON.stringify({ type: 2 });
            const req = https.request({ hostname: 'discord.com', path: '/api/v9/users/@me/relationships/' + id, method: 'PUT', headers: { Authorization: token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, timeout: 5000 }, r => { r.on('data', ()=>{}); r.on('end', res); });
            req.on('error', rej); req.write(body); req.end();
          });
          blocked++; await sleep(600);
        } catch { failed++; }
      }
      await conf.edit('✅ حُظر **' + blocked + '** | فشل **' + failed + '**');
    }
  },
  {
    name: 'massunfriend', aliases: ['removeallfriends', 'clearfriends'], description: '☢️ إزالة كل الأصدقاء', category: 'خطير',
    async execute(message) {
      const https = require('https');
      const conf = await askConfirm(message, '**سيُزال كل أصدقائك** من قائمة الأصدقاء!');
      if (!conf) return;
      const token = message.client.token;
      const getRels = () => new Promise((res, rej) => {
        const req = https.request({ hostname: 'discord.com', path: '/api/v9/users/@me/relationships', method: 'GET', headers: { Authorization: token }, timeout: 8000 }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch { res([]); } }); }); req.on('error', rej); req.end();
      });
      const delRel = id => new Promise(res => {
        const req = https.request({ hostname: 'discord.com', path: '/api/v9/users/@me/relationships/' + id, method: 'DELETE', headers: { Authorization: token }, timeout: 5000 }, r => { r.on('data', ()=>{}); r.on('end', res); }); req.on('error', res); req.end();
      });
      try {
        const rels = await getRels();
        const friends = rels.filter(r => r.type === 1);
        let removed = 0;
        for (const f of friends) { await delRel(f.id); removed++; await sleep(700); }
        await conf.edit('✅ تم إزالة **' + removed + '** صديق.');
      } catch (err) { await conf.edit('❌ فشل: `' + err.message + '`'); }
    }
  }
];
