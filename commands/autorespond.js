const fs = require('fs'), path = require('path');
const dataDir = require('../utils/dataDir');
const RULES_PATH = () => dataDir('autorespond.json');
function loadRules(){const p=RULES_PATH();try{if(fs.existsSync(p))return JSON.parse(fs.readFileSync(p,'utf8'));}catch{}return{rules:[],enabled:true};}
function saveRules(d){const p=RULES_PATH();try{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(d,null,2));}catch(e){console.error('AutoRespond save error:',e.message);}}
function handleAutoRespond(message){
    try{const data=loadRules();if(!data.enabled)return;
    const content=message.content.toLowerCase();
    for(const rule of(data.rules||[])){
        if(!rule.enabled)continue;const trigger=(rule.trigger||'').toLowerCase();
        const matched=rule.exact?content===trigger:content.includes(trigger);
        if(matched){let r=rule.response||'';r=r.replace('{user}',message.author.username).replace('{tag}',message.author.tag||message.author.username).replace('{server}',message.guild?.name||'DM');message.reply(r).catch(()=>{});break;}
    }}catch{}
}
module.exports={name:'autorespond',aliases:['ar'],description:'إدارة الردود التلقائية',category:'أتوماتيك',handleAutoRespond,
 execute(message,args,commandManager){
    const sub=args[1]?.toLowerCase();const data=loadRules();const prefix=commandManager.getMainPrefix();
    if(sub==='add'){
        const rest=args.slice(2).join(' ');const pi=rest.indexOf('|');
        if(pi===-1)return message.reply('❌ الصيغة: `'+prefix+'ar add <تريقر> | <الرد>`');
        const trigger=rest.slice(0,pi).trim();const response=rest.slice(pi+1).trim();
        if(!trigger||!response)return message.reply('❌ التريقر والرد مطلوبين.');
        if((data.rules||[]).length>=50)return message.reply('❌ الحد الأقصى 50 قاعدة.');
        if(!data.rules)data.rules=[];data.rules.push({id:Date.now(),trigger,response,enabled:true,exact:false});
        saveRules(data);return message.reply('✅ **تمت الإضافة!**\n🔑 التريقر: `'+trigger+'`\n💬 الرد: `'+response+'`');
    }
    if(sub==='list'){
        if(!data.rules||!data.rules.length)return message.reply('📭 لا توجد قواعد.\nاستخدم `'+prefix+'ar add`');
        let t='**🤖 الردود التلقائية ('+data.rules.length+'/50) — '+(data.enabled?'✅ مفعّل':'❌ معطّل')+'**\n```\n';
        data.rules.forEach((r,i)=>t+=(i+1)+'. ['+(r.enabled?'✓':'✗')+'] "'+r.trigger+'" → "'+r.response.slice(0,35)+(r.response.length>35?'...':'')+'" \n');
        return message.reply(t+'```');
    }
    if(sub==='delete'||sub==='del'||sub==='remove'){
        const idx=parseInt(args[2])-1;
        if(isNaN(idx)||!data.rules||idx<0||idx>=data.rules.length)return message.reply('❌ رقم غير صحيح.');
        const removed=data.rules.splice(idx,1)[0];saveRules(data);
        return message.reply('✅ **تم حذف:** `'+removed.trigger+'`');
    }
    if(sub==='on'){data.enabled=true;saveRules(data);return message.reply('✅ **الردود التلقائية مفعّلة.**');}
    if(sub==='off'){data.enabled=false;saveRules(data);return message.reply('❌ **الردود التلقائية معطّلة.**');}
    if(sub==='toggle'){
        const idx=parseInt(args[2])-1;if(isNaN(idx)||!data.rules||idx<0||idx>=data.rules.length)return message.reply('❌ رقم غير صحيح.');
        data.rules[idx].enabled=!data.rules[idx].enabled;saveRules(data);
        return message.reply((data.rules[idx].enabled?'✅':'❌')+' **'+(data.rules[idx].enabled?'تفعيل':'تعطيل')+': `'+data.rules[idx].trigger+'`**');
    }
    if(sub==='clear'){data.rules=[];saveRules(data);return message.reply('🗑️ **تم مسح كل القواعد.**');}
    return message.reply('**🤖 أوامر الرد التلقائي**\n\n`'+prefix+'ar add <تريقر> | <الرد>` — إضافة\n`'+prefix+'ar list` — عرض القواعد\n`'+prefix+'ar delete <رقم>` — حذف\n`'+prefix+'ar on / off` — تفعيل/تعطيل\n`'+prefix+'ar toggle <رقم>` — تبديل\n`'+prefix+'ar clear` — مسح الكل\n\n**متغيرات:** `{user}` `{tag}` `{server}`');
}};
