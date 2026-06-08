
const https = require('https');
function get(url) {
  return new Promise((res,rej)=>{
    const u=new URL(url);
    const req=https.request({hostname:u.hostname,path:u.pathname+u.search,method:'GET',headers:{'User-Agent':'Mozilla/5.0'},timeout:8000},r=>{
      let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d));
    });req.on('error',rej);req.on('timeout',()=>{req.destroy();rej(new Error('timeout'));});req.end();
  });
}
function pj(str){try{return JSON.parse(str);}catch{return null;}}
module.exports = [
  {
    name:'wiki3',aliases:['w3','wikipedia3'],description:'بحث في ويكيبيديا العربية',category:'بحث',
    async execute(message,args,cm){
      const q=args.slice(1).join(' ');if(!q)return message.reply('❌ `'+cm.getMainPrefix()+'wiki3 <موضوع>`');
      const msg=await message.reply('🔍 جاري البحث عن `'+q+'`...');
      try{
        const raw=await get('https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch='+encodeURIComponent(q)+'&format=json&srlimit=1');
        const data=pj(raw);
        const page=data?.query?.search?.[0];
        if(!page)return msg.edit('❌ لا توجد نتائج لـ `'+q+'`.');
        const raw2=await get('https://ar.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&pageids='+page.pageid+'&format=json');
        const data2=pj(raw2);
        const extract=data2?.query?.pages?.[page.pageid]?.extract||'لا يوجد وصف.';
        const summary=extract.slice(0,600).replace(/\n+/g,' ').trim();
        await msg.edit('**📚 '+page.title+'**\n\n'+summary+'...\n\n🔗 https://ar.wikipedia.org/?curid='+page.pageid);
      }catch(err){await msg.edit('❌ فشل: `'+err.message+'`');}
    }
  },
  {
    name:'ipinfo3',aliases:['ip3','myip2'],description:'معلومات عنوان IP',category:'بحث',
    async execute(message,args,cm){
      const ip=args[1]||'';
      const msg=await message.reply('🌐 جاري جلب معلومات IP...');
      try{
        const d=pj(await get('https://ipapi.co/'+ip+'/json/'));
        if(d?.error)return msg.edit('❌ '+(d.reason||'IP غير صحيح.'));
        await msg.edit('**🌐 IP: `'+d.ip+'`**\n```\n🌍 الدولة : '+d.country_name+' ('+d.country_code+')\n🏙️ المدينة: '+(d.city||'?')+'\n🏢 ISP     : '+(d.org||'?')+'\n⏰ توقيت  : '+(d.timezone||'?')+'\n📐 موقع   : '+d.latitude+', '+d.longitude+'\n```');
      }catch(err){await msg.edit('❌ فشل: `'+err.message+'`');}
    }
  },
  {
    name:'weather3',aliases:['w4','طقس2'],description:'الطقس الحالي لأي مدينة',category:'بحث',
    async execute(message,args,cm){
      const city=args.slice(1).join(' ');if(!city)return message.reply('❌ `'+cm.getMainPrefix()+'weather3 <المدينة>`');
      const msg=await message.reply('🌤️ جاري جلب طقس '+city+'...');
      try{
        const d=pj(await get('https://wttr.in/'+encodeURIComponent(city)+'?format=j1'));
        if(!d||d.error)return msg.edit('❌ مش لاقي مدينة `'+city+'`.');
        const curr=d.current_condition?.[0];
        const desc=curr?.lang_ar?.[0]?.value||curr?.weatherDesc?.[0]?.value||'?';
        await msg.edit('**🌤️ طقس '+city+'**\n```\n📋 الحالة   : '+desc+'\n🌡️ الحرارة : '+(curr?.temp_C||'?')+'°C (يُحس بـ '+(curr?.FeelsLikeC||'?')+'°C)\n💧 الرطوبة : '+(curr?.humidity||'?')+'%\n💨 الرياح  : '+(curr?.windspeedKmph||'?')+' كم/ساعة\n```');
      }catch(err){await msg.edit('❌ فشل: `'+err.message+'`');}
    }
  },
  {
    name:'convert3',aliases:['curr3','currency3'],description:'تحويل العملات',category:'بحث',
    async execute(message,args,cm){
      const amount=parseFloat(args[1]),from=args[2]?.toUpperCase(),to=args[3]?.toUpperCase();
      if(isNaN(amount)||!from||!to)return message.reply('❌ `'+cm.getMainPrefix()+'convert3 100 USD EGP`');
      const msg=await message.reply('💱 جاري التحويل...');
      try{
        const d=pj(await get('https://api.frankfurter.app/latest?amount='+amount+'&from='+from+'&to='+to));
        if(d?.message||!d?.rates)return msg.edit('❌ '+(d?.message||'عملة غير صحيحة.'));
        await msg.edit('**💱 '+amount+' '+from+' = **'+d.rates[to]?.toFixed(2)+'** '+to+'**');
      }catch(err){await msg.edit('❌ فشل: `'+err.message+'`');}
    }
  },
  {
    name:'numbase3',aliases:['base3','baseconv3'],description:'تحويل بين الأنظمة العددية',category:'بحث',
    execute(message,args,cm){
      const num=args[1],from=parseInt(args[2])||10,to=parseInt(args[3])||2;
      if(!num)return message.reply('❌ `'+cm.getMainPrefix()+'numbase3 255 10 2`');
      if(![2,8,10,16].includes(from)||![2,8,10,16].includes(to))return message.reply('❌ الأنظمة: 2, 8, 10, 16');
      try{const d=parseInt(num,from);if(isNaN(d))return message.reply('❌ رقم غير صحيح.');message.reply('**🔢 '+num+' (أساس '+from+') → `'+d.toString(to).toUpperCase()+'` (أساس '+to+')**');}
      catch{message.reply('❌ خطأ.');}
    }
  },
  {
    name:'temp3',aliases:['temperature3','tempconv3'],description:'تحويل درجات الحرارة',category:'بحث',
    execute(message,args,cm){
      const value=parseFloat(args[1]),unit=args[2]?.toLowerCase();
      if(isNaN(value)||!unit)return message.reply('❌ `'+cm.getMainPrefix()+'temp3 100 c` (c/f/k)');
      let c,f,k;
      if(unit==='c'){c=value;f=(c*9/5)+32;k=c+273.15;}
      else if(unit==='f'){f=value;c=(f-32)*5/9;k=c+273.15;}
      else if(unit==='k'){k=value;c=k-273.15;f=(c*9/5)+32;}
      else return message.reply('❌ الوحدات: c / f / k');
      message.reply('**🌡️ تحويل الحرارة:**\n```\n🌡️ مئوية      : '+c.toFixed(2)+'°C\n🌡️ فهرنهايت : '+f.toFixed(2)+'°F\n🌡️ كلفن       : '+k.toFixed(2)+'K\n```');
    }
  },
  {
    name:'qr3',aliases:['qrcode3','genqr3'],description:'إنشاء QR Code لأي نص/رابط',category:'بحث',
    execute(message,args,cm){
      const text=args.slice(1).join(' ');if(!text)return message.reply('❌ `'+cm.getMainPrefix()+'qr3 <نص>`');
      message.reply('**📱 QR Code:**\nhttps://api.qrserver.com/v1/create-qr-code/?size=300x300&data='+encodeURIComponent(text.slice(0,300)));
    }
  },
  {
    name:'shorten3',aliases:['short3','tinyurl3'],description:'اختصار روابط URL',category:'بحث',
    async execute(message,args,cm){
      const url=args[1];if(!url||!url.startsWith('http'))return message.reply('❌ `'+cm.getMainPrefix()+'shorten3 <رابط>`');
      const msg=await message.reply('🔗 جاري الاختصار...');
      try{const raw=await get('https://tinyurl.com/api-create.php?url='+encodeURIComponent(url));if(raw.startsWith('http'))await msg.edit('**🔗 الرابط المختصر:**\n'+raw);else await msg.edit('❌ فشل.');}
      catch(err){await msg.edit('❌ فشل: `'+err.message+'`');}
    }
  },
  {
    name:'uuid3',aliases:['uid3','randomid3'],description:'توليد UUID عشوائي',category:'بحث',
    execute(message,args){
      const count=Math.min(parseInt(args[1])||1,10);
      const uuids=Array.from({length:count},()=>'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&0x3|0x8)).toString(16);}));
      message.reply('**🔑 UUID ('+count+'):**\n```\n'+uuids.join('\n')+'\n```');
    }
  },
  {
    name:'passgen3',aliases:['pass3','password3'],description:'توليد كلمات مرور قوية',category:'بحث',
    execute(message,args,cm){
      const length=Math.min(Math.max(parseInt(args[1])||16,8),64);
      const count=Math.min(parseInt(args[2])||1,5);
      const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
      const passwords=Array.from({length:count},()=>Array.from({length},()=>chars[Math.floor(Math.random()*chars.length)]).join(''));
      message.reply('**🔐 كلمات مرور ('+length+' حرف):**\n```\n'+passwords.join('\n')+'\n```\n⚠️ احفظها في مكان آمن!');
    }
  },
  {
    name:'random3',aliases:['rand3','rng3'],description:'رقم عشوائي بين حدّين',category:'بحث',
    execute(message,args,cm){
      const min=parseInt(args[1])??1,max=parseInt(args[2])??100;
      if(isNaN(min)||isNaN(max)||min>=max)return message.reply('❌ `'+cm.getMainPrefix()+'random3 1 100`');
      message.reply('🎲 **رقم عشوائي بين '+min+' و '+max+':**\n# **'+(Math.floor(Math.random()*(max-min+1))+min)+'**');
    }
  },
  {
    name:'worldtime',aliases:['clock3','tz3'],description:'الوقت الحالي في أي منطقة زمنية',category:'بحث',
    execute(message,args,cm){
      const tzInput=args.slice(1).join(' ')||'UTC';
      const tzMap={'مصر':'Africa/Cairo','السعودية':'Asia/Riyadh','الامارات':'Asia/Dubai','الكويت':'Asia/Kuwait','العراق':'Asia/Baghdad','تركيا':'Europe/Istanbul','لندن':'Europe/London','نيويورك':'America/New_York','طوكيو':'Asia/Tokyo'};
      const tz=tzMap[tzInput]||tzInput;
      try{
        const now=new Date();
        const formatted=now.toLocaleString('ar-EG',{timeZone:tz,weekday:'long',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});
        message.reply('**⏰ الوقت في '+tzInput+':**\n'+formatted+'\n`'+tz+'`');
      }catch{message.reply('❌ المنطقة الزمنية `'+tzInput+'` غير صحيحة.');}
    }
  }
];
