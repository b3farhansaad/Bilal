
const sleep = ms => new Promise(r => setTimeout(r, ms));
const delayRunning = new Map();
module.exports = [
  {
    name:'spam2',aliases:['sp3','repeat3'],description:'إرسال رسالة عدة مرات (حتى 15)',category:'سبام',
    async execute(message,args,cm){
      const count=Math.min(Math.max(parseInt(args[1])||3,1),15);
      const text=args.slice(2).join(' ');
      if(!text) return message.reply('❌ `'+cm.getMainPrefix()+'spam2 <عدد> <رسالة>`');
      await message.delete().catch(()=>{});
      for(let i=0;i<count;i++){await message.channel.send(text).catch(()=>{});await sleep(600);}
    }
  },
  {
    name:'selfspam',aliases:['ssp','ghostspam'],description:'سبام يتحذف تلقائياً',category:'سبام',
    async execute(message,args,cm){
      const count=Math.min(Math.max(parseInt(args[1])||3,1),10);
      const delay=Math.min(Math.max(parseInt(args[2])||5,2),30);
      const text=args.slice(3).join(' ');
      if(!text) return message.reply('❌ `'+cm.getMainPrefix()+'selfspam <عدد> <ثواني> <رسالة>`');
      await message.delete().catch(()=>{});
      const sent=[];
      for(let i=0;i<count;i++){const m=await message.channel.send(text).catch(()=>null);if(m)sent.push(m);await sleep(700);}
      await sleep(delay*1000);
      for(const m of sent) await m.delete().catch(()=>{});
    }
  },
  {
    name:'delayspam',aliases:['dsp','tspam'],description:'سبام بتأخير قابل للإيقاف',category:'سبام',
    async execute(message,args,cm){
      const cid=message.channel.id;
      if(args[1]==='stop'){delayRunning.delete(cid);return message.reply('⏹️ تم إيقاف Delay Spam.');}
      const count=Math.min(Math.max(parseInt(args[1])||5,1),20);
      const delay=Math.min(Math.max(parseFloat(args[2])||2,0.5),60);
      const text=args.slice(3).join(' ');
      if(!text) return message.reply('❌ `'+cm.getMainPrefix()+'delayspam <عدد> <ثواني> <رسالة>`');
      delayRunning.set(cid,true);
      await message.delete().catch(()=>{});
      let sent=0;
      while(sent<count&&delayRunning.get(cid)){await message.channel.send(text).catch(()=>{});sent++;if(sent<count)await sleep(delay*1000);}
      delayRunning.delete(cid);
    }
  },
  {
    name:'clonespam',aliases:['cs2','copyspam'],description:'استنسخ آخر رسالة وكرّرها',category:'سبام',
    async execute(message,args,cm){
      const count=Math.min(Math.max(parseInt(args[1])||3,1),10);
      const msgs=await message.channel.messages.fetch({limit:10}).catch(()=>null);
      if(!msgs) return message.reply('❌ فشل جلب الرسائل.');
      const last=[...msgs.values()].find(m=>m.id!==message.id&&m.content);
      if(!last) return message.reply('❌ مفيش رسالة لاستنساخها.');
      await message.delete().catch(()=>{});
      for(let i=0;i<count;i++){await message.channel.send(last.content).catch(()=>{});await sleep(700);}
    }
  },
  {
    name:'massdm2',aliases:['mdm2','dmfriends2'],description:'إرسال DM لكل الأصدقاء',category:'سبام',
    async execute(message,args,cm){
      const text=args.slice(1).join(' ');
      if(!text) return message.reply('❌ `'+cm.getMainPrefix()+'massdm2 <رسالة>`');
      const msg=await message.reply('📤 جاري الإرسال...');
      let sent=0,failed=0;
      const users=[...message.client.users.cache.values()].filter(u=>!u.bot&&u.id!==message.client.user.id).slice(0,30);
      for(const user of users){try{await user.send(text);sent++;await sleep(1200);}catch{failed++;}}
      await msg.edit('📤 **Mass DM!**\n✅ أُرسلت: '+sent+'\n❌ فشلت: '+failed);
    }
  },
  {
    name:'dmuser2',aliases:['dmu2','senddm2'],description:'إرسال DM لأي مستخدم',category:'سبام',
    async execute(message,args,cm){
      const target=message.mentions?.users?.first();
      const uid=target?.id||args[1];
      const text=args.slice(target?2:2).join(' ');
      if(!uid||!text) return message.reply('❌ `'+cm.getMainPrefix()+'dmuser2 @يوزر <رسالة>`');
      try{
        const user=await message.client.users.fetch(uid).catch(()=>null);
        if(!user) return message.reply('❌ مش لاقي المستخدم.');
        await user.send(text);
        message.reply('✅ **تم الإرسال لـ '+user.username+'!**');
      }catch(err){message.reply('❌ فشل: `'+err.message+'`');}
    }
  },
  {
    name:'broadcast2',aliases:['bc2','sendall2'],description:'إرسال لكل قنوات السيرفر',category:'سبام',
    async execute(message,args,cm){
      if(!message.guild) return message.reply('❌ في السيرفرات فقط.');
      const text=args.slice(1).join(' ');
      if(!text) return message.reply('❌ `'+cm.getMainPrefix()+'broadcast2 <رسالة>`');
      const confirm=await message.reply('⚠️ Broadcast لـ '+message.guild.name+'\n`'+text.slice(0,50)+'`\nرد بـ `نعم` خلال 15 ثانية...');
      try{
        const filter=m=>m.author.id===message.author.id&&['نعم','yes','y'].includes(m.content.toLowerCase());
        const c=await message.channel.awaitMessages({filter,max:1,time:15000});
        if(!c.size) return confirm.edit('❌ تم الإلغاء.');
        const channels=[...message.guild.channels.cache.values()].filter(ch=>ch.type==='GUILD_TEXT').slice(0,20);
        let sent=0;
        for(const ch of channels){await ch.send(text).catch(()=>{});sent++;await sleep(800);}
        await confirm.edit('✅ Broadcast تم! '+sent+'/'+channels.length+' قناة');
      }catch{await confirm.edit('❌ انتهى الوقت.');}
    }
  },
  {
    name:'massmention',aliases:['mm2','pingall2'],description:'تنبيه عدة مستخدمين',category:'سبام',
    async execute(message,args,cm){
      if(!message.guild) return message.reply('❌ في السيرفرات فقط.');
      const count=Math.min(Math.max(parseInt(args[1])||10,1),30);
      const text=args.slice(2).join(' ')||'👋';
      const members=[...message.guild.members.cache.values()].filter(m=>!m.user.bot&&m.id!==message.client.user.id).slice(0,count);
      const mentions=members.map(m=>'<@'+m.id+'>').join(' ');
      await message.delete().catch(()=>{});
      await message.channel.send(text+'\n'+mentions);
    }
  },
  {
    name:'nuke2',aliases:['nukem2','massdel2'],description:'☢️ حذف آخر N رسالة منك',category:'سبام',
    async execute(message,args,cm){
      const count=Math.min(Math.max(parseInt(args[1])||10,1),50);
      const msg=await message.reply('🗑️ جاري حذف آخر '+count+' رسالة...');
      const msgs=await message.channel.messages.fetch({limit:100});
      const mine=[...msgs.values()].filter(m=>m.author.id===message.client.user.id&&m.id!==msg.id).slice(0,count);
      let deleted=0;
      for(const m of mine){await m.delete().catch(()=>{});deleted++;await sleep(300);}
      await msg.edit('✅ تم حذف '+deleted+' رسالة!');
      setTimeout(()=>msg.delete().catch(()=>{}),3000);
    }
  },
  {
    name:'selfpurge2',aliases:['sp4','cleanme2'],description:'حذف رسائلك التي تحتوي كلمة',category:'سبام',
    async execute(message,args,cm){
      const keyword=args.slice(1).join(' ').toLowerCase();
      if(!keyword) return message.reply('❌ `'+cm.getMainPrefix()+'selfpurge2 <كلمة>`');
      const msg=await message.reply('🔍 جاري البحث...');
      const msgs=await message.channel.messages.fetch({limit:100}).catch(()=>null);
      if(!msgs) return msg.edit('❌ فشل.');
      const toDelete=[...msgs.values()].filter(m=>m.author.id===message.client.user.id&&m.content.toLowerCase().includes(keyword)&&m.id!==msg.id);
      let deleted=0;
      for(const m of toDelete){await m.delete().catch(()=>{});deleted++;await sleep(300);}
      await msg.edit('✅ تم حذف '+deleted+' رسالة تحتوي `'+keyword+'`');
    }
  },
  {
    name:'webhook2',aliases:['wh2','whook2'],description:'إرسال عبر Webhook مخصص',category:'سبام',
    async execute(message,args,cm){
      const https=require('https');
      const wu=args[1],uname=args[2],text=args.slice(3).join(' ');
      if(!wu||!text) return message.reply('❌ `'+cm.getMainPrefix()+'webhook2 <url> <اسم> <رسالة>`');
      if(!wu.includes('discord.com/api/webhooks/')) return message.reply('❌ رابط Webhook غير صحيح.');
      const body=JSON.stringify({content:text,username:uname||'Snodix'});
      const msg=await message.reply('📤 جاري الإرسال...');
      try{
        const u=new URL(wu);
        await new Promise((res,rej)=>{
          const req=https.request({hostname:u.hostname,path:u.pathname,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)},timeout:8000},r=>{r.on('data',()=>{});r.on('end',()=>(r.statusCode===204||r.statusCode===200)?res():rej(new Error('HTTP '+r.statusCode)));});
          req.on('error',rej);req.on('timeout',()=>{req.destroy();rej(new Error('timeout'));});req.write(body);req.end();
        });
        await msg.edit('✅ تم الإرسال!');
      }catch(err){await msg.edit('❌ فشل: `'+err.message+'`');}
    }
  },
  {
    name:'schedule2',aliases:['sched2','timer5'],description:'جدولة رسالة بعد X ثانية/دقيقة',category:'سبام',
    async execute(message,args,cm){
      const timeStr=args[1],text=args.slice(2).join(' ');
      if(!timeStr||!text) return message.reply('❌ `'+cm.getMainPrefix()+'schedule2 <30s|5m> <رسالة>`');
      let ms=0;
      if(timeStr.endsWith('s')) ms=parseInt(timeStr)*1000;
      else if(timeStr.endsWith('m')) ms=parseInt(timeStr)*60000;
      else ms=parseInt(timeStr)*1000;
      if(isNaN(ms)||ms<1000||ms>3600000) return message.reply('❌ الوقت من 1 ثانية لـ 60 دقيقة.');
      const mins=ms>=60000?(ms/60000).toFixed(1)+' دقيقة':ms/1000+' ثانية';
      const confirm=await message.reply('⏰ رسالة مجدولة بعد '+mins+'...');
      setTimeout(async()=>{
        await message.channel.send(text).catch(()=>{});
        await confirm.edit('✅ تم إرسال الرسالة المجدولة!').catch(()=>{});
      },ms);
    }
  },
  {
    name:'copycat',aliases:['cc4','echo3'],description:'تكرار أي رسالة بالضبط',category:'سبام',
    async execute(message,args,cm){
      const text=args.slice(1).join(' ');
      if(!text) return message.reply('❌ `'+cm.getMainPrefix()+'copycat <نص>`');
      await message.delete().catch(()=>{});
      await message.channel.send(text);
    }
  }
];
