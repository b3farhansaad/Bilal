const sleep = ms => new Promise(r => setTimeout(r, ms));
module.exports = [
  {
    name: 'nickname2', aliases: ['nick2', 'mynick2'], description: 'تغيير نيكك في السيرفر الحالي', category: 'ادارة',
    async execute(message, args, cm) {
      if (!message.guild) return message.reply('❌ في السيرفرات فقط.');
      const nick = args.slice(1).join(' ') || null;
      try { await message.guild.members.cache.get(message.client.user.id)?.setNickname(nick); message.reply(nick ? '✅ نيكك تغيّر لـ `' + nick + '`' : '✅ تم إزالة النيك.'); }
      catch (err) { message.reply('❌ فشل: `' + err.message + '`'); }
    }
  },
  {
    name: 'setnick', aliases: ['changenick', 'forcenick'], description: 'تغيير نيك مستخدم آخر (تحتاج صلاحية)', category: 'ادارة',
    async execute(message, args, cm) {
      if (!message.guild) return message.reply('❌ في السيرفرات فقط.');
      const target = message.mentions?.users?.first();
      if (!target) return message.reply('❌ `' + cm.getMainPrefix() + 'setnick @يوزر <نيك>`');
      const nick = args.slice(2).join(' ') || null;
      try {
        const member = message.guild.members.cache.get(target.id);
        if (!member) return message.reply('❌ مش لاقي العضو.');
        await member.setNickname(nick);
        message.reply(nick ? '✅ نيك **' + target.username + '** تغيّر لـ `' + nick + '`' : '✅ تم إزالة نيك **' + target.username + '**');
      } catch (err) { message.reply('❌ فشل: `' + err.message + '`'); }
    }
  },
  {
    name: 'pinmsg', aliases: ['pin2', 'pinlast'], description: 'تثبيت آخر رسالة في الشات', category: 'ادارة',
    async execute(message, args) {
      const msgs = await message.channel.messages.fetch({ limit: 5 }).catch(() => null);
      if (!msgs) return message.reply('❌ فشل جلب الرسائل.');
      const target = args[1] ? msgs.get(args[1]) : [...msgs.values()].find(m => m.id !== message.id);
      if (!target) return message.reply('❌ مش لاقي رسالة.');
      try { await target.pin(); message.reply('📌 **تم التثبيت!** من ' + target.author.username); }
      catch (err) { message.reply('❌ فشل: `' + err.message + '`'); }
    }
  },
  {
    name: 'unpinmsg', aliases: ['unpin2', 'removepin'], description: 'إزالة تثبيت آخر رسالة مثبّتة', category: 'ادارة',
    async execute(message) {
      try {
        const pinned = await message.channel.messages.fetchPinned();
        const last = [...pinned.values()][0];
        if (!last) return message.reply('❌ مفيش رسائل مثبّتة.');
        await last.unpin();
        message.reply('📌 **تم إزالة التثبيت** من: `' + last.author.username + '`');
      } catch (err) { message.reply('❌ فشل: `' + err.message + '`'); }
    }
  },
  {
    name: 'slowmode2', aliases: ['slow2', 'ratelimit2'], description: 'تفعيل Slow Mode (0 لإلغاء)', category: 'ادارة',
    async execute(message, args, cm) {
      const secs = parseInt(args[1]);
      if (isNaN(secs) || secs < 0 || secs > 21600) return message.reply('❌ `' + cm.getMainPrefix() + 'slowmode2 <0-21600>`');
      try { await message.channel.setRateLimitPerUser(secs); message.reply(secs === 0 ? '✅ **Slow Mode** أُزيل.' : '⏱️ **Slow Mode** مفعّل: **' + secs + ' ثانية**'); }
      catch (err) { message.reply('❌ فشل: `' + err.message + '`'); }
    }
  },
  {
    name: 'settopic', aliases: ['topic2', 'chantopic'], description: 'تغيير موضوع القناة', category: 'ادارة',
    async execute(message, args, cm) {
      const text = args.slice(1).join(' ');
      if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'settopic <موضوع>`');
      try { await message.channel.setTopic(text); message.reply('✅ **موضوع القناة** تغيّر لـ `' + text.slice(0,50) + '`'); }
      catch (err) { message.reply('❌ فشل: `' + err.message + '`'); }
    }
  },
  {
    name: 'chname', aliases: ['renamechan', 'channelname'], description: 'إعادة تسمية القناة الحالية', category: 'ادارة',
    async execute(message, args, cm) {
      const name = args.slice(1).join('-').toLowerCase().replace(/\s+/g, '-');
      if (!name) return message.reply('❌ `' + cm.getMainPrefix() + 'chname <الاسم الجديد>`');
      try { const old = message.channel.name; await message.channel.setName(name); message.reply('✅ اسم القناة تغيّر من `#' + old + '` لـ `#' + name + '`'); }
      catch (err) { message.reply('❌ فشل: `' + err.message + '`'); }
    }
  },
  {
    name: 'massnick', aliases: ['allnick', 'bulknick'], description: 'تغيير نيك كل أعضاء رتبة', category: 'ادارة',
    async execute(message, args, cm) {
      if (!message.guild) return message.reply('❌ في السيرفرات فقط.');
      const roleName = args[1]; const newNick = args.slice(2).join(' ');
      if (!roleName || !newNick) return message.reply('❌ `' + cm.getMainPrefix() + 'massnick <رول> <نيك>`');
      const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
      if (!role) return message.reply('❌ رول `' + roleName + '` مش موجود.');
      const members = [...role.members.values()].filter(m => !m.user.bot).slice(0,10);
      const msg = await message.reply('✏️ جاري تغيير نيك ' + members.length + ' عضو...');
      let done = 0;
      for (const m of members) { await m.setNickname(newNick).catch(()=>{}); done++; await sleep(600); }
      await msg.edit('✅ تم تغيير نيك **' + done + '** عضو لـ `' + newNick + '`');
    }
  },
  {
    name: 'firstmsg', aliases: ['firstmessage2', 'channelstart'], description: 'رابط لأول رسالة في القناة', category: 'ادارة',
    execute(message) {
      const ch = message.channel; const gid = message.guild?.id || '@me';
      const link = 'https://discord.com/channels/' + gid + '/' + ch.id + '/' + ch.id;
      message.reply('**🔝 أول رسالة في #' + ch.name + ':**\n' + link);
    }
  },
  {
    name: 'msgjump', aliases: ['jumpmsg', 'msglink'], description: 'إنشاء رابط لرسالة معينة', category: 'ادارة',
    execute(message, args, cm) {
      const msgId = args[1];
      if (!msgId || isNaN(msgId)) return message.reply('❌ `' + cm.getMainPrefix() + 'msgjump <message_id>`');
      const gid = message.guild?.id || '@me';
      message.reply('🔗 **رابط الرسالة:**\nhttps://discord.com/channels/' + gid + '/' + message.channel.id + '/' + msgId);
    }
  },
  {
    name: 'reactmsg', aliases: ['react3', 'addreact'], description: 'إضافة تفاعل على رسالة بالـ ID', category: 'ادارة',
    async execute(message, args, cm) {
      const msgId = args[1]; const emoji = args[2];
      if (!msgId || !emoji) return message.reply('❌ `' + cm.getMainPrefix() + 'reactmsg <message_id> <إيموجي>`');
      try {
        const target = await message.channel.messages.fetch(msgId);
        if (!target) return message.reply('❌ مش لاقي الرسالة.');
        await target.react(emoji);
        await message.delete().catch(()=>{});
      } catch (err) { message.reply('❌ فشل: `' + err.message + '`'); }
    }
  },
  {
    name: 'delrole', aliases: ['removerole', 'roleremove'], description: 'سحب رتبة من مستخدم (تحتاج صلاحية)', category: 'ادارة',
    async execute(message, args, cm) {
      if (!message.guild) return message.reply('❌ في السيرفرات فقط.');
      const target = message.mentions?.users?.first();
      const roleName = args.slice(2).join(' ');
      if (!target || !roleName) return message.reply('❌ `' + cm.getMainPrefix() + 'delrole @يوزر <اسم الرتبة>`');
      const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
      if (!role) return message.reply('❌ رتبة `' + roleName + '` مش موجودة.');
      const member = message.guild.members.cache.get(target.id);
      if (!member) return message.reply('❌ مش لاقي العضو.');
      try { await member.roles.remove(role); message.reply('✅ تم سحب `' + role.name + '` من **' + target.username + '**'); }
      catch (err) { message.reply('❌ فشل: `' + err.message + '`'); }
    }
  }


