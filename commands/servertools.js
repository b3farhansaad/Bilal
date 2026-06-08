module.exports=[
    {name:'serverlist',aliases:['servers','guilds','sl'],description:'قائمة كل السيرفرات مرتبة',category:'سيرفر',
     execute(message,args,commandManager){
        const guilds=[...message.client.guilds.cache.values()].sort((a,b)=>b.memberCount-a.memberCount);
        if(!guilds.length)return message.reply('❌ مش في أي سيرفر!');
        const page=Math.max(1,parseInt(args[1])||1),pp=8,tp=Math.ceil(guilds.length/pp);
        const slice=guilds.slice((page-1)*pp,page*pp);
        let t='**🏠 السيرفرات ('+guilds.length+') — صفحة '+page+'/'+tp+'**\n```\n';
        slice.forEach((g,i)=>{const r=(page-1)*pp+i+1;t+=String(r).padStart(2)+'. '+g.name.slice(0,22).padEnd(22)+' '+g.memberCount.toLocaleString().padStart(8)+' عضو\n    '+g.id+'\n';});
        t+='```';if(tp>1)t+='\n> `!serverlist '+(Math.min(page+1,tp))+'` للصفحة التالية';
        message.reply(t);
    }},
    {name:'totalstats',aliases:['allstats','globalstats'],description:'إحصائيات شاملة عبر كل السيرفرات',category:'سيرفر',
     execute(message,args,commandManager){
        const guilds=[...message.client.guilds.cache.values()];
        const tM=guilds.reduce((s,g)=>s+g.memberCount,0),tC=guilds.reduce((s,g)=>s+g.channels.cache.size,0);
        const tR=guilds.reduce((s,g)=>s+g.roles.cache.size,0),tE=guilds.reduce((s,g)=>s+g.emojis.cache.size,0);
        const sorted=[...guilds].sort((a,b)=>b.memberCount-a.memberCount);
        message.reply('**📊 إحصائيات شاملة — Snodix**\n```\n🏠 السيرفرات     : '+guilds.length+'\n👥 إجمالي أعضاء : '+tM.toLocaleString()+'\n📢 الشاتات       : '+tC.toLocaleString()+'\n🎭 الرتب         : '+tR.toLocaleString()+'\n😄 الإيموجيات    : '+tE.toLocaleString()+'\n\n🥇 أكبر سيرفر  : '+(sorted[0]?.name||'?')+' ('+sorted[0]?.memberCount.toLocaleString()+')\n🥉 أصغر سيرفر  : '+(sorted[sorted.length-1]?.name||'?')+' ('+sorted[sorted.length-1]?.memberCount.toLocaleString()+')\n```');
    }},
    {name:'leavesrv2',aliases:['leaveguild2','lguild2'],description:'غادر سيرفر بالـ ID',category:'سيرفر',
     async execute(message,args,commandManager){
        const gid=args[1];if(!gid)return message.reply('❌ **الاستخدام:** `'+commandManager.getMainPrefix()+'leaveserver <id>`');
        const g=message.client.guilds.cache.get(gid);if(!g)return message.reply('❌ مش لاقي سيرفر: `'+gid+'`');
        const name=g.name;try{await g.leave();message.reply('✅ **غادرت:** `'+name+'`');}catch(err){message.reply('❌ **فشل:** `'+err.message+'`');}
    }},
    {name:'invitecheck',aliases:['invcheck','icheck'],description:'معلومات لينك دعوة ديسكورد',category:'سيرفر',
     async execute(message,args,commandManager){
        const input=args[1];if(!input)return message.reply('❌ **الاستخدام:** `'+commandManager.getMainPrefix()+'inviteinfo <code>`');
        const code=input.replace(/https?:\/\/discord\.(gg|com\/invite)\//i,'').trim();
        const msg=await message.reply('🔍 جاري جلب معلومات الدعوة `'+code+'`...');
        try{const inv=await message.client.fetchInvite(code);const g=inv.guild;
        await msg.edit('**📨 معلومات الدعوة: `'+code+'`**\n```\n🏠 السيرفر : '+(g?.name||'?')+'\n🆔 ID      : '+(g?.id||'?')+'\n👥 أعضاء   : '+(inv.memberCount?.toLocaleString()||'?')+'\n🟢 أونلاين  : '+(inv.presenceCount?.toLocaleString()||'?')+'\n👤 الداعي  : '+(inv.inviter?.username||'?')+'\n📢 الشات   : #'+(inv.channel?.name||'?')+'\n🔗 الرابط  : https://discord.gg/'+code+'\n```');}
        catch(err){await msg.edit('❌ **فشل:** `'+err.message+'`');}
    }},
    {name:'serverbkp',aliases:['guildbackup2','bkp2'],description:'باك أب بسيط للسيرفر الحالي',category:'سيرفر',
     execute(message,args,commandManager){
        const g=message.guild;if(!g)return message.reply('❌ في السيرفرات فقط.');
        const roles=[...g.roles.cache.values()].filter(r=>r.name!=='@everyone').map(r=>r.name).slice(0,15);
        const created=new Date(g.createdAt).toLocaleDateString('ar-EG');
        message.reply('**💾 باك أب: '+g.name+'**\n```\n🆔 ID     : '+g.id+'\n👥 أعضاء  : '+g.memberCount+'\n📅 إنشاء  : '+created+'\n📢 شاتات  : '+g.channels.cache.size+'\n🎭 رتب    : '+(g.roles.cache.size-1)+'\n😄 إيموجي : '+g.emojis.cache.size+'\n\nأول 15 رتبة:\n'+roles.join(', ')+'\n```');
    }}
];
