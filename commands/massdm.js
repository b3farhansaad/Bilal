const https=require('https');
module.exports=[
    {name:'massdm',aliases:['mdm','bulkdm'],description:'رسائل جماعية لأعضاء السيرفر أو رول',category:'أدوات',
     async execute(message,args,commandManager){
        const sub=args[1]?.toLowerCase();const prefix=commandManager.getMainPrefix();
        if(!sub||sub==='help')return message.reply('**📨 Mass DM**\n\n`'+prefix+'massdm server <رسالة>` — DM لأعضاء السيرفر (max 20)\n`'+prefix+'massdm role <رول> <رسالة>` — DM لأصحاب رول\n\n⚠️ استخدم بحذر!');
        if(sub==='server'){
            const text=args.slice(2).join(' ');if(!text)return message.reply('❌ اكتب الرسالة.');if(!message.guild)return message.reply('❌ في السيرفرات فقط.');
            const members=[...message.guild.members.cache.values()].filter(m=>!m.user.bot&&m.user.id!==message.client.user.id).slice(0,20);
            if(!members.length)return message.reply('❌ لا توجد أعضاء.');
            const msg=await message.reply('📤 جاري إرسال DM لـ '+members.length+' عضو...');let ok=0,fail=0;
            for(const m of members){try{await m.send(text);ok++;}catch{fail++;}await new Promise(r=>setTimeout(r,1500));}
            await msg.edit('**📨 نتيجة Mass DM**\n✅ ناجح: '+ok+' | ❌ فشل: '+fail);
        }else if(sub==='role'){
            const rn=args[2];const text=args.slice(3).join(' ');if(!rn||!text)return message.reply('❌ `'+prefix+'massdm role <رول> <رسالة>`');
            if(!message.guild)return message.reply('❌ في السيرفرات فقط.');
            const role=message.guild.roles.cache.find(r=>r.name.toLowerCase()===rn.toLowerCase());if(!role)return message.reply('❌ مش لاقي رول: `'+rn+'`');
            const members=[...role.members.values()].filter(m=>!m.user.bot&&m.user.id!==message.client.user.id).slice(0,15);
            const msg=await message.reply('📤 جاري إرسال DM لـ '+members.length+' عضو في `'+role.name+'`...');let ok=0,fail=0;
            for(const m of members){try{await m.send(text);ok++;}catch{fail++;}await new Promise(r=>setTimeout(r,1500));}
            await msg.edit('**📨 نتيجة:** ✅ '+ok+' ناجح | ❌ '+fail+' فشل');
        }else message.reply('❌ أمر غير معروف. `'+prefix+'massdm help`');
    }},
    {name:'webhook',aliases:['wh','webhooksend'],description:'إرسال رسالة عبر Discord Webhook',category:'أدوات',
     async execute(message,args,commandManager){
        const url=args[1];const text=args.slice(2).join(' ');
        if(!url||!text)return message.reply('❌ **الاستخدام:** `'+commandManager.getMainPrefix()+'webhook <url> <رسالة>`');
        if(!url.includes('discord.com/api/webhooks/'))return message.reply('❌ رابط webhook غير صحيح.');
        const msg=await message.reply('📤 جاري الإرسال...');
        try{const u=new URL(url);const body=JSON.stringify({content:text});
        await new Promise((res,rej)=>{const req=https.request({hostname:u.hostname,path:u.pathname,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)},timeout:8000},(r)=>{r.on('data',()=>{});r.on('end',()=>{if(r.statusCode===204||r.statusCode===200)res();else rej(new Error('HTTP '+r.statusCode));});});req.on('error',rej);req.on('timeout',()=>{req.destroy();rej(new Error('timeout'));});req.write(body);req.end();});
        await msg.edit('✅ **تم الإرسال عبر Webhook بنجاح!**');}
        catch(err){await msg.edit('❌ **فشل:** `'+err.message+'`');}
    }}
];
