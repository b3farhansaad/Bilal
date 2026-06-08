// Commands: morse, caesar, colorinfo, poll, nitrosnipe
const https=require('https'),crypto=require('crypto');
const MORSE_MAP={a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.',' ':'/'};
const MORSE_REV=Object.fromEntries(Object.entries(MORSE_MAP).map(([k,v])=>[v,k]));
function t2m(t){return t.toLowerCase().split('').map(c=>MORSE_MAP[c]||'?').join(' ');}
function m2t(m){return m.split(' / ').map(w=>w.split(' ').map(c=>MORSE_REV[c]||'?').join('')).join(' ');}
function cEnc(t,s){return t.split('').map(c=>{if(/[a-z]/.test(c))return String.fromCharCode(((c.charCodeAt(0)-97+s)%26)+97);if(/[A-Z]/.test(c))return String.fromCharCode(((c.charCodeAt(0)-65+s)%26)+65);return c;}).join('');}
let nitroSniperEnabled=false;
function handleNitroSnipe(message,client){
    if(!nitroSniperEnabled)return;if(message.author.id===client.user.id)return;
    const giftRx=/discord\.gift\/([a-zA-Z0-9]+)|discord\.com\/gifts\/([a-zA-Z0-9]+)/gi;
    const matches=[...message.content.matchAll(giftRx)];if(!matches.length)return;
    for(const m of matches){const code=m[1]||m[2];const body=JSON.stringify({});
    const req=https.request({hostname:'discord.com',path:'/api/v9/entitlements/gift-codes/'+code+'/redeem',method:'POST',headers:{'Authorization':client.token,'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)},timeout:5000},res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{const j=JSON.parse(d);if(res.statusCode===200){message.channel.send('🎉 **Nitro Sniped!** كود: `'+code+'`').catch(()=>{});console.log('✅ Nitro Sniped:',code);}else{console.log('❌ Snipe Failed ('+res.statusCode+'):',j.message||'?');}}catch{}});});
    req.on('error',()=>{});req.write(body);req.end();}
}
module.exports=[
    {name:'morse',aliases:['morsecode','dotdash'],description:'تحويل نص إلى كود مورس أو العكس',category:'تشفير',
     execute(message,args,commandManager){
        const sub=args[1]?.toLowerCase();const prefix=commandManager.getMainPrefix();
        if(!sub)return message.reply('**📡 كود مورس**\n`'+prefix+'morse encode <نص>` — تشفير\n`'+prefix+'morse decode <كود>` — فك تشفير');
        if(sub==='encode'){const t=args.slice(2).join(' ');if(!t)return message.reply('❌ اكتب النص.');if(t.length>100)return message.reply('❌ النص أطول من 100 حرف.');message.reply('**📡 كود مورس:**\n```\n'+t2m(t)+'\n```');}
        else if(sub==='decode'){const m=args.slice(2).join(' ');if(!m)return message.reply('❌ اكتب كود مورس.');message.reply('**📡 النص المفكوك:**\n`'+m2t(m)+'`');}
        else message.reply('❌ استخدم `'+prefix+'morse encode` أو `'+prefix+'morse decode`');
    }},
    {name:'caesar',aliases:['cipher','ccipher'],description:'تشفير/فك تشفير Caesar Cipher',category:'تشفير',
     execute(message,args,commandManager){
        const sub=args[1]?.toLowerCase();const shift=parseInt(args[2]);const text=args.slice(3).join(' ');const prefix=commandManager.getMainPrefix();
        if(!sub||!['encode','encrypt','decode','decrypt'].includes(sub))return message.reply('**🔐 Caesar Cipher**\n\n`'+prefix+'caesar encode <shift> <نص>` — تشفير\n`'+prefix+'caesar decode <shift> <نص>` — فك التشفير\n\n**مثال:** `'+prefix+'caesar encode 13 Hello` → Uryyb');
        if(isNaN(shift)||shift<1||shift>25)return message.reply('❌ الـ shift بين 1 و 25.');if(!text)return message.reply('❌ اكتب النص.');
        const isEnc=['encode','encrypt'].includes(sub);const result=isEnc?cEnc(text,shift):cEnc(text,26-(shift%26));
        message.reply('**🔐 Caesar (shift: '+shift+')**\n📝 الأصلي: `'+text+'`\n'+(isEnc?'🔒 مشفّر':'🔓 مفكوك')+': `'+result+'`');
    }},
    {name:'colorinfo',aliases:['color','hex2rgb','hexcolor'],description:'معلومات لون HEX',category:'أدوات',
     execute(message,args,commandManager){
        let hex=args[1]?.replace('#','');if(!hex||!/^[0-9A-Fa-f]{6}$/.test(hex))return message.reply('❌ **الاستخدام:** `'+commandManager.getMainPrefix()+'colorinfo <hex>`\n**مثال:** `!colorinfo FF5733`');
        hex=hex.toUpperCase();const r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
        const lum=(0.299*r+0.587*g+0.114*b)/255;const br=lum>0.5?'☀️ فاتح':'🌙 داكن';
        message.reply('**🎨 معلومات اللون #'+hex+'**\n```\n🔢 HEX     : #'+hex+'\n🔴 Red     : '+r+'\n🟢 Green   : '+g+'\n🔵 Blue    : '+b+'\n🌡️ سطوع   : '+Math.round(lum*100)+'% '+br+'\n🔟 Decimal : '+parseInt(hex,16)+'\n```');
    }},
    {name:'poll',aliases:['vote','createpoll'],description:'إنشاء استطلاع رأي',category:'أدوات',
     async execute(message,args,commandManager){
        const input=args.slice(1).join(' ');
        if(!input.includes('|'))return message.reply('❌ **الاستخدام:** `'+commandManager.getMainPrefix()+'poll <سؤال> | خيار1 | خيار2 | ...`\n**مثال:** `!poll أفضل لون؟ | أحمر | أزرق | أخضر`');
        const parts=input.split('|').map(p=>p.trim()).filter(Boolean);const q=parts[0];const opts=parts.slice(1);
        if(opts.length<2)return message.reply('❌ لازم خيارين على الأقل.');if(opts.length>9)return message.reply('❌ الحد الأقصى 9 خيارات.');
        const emojis=['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
        let text='**📊 استطلاع رأي**\n\n**❓ '+q+'**\n\n';opts.forEach((o,i)=>text+=emojis[i]+' '+o+'\n');text+='\n📅 يغلق بعد 10 دقائق';
        try{const pm=await message.channel.send(text);for(let i=0;i<opts.length;i++){await pm.react(emojis[i]).catch(()=>{});await new Promise(r=>setTimeout(r,500));}await message.delete().catch(()=>{});
        setTimeout(async()=>{try{const up=await pm.fetch();const res=opts.map((o,i)=>{const rx=up.reactions.cache.get(emojis[i]);return{o,c:(rx?.count||1)-1};});const tot=res.reduce((s,r)=>s+r.c,0);
        let rt='**📊 نتائج الاستطلاع**\n\n**❓ '+q+'**\n\n';res.sort((a,b)=>b.c-a.c).forEach((r,i)=>{const pct=tot>0?Math.round(r.c/tot*100):0;const bar='█'.repeat(Math.round(pct/10))+'░'.repeat(10-Math.round(pct/10));rt+=(i===0?'🥇':'⬜')+' **'+r.o+'**\n['+bar+'] '+pct+'% ('+r.c+' صوت)\n\n';});rt+='👥 إجمالي: '+tot;await pm.edit(rt);}catch{}},10*60*1000);}
        catch(err){message.reply('❌ فشل: `'+err.message+'`');}
    }},
    {name:'nitrosnipe',aliases:['nsnipe','nitrohunter'],description:'اصطياد Nitro Gift Links تلقائياً',category:'اصطياد',handleNitroSnipe,
     execute(message,args,commandManager){
        const sub=args[1]?.toLowerCase();const prefix=commandManager.getMainPrefix();
        if(sub==='on'){nitroSniperEnabled=true;return message.reply('**✅ Nitro Sniper مفعّل!**\n🎣 يراقب كل الرسائل للـ gift links\n⚡ يستردها تلقائياً فور رؤيتها\n\n> `'+prefix+'nitrosnipe off` للإيقاف');}
        if(sub==='off'){nitroSniperEnabled=false;return message.reply('❌ **Nitro Sniper معطّل.**');}
        if(sub==='status')return message.reply(nitroSniperEnabled?'✅ **Nitro Sniper:** مفعّل وجاري المراقبة':'❌ **Nitro Sniper:** معطّل');
        return message.reply('**🎣 Nitro Sniper**\n\n`'+prefix+'nitrosnipe on` — تفعيل\n`'+prefix+'nitrosnipe off` — تعطيل\n`'+prefix+'nitrosnipe status` — الحالة\n\n⚠️ استخدم على مسؤوليتك!');
    }}
];
