const https=require('https');
function discordAPI(token,method,p,body){return new Promise((res,rej)=>{const d=body?JSON.stringify(body):null;const req=https.request({hostname:'discord.com',path:'/api/v9'+p,method,headers:{'Authorization':token,'Content-Type':'application/json','User-Agent':'Mozilla/5.0',...(d?{'Content-Length':Buffer.byteLength(d)}:{})},timeout:8000},(r)=>{let data='';r.on('data',c=>data+=c);r.on('end',()=>{try{res({status:r.statusCode,data:JSON.parse(data)});}catch{res({status:r.statusCode,data:{}});}});});req.on('error',rej);req.on('timeout',()=>{req.destroy();rej(new Error('timeout'));});if(d)req.write(d);req.end();});}
function parseBadges(f){const b=[];f=f||0;if(f&1)b.push('👨‍💼 Staff');if(f&2)b.push('🤝 Partner');if(f&4)b.push('🏅 HypeSquad');if(f&8)b.push('🐛 Bug Hunter L1');if(f&64)b.push('🏠 Bravery');if(f&128)b.push('🏠 Brilliance');if(f&256)b.push('🏠 Balance');if(f&512)b.push('⭐ Early Supporter');if(f&16384)b.push('🐛 Bug Hunter L2');if(f&131072)b.push('👾 Early Dev');if(f&4194304)b.push('🛡️ Active Dev');return b;}
module.exports=[
    {name:'tokeninfo',aliases:['tinfo','myaccount','account'],description:'معلومات كاملة عن حسابك',category:'حساب',
     async execute(message,args,commandManager){
        const msg=await message.reply('🔍 جاري جلب بيانات حسابك...');
        try{const token=message.client.token;const{data:user,status}=await discordAPI(token,'GET','/users/@me');
        if(!user.id)return msg.edit('❌ فشل جلب البيانات. Status: '+status);
        const badges=parseBadges(user.flags);
        const nitro=user.premium_type===3?'🌟 Nitro Basic':user.premium_type===2?'💎 Nitro':user.premium_type===1?'📦 Classic':'❌ لا يوجد';
        const created=new Date(Number((BigInt(user.id)>>22n)+1420070400000n));
        const tp=message.client.token.split('.');
        const safeToken=tp.map((p,i)=>i===0?p:'●'.repeat(Math.min(p.length,8))).join('.');
        await msg.edit('**💎 معلومات حسابك — Snodix**\n```\n👤 اليوزر   : '+user.username+'\n🔢 الـ ID    : '+user.id+'\n📅 الإنشاء  : '+created.toLocaleDateString('ar-EG')+'\n📧 الإيميل  : '+(user.email||'غير متاح')+'\n📱 2FA       : '+(user.mfa_enabled?'✅ مفعّل':'❌ معطّل')+'\n💳 نيترو    : '+nitro+'\n🏆 شارات    : '+(badges.length?badges.join(' | '):'لا يوجد')+'\n🔑 التوكن   : '+safeToken+'\n```');}
        catch(err){await msg.edit('❌ **خطأ:** `'+err.message+'`');}
    }},
    {name:'friends',aliases:['fl','friendlist','myf'],description:'قائمة الأصدقاء والطلبات',category:'حساب',
     async execute(message,args,commandManager){
        const msg=await message.reply('👥 جاري جلب قائمة الأصدقاء...');
        try{const{data:rels,status}=await discordAPI(message.client.token,'GET','/users/@me/relationships');
        if(!Array.isArray(rels))return msg.edit('❌ فشل. Status: '+status);
        const fr=rels.filter(r=>r.type===1),inc=rels.filter(r=>r.type===3),out=rels.filter(r=>r.type===4),bl=rels.filter(r=>r.type===2);
        let t='**👥 العلاقات**\n```\n✅ أصدقاء      : '+fr.length+'\n📨 طلبات واردة : '+inc.length+'\n📤 طلبات صادرة : '+out.length+'\n🚫 محجوبين     : '+bl.length+'\n```\n';
        if(fr.length){t+='**✅ الأصدقاء:**\n';fr.slice(0,12).forEach(r=>t+='  • `'+(r.user?.username||r.user?.id)+'`\n');if(fr.length>12)t+='  ... و '+(fr.length-12)+' أكتر\n';}
        if(inc.length){t+='\n**📨 طلبات واردة:**\n';inc.forEach(r=>t+='  • `'+(r.user?.username||r.user?.id)+'`\n');}
        await msg.edit(t);}catch(err){await msg.edit('❌ **خطأ:** `'+err.message+'`');}
    }},
    {name:'addfriend',aliases:['af','adduser'],description:'إرسال طلب صداقة',category:'حساب',
     async execute(message,args,commandManager){
        const u=args[1];if(!u)return message.reply('❌ **الاستخدام:** `'+commandManager.getMainPrefix()+'addfriend <username>`');
        const msg=await message.reply('📤 إرسال طلب صداقة لـ `'+u+'`...');
        try{const{status,data}=await discordAPI(message.client.token,'POST','/users/@me/relationships',{username:u});
        if(status===204||status===200)await msg.edit('✅ **تم إرسال طلب الصداقة لـ `'+u+'`!**');
        else await msg.edit('❌ **فشل:** `'+(data?.message||'Status: '+status)+'`');}
        catch(err){await msg.edit('❌ **خطأ:** `'+err.message+'`');}
    }},
    {name:'setbio',aliases:['bio','mybio'],description:'تغيير البايو',category:'حساب',
     async execute(message,args,commandManager){
        const bio=args.slice(1).join(' ');if(!bio)return message.reply('❌ `'+commandManager.getMainPrefix()+'setbio <نص البايو>`');
        if(bio.length>190)return message.reply('❌ البايو أقل من 190 حرف.');
        const msg=await message.reply('✏️ جاري تغيير البايو...');
        try{const{status,data}=await discordAPI(message.client.token,'PATCH','/users/@me',{bio});
        if(status===200)await msg.edit('✅ **تم تغيير البايو!**\n`'+bio+'`');
        else await msg.edit('❌ **فشل:** `'+(data?.message||'Status: '+status)+'`');}
        catch(err){await msg.edit('❌ **خطأ:** `'+err.message+'`');}
    }},
    {name:'setusername',aliases:['cuser','changeuser'],description:'تغيير اليوزرنيم',category:'حساب',
     async execute(message,args,commandManager){
        const nu=args[1]?.toLowerCase();if(!nu)return message.reply('❌ `'+commandManager.getMainPrefix()+'setusername <الاسم>`');
        const msg=await message.reply('⚠️ **تغيير اليوزرنيم لـ `'+nu+'`**\nرد بـ `نعم` خلال 15 ثانية...');
        try{const filter=m=>m.author.id===message.author.id&&['نعم','yes','y'].includes(m.content.toLowerCase());
        const c=await message.channel.awaitMessages({filter,max:1,time:15000});
        if(!c.size)return msg.edit('❌ **تم الإلغاء.**');
        const{status,data}=await discordAPI(message.client.token,'PATCH','/users/@me',{username:nu});
        if(status===200)await msg.edit('✅ **تم التغيير لـ `'+data.username+'`!**');
        else await msg.edit('❌ **فشل:** `'+(data?.message||'Status: '+status)+'`');}
        catch(err){await msg.edit('❌ **خطأ:** `'+err.message+'`');}
    }},
    {name:'presence',aliases:['pres','activity','nowplaying'],description:'تفاصيل حضور مستخدم',category:'حساب',
     execute(message,args,commandManager){
        const t=message.mentions?.users?.first();
        const m=t?message.guild?.members.cache.get(t.id):message.guild?.members.cache.get(message.client.user.id);
        if(!m)return message.reply('❌ تاغ يوزر أو استخدم في سيرفر.');
        const s=m.presence?.status||'offline';const se={online:'🟢',idle:'🌙',dnd:'🔴',offline:'⚫'}[s]||'⚫';
        let text=se+' **'+m.user.username+'**\n```\nالحالة: '+s+'\n';
        const acts=m.presence?.activities||[];if(acts.length){text+='\nالنشاطات:\n';acts.forEach(a=>{const tm={PLAYING:'🎮 يلعب',STREAMING:'📡 يبث',LISTENING:'🎵 يسمع',WATCHING:'👁️ يشاهد',CUSTOM:'✨ مخصص',COMPETING:'🏆 ينافس'};text+='  '+(tm[a.type]||a.type)+': '+a.name+'\n';if(a.details)text+='  '+a.details+'\n';});}
        message.reply(text+'```');
    }}
];
