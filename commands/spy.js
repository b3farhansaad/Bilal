const fs=require('fs'),path=require('path');
const dataDir=require('../utils/dataDir');
const LOG=()=>dataDir('spy_log.json');
function loadLog(){const p=LOG();try{if(fs.existsSync(p))return JSON.parse(fs.readFileSync(p,'utf8'));}catch{}return{edits:[],deletes:[]};}
function saveLog(d){const p=LOG();try{fs.mkdirSync(path.dirname(p),{recursive:true});d.edits=(d.edits||[]).slice(-100);d.deletes=(d.deletes||[]).slice(-100);fs.writeFileSync(p,JSON.stringify(d,null,2));}catch{}}
function onMessageUpdate(oldMsg,newMsg){
    try{if(!oldMsg.content||oldMsg.content===newMsg.content)return;if(oldMsg.author?.bot)return;
    const log=loadLog();if(!log.edits)log.edits=[];
    log.edits.push({user:oldMsg.author?.tag||oldMsg.author?.username||'مجهول',channel:oldMsg.channel?.name||'DM',guild:oldMsg.guild?.name||'DM',before:oldMsg.content.slice(0,250),after:newMsg.content.slice(0,250),at:new Date().toISOString()});
    saveLog(log);}catch{}
}
function onMessageDelete(msg){
    try{if(!msg.content||msg.author?.bot)return;
    const log=loadLog();if(!log.deletes)log.deletes=[];
    log.deletes.push({user:msg.author?.tag||msg.author?.username||'مجهول',channel:msg.channel?.name||'DM',guild:msg.guild?.name||'DM',content:msg.content.slice(0,300),at:new Date().toISOString()});
    saveLog(log);}catch{}
}
module.exports=[
    {name:'spy',aliases:['spylog','spymsglog'],description:'مراقبة الرسائل المعدّلة والمحذوفة',category:'مراقبة',onMessageUpdate,onMessageDelete,
     execute(message,args,commandManager){
        const sub=args[1]?.toLowerCase()||'help';const log=loadLog();const prefix=commandManager.getMainPrefix();
        if(sub==='edits'||sub==='edit'){
            const edits=(log.edits||[]).slice(-5).reverse();
            if(!edits.length)return message.reply('📭 لا توجد رسائل معدّلة مسجّلة.');
            let t='**✏️ آخر '+edits.length+' رسائل معدّلة**\n\n';
            edits.forEach((e,i)=>{const tm=new Date(e.at).toLocaleTimeString('ar-EG');t+='**'+(i+1)+'.** `'+e.user+'` في `#'+e.channel+'` — '+tm+'\n  📝 قبل: `'+e.before.slice(0,80)+(e.before.length>80?'...':'')+'`\n  ✏️ بعد: `'+e.after.slice(0,80)+(e.after.length>80?'...':'')+'`\n\n';});
            return message.reply(t);
        }
        if(sub==='deletes'||sub==='delete'||sub==='deleted'){
            const deletes=(log.deletes||[]).slice(-5).reverse();
            if(!deletes.length)return message.reply('📭 لا توجد رسائل محذوفة مسجّلة.');
            let t='**🗑️ آخر '+deletes.length+' رسائل محذوفة**\n\n';
            deletes.forEach((d,i)=>{const tm=new Date(d.at).toLocaleTimeString('ar-EG');t+='**'+(i+1)+'.** `'+d.user+'` في `#'+d.channel+'` — '+tm+'\n  💬 المحتوى: `'+d.content.slice(0,100)+(d.content.length>100?'...':'')+'`\n\n';});
            return message.reply(t);
        }
        if(sub==='clear'){saveLog({edits:[],deletes:[]});return message.reply('🗑️ **تم مسح كل سجلات المراقبة.**');}
        return message.reply('**🕵️ نظام المراقبة**\n\n`'+prefix+'spy edits` — الرسائل المعدّلة\n`'+prefix+'spy deletes` — الرسائل المحذوفة\n`'+prefix+'spy clear` — مسح السجل');
    }}
];
