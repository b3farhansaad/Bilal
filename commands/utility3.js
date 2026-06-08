
const https = require('https');
const os = require('os');
const sleep = ms => new Promise(r => setTimeout(r, ms));
function httpGet(url) {
  return new Promise((res,rej)=>{
    const u=new URL(url);
    const req=https.request({hostname:u.hostname,path:u.pathname+u.search,method:'GET',headers:{'User-Agent':'Mozilla/5.0'},timeout:8000},
      r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d));});
    req.on('error',rej);req.on('timeout',()=>{req.destroy();rej(new Error('timeout'));});req.end();
  });
}
module.exports = [
  {
    name:'ping3', aliases:['latency3','ms3','بينج3'],
    description:'فحص لايتنسي البوت المفصّل', category:'مساعدة',
    async execute(message) {
      const start=Date.now();
      const msg=await message.reply('🏓 جاري القياس...');
      const msgPing=Date.now()-start;
      const wsPing=Math.round(message.client.ws.ping);
      const q=['⚡ سريع جداً','✅ جيد','⚠️ بطيء نسبياً','🐌 بطيء'];
      const qp=msgPing<50?q[0]:msgPing<150?q[1]:msgPing<400?q[2]:q[3];
      await msg.edit([
        '**🏓 نتائج البينج**',
        '```',
        '📨 Message Ping : '+msgPing+'ms  '+qp,
        '🌐 WebSocket    : '+wsPing+'ms',
        '⏱️ Uptime       : '+Math.floor(process.uptime()/3600)+'h '+Math.floor((process.uptime()%3600)/60)+'m',
        '```',
      ].join('\n'));
    }
  },
  {
    name:'sysinfo3', aliases:['system2','specs2','نظام2'],
    description:'معلومات النظام الكاملة', category:'مساعدة',
    execute(message) {
      const mem=process.memoryUsage();
      const total=os.totalmem(), free=os.freemem();
      const up=process.uptime();
      const h=Math.floor(up/3600), m=Math.floor((up%3600)/60), s=Math.floor(up%60);
      message.reply([
        '**💻 معلومات النظام**',
        '```',
        '🖥️ النظام   : '+os.platform()+' '+os.arch(),
        '🔢 Node.js  : '+process.version,
        '⏱️ Uptime   : '+h+'h '+m+'m '+s+'s',
        '🧠 RAM (Bot): '+(mem.heapUsed/1048576).toFixed(1)+'MB / '+(mem.heapTotal/1048576).toFixed(1)+'MB',
        '💾 RAM (OS) : '+(( total-free)/1073741824).toFixed(2)+'GB / '+(total/1073741824).toFixed(2)+'GB',
        '⚙️ CPU      : '+os.cpus()[0]?.model?.slice(0,30)||'?',
        '📡 سيرفرات : '+message.client.guilds.cache.size,
        '```',
      ].join('\n'));
    }
  },
  {
    name:'mathsolve', aliases:['calc3','math2','حساب2'],
    description:'حل عمليات رياضية متقدمة', category:'مساعدة',
    execute(message, args, cm) {
      const expr=args.slice(1).join(' ');
      if(!expr) return message.reply('❌ `'+cm.getMainPrefix()+'mathsolve <معادلة>`\nمثال: `!mathsolve (100*3.14)/2`');
      try {
        const safe=expr.replace(/[^0-9+\-*/%.()^, ]/g,'').replace(/\^/g,'**').replace(/\*\*/g,'**');
        // eslint-disable-next-line no-new-func
        const result=Function('"use strict"; return ('+safe+')')();
        if(typeof result!=='number'||!isFinite(result)) return message.reply('❌ نتيجة غير صالحة.');
        message.reply('**🧮 '+expr+' =** `'+result+'`');
      } catch(e) { message.reply('❌ معادلة غير صحيحة: `'+e.message+'`'); }
    }
  },
  {
    name:'countdown2', aliases:['timer6','count3','عد_تنازلي'],
    description:'عدّاد تنازلي مع تحديثات في نفس الرسالة', category:'مساعدة',
    async execute(message, args, cm) {
      const seconds=Math.min(Math.max(parseInt(args[1])||10, 1), 60);
      const label=args.slice(2).join(' ')||'الوقت';
      const msg=await message.reply('⏳ **'+label+':** **'+seconds+'**ث');
      for(let i=seconds-1;i>=0;i--){
        await sleep(1000);
        const bar='█'.repeat(Math.floor((i/seconds)*10))+'░'.repeat(10-Math.floor((i/seconds)*10));
        if(i>0) await msg.edit('⏳ **'+label+':** **'+i+'**ث `'+bar+'`').catch(()=>{});
        else await msg.edit('🔔 **انتهى الوقت!** ('+label+')').catch(()=>{});
      }
    }
  },
  {
    name:'remind2', aliases:['reminder2','remindme2','ذكّرني'],
    description:'تذكير مخصص بعد وقت محدد', category:'مساعدة',
    async execute(message, args, cm) {
      const timeStr=args[1];
      const text=args.slice(2).join(' ');
      if(!timeStr||!text) return message.reply('❌ `'+cm.getMainPrefix()+'remind2 <30s|5m|2h> <التذكير>`');
      const units={s:1,m:60,h:3600,d:86400};
      const match=timeStr.match(/^(\d+)([smhd])$/);
      if(!match) return message.reply('❌ الصيغة: `30s` / `5m` / `2h` / `1d`');
      const ms=parseInt(match[1])*units[match[2]]*1000;
      if(ms>86400000) return message.reply('❌ الحد الأقصى: 24 ساعة');
      await message.reply('⏰ **تذكير مضبوط!** بعد `'+timeStr+'`: '+text);
      setTimeout(async()=>{
        try{ await message.reply('🔔 **تذكير!** '+text); }catch{}
      }, ms);
    }
  },
  {
    name:'poll2', aliases:['vote2','استطلاع2'],
    description:'إنشاء استطلاع رأي مع خيارات', category:'مساعدة',
    async execute(message, args, cm) {
      const input=args.slice(1).join(' ');
      if(!input) return message.reply('❌ `'+cm.getMainPrefix()+'poll2 السؤال | خيار1 | خيار2 | خيار3`');
      const parts=input.split('|').map(s=>s.trim()).filter(Boolean);
      if(parts.length<3) return message.reply('❌ ادخل سؤال وخيارين على الأقل (مفصول بـ |)');
      const question=parts[0], options=parts.slice(1);
      const emojis=['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
      const optLines=options.map((o,i)=>emojis[i]+' '+o).join('\n');
      const msg=await message.reply([
        '**📊 استطلاع رأي:**',
        '> **'+question+'**',
        '',
        optLines,
        '',
        '🗳️ تفاعل للتصويت!',
      ].join('\n'));
      for(let i=0;i<Math.min(options.length,10);i++){
        await msg.react(emojis[i]).catch(()=>{});
        await sleep(300);
      }
    }
  },
  {
    name:'stealemoji', aliases:['steal2','addemoji2','سرق_ايموجي'],
    description:'سرقة ايموجي من أي رسالة أو رابط', category:'مساعدة',
    async execute(message, args, cm) {
      if(!message.guild) return message.reply('❌ هذا الأمر في السيرفرات فقط.');
      const input=args[1];
      if(!input) return message.reply('❌ `'+cm.getMainPrefix()+'stealemoji <:emoji:> أو <رابط>`');
      const customMatch=input.match(/<a?:(\w+):(\d+)>/);
      if(!customMatch) return message.reply('❌ ادخل إيموجي مخصص مثل `:snodix:`');
      const [,name,id]=customMatch;
      const animated=input.startsWith('<a:');
      const url='https://cdn.discordapp.com/emojis/'+id+(animated?'.gif':'.png');
      const msg=await message.reply('🎨 جاري إضافة الإيموجي...');
      try {
        const emoji=await message.guild.emojis.create(url,name);
        await msg.edit('✅ **تم إضافة الإيموجي:**  <'+(animated?'a':'')+':'+emoji.name+':'+emoji.id+'>');
      } catch(e) { await msg.edit('❌ فشل: `'+e.message+'`'); }
    }
  },
  {
    name:'serverbackup3', aliases:['backup3','sv_backup3','نسخ_احتياطي3'],
    description:'حفظ معلومات السيرفر نسخة احتياطية', category:'مساعدة',
    execute(message) {
      if(!message.guild) return message.reply('❌ هذا الأمر في السيرفرات فقط.');
      const g=message.guild;
      const channels=[...g.channels.cache.values()].map(c=>({id:c.id,name:c.name,type:c.type}));
      const roles=[...g.roles.cache.values()].map(r=>({id:r.id,name:r.name,color:r.hexColor,position:r.position}));
      const backup={
        id:g.id, name:g.name, icon:g.iconURL(), memberCount:g.memberCount,
        channels:channels.slice(0,50), roles:roles.slice(0,50),
        backedUpAt:new Date().toISOString(),
      };
      const json=JSON.stringify(backup,null,2);
      message.reply([
        '**💾 نسخة احتياطية للسيرفر: '+g.name+'**',
        '```json',
        json.slice(0,1500),
        json.length>1500?'...':'' ,
        '```',
        '📊 **'+channels.length+' قناة** | **'+roles.length+' رتبة** | **'+g.memberCount+' عضو**',
      ].join('\n'));
    }
  },
  {
    name:'charmap', aliases:['unicode2','symbols2','رموز'],
    description:'عرض رموز Unicode جميلة', category:'مساعدة',
    execute(message, args, cm) {
      const cats={
        arrows:'← → ↑ ↓ ↔ ↕ ⇐ ⇒ ⇑ ⇓ ➡ ⬅ ⬆ ⬇ ➤ ➜ ➨',
        math:'∑ ∏ ∞ √ ∂ ∫ ± × ÷ ≈ ≠ ≤ ≥ ⊕ ⊗',
        shapes:'■ □ ▪ ▫ ▲ △ ▼ ▽ ◆ ◇ ● ○ ★ ☆ ♦ ♣ ♥ ♠',
        symbols:'™ ® © § ¶ † ‡ • · … ‼ ⁉ ❓ ❗ ✔ ✘ ✓ ✗',
        lines:'─ ━ │ ┃ ┄ ┅ ┈ ┉ ╌ ╍ ═ ║ ╔ ╗ ╚ ╝ ╠ ╣ ╦ ╩ ╬',
      };
      const sub=args[1]?.toLowerCase();
      const cat=cats[sub];
      if(cat) return message.reply('**'+sub+':**\n```\n'+cat+'\n```');
      const menu=Object.keys(cats).map(k=>'• `'+k+'` — '+cats[k].slice(0,20)+'...').join('\n');
      message.reply('**🔣 رموز Unicode:**\n'+menu+'\n\n💡 استخدم `'+cm.getMainPrefix()+'charmap <اسم>`');
    }
  },
  {
    name:'colorinfo3', aliases:['color4','hex3','لون3'],
    description:'معلومات عن لون HEX', category:'مساعدة',
    execute(message, args, cm) {
      const hex=(args[1]||'').replace('#','');
      if(!/^[0-9A-Fa-f]{6}$/.test(hex)) return message.reply('❌ `'+cm.getMainPrefix()+'colorinfo <HEX>`\nمثال: `'+cm.getMainPrefix()+'colorinfo FF5733`');
      const r=parseInt(hex.slice(0,2),16), g2=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
      const hsl=(()=>{const r1=r/255,g1=g2/255,b1=b/255,max=Math.max(r1,g1,b1),min=Math.min(r1,g1,b1);let h,s,l=(max+min)/2;if(max===min){h=s=0;}else{const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);h=(max===r1?(g1-b1)/d+(g1<b1?6:0):max===g1?(b1-r1)/d+2:(r1-g1)/d+4)/6;}return Math.round(h*360)+', '+Math.round(s*100)+'%, '+Math.round(l*100)+'%';})();
      const preview='██████';
      message.reply([
        '**🎨 اللون: #'+hex.toUpperCase()+'**',
        '```',
        '🔴 Red    : '+r+' ('+((r/255)*100).toFixed(1)+'%)',
        '🟢 Green  : '+g2+' ('+((g2/255)*100).toFixed(1)+'%)',
        '🔵 Blue   : '+b+' ('+((b/255)*100).toFixed(1)+'%)',
        '🎨 HSL    : '+hsl,
        '🔢 Decimal: '+parseInt(hex,16),
        '```',
        '🖼️ https://singlecolorimage.com/get/'+hex+'/150x50',
      ].join('\n'));
    }
  },
];
