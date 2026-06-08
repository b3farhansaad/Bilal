const https=require('https');
function discordGET(token,p){return new Promise((res,rej)=>{const req=https.request({hostname:'discord.com',path:'/api/v9'+p,method:'GET',headers:{'Authorization':token,'User-Agent':'Mozilla/5.0'},timeout:8000},(r)=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res({status:r.statusCode,data:JSON.parse(d)});}catch{res({status:r.statusCode,data:{}});}});});req.on('error',rej);req.on('timeout',()=>{req.destroy();rej(new Error('timeout'));});req.end();});}
function parseBadges(f){const b=[];f=f||0;if(f&1)b.push('👨‍💼 Staff');if(f&2)b.push('🤝 Partner');if(f&8)b.push('🐛 Bug Hunter');if(f&512)b.push('⭐ Early Supporter');if(f&131072)b.push('👾 Early Dev');if(f&4194304)b.push('🛡️ Active Dev');return b;}
let antideleteEnabled=false;
module.exports=[
    {name:'tokcheck',aliases:['tokencheck','checktoken','tc'],description:'التحقق من صحة توكن ديسكورد',category:'حساب',
     async execute(message,args,commandManager){
        const token=args[1];if(!token)return message.reply('❌ **الاستخدام:** `'+commandManager.getMainPrefix()+'tokcheck <token>`\n> التوكن لن يُعرض في النتيجة للحماية');
        const msg=await message.reply('🔍 جاري فحص التوكن...');
        try{const{status,data}=await discordGET(token,'/users/@me');
        if(status===200&&data.id){
            const nitro=data.premium_type===2?'💎 Nitro':data.premium_type===1?'📦 Classic':data.premium_type===3?'🌟 Basic':'❌ لا يوجد';
            const created=new Date(Number((BigInt(data.id)>>22n)+1420070400000n));
            const badges=parseBadges(data.flags);
            await msg.edit('**✅ توكن صحيح وشغال!**\n```\n👤 اسم          : '+data.username+'\n🆔 ID           : '+data.id+'\n📅 تاريخ الإنشاء: '+created.toLocaleDateString('ar-EG')+'\n📱 2FA           : '+(data.mfa_enabled?'✅ مفعّل':'❌ معطّل')+'\n💳 نيترو         : '+nitro+'\n🏆 شارات         : '+(badges.length?badges.join(' | '):'لا يوجد')+'\n```');
        }else if(status===401)await msg.edit('**❌ توكن غير صحيح أو منتهي الصلاحية.**');
        else await msg.edit('**⚠️ نتيجة غير معروفة. Status: '+status+'**');}
        catch(err){await msg.edit('❌ **خطأ:** `'+err.message+'`');}
    }},
    {name:'antidelete',aliases:['antidel','repost'],description:'إعادة نشر الرسائل المحذوفة تلقائياً',category:'مراقبة',
     onMessageDelete(msg){
        if(!antideleteEnabled)return;if(!msg.content||msg.author?.bot)return;if(msg.author?.id===msg.client?.user?.id)return;
        try{const t=new Date().toLocaleTimeString('ar-EG');msg.channel.send('**🔁 رسالة محذوفة — Anti-Delete**\n👤 من: `'+(msg.author?.username||'مجهول')+'`  |  ⏰ '+t+'\n```\n'+msg.content.slice(0,500)+'\n```').catch(()=>{});}catch{}
     },
     execute(message,args,commandManager){
        const sub=args[1]?.toLowerCase();const prefix=commandManager.getMainPrefix();
        if(sub==='on'){antideleteEnabled=true;return message.reply('**✅ Anti-Delete مفعّل!**\n🔁 كل الرسائل المحذوفة ستُعاد نشرها\n> `'+prefix+'antidelete off` للإيقاف');}
        if(sub==='off'){antideleteEnabled=false;return message.reply('❌ **Anti-Delete معطّل.**');}
        if(sub==='status')return message.reply(antideleteEnabled?'✅ Anti-Delete **مفعّل**':'❌ Anti-Delete **معطّل**');
        return message.reply('**🔁 Anti-Delete**\n\n`'+prefix+'antidelete on` — تفعيل\n`'+prefix+'antidelete off` — تعطيل\n`'+prefix+'antidelete status` — الحالة');
    }},
    {name:'roleall',aliases:['msgrole','roleping'],description:'رسالة في الشات لأصحاب رول معين',category:'سيرفر',
     execute(message,args,commandManager){
        const rn=args[1];const text=args.slice(2).join(' ');
        if(!rn||!text)return message.reply('❌ `'+commandManager.getMainPrefix()+'roleall <رول> <رسالة>`');
        if(!message.guild)return message.reply('❌ في السيرفرات فقط.');
        const role=message.guild.roles.cache.find(r=>r.name.toLowerCase()===rn.toLowerCase());if(!role)return message.reply('❌ مش لاقي رول: `'+rn+'`');
        const members=[...role.members.values()].filter(m=>!m.user.bot).slice(0,20);
        const mentions=members.map(m=>'<@'+m.user.id+'>').join(' ');
        message.channel.send(text+'\n'+mentions).then(()=>message.delete().catch(()=>{})).catch(err=>message.reply('❌ فشل: `'+err.message+'`'));
    }},
    {name:'msgfind',aliases:['findmsg','searchmsg','mfind'],description:'البحث عن رسالة في الشات',category:'شبحي',
     async execute(message,args,commandManager){
        const q=args.slice(1).join(' ').toLowerCase();if(!q)return message.reply('❌ `'+commandManager.getMainPrefix()+'msgfind <نص>`');
        const msg=await message.reply('🔍 جاري البحث عن `'+q.slice(0,30)+'`...');
        try{const msgs=await message.channel.messages.fetch({limit:100});const found=[...msgs.values()].filter(m=>m.id!==message.id&&m.content.toLowerCase().includes(q)).slice(0,5);
        if(!found.length)return msg.edit('❌ لم أجد رسائل تحتوي على `'+q.slice(0,30)+'` في آخر 100 رسالة.');
        let t='**🔍 نتائج البحث ('+found.length+')**\n\n';found.forEach((m,i)=>{const tm=new Date(m.createdAt).toLocaleTimeString('ar-EG');t+='**'+(i+1)+'.** `'+m.author.username+'` — '+tm+'\n> '+m.content.slice(0,100)+(m.content.length>100?'...':'')+'\n\n';});
        await msg.edit(t);}catch(err){await msg.edit('❌ فشل: `'+err.message+'`');}
    }},
    {name:'embed2',aliases:['sendembed','richembed'],description:'إرسال Embed مخصص عبر Webhook',category:'أدوات',
     async execute(message,args,commandManager){
        const wu=args[1];const input=args.slice(2).join(' ');const prefix=commandManager.getMainPrefix();
        if(!wu||!input)return message.reply('❌ `'+prefix+'embed2 <webhook_url> <عنوان> | <وصف> | <لون_hex>`');
        if(!wu.includes('discord.com/api/webhooks/'))return message.reply('❌ رابط Webhook غير صحيح.');
        const parts=input.split('|').map(p=>p.trim());const title=parts[0]||'Snodix Embed';const desc=parts[1]||'';const color=parseInt((parts[2]||'5865F2').replace('#',''),16)||5765361;
        const body=JSON.stringify({embeds:[{title,description:desc,color,footer:{text:'✨ Snodix SelfBot v4'},timestamp:new Date().toISOString()}]});
        const msg=await message.reply('📤 جاري الإرسال...');
        try{const u=new URL(wu);await new Promise((res,rej)=>{const req=https.request({hostname:u.hostname,path:u.pathname,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)},timeout:8000},(r)=>{r.on('data',()=>{});r.on('end',()=>{if(r.statusCode===204||r.statusCode===200)res();else rej(new Error('HTTP '+r.statusCode));});});req.on('error',rej);req.on('timeout',()=>{req.destroy();rej(new Error('timeout'));});req.write(body);req.end();});
        await msg.edit('✅ **تم إرسال الـ Embed بنجاح!**');}catch(err){await msg.edit('❌ فشل: `'+err.message+'`');}
    }}
];
