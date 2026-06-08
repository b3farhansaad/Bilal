
function toFullWidth(str) {
  return str.split('').map(c => { const code = c.charCodeAt(0); if(code>=33&&code<=126) return String.fromCharCode(code+0xFEE0); return c==' '?'\u3000':c; }).join('');
}
function toBubble(str) {
  const a='ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ'.split('');
  return str.toLowerCase().split('').map(c=>c>='a'&&c<='z'?a[c.charCodeAt(0)-97]:c).join('');
}
function toSmall(str) {
  const m={a:'ᵃ',b:'ᵇ',c:'ᶜ',d:'ᵈ',e:'ᵉ',f:'ᶠ',g:'ᵍ',h:'ʰ',i:'ⁱ',j:'ʲ',k:'ᵏ',l:'ˡ',m:'ᵐ',n:'ⁿ',o:'ᵒ',p:'ᵖ',r:'ʳ',s:'ˢ',t:'ᵗ',u:'ᵘ',v:'ᵛ',w:'ʷ',x:'ˣ',y:'ʸ',z:'ᶻ'};
  return str.toLowerCase().split('').map(c=>m[c]||c).join('');
}
function toMirror(str) {
  const m={a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z'};
  return str.toLowerCase().split('').reverse().map(c=>m[c]||c).join('');
}
function toLeet(str) {
  return str.toLowerCase().split('').map(c=>({a:'4',e:'3',i:'1',o:'0',s:'5',t:'7',l:'1',g:'9'}[c]||c)).join('');
}
function toNATO(str) {
  const n={a:'Alpha',b:'Bravo',c:'Charlie',d:'Delta',e:'Echo',f:'Foxtrot',g:'Golf',h:'Hotel',i:'India',j:'Juliet',k:'Kilo',l:'Lima',m:'Mike',n:'November',o:'Oscar',p:'Papa',q:'Quebec',r:'Romeo',s:'Sierra',t:'Tango',u:'Uniform',v:'Victor',w:'Whiskey',x:'X-ray',y:'Yankee',z:'Zulu'};
  return str.toLowerCase().split('').map(c=>n[c]||c.toUpperCase()).join(' ─ ');
}
function similarity(s1,s2) {
  const longer=s1.length>s2.length?s1:s2, shorter=s1.length>s2.length?s2:s1;
  if(!longer.length) return 100;
  const dp=Array.from({length:s1.length+1},(_,i)=>Array.from({length:s2.length+1},(_,j)=>i||j));
  for(let i=1;i<=s1.length;i++) for(let j=1;j<=s2.length;j++) dp[i][j]=s1[i-1]===s2[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return ((1-dp[s1.length][s2.length]/longer.length)*100).toFixed(1);
}
module.exports = [
  { name:'bold3',aliases:['b3','thicktext2'],description:'تحويل النص لبولد',category:'نص',execute(m,a,c){const t=a.slice(1).join(' ');if(!t)return m.reply('❌ `'+c.getMainPrefix()+'bold3 <نص>`');m.reply('**'+t+'**');} },
  { name:'italic3',aliases:['it3','slant2'],description:'نص مائل',category:'نص',execute(m,a,c){const t=a.slice(1).join(' ');if(!t)return m.reply('❌ `'+c.getMainPrefix()+'italic3 <نص>`');m.reply('_'+t+'_');} },
  { name:'bubble3',aliases:['circle2','circletext2'],description:'نص دائري ⓣⓔⓧⓣ',category:'نص',execute(m,a,c){const t=a.slice(1).join(' ');if(!t)return m.reply('❌ `'+c.getMainPrefix()+'bubble3 <نص>`');m.reply(toBubble(t));} },
  { name:'fullwidth3',aliases:['fw3','wide3'],description:'نص عريض ｆｕｌｌ',category:'نص',execute(m,a,c){const t=a.slice(1).join(' ');if(!t)return m.reply('❌ `'+c.getMainPrefix()+'fullwidth3 <نص>`');m.reply(toFullWidth(t));} },
  { name:'small3',aliases:['tiny3','superscript3'],description:'نص صغير ˢᵘᵖᵉʳ',category:'نص',execute(m,a,c){const t=a.slice(1).join(' ');if(!t)return m.reply('❌ `'+c.getMainPrefix()+'small3 <نص>`');m.reply(toSmall(t));} },
  { name:'leet3',aliases:['1337b','leetspeak3'],description:'نص ليت سبيك',category:'نص',execute(m,a,c){const t=a.slice(1).join(' ');if(!t)return m.reply('❌ `'+c.getMainPrefix()+'leet3 <نص>`');m.reply(toLeet(t));} },
  { name:'nato3',aliases:['natoalpha3','phonetic3'],description:'الأبجدية الفونيتيكية NATO',category:'نص',execute(m,a,c){const t=a.slice(1).join(' ');if(!t)return m.reply('❌ `'+c.getMainPrefix()+'nato3 <نص>`');m.reply('`'+toNATO(t)+'`');} },
  { name:'mock3',aliases:['spongebob3','mocking3'],description:'نص سبونج بوب ساخر',category:'نص',execute(m,a,c){const t=a.slice(1).join(' ');if(!t)return m.reply('❌ `'+c.getMainPrefix()+'mock3 <نص>`');m.reply(t.split('').map((ch,i)=>i%2===0?ch.toLowerCase():ch.toUpperCase()).join(''));} },
  { name:'reverse3',aliases:['rev3','backward3'],description:'عكس النص ←→',category:'نص',execute(m,a,c){const t=a.slice(1).join(' ');if(!t)return m.reply('❌ `'+c.getMainPrefix()+'reverse3 <نص>`');m.reply(t.split('').reverse().join(''));} },
  { name:'mirror3',aliases:['upsidedown3','flipped'],description:'نص مقلوب ʇxǝʇ',category:'نص',execute(m,a,c){const t=a.slice(1).join(' ');if(!t)return m.reply('❌ `'+c.getMainPrefix()+'mirror3 <نص>`');m.reply(toMirror(t));} },
  { name:'clap3',aliases:['clapclap3','claps3'],description:'أضف 👏 بين الكلمات',category:'نص',execute(m,a,c){const t=a.slice(1).join(' ');if(!t)return m.reply('❌ `'+c.getMainPrefix()+'clap3 <نص>`');m.reply(t.split(' ').join(' 👏 ')+' 👏');} },
  { name:'emojify3',aliases:['emoji3text','emojitext3'],description:'حوّل الحروف لإيموجيات 🅰️',category:'نص',execute(m,a,c){
    const t=a.slice(1).join(' ');if(!t)return m.reply('❌ `'+c.getMainPrefix()+'emojify3 <نص>`');
    const em={a:'🅰️',b:'🅱️',c:'🇨',d:'🇩',e:'🇪',f:'🇫',g:'🇬',h:'🇭',i:'🇮',j:'🇯',k:'🇰',l:'🇱',m:'🇲',n:'🇳',o:'🅾️',p:'🇵',q:'🇶',r:'🇷',s:'🇸',t:'🇹',u:'🇺',v:'🇻',w:'🇼',x:'❌',y:'🇾',z:'💤',' ':' '};
    m.reply(t.toLowerCase().split('').map(ch=>em[ch]||ch).join(''));
  } },
  { name:'encode3',aliases:['b64enc3','base64enc3'],description:'ترميز Base64',category:'نص',execute(m,a,c){const t=a.slice(1).join(' ');if(!t)return m.reply('❌ `'+c.getMainPrefix()+'encode3 <نص>`');m.reply('🔒 `'+Buffer.from(t).toString('base64')+'`');} },
  { name:'decode3',aliases:['b64dec3','base64dec3'],description:'فك ترميز Base64',category:'نص',execute(m,a,c){const t=a.slice(1).join(' ');if(!t)return m.reply('❌ `'+c.getMainPrefix()+'decode3 <نص>`');try{m.reply('🔓 `'+Buffer.from(t,'base64').toString('utf8')+'`');}catch{m.reply('❌ نص Base64 غير صحيح.');}} },
  { name:'charcount3',aliases:['cc3','chars3'],description:'إحصائيات النص الشاملة',category:'نص',execute(m,a,c){
    const t=a.slice(1).join(' ');if(!t)return m.reply('❌ `'+c.getMainPrefix()+'charcount3 <نص>`');
    const words=t.split(/\s+/).filter(Boolean),sentences=t.split(/[.!?؟]/).filter(s=>s.trim());
    m.reply('**📊 إحصائيات النص:**\n```\n📝 حروف (مع مسافات)   : '+t.length+'\n📝 حروف (بدون مسافات): '+t.replace(/\s/g,'').length+'\n📖 كلمات              : '+words.length+'\n📜 جمل                : '+sentences.length+'\n```');
  } },
  { name:'wordcount3',aliases:['wc3','words3'],description:'عدد الكلمات والحروف',category:'نص',execute(m,a,c){const t=a.slice(1).join(' ');if(!t)return m.reply('❌ `'+c.getMainPrefix()+'wordcount3 <نص>`');m.reply('📊 **'+t.split(/\s+/).filter(Boolean).length+'** كلمة | **'+t.length+'** حرف');} },
  { name:'similarity3',aliases:['sim3','compare3'],description:'نسبة التشابه بين نصين',category:'نص',execute(m,a,c){
    const t=a.slice(1).join(' ');const [s1,s2]=t.split('|').map(s=>s.trim());
    if(!s1||!s2)return m.reply('❌ `'+c.getMainPrefix()+'similarity3 <نص1> | <نص2>`');
    const pct=similarity(s1,s2);
    const bar='█'.repeat(Math.floor(pct/10))+'░'.repeat(10-Math.floor(pct/10));
    m.reply('**🔍 نسبة التشابه:**\n`'+bar+'` **'+pct+'%**');
  } },
  { name:'caesar3',aliases:['rot3','shift3'],description:'تشفير Caesar Cipher',category:'نص',execute(m,a,c){
    const shift=parseInt(a[1])||13,t=a.slice(2).join(' ');
    if(!t)return m.reply('❌ `'+c.getMainPrefix()+'caesar3 <shift> <نص>`');
    const enc=t.split('').map(ch=>{const code=ch.charCodeAt(0);if(code>=65&&code<=90)return String.fromCharCode(((code-65+shift)%26+26)%26+65);if(code>=97&&code<=122)return String.fromCharCode(((code-97+shift)%26+26)%26+97);return ch;}).join('');
    m.reply('🔐 **Caesar (shift '+shift+'):**\n`'+enc+'`');
  } }
];
