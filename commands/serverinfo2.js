
module.exports = [
  {
    name: 'serverinfo2', aliases: ['si2', 'guildinfo2'], description: 'معلومات السيرفر الحالي التفصيلية', category: 'سيرفر',
    execute(message) {
      const g = message.guild; if (!g) return message.reply('❌ في السيرفرات فقط.');
      const created = new Date(g.createdAt);
      const age = Math.floor((Date.now() - created) / 86400000);
      const online = g.members.cache.filter(m => m.presence?.status !== 'offline').size;
      const bots = g.members.cache.filter(m => m.user.bot).size;
      const tier = ['لا يوجد', '🥉 Level 1', '🥈 Level 2', '🥇 Level 3'][g.premiumTier] || '?';
      message.reply('**🏠 ' + g.name + '**\n```\n🆔 ID       : ' + g.id + '\n👑 المالك  : ' + (g.ownerID || '?') + '\n📅 الإنشاء : ' + created.toLocaleDateString('ar-EG') + ' (' + age + ' يوم)\n👥 الأعضاء : ' + g.memberCount + ' (🟢 ' + online + ' | 🤖 ' + bots + ')\n📢 القنوات : ' + g.channels.cache.size + '\n🎭 الرتب   : ' + (g.roles.cache.size - 1) + '\n😄 إيموجيات: ' + g.emojis.cache.size + '\n🚀 Boosts  : ' + tier + ' (' + (g.premiumSubscriptionCount || 0) + ')\n```' + (g.iconURL({ size: 512 }) ? '\n🖼️ ' + g.iconURL({ size: 512 }) : ''));
    }
  },
  {
    name: 'membercount2', aliases: ['mc2', 'members2'], description: 'عدد الأعضاء التفصيلي', category: 'سيرفر',
    execute(message) {
      const g = message.guild; if (!g) return message.reply('❌ في السيرفرات فقط.');
      const bots = g.members.cache.filter(m => m.user.bot).size;
      const humans = g.members.cache.size - bots;
      const online = g.members.cache.filter(m => ['online','idle','dnd'].includes(m.presence?.status)).size;
      message.reply('**👥 أعضاء ' + g.name + '**\n```\n👥 الإجمالي : ' + g.memberCount.toLocaleString() + '\n👤 بشر       : ' + humans.toLocaleString() + '\n🤖 بوتات     : ' + bots.toLocaleString() + '\n🟢 أونلاين   : ' + online.toLocaleString() + '\n```');
    }
  },
  {
    name: 'channellist', aliases: ['channels2', 'cl2'], description: 'قائمة القنوات في السيرفر', category: 'سيرفر',
    execute(message, args) {
      const g = message.guild; if (!g) return message.reply('❌ في السيرفرات فقط.');
      const page = Math.max(1, parseInt(args[1]) || 1), pp = 12;
      const channels = [...g.channels.cache.values()].filter(c => c.type !== 'GUILD_CATEGORY').sort((a,b) => a.position - b.position);
      const tp = Math.ceil(channels.length / pp);
      const slice = channels.slice((page-1)*pp, page*pp);
      const em = { GUILD_TEXT: '#', GUILD_VOICE: '🔊', GUILD_STAGE_VOICE: '🎙️', GUILD_FORUM: '💬', GUILD_NEWS: '📢' };
      let text = '**📢 القنوات (' + channels.length + ') — صفحة ' + page + '/' + tp + '**\n```\n';
      slice.forEach(c => { text += (em[c.type] || '?') + ' ' + c.name.slice(0,25).padEnd(25) + ' ' + c.id + '\n'; });
      text += '```';
      if (tp > 1) text += '\n> `!channellist ' + Math.min(page+1,tp) + '` للصفحة التالية';
      message.reply(text);
    }
  },
  {
    name: 'rolelist', aliases: ['roles2', 'rl2'], description: 'قائمة الرتب في السيرفر', category: 'سيرفر',
    execute(message, args) {
      const g = message.guild; if (!g) return message.reply('❌ في السيرفرات فقط.');
      const page = Math.max(1, parseInt(args[1]) || 1), pp = 12;
      const roles = [...g.roles.cache.values()].filter(r => r.name !== '@everyone').sort((a,b) => b.position - a.position);
      const tp = Math.ceil(roles.length / pp);
      const slice = roles.slice((page-1)*pp, page*pp);
      let text = '**🎭 الرتب (' + roles.length + ') — صفحة ' + page + '/' + tp + '**\n```\n';
      slice.forEach(r => { text += r.members.size.toString().padStart(4) + ' عضو  ' + r.name.slice(0,22).padEnd(22) + ' ' + r.id + '\n'; });
      text += '```';
      if (tp > 1) text += '\n> `!rolelist ' + Math.min(page+1,tp) + '` للصفحة التالية';
      message.reply(text);
    }
  },
  {
    name: 'emojilist', aliases: ['emojis2', 'el2'], description: 'كل إيموجيات السيرفر', category: 'سيرفر',
    execute(message, args) {
      const g = message.guild; if (!g) return message.reply('❌ في السيرفرات فقط.');
      const emojis = [...g.emojis.cache.values()];
      if (!emojis.length) return message.reply('❌ السيرفر ما عندوش إيموجيات مخصصة.');
      const page = Math.max(1, parseInt(args[1]) || 1), pp = 20;
      const tp = Math.ceil(emojis.length / pp);
      const slice = emojis.slice((page-1)*pp, page*pp);
      const display = slice.map(e => '<' + (e.animated?'a':'') + ':' + e.name + ':' + e.id + '>').join(' ');
      message.reply('**😄 إيموجيات ' + g.name + ' (' + emojis.length + ') — صفحة ' + page + '/' + tp + '**\n' + display);
    }
  },
  {
    name: 'servericon', aliases: ['sicon2', 'gicon2'], description: 'صورة السيرفر بجودة عالية', category: 'سيرفر',
    execute(message) {
      const g = message.guild; if (!g) return message.reply('❌ في السيرفرات فقط.');
      const icon = g.iconURL({ size: 4096, dynamic: true });
      if (!icon) return message.reply('❌ السيرفر ما عندوش صورة.');
      message.reply('**🖼️ صورة ' + g.name + ':**\n' + icon);
    }
  },
  {
    name: 'boostinfo', aliases: ['bi2', 'boosts2'], description: 'معلومات بوستات السيرفر', category: 'سيرفر',
    execute(message) {
      const g = message.guild; if (!g) return message.reply('❌ في السيرفرات فقط.');
      const boosters = [...g.members.cache.values()].filter(m => m.premiumSince).sort((a,b) => a.premiumSince - b.premiumSince);
      const tier = ['لا يوجد','🥉 Level 1','🥈 Level 2','🥇 Level 3'][g.premiumTier] || '?';
      let text = '**🚀 بوستات ' + g.name + '**\n```\n🏆 المستوى : ' + tier + '\n💜 عدد الـ Boosts: ' + (g.premiumSubscriptionCount || 0) + '\n👥 عدد المعززين: ' + boosters.length + '\n```';
      if (boosters.length) text += '\n**💜 المعززون:**\n' + boosters.slice(0,10).map(m => '> ' + m.user.username + ' — منذ ' + new Date(m.premiumSince).toLocaleDateString('ar-EG')).join('\n');
      message.reply(text);
    }
  },
  {
    name: 'topservers', aliases: ['biggest2', 'topg2'], description: 'أكبر 10 سيرفرات أنت فيها', category: 'سيرفر',
    execute(message) {
      const guilds = [...message.client.guilds.cache.values()].sort((a,b) => b.memberCount - a.memberCount).slice(0,10);
      let text = '**🏆 أكبر السيرفرات:**\n```\n';
      guilds.forEach((g,i) => { text += (i+1).toString().padStart(2) + '. ' + g.name.slice(0,22).padEnd(22) + ' ' + g.memberCount.toLocaleString().padStart(8) + ' عضو\n'; });
      text += '```';
      message.reply(text);
    }
  },
  {
    name: 'joindate', aliases: ['joined2', 'jd2'], description: 'تاريخ انضمامك للسيرفر الحالي', category: 'سيرفر',
    execute(message, args) {
      const g = message.guild; if (!g) return message.reply('❌ في السيرفرات فقط.');
      const target = message.mentions?.users?.first();
      const member = target ? g.members.cache.get(target.id) : g.members.cache.get(message.client.user.id);
      if (!member) return message.reply('❌ مش لاقي العضو.');
      const joined = new Date(member.joinedAt);
      const days = Math.floor((Date.now() - joined) / 86400000);
      message.reply('**📅 انضمام ' + member.user.username + ' لـ ' + g.name + '**\n```\n📆 التاريخ : ' + joined.toLocaleDateString('ar-EG') + '\n⏳ منذ      : ' + days + ' يوم (' + (days/365).toFixed(1) + ' سنة)\n```');
    }
  },
  {
    name: 'inviteinfo', aliases: ['invite2', 'ii2'], description: 'معلومات كود دعوة', category: 'سيرفر',
    async execute(message, args, cm) {
      const code = args[1]?.replace('https://discord.gg/', '');
      if (!code) return message.reply('❌ `' + cm.getMainPrefix() + 'inviteinfo <كود>`');
      const msg = await message.reply('🔍 جاري جلب معلومات الدعوة...');
      try {
        const inv = await message.client.fetchInvite(code);
        await msg.edit('**📨 معلومات الدعوة `' + code + '`**\n```\n🏠 السيرفر : ' + (inv.guild?.name || '?') + '\n👥 الأعضاء : ' + (inv.memberCount || '?') + '\n🌐 حضور   : ' + (inv.presenceCount || '?') + '\n📢 القناة : ' + (inv.channel?.name || '?') + '\n👤 بواسطة : ' + (inv.inviter?.username || '?') + '\n🔢 استخدامات: ' + (inv.uses || '?') + '\n```');
      } catch (err) { await msg.edit('❌ فشل: `' + err.message + '`'); }
    }
  },
  {
    name: 'leaveserver', aliases: ['leave2', 'ls2'], description: 'مغادرة سيرفر بالـ ID', category: 'سيرفر',
    async execute(message, args, cm) {
      const id = args[1];
      if (!id) return message.reply('❌ `' + cm.getMainPrefix() + 'leaveserver <server_id>`');
      const g = message.client.guilds.cache.get(id);
      if (!g) return message.reply('❌ مش موجود في هذا السيرفر.');
      const name = g.name;
      await g.leave();
      // can't reply after leaving if it's the current server
    }
  },
  {
    name: 'totalstats2', aliases: ['ts3', 'globalstats2'], description: 'إحصائياتك الكلية في كل السيرفرات', category: 'سيرفر',
    execute(message) {
      const guilds = message.client.guilds.cache;
      const channels = message.client.channels.cache;
      const users = message.client.users.cache;
      message.reply('**📊 الإحصائيات الكلية**\n```\n🏠 السيرفرات : ' + guilds.size + '\n📢 القنوات   : ' + channels.size + '\n👥 المستخدمون: ' + users.size + '\n🤖 البوتات   : ' + users.filter(u=>u.bot).size + '\n```');
    }
  }
];