,
  {
    name: 'lockchannel', aliases: ['lock', 'closechannel'], description: 'قفل الشات الحالي', category: 'ادارة',
    async execute(message) {
      if (!message.guild) return message.reply('❌ للسيرفر فقط.');
      try {
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
        message.reply('🔒 تم قفل الشات.');
      } catch (err) { message.reply('❌ ' + err.message); }
    }
  },
  {
    name: 'unlockchannel', aliases: ['unlock', 'openchannel'], description: 'فتح الشات الحالي', category: 'ادارة',
    async execute(message) {
      if (!message.guild) return message.reply('❌ للسيرفر فقط.');
      try {
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
        message.reply('🔓 تم فتح الشات.');
      } catch (err) { message.reply('❌ ' + err.message); }
    }
  },
  {
    name: 'hidechannel', aliases: ['hidech'], description: 'إخفاء الشات', category: 'ادارة',
    async execute(message) {
      if (!message.guild) return message.reply('❌ للسيرفر فقط.');
      try {
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { ViewChannel: false });
        message.reply('👻 تم إخفاء الشات.');
      } catch (err) { message.reply('❌ ' + err.message); }
    }
  },
  {
    name: 'showchannel', aliases: ['unhidech'], description: 'إظهار الشات', category: 'ادارة',
    async execute(message) {
      if (!message.guild) return message.reply('❌ للسيرفر فقط.');
      try {
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { ViewChannel: true });
        message.reply('👁️ تم إظهار الشات.');
      } catch (err) { message.reply('❌ ' + err.message); }
    }
  },
  {
    name: 'clonechannel', aliases: ['clonech'], description: 'استنساخ القناة الحالية', category: 'ادارة',
    async execute(message) {
      try {
        const cloned = await message.channel.clone();
        await cloned.setPosition(message.channel.position + 1);
        message.reply('🧬 تم استنساخ القناة: ' + cloned.name);
      } catch (err) { message.reply('❌ ' + err.message); }
    }
  },
  {
    name: 'createtext', aliases: ['newtext'], description: 'إنشاء روم كتابي', category: 'ادارة',
    async execute(message, args) {
      const name = args.slice(1).join('-');
      if (!name) return message.reply('❌ اكتب اسم الروم.');
      try {
        const ch = await message.guild.channels.create({ name, type: 0 });
        message.reply('📝 تم إنشاء الروم: ' + ch.name);
      } catch (err) { message.reply('❌ ' + err.message); }
    }
  },
  {
    name: 'createvoice', aliases: ['newvoice'], description: 'إنشاء روم صوتي', category: 'ادارة',
    async execute(message, args) {
      const name = args.slice(1).join('-');
      if (!name) return message.reply('❌ اكتب اسم الروم.');
      try {
        const ch = await message.guild.channels.create({ name, type: 2 });
        message.reply('🔊 تم إنشاء الروم الصوتي: ' + ch.name);
      } catch (err) { message.reply('❌ ' + err.message); }
    }
  },
  {
    name: 'deleteroom', aliases: ['deletechannel'], description: 'حذف القناة الحالية', category: 'ادارة',
    async execute(message) {
      try {
        await message.reply('🗑️ جاري حذف القناة...');
        await message.channel.delete();
      } catch (err) { }
    }
  },
  {
    name: 'giverole', aliases: ['addroleuser'], description: 'إعطاء رتبة لمستخدم', category: 'ادارة',
    async execute(message, args) {
      const user = message.mentions.members.first();
      const roleName = args.slice(2).join(' ');
      if (!user || !roleName) return message.reply('❌ الاستخدام: giverole @user الرتبة');
      const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
      if (!role) return message.reply('❌ الرتبة غير موجودة.');
      try {
        await user.roles.add(role);
        message.reply('✅ تم إعطاء الرتبة.');
      } catch (err) { message.reply('❌ ' + err.message); }
    }
  },
  {
    name: 'rolemembers', aliases: ['inrole'], description: 'عرض أعضاء رتبة معينة', category: 'ادارة',
    async execute(message, args) {
      const roleName = args.slice(1).join(' ');
      const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
      if (!role) return message.reply('❌ الرتبة غير موجودة.');
      const members = role.members.map(m => m.user.username).slice(0, 30).join(', ');
      message.reply('👥 أعضاء الرتبة:\n' + (members || 'لا يوجد'));
    }
  }
];
