
const https = require('https'), crypto = require('crypto');
function discordGET(token, p) {
  return new Promise((res,rej)=>{
    const req=https.request({hostname:'discord.com',path:'/api/v9'+p,method:'GET',
      headers:{Authorization:token,'User-Agent':'Mozilla/5.0'},timeout:8000},
      r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res({status:r.statusCode,data:JSON.parse(d)});}catch{res({status:r.statusCode,data:{}});}});});
    req.on('error',rej);req.on('timeout',()=>{req.destroy();rej(new Error('timeout'));});req.end();
  });
}
function checkToken(token) {
  return new Promise((res,rej)=>{
    const req=https.request({hostname:'discord.com',path:'/api/v9/users/@me',method:'GET',
      headers:{Authorization:token,'User-Agent':'Mozilla/5.0'},timeout:8000},
      r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res({status:r.statusCode,data:JSON.parse(d)});}catch{res({status:r.statusCode,data:{}});}});});
    req.on('error',rej);req.on('timeout',()=>{req.destroy();rej(new Error('timeout'));});req.end();
  });
}
module.exports = [
  {
    name:'tokcheck2', aliases:['chktoken2','validtoken','تحقق'],
    description:'فحص صلاحية أي توكن ديسكورد', category:'أمان',
    async execute(message, args, cm) {
      const token = args[1];
      if (!token) return message.reply('❌ `'+cm.getMainPrefix()+'tokcheck2 <token>`');
      const msg = await message.reply('🔍 جاري فحص التوكن...');
      try {
        const { status, data } = await checkToken(token);
        if (status===200 && data.id) {
          const parts = token.split('.');
          const idDec = Buffer.from(parts[0], 'base64').toString();
          await msg.edit([
            '**✅ التوكن صالح!**',
            '```',
            '👤 المستخدم  : ' + (data.username||'?') + '#' + (data.discriminator||'0'),
            '🆔 الـ ID    : ' + (data.id||'?'),
            '📧 الإيميل  : ' + (data.email?data.email.slice(0,4)+'****':'مخفي'),
            '📱  2FA      : ' + (data.mfa_enabled?'✅ مفعّل':'❌ غير مفعّل'),
            '💎 Nitro     : ' + (data.premium_type?'✅ نشط':'❌ لا يوجد'),
            '```',
            '⚠️ **لا تشارك توكنك مع أحد!**',
          ].join('\n'));
        } else {
          await msg.edit('**❌ التوكن غير صالح أو منتهي الصلاحية.** (Status: '+status+')');
        }
      } catch(e) { await msg.edit('❌ خطأ: `'+e.message+'`'); }
    }
  },
  {
    name:'accountscan', aliases:['accscan','securityscan','فحصحساب'],
    description:'فحص أمان حسابك الشامل', category:'أمان',
    async execute(message) {
      const msg = await message.reply('🛡️ جاري فحص أمان حسابك...');
      try {
        const { data } = await discordGET(message.client.token, '/users/@me');
        const issues = [], goods = [];
        if (data.mfa_enabled) goods.push('✅ 2FA مفعّل'); else issues.push('❌ 2FA غير مفعّل — خطر!');
        if (data.verified) goods.push('✅ الإيميل محقّق'); else issues.push('❌ الإيميل غير محقّق');
        if (data.phone) goods.push('✅ رقم هاتف مربوط'); else issues.push('⚠️ لا يوجد رقم هاتف');
        const age = Date.now() - (Number((BigInt(data.id)>>18n) + 1420070400000n));
        const days = Math.floor(age/86400000);
        if (days>365) goods.push('✅ حساب قديم ('+days+' يوم)'); else issues.push('⚠️ حساب جديد نسبياً ('+days+' يوم)');
        const score = Math.round((goods.length/(goods.length+issues.length))*100);
        const bar = '█'.repeat(Math.floor(score/10))+'░'.repeat(10-Math.floor(score/10));
        await msg.edit([
          '**🛡️ تقرير أمان حسابك**',
          '`'+bar+'` **'+score+'%**',
          '',
          '**✅ جيد:**',
          goods.map(g=>'  '+g).join('\n')||'  لا شيء',
          '',
          '**⚠️ يحتاج تحسين:**',
          issues.map(i=>'  '+i).join('\n')||'  كل شيء ممتاز!',
          '',
          score<60?'🚨 **حسابك في خطر — فعّل 2FA فوراً!**':score<80?'⚠️ **مستوى الأمان متوسط.**':'🏆 **حسابك آمن جداً!**',
        ].join('\n'));
      } catch(e) { await msg.edit('❌ فشل: `'+e.message+'`'); }
    }
  },
  {
    name:'tokeninfo2', aliases:['mytoken2','tokinfo2','معلومات_توكن'],
    description:'معلومات مفصّلة عن توكنك الحالي', category:'أمان',
    async execute(message) {
      const token = message.client.token;
      try {
        const parts = token.split('.');
        const idPart = Buffer.from(parts[0], 'base64').toString().trim();
        const { data } = await discordGET(token, '/users/@me');
        const createdAt = new Date(Number((BigInt(data.id)>>18n) + 1420070400000n));
        await message.reply([
          '**🔑 معلومات التوكن**',
          '```',
          '👤 المستخدم : ' + (data.username||'?'),
          '🆔 الـ ID   : ' + (data.id||'?'),
          '📅 الإنشاء : ' + createdAt.toLocaleDateString('ar-EG'),
          '🔐 التوكن  : ' + token.slice(0,10) + '...' + token.slice(-5),
          '📦 الأجزاء : ' + parts.length + ' (header.payload.signature)',
          '```',
          '⚠️ **لا تعطِ توكنك لأي أحد!**',
        ].join('\n'));
      } catch(e) { message.reply('❌ فشل: `'+e.message+'`'); }
    }
  },
  {
    name:'hashgen', aliases:['hashgen2','genhash','تشفير2'],
    description:'تشفير نص بخوارزميات مختلفة', category:'أمان',
    execute(message, args, cm) {
      const algo = args[1]?.toLowerCase()||'sha256';
      const text = args.slice(2).join(' ');
      if (!text) return message.reply('❌ `'+cm.getMainPrefix()+'hashgen <sha256/md5/sha1/sha512> <نص>`');
      const supported = ['md5','sha1','sha256','sha384','sha512'];
      if (!supported.includes(algo)) return message.reply('❌ الخوارزميات المدعومة: '+supported.join(', '));
      try {
        const hash = crypto.createHash(algo).update(text).digest('hex');
        message.reply('**🔐 '+algo.toUpperCase()+':**\n```\n'+hash+'\n```');
      } catch(e) { message.reply('❌ فشل: `'+e.message+'`'); }
    }
  },
  {
    name:'encrypt2', aliases:['enc2','xorenc','تشفير_متقدم'],
    description:'تشفير نص بمفتاح مخصص (XOR)', category:'أمان',
    execute(message, args, cm) {
      const key = args[1];
      const text = args.slice(2).join(' ');
      if (!key||!text) return message.reply('❌ `'+cm.getMainPrefix()+'encrypt2 <مفتاح> <نص>`');
      const encrypted = Buffer.from(text.split('').map((c,i)=>String.fromCharCode(c.charCodeAt(0)^key.charCodeAt(i%key.length))).join('')).toString('base64');
      message.reply('**🔒 النص المشفّر (مفتاح: `'+key.slice(0,3)+'***`):**\n`'+encrypted+'`\n\nللفك: `'+cm.getMainPrefix()+'decrypt2 '+key+' '+encrypted+'`');
    }
  },
  {
    name:'decrypt2', aliases:['dec2','xordec','فك_تشفير'],
    description:'فك تشفير XOR', category:'أمان',
    execute(message, args, cm) {
      const key = args[1];
      const text = args[2];
      if (!key||!text) return message.reply('❌ `'+cm.getMainPrefix()+'decrypt2 <مفتاح> <نص_مشفر>`');
      try {
        const decoded = Buffer.from(text,'base64').toString();
        const result = decoded.split('').map((c,i)=>String.fromCharCode(c.charCodeAt(0)^key.charCodeAt(i%key.length))).join('');
        message.reply('**🔓 النص الأصلي:**\n```\n'+result+'\n```');
      } catch { message.reply('❌ نص مشفّر غير صحيح.'); }
    }
  },
  {
    name:'ipcheck', aliases:['checkip','isVPN','ip_scan'],
    description:'فحص IP: هل هو VPN/Proxy/Tor؟', category:'أمان',
    async execute(message, args, cm) {
      const ip = args[1];
      if (!ip) return message.reply('❌ `'+cm.getMainPrefix()+'ipcheck <IP>`');
      const msg = await message.reply('🔍 جاري فحص الـ IP...');
      try {
        const d = await new Promise((res,rej)=>{
          const req=https.request({hostname:'vpnapi.io',path:'/api/'+ip+'?key=free',method:'GET',
            headers:{'User-Agent':'Mozilla/5.0'},timeout:8000},
            r=>{let data='';r.on('data',c=>data+=c);r.on('end',()=>{try{res(JSON.parse(data));}catch{res({});} });});
          req.on('error',rej);req.on('timeout',()=>{req.destroy();rej(new Error('timeout'));});req.end();
        });
        await msg.edit([
          '**🔍 تقرير IP: `'+ip+'`**',
          '```',
          '🌍 الدولة   : '+(d.location?.country||'?'),
          '🏙️ المدينة : '+(d.location?.city||'?'),
          '🕵️ VPN      : '+(d.security?.vpn?'✅ نعم':'❌ لا'),
          '🔄 Proxy    : '+(d.security?.proxy?'✅ نعم':'❌ لا'),
          '🧅 Tor      : '+(d.security?.tor?'✅ نعم':'❌ لا'),
          '🤖 Bot      : '+(d.security?.relay?'✅ نعم':'❌ لا'),
          '```',
        ].join('\n'));
      } catch(e) { await msg.edit('❌ فشل: `'+e.message+'`'); }
    }
  },
];
