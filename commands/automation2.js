
const fs2 = require('fs'), path2 = require('path'), https = require('https');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const DATA = path2.join(__dirname,'../data');
if(!fs2.existsSync(DATA)) fs2.mkdirSync(DATA,{recursive:true});
function loadJSON(f,def){try{if(fs2.existsSync(f))return JSON.parse(fs2.readFileSync(f,'utf8'));return def;}catch{return def;}}
function saveJSON(f,d){try{fs2.writeFileSync(f,JSON.stringify(d,null,2));}catch{}}

const autoJoinData = path2.join(DATA,'autojoin.json');
const reminderData = path2.join(DATA,'scheduled.json');
const activeTimers = new Map();

module.exports = [
  {
    name:'autoreply2', aliases:['ar2','autowelcome','رد_تلقائي2'],
    description:'رد تلقائي بمحتوى مخصص لكلمات محددة', category:'أتمتة',
    execute(message, args, cm) {
      const sub=args[1]?.toLowerCase();
      const filePath=path2.join(DATA,'autoreply2.json');
      const data=loadJSON(filePath,{});
      if(sub==='add'){
        const trigger=args[2]?.toLowerCase();
        const reply=args.slice(3).join(' ');
        if(!trigger||!reply) return message.reply('❌ `'+cm.getMainPrefix()+'autoreply2 add <كلمة> <الرد>`');
        data[trigger]=reply;
        saveJSON(filePath,data);
        return message.reply('✅ **تمت الإضافة:** كلمة `'+trigger+'` → `'+reply+'`');
      }
      if(sub==='remove'||sub==='del'){
        const trigger=args[2]?.toLowerCase();
        if(!trigger||!data[trigger]) return message.reply('❌ لا يوجد رد لـ `'+(trigger||'؟')+'`');
        delete data[trigger];
        saveJSON(filePath,data);
        return message.reply('✅ **تم حذف الرد لـ `'+trigger+'`**');
      }
      if(sub==='list'){
        const keys=Object.keys(data);
        if(!keys.length) return message.reply('📭 لا يوجد ردود تلقائية.');
        return message.reply('**📋 الردود التلقائية ('+keys.length+'):**\n'+keys.map((k,i)=>'**'+(i+1)+'.** `'+k+'` → '+data[k]).join('\n').slice(0,1800));
      }
      if(sub==='clear'){
        saveJSON(filePath,{});
        return message.reply('✅ **تم مسح كل الردود التلقائية.**');
      }
      message.reply([
        '**⚙️ الردود التلقائية 2.0**',
        '`'+cm.getMainPrefix()+'autoreply2 add <كلمة> <الرد>`',
        '`'+cm.getMainPrefix()+'autoreply2 remove <كلمة>`',
        '`'+cm.getMainPrefix()+'autoreply2 list`',
        '`'+cm.getMainPrefix()+'autoreply2 clear`',
      ].join('\n'));
    }
  },
  {
    name:'msglog', aliases:['messagelog','logmsgs','سجل_رسائل'],
    description:'تسجيل كل الرسائل في قناة لملف محلي', category:'أتمتة',
    async execute(message, args, cm) {
      const sub=args[1]?.toLowerCase();
      const logFile=path2.join(DATA,'msglog_'+message.channel.id+'.txt');
      if(sub==='save'||!sub){
        const msgs=await message.channel.messages.fetch({limit:100});
        const lines=[...msgs.values()].reverse().map(m=>[new Date(m.createdTimestamp).toISOString(),m.author.username,m.content].join(' | '));
        fs2.writeFileSync(logFile,'=== Log: #'+(message.channel.name||'dm')+' ===\n'+lines.join('\n'));
        return message.reply('✅ **تم حفظ '+lines.length+' رسالة** في `msglog_'+message.channel.id+'.txt`');
      }
      if(sub==='show'){
        if(!fs2.existsSync(logFile)) return message.reply('❌ لا يوجد سجل لهذه القناة.');
        const content=fs2.readFileSync(logFile,'utf8');
        message.reply('```\n'+content.slice(0,1800)+'\n```');
      }
    }
  },
  {
    name:'schedulemsg', aliases:['schedmsg','timed_msg','رسالة_مجدولة'],
    description:'جدولة رسائل متعددة متتالية', category:'أتمتة',
    async execute(message, args, cm) {
      const sub=args[1]?.toLowerCase();
      if(sub==='stop'){
        if(activeTimers.has(message.channel.id)){
          clearTimeout(activeTimers.get(message.channel.id));
          activeTimers.delete(message.channel.id);
          return message.reply('⏹️ تم إلغاء الرسائل المجدولة.');
        }
        return message.reply('ℹ️ لا يوجد رسائل مجدولة في هذه القناة.');
      }
      const timeStr=args[1];
      const text=args.slice(2).join(' ');
      if(!timeStr||!text) return message.reply('❌ `'+cm.getMainPrefix()+'schedulemsg <30s|5m|2h> <الرسالة>`');
      const units={s:1000,m:60000,h:3600000};
      const match=timeStr.match(/^(\d+)([smh])$/);
      if(!match) return message.reply('❌ الصيغة: `30s` / `5m` / `2h`');
      const ms=parseInt(match[1])*units[match[2]];
      if(ms>7200000) return message.reply('❌ الحد الأقصى: ساعتان');
      await message.reply('📅 **تمت الجدولة!** الرسالة ستُرسل بعد `'+timeStr+'`\n> '+text);
      const t=setTimeout(async()=>{
        try{ await message.channel.send(text); activeTimers.delete(message.channel.id); }catch{}
      }, ms);
      activeTimers.set(message.channel.id,t);
    }
  },
  {
    name:'autopin', aliases:['pinlatest','pinmy','تثبيت_تلقائي'],
    description:'تثبيت أحدث رسالة لك في القناة', category:'أتمتة',
    async execute(message) {
      if(!message.guild) return message.reply('❌ في السيرفرات فقط.');
      const msgs=await message.channel.messages.fetch({limit:50});
      const mine=[...msgs.values()].find(m=>m.author.id===message.client.user.id&&m.id!==message.id);
      if(!mine) return message.reply('❌ لا توجد رسائل لك في هذه القناة.');
      const msg=await message.reply('📌 جاري التثبيت...');
      try { await mine.pin(); await msg.edit('📌 **تم تثبيت رسالتك:**\n> '+mine.content.slice(0,200)); }
      catch(e) { await msg.edit('❌ فشل: `'+e.message+'`'); }
    }
  },
  {
    name:'autodelete', aliases:['selfdel','tempmsgs','تحذف_تلقائي'],
    description:'إرسال رسالة تحذف نفسها بعد وقت', category:'أتمتة',
    async execute(message, args, cm) {
      const timeStr=args[1];
      const text=args.slice(2).join(' ');
      if(!timeStr||!text) return message.reply('❌ `'+cm.getMainPrefix()+'autodelete <10s|2m> <الرسالة>`');
      const units={s:1000,m:60000};
      const match=timeStr.match(/^(\d+)([sm])$/);
      if(!match) return message.reply('❌ الصيغة: `10s` / `2m`');
      const ms=Math.min(parseInt(match[1])*units[match[2]], 300000);
      await message.delete().catch(()=>{});
      const m=await message.channel.send(text+' `[تحذف بعد '+timeStr+']`');
      setTimeout(()=>m.delete().catch(()=>{}), ms);
    }
  },
  {
    name:'bulkreact', aliases:['massreact2','reactall2','تفاعل_جماعي'],
    description:'إضافة تفاعلات متعددة على رسالة واحدة', category:'أتمتة',
    async execute(message, args, cm) {
      const msgId=args[1];
      const emojis=args.slice(2);
      if(!msgId||!emojis.length) return message.reply('❌ `'+cm.getMainPrefix()+'bulkreact <message_id> <emoji1> <emoji2>...`');
      const msg=await message.reply('⚡ جاري الإضافة...');
      try {
        const target=await message.channel.messages.fetch(msgId);
        let added=0;
        for(const emoji of emojis.slice(0,10)){
          await target.react(emoji).then(()=>added++).catch(()=>{});
          await sleep(400);
        }
        await msg.edit('✅ **تمت إضافة '+added+' تفاعل** على الرسالة!');
      } catch(e) { await msg.edit('❌ فشل: `'+e.message+'`'); }
    }
  },
  {
    name:'clearchannel', aliases:['clearchat2','purgechat2','مسح_شات'],
    description:'حذف كل رسائلك في القناة (آخر 500)', category:'أتمتة',
    async execute(message) {
      const msg=await message.reply('🗑️ جاري حذف رسائلك... ');
      let deleted=0, lastId=undefined;
      for(let i=0;i<5;i++){
        const opts={limit:100};
        if(lastId) opts.before=lastId;
        const msgs=await message.channel.messages.fetch(opts);
        if(!msgs.size) break;
        const mine=[...msgs.values()].filter(m=>m.author.id===message.client.user.id&&m.id!==msg.id);
        for(const m of mine){ await m.delete().catch(()=>{}); deleted++; await sleep(350); }
        lastId=[...msgs.values()].pop()?.id;
      }
      await msg.edit('✅ **تم حذف '+deleted+' رسالة** من رسائلك!');
      setTimeout(()=>msg.delete().catch(()=>{}),5000);
    }
  },
  {
    name:'watchkw', aliases:['keyword_alert','alertword','تنبيه_كلمة'],
    description:'تنبيه عند ورود كلمة معينة في الشات', category:'أتمتة',
    execute(message, args, cm) {
      const sub=args[1]?.toLowerCase();
      const kwFile=path2.join(DATA,'watchkw.json');
      const data=loadJSON(kwFile,[]);
      if(sub==='add'){
        const word=args.slice(2).join(' ').toLowerCase();
        if(!word) return message.reply('❌ `'+cm.getMainPrefix()+'watchkw add <كلمة>`');
        if(!data.includes(word)) data.push(word);
        saveJSON(kwFile,data);
        return message.reply('✅ **تمت إضافة:** `'+word+'` للقائمة');
      }
      if(sub==='list') return message.reply(data.length?'**🔍 الكلمات المراقبة:**\n'+data.map((w,i)=>'**'+(i+1)+'.** `'+w+'`').join('\n'):'📭 لا يوجد كلمات.');
      if(sub==='clear'){ saveJSON(kwFile,[]); return message.reply('✅ **تم مسح كل الكلمات المراقبة.**'); }
      if(sub==='remove'){ const w=args[2]?.toLowerCase(); const idx=data.indexOf(w); if(idx>-1){data.splice(idx,1);saveJSON(kwFile,data);return message.reply('✅ تم حذف `'+w+'`');} return message.reply('❌ غير موجود.'); }
      message.reply('`'+cm.getMainPrefix()+'watchkw add/list/remove/clear`');
    }
  },
];
