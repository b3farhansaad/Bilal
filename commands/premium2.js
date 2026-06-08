
const fs2 = require('fs'), path2 = require('path'), https = require('https');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const DATA = path2.join(__dirname,'../data');
if(!fs2.existsSync(DATA)) fs2.mkdirSync(DATA,{recursive:true});

function discordPATCH(token, body) {
  return new Promise((res,rej)=>{
    const d=JSON.stringify(body);
    const req=https.request({hostname:'discord.com',path:'/api/v9/users/@me',method:'PATCH',
      headers:{Authorization:token,'Content-Type':'application/json','Content-Length':Buffer.byteLength(d),'User-Agent':'Mozilla/5.0'},timeout:10000},
      r=>{let data='';r.on('data',c=>data+=c);r.on('end',()=>res({status:r.statusCode,data:JSON.parse(data||'{}')}));});
    req.on('error',rej);req.on('timeout',()=>{req.destroy();rej(new Error('timeout'));});
    req.write(d);req.end();
  });
}

const rotators = new Map(); // userId -> { interval, items, current }

module.exports = [
  {
    name:'statusrotate', aliases:['rotstat','spinstat','اوضاع'],
    description:'تدوير الحالة بين أوضاع متعددة تلقائياً', category:'متقدم',
    async execute(message, args, cm) {
      const uid = message.client.user.id;
      const sub = args[1]?.toLowerCase();
      if (sub==='stop'||sub==='off') {
        if (rotators.has('status_'+uid)) { clearInterval(rotators.get('status_'+uid)); rotators.delete('status_'+uid); }
        return message.reply('⏹️ **تم إيقاف تدوير الحالة.**');
      }
      if (sub==='list') {
        const p = path2.join(DATA,'status_rotate.json');
        if(!fs2.existsSync(p)) return message.reply('📭 لا يوجد أوضاع محفوظة.');
        const items = JSON.parse(fs2.readFileSync(p,'utf8'));
        return message.reply('**🔄 الأوضاع المحفوظة:**\n'+items.map((s,i)=>'**'+(i+1)+'.** '+s).join('\n'));
      }
      const statuses = args.slice(1).join(' ').split('|').map(s=>s.trim()).filter(Boolean);
      if (statuses.length < 2) return message.reply('❌ `'+cm.getMainPrefix()+'statusrotate <حالة1> | <حالة2> | <حالة3>` (فصل بـ |)\nأو: `'+cm.getMainPrefix()+'statusrotate stop`');
      fs2.writeFileSync(path2.join(DATA,'status_rotate.json'), JSON.stringify(statuses));
      if (rotators.has('status_'+uid)) clearInterval(rotators.get('status_'+uid));
      let idx = 0;
      const setStatus = async () => {
        const s = statuses[idx % statuses.length]; idx++;
        try { await message.client.user.setPresence({ activities:[{name:s,type:0}], status:'online' }); } catch{}
      };
      await setStatus();
      const interval = setInterval(setStatus, 30000);
      rotators.set('status_'+uid, interval);
      message.reply('✅ **تدوير الحالة نشط!**\n🔄 **'+statuses.length+'** حالة كل 30 ثانية:\n'+statuses.map((s,i)=>'**'+(i+1)+'.** '+s).join('\n'));
    }
  },
  {
    name:'biorotate', aliases:['rotbio','spinbio','بايو2'],
    description:'تدوير البايو تلقائياً بين نصوص', category:'متقدم',
    async execute(message, args, cm) {
      const uid = message.client.user.id;
      const sub = args[1]?.toLowerCase();
      if (sub==='stop') {
        if (rotators.has('bio_'+uid)) { clearInterval(rotators.get('bio_'+uid)); rotators.delete('bio_'+uid); }
        return message.reply('⏹️ **تم إيقاف تدوير البايو.**');
      }
      const bios = args.slice(1).join(' ').split('|').map(s=>s.trim()).filter(Boolean);
      if (bios.length < 2) return message.reply('❌ `'+cm.getMainPrefix()+'biorotate <بايو1> | <بايو2> | ...`\nأو: `stop`');
      if (rotators.has('bio_'+uid)) clearInterval(rotators.get('bio_'+uid));
      let idx = 0;
      const setBio = async () => {
        const b = bios[idx % bios.length]; idx++;
        try { await discordPATCH(message.client.token, { bio: b }); } catch{}
      };
      await setBio();
      const interval = setInterval(setBio, 45000);
      rotators.set('bio_'+uid, interval);
      message.reply('✅ **تدوير البايو نشط!** (كل 45 ثانية)\n'+bios.map((b,i)=>'**'+(i+1)+'.** '+b).join('\n'));
    }
  },
  {
    name:'nickcycle', aliases:['nickrotate','spinname','دوّرنيك'],
    description:'تغيير نيكنيمك تلقائياً في السيرفر الحالي', category:'متقدم',
    async execute(message, args, cm) {
      if (!message.guild) return message.reply('❌ هذا الأمر في السيرفرات فقط.');
      const gid = message.guild.id;
      const sub = args[1]?.toLowerCase();
      if (sub==='stop') {
        if (rotators.has('nick_'+gid)) { clearInterval(rotators.get('nick_'+gid)); rotators.delete('nick_'+gid); }
        return message.reply('⏹️ **تم إيقاف تدوير النيك.**');
      }
      const nicks = args.slice(1).join(' ').split('|').map(s=>s.trim()).filter(Boolean);
      if (nicks.length < 2) return message.reply('❌ `'+cm.getMainPrefix()+'nickcycle <نيك1> | <نيك2> | ...`');
      if (rotators.has('nick_'+gid)) clearInterval(rotators.get('nick_'+gid));
      let idx = 0;
      const setNick = async () => {
        const n = nicks[idx % nicks.length]; idx++;
        try { await message.guild.members.me.setNickname(n).catch(()=>{}); } catch{}
      };
      await setNick();
      const interval = setInterval(setNick, 60000);
      rotators.set('nick_'+gid, interval);
      message.reply('✅ **تدوير النيك نشط!** (كل دقيقة)\n'+nicks.map((n,i)=>'**'+(i+1)+'.** '+n).join('\n'));
    }
  },
  {
    name:'ghostping', aliases:['gp2','pingdel','سحب'],
    description:'ghost ping مستخدم ويمسح الرسالة فوراً', category:'متقدم',
    async execute(message, args, cm) {
      const target = message.mentions?.users?.first();
      if (!target) return message.reply('❌ `'+cm.getMainPrefix()+'ghostping @يوزر`');
      await message.delete().catch(()=>{});
      const m = await message.channel.send('<@'+target.id+'>');
      await sleep(300);
      await m.delete().catch(()=>{});
    }
  },
  {
    name:'massghosting', aliases:['multighost','ghostall'],
    description:'ghost ping عدة أشخاص مرة واحدة', category:'متقدم',
    async execute(message, args, cm) {
      const targets = [...(message.mentions?.users?.values()||[])];
      if (!targets.length) return message.reply('❌ `'+cm.getMainPrefix()+'massghosting @1 @2 @3`');
      await message.delete().catch(()=>{});
      const m = await message.channel.send(targets.map(u=>'<@'+u.id+'>').join(' '));
      await sleep(400);
      await m.delete().catch(()=>{});
    }
  },
  {
    name:'fakeonline', aliases:['appear','showin','ظهور'],
    description:'تغيير حالة الظهور (online/dnd/idle/invisible)', category:'متقدم',
    async execute(message, args, cm) {
      const statuses = {online:'🟢 أونلاين',idle:'🌙 غايب',dnd:'🔴 لا تزعج',invisible:'👻 مخفي',offline:'⚫ أوفلاين',
                        dnd2:'dnd',busy:'dnd','لا ازعج':'dnd','مخفي':'invisible','غايب':'idle','اونلاين':'online'};
      const raw = args[1]?.toLowerCase()||'online';
      const status = ['online','idle','dnd','invisible'].includes(raw)?raw:(raw==='مخفي'?'invisible':raw==='غايب'?'idle':raw==='لا ازعج'?'dnd':'online');
      try {
        await message.client.user.setPresence({status});
        const labels={online:'🟢 أونلاين',idle:'🌙 غايب',dnd:'🔴 لا تزعج',invisible:'👻 مخفي'};
        message.reply('✅ **تم تغيير الحالة لـ '+( labels[status]||status)+'**');
      } catch(e) { message.reply('❌ فشل: `'+e.message+'`'); }
    }
  },
  {
    name:'setbio2', aliases:['changebio','updatebio','editbio'],
    description:'تغيير البايو مباشرة عبر API', category:'متقدم',
    async execute(message, args, cm) {
      const bio = args.slice(1).join(' ');
      if (!bio && bio!=='clear') return message.reply('❌ `'+cm.getMainPrefix()+'setbio2 <نص البايو>`\nأو `'+cm.getMainPrefix()+'setbio2 clear` لمسح البايو');
      const msg = await message.reply('✏️ جاري تحديث البايو...');
      try {
        const { status } = await discordPATCH(message.client.token, { bio: bio==='clear'?'':bio });
        await msg.edit(status===200?'✅ **تم تحديث البايو بنجاح!**\n> '+bio:'❌ فشل. Status: '+status);
      } catch(e) { await msg.edit('❌ خطأ: `'+e.message+'`'); }
    }
  },
  {
    name:'faketypes', aliases:['continuoustype','alwaystype','كتابة'],
    description:'إظهار مؤشر الكتابة باستمرار (30 ثانية)', category:'متقدم',
    async execute(message, args, cm) {
      const dur = Math.min(parseInt(args[1])||30, 120);
      const msg = await message.reply('⌨️ مؤشر الكتابة نشط لـ '+dur+' ثانية...');
      const end = Date.now() + dur*1000;
      const tick = async () => { if(Date.now()<end){try{await message.channel.sendTyping();}catch{}; setTimeout(tick,8000); } else { await msg.edit('⌨️ انتهى مؤشر الكتابة.'); } };
      tick();
    }
  },
  {
    name:'copyuser', aliases:['cloneuser','mirroruser','انسخ'],
    description:'نسخ اسم وحالة مستخدم آخر (يُقلّده)', category:'متقدم',
    async execute(message, args, cm) {
      const target = message.mentions?.users?.first() || message.client.users.cache.get(args[1]);
      if (!target) return message.reply('❌ `'+cm.getMainPrefix()+'copyuser @يوزر`');
      const msg = await message.reply('🪞 جاري نسخ المستخدم...');
      try {
        const pres = target.presence;
        const activity = pres?.activities?.[0];
        if (activity) await message.client.user.setPresence({activities:[{name:activity.name,type:activity.type}],status:pres?.status||'online'});
        const nick = message.guild?.members?.cache?.get(target.id)?.nickname || target.username;
        if (message.guild?.members?.me) await message.guild.members.me.setNickname(nick).catch(()=>{});
        await msg.edit('✅ **تم نسخ `'+target.username+'`!**\n👤 الاسم: `'+nick+'`\n🎮 النشاط: `'+(activity?.name||'لا يوجد')+'`');
      } catch(e) { await msg.edit('❌ فشل: `'+e.message+'`'); }
    }
  },
  {
    name:'clearrotators', aliases:['stopallauto','stopall3','ايقاف'],
    description:'إيقاف كل التدوير التلقائي النشط', category:'متقدم',
    execute(message) {
      let count = 0;
      for (const [key, interval] of rotators.entries()) { clearInterval(interval); rotators.delete(key); count++; }
      message.reply(count>0 ? '✅ **تم إيقاف '+count+' عملية تدوير تلقائي.**' : 'ℹ️ لا يوجد تدوير نشط.');
    }
  },
];
