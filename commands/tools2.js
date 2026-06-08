const https=require('https'),crypto=require('crypto');
function httpGet(url){return new Promise((res,rej)=>{const u=new URL(url);https.get({hostname:u.hostname,path:u.pathname+u.search,headers:{'User-Agent':'Mozilla/5.0'},timeout:8000},(r)=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d));}catch{res({_raw:d});}});}).on('error',rej).on('timeout',()=>rej(new Error('timeout')));});}
module.exports=[
    {name:'convert',aliases:['currency','exchange','curr'],description:'تحويل بين العملات لايف',category:'أدوات',
     async execute(message,args,commandManager){
        const amt=parseFloat(args[1]);const from=args[2]?.toUpperCase();const to=args[3]?.toUpperCase();
        if(isNaN(amt)||!from||!to)return message.reply('❌ **الاستخدام:** `'+commandManager.getMainPrefix()+'convert <مبلغ> <من> <إلى>`\n**مثال:** `!convert 100 USD EGP`\n**عملات:** USD EGP SAR EUR GBP AED JPY TRY');
        const msg=await message.reply('💱 جاري التحويل...');
        try{const d=await httpGet('https://api.exchangerate-api.com/v4/latest/'+from);if(!d.rates||!d.rates[to])return msg.edit('❌ عملة غير معروفة: `'+to+'`');const r=d.rates[to];await msg.edit('**💱 تحويل العملات**\n```\n'+amt+' '+from+' = '+(amt*r).toFixed(4)+' '+to+'\n1 '+from+' = '+r.toFixed(6)+' '+to+'\n```');}
        catch(err){await msg.edit('❌ **خطأ:** `'+err.message+'`');}
    }},
    {name:'shorten',aliases:['short','tinyurl','shrink'],description:'اختصار رابط عبر TinyURL',category:'أدوات',
     async execute(message,args,commandManager){
        const url=args[1];if(!url||!url.startsWith('http'))return message.reply('❌ `'+commandManager.getMainPrefix()+'shorten <رابط>`');
        const msg=await message.reply('🔗 جاري الاختصار...');
        try{const d=await httpGet('https://tinyurl.com/api-create.php?url='+encodeURIComponent(url));const s=d._raw||String(d);if(s.startsWith('http'))await msg.edit('**🔗 الرابط المختصر:**\n'+s+'\n\n**الأصلي:** '+url.slice(0,50)+(url.length>50?'...':''));else await msg.edit('❌ فشل الاختصار.');}
        catch(err){await msg.edit('❌ **خطأ:** `'+err.message+'`');}
    }},
    {name:'sitecheck',aliases:['webcheck','isup','pingsite'],description:'تحقق إذا موقع شغال',category:'أدوات',
     async execute(message,args,commandManager){
        let url=args[1];if(!url)return message.reply('❌ `'+commandManager.getMainPrefix()+'sitecheck <url>`');if(!url.startsWith('http'))url='https://'+url;
        const msg=await message.reply('🔍 جاري فحص `'+url+'`...');const start=Date.now();
        try{const u=new URL(url);await new Promise((res,rej)=>{const req=https.get({hostname:u.hostname,path:u.pathname||'/',timeout:8000},(r)=>{r.on('data',()=>{});r.on('end',()=>res(r.statusCode));});req.on('error',rej);req.on('timeout',()=>{req.destroy();rej(new Error('timeout'));});});const ping=Date.now()-start;const e=ping<300?'🟢':ping<1000?'🟡':'🟠';await msg.edit(e+' **'+url+'**\n✅ الموقع شغال!\n⏱️ `'+ping+'ms`');}
        catch(err){const p=Date.now()-start;await msg.edit('🔴 **'+url+'**\n❌ غير متاح. `'+p+'ms`');}
    }},
    {name:'uuid',aliases:['guid','genid','randid'],description:'توليد UUID عشوائي',category:'أدوات',
     execute(message,args){const n=Math.min(Math.max(parseInt(args[1])||1,1),5);let t='**🆔 UUID ('+n+')**\n```\n';for(let i=0;i<n;i++)t+=crypto.randomUUID()+'\n';message.reply(t+'```');}},
    {name:'similarity',aliases:['sim','compare','textdiff'],description:'نسبة التشابه بين نصين',category:'أدوات',
     execute(message,args,commandManager){
        const text=args.slice(1).join(' ');const pi=text.indexOf('|');if(pi===-1)return message.reply('❌ `'+commandManager.getMainPrefix()+'similarity نص1 | نص2`');
        const a=text.slice(0,pi).trim().toLowerCase();const b=text.slice(pi+1).trim().toLowerCase();if(!a||!b)return message.reply('❌ اكتب نصين مفصولين بـ `|`');
        const m=a.length,n=b.length;const dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>j===0?i:i===0?j:0));
        for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
        const sim=Math.round((1-dp[m][n]/Math.max(m,n,1))*100);const e=sim>=80?'🟢':sim>=50?'🟡':'🔴';const bar='█'.repeat(Math.round(sim/10))+'░'.repeat(10-Math.round(sim/10));
        message.reply('**📊 نسبة التشابه**\n📝 النص 1: `'+a.slice(0,50)+'`\n📝 النص 2: `'+b.slice(0,50)+'`\n\n'+e+' ['+bar+'] **'+sim+'%**');
    }}
];
