// Commands: ghost, typing, lastedit, quickreact, bulkreact, fakeping, chstats
let ghostEnabled = false;
const typingIntervals = new Map();

module.exports = [
    {name:'ghost',aliases:['ghst','invisible'],description:'الوضع الشبحي — رسائلك تتحذف بعد 5 ثواني',category:'شبحي',
     handleGhostDelete(msg){if(!ghostEnabled)return;setTimeout(()=>msg.delete().catch(()=>{}),5000);},
     async execute(message,args,commandManager){
        const sub=args[1]?.toLowerCase();const prefix=commandManager.getMainPrefix();
        if(sub==='on'){ghostEnabled=true;const m=await message.reply('👻 **الوضع الشبحي مفعّل!** رسائلك ستُحذف بعد 5 ثواني.');setTimeout(()=>m.delete().catch(()=>{}),5000);setTimeout(()=>message.delete().catch(()=>{}),5000);return;}
        if(sub==='off'){ghostEnabled=false;return message.reply('✅ **الوضع الشبحي معطّل.**');}
        if(sub==='status')return message.reply(ghostEnabled?'👻 الوضع الشبحي **مفعّل** — رسائلك تحذف بعد 5s':'✅ الوضع الشبحي **معطّل**');
        const text=args.slice(1).join(' ');
        if(!text)return message.reply('**👻 الوضع الشبحي**\n\n`'+prefix+'ghost on` — تفعيل\n`'+prefix+'ghost off` — تعطيل\n`'+prefix+'ghost <رسالة>` — رسالة شبحية فورية');
        try{await message.delete().catch(()=>{});const s=await message.channel.send(text);setTimeout(()=>s.delete().catch(()=>{}),5000);}
        catch(err){message.channel.send('❌ فشل: `'+err.message+'`').then(m=>setTimeout(()=>m.delete().catch(()=>{}),3000));}
    }},
    {name:'typing',aliases:['faketype','sendtyping'],description:'مؤشر typing مستمر أو لوقت محدد',category:'شبحي',
     async execute(message,args,commandManager){
        const sub=args[1]?.toLowerCase();const cid=message.channel.id;const prefix=commandManager.getMainPrefix();
        if(sub==='on'){
            if(typingIntervals.has(cid))return message.reply('⚠️ Typing شغال بالفعل. `'+prefix+'typing off` لإيقافه.');
            await message.channel.sendTyping().catch(()=>{});
            const iv=setInterval(()=>message.channel.sendTyping().catch(()=>{}),8000);
            typingIntervals.set(cid,iv);
            const m=await message.reply('⌨️ **Typing مفعّل!** `'+prefix+'typing off` لإيقافه.');
            setTimeout(()=>{m.delete().catch(()=>{});message.delete().catch(()=>{});},4000);return;
        }
        if(sub==='off'){
            const iv=typingIntervals.get(cid);if(!iv)return message.reply('❌ Typing مش شغال هنا.');
            clearInterval(iv);typingIntervals.delete(cid);return message.reply('✅ **Typing متوقف.**');
        }
        const secs=parseInt(sub);
        if(!isNaN(secs)&&secs>0){
            const ms=Math.min(secs,300)*1000;
            await message.channel.sendTyping().catch(()=>{});
            const iv=setInterval(()=>message.channel.sendTyping().catch(()=>{}),8000);
            setTimeout(()=>clearInterval(iv),ms);
            const m=await message.reply('⌨️ **Typing لـ '+Math.min(secs,300)+'ثانية...**');
            setTimeout(()=>{m.delete().catch(()=>{});message.delete().catch(()=>{});},2000);return;
        }
        message.reply('**⌨️ Typing**\n`'+prefix+'typing on` — مستمر\n`'+prefix+'typing off` — إيقاف\n`'+prefix+'typing <ثواني>` — لوقت محدد');
    }},
    {name:'lastedit',aliases:['editmsg','editlast','le'],description:'تعديل آخر رسالة أرسلتها',category:'شبحي',
     async execute(message,args,commandManager){
        const newText=args.slice(1).join(' ');
        if(!newText)return message.reply('❌ **الاستخدام:** `'+commandManager.getMainPrefix()+'lastedit <النص الجديد>`');
        try{const msgs=await message.channel.messages.fetch({limit:50});
        const myLast=msgs.filter(m=>m.author.id===message.client.user.id&&m.id!==message.id).first();
        if(!myLast)return message.reply('❌ مش لاقي رسالة سابقة منك.');
        await myLast.edit(newText);await message.delete().catch(()=>{});}
        catch(err){message.reply('❌ فشل: `'+err.message+'`');}
    }},
    {name:'quickreact',aliases:['qreact','react'],description:'تفاعل سريع على آخر رسالة',category:'شبحي',
     async execute(message,args,commandManager){
        const emojis=args.slice(1);
        if(!emojis.length)return message.reply('❌ **الاستخدام:** `'+commandManager.getMainPrefix()+'quickreact 👋 ❤️ 🔥`');
        try{await message.delete().catch(()=>{});const msgs=await message.channel.messages.fetch({limit:5});
        const t=msgs.filter(m=>m.id!==message.id).first();if(!t)return;
        for(const e of emojis.slice(0,5)){await t.react(e).catch(()=>{});await new Promise(r=>setTimeout(r,350));}}
        catch(err){message.channel.send('❌ فشل: `'+err.message+'`').then(m=>setTimeout(()=>m.delete().catch(()=>{}),3000));}
    }},
    {name:'bulkreact2',aliases:['br','massreact'],description:'تفاعل على آخر N رسالة',category:'شبحي',
     async execute(message,args,commandManager){
        const emoji=args[1];const count=Math.min(Math.max(parseInt(args[2])||5,1),15);
        if(!emoji)return message.reply('❌ **الاستخدام:** `'+commandManager.getMainPrefix()+'bulkreact <إيموجي> [عدد]`');
        try{await message.delete().catch(()=>{});const msgs=await message.channel.messages.fetch({limit:count+1});
        const targets=[...msgs.values()].filter(m=>m.id!==message.id).slice(0,count);
        for(const m of targets){await m.react(emoji).catch(()=>{});await new Promise(r=>setTimeout(r,400));}}
        catch(err){message.channel.send('❌ فشل: `'+err.message+'`').then(m=>setTimeout(()=>m.delete().catch(()=>{}),3000));}
    }},
    {name:'fakeping',aliases:['fping','pingfake'],description:'تنبيه مزيف سريع ويتحذف',category:'شبحي',
     async execute(message,args,commandManager){
        const t=message.mentions?.users?.first();
        if(!t)return message.reply('❌ **الاستخدام:** `'+commandManager.getMainPrefix()+'fakeping @يوزر`');
        const text=args.slice(2).join(' ')||'👋';
        try{await message.delete().catch(()=>{});const s=await message.channel.send('<@'+t.id+'> '+text);setTimeout(()=>s.delete().catch(()=>{}),1500);}
        catch(err){message.channel.send('❌ فشل: `'+err.message+'`').then(m=>setTimeout(()=>m.delete().catch(()=>{}),3000));}
    }},
    {name:'chstats',aliases:['channelstats','msgstats'],description:'إحصائيات تفصيلية عن الشات',category:'شبحي',
     async execute(message,args,commandManager){
        const limit=Math.min(Math.max(parseInt(args[1])||50,10),100);
        const msg=await message.reply('📊 جاري تحليل آخر '+limit+' رسالة...');
        try{const msgs=await message.channel.messages.fetch({limit});
        const userMap=new Map();let totalWords=0,totalChars=0,botCount=0;const hourMap=new Array(24).fill(0);
        for(const m of msgs.values()){
            if(m.author.bot){botCount++;continue;}
            const words=m.content.split(/\s+/).filter(Boolean);totalWords+=words.length;totalChars+=m.content.length;
            const user=m.author.username;userMap.set(user,(userMap.get(user)||0)+1);
            hourMap[new Date(m.createdAt).getHours()]++;
        }
        const sorted=[...userMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);
        const peakHour=hourMap.indexOf(Math.max(...hourMap));
        let text='**📊 إحصائيات #'+message.channel.name+'**\n```\n';
        text+='📨 رسائل   : '+msgs.size+' | 👥 بشر: '+(msgs.size-botCount)+' | 🤖 بوتات: '+botCount+'\n';
        text+='📝 كلمات  : '+totalWords.toLocaleString()+'\n';
        text+='🔤 حروف   : '+totalChars.toLocaleString()+'\n';
        text+='⏰ أنشط ساعة: '+peakHour+':00\n\n🏆 أنشط المستخدمين:\n';
        sorted.forEach(([u,c],i)=>text+='  '+(i+1)+'. '+u.slice(0,14).padEnd(14)+' '+c+' رسالة\n');
        await msg.edit(text+'```');}catch(err){await msg.edit('❌ فشل: `'+err.message+'`');}
    }}
];
