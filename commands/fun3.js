
const https = require('https');
const JOKES_AR = [
  'ليش الأسد ملك الغابة؟ لأن الغابة ما عندها وايفاي!',
  'قالوا: الصمت من ذهب. طيّب، ليش الأساتذة يتكلمون؟',
  'سألت جوجل: كيف أفقد وزني بسرعة؟ قال: احذف صورك.',
  'قلت لأمي: أنا تعبان. قالت: اشرب ماء.',
  'دكتور قال لمريض: عندك 6 أشهر. المريض: ما عندي فلوس. الدكتور: 12 شهر.',
  'طالب سأل المعلم: ليش القمر يضيء؟ قال: اقرأ الكتاب. قرأ وما لقى جواب.',
];
const EIGHTS = [
  'نعم، بالتأكيد! 🎯','الأمور تبدو إيجابية! ✨','أعتقد ذلك بقوة 💪',
  'اسأل مرة أخرى لاحقاً 🔮','غير مؤكد، جرب الآن 🤔','الجواب ضبابي 🌫️',
  'لا تعتمد عليه 😅','الجواب لا! 🚫','لا تبدو الأمور جيدة 😬','غير محتمل 🎲',
];
const WOULD_YOU = [
  ['تأكل طعاماً لا تحبه مدة أسبوع','تتوقف عن النوم 48 ساعة'],
  ['تعيش بدون هاتف شهر','تعيش بدون إنترنت سنة'],
  ['تعرف تاريخ وفاتك','تعرف تفكير الناس فيك'],
  ['تكون غني ووحيد','تكون فقير ومحبوب'],
  ['تسافر للماضي','تسافر للمستقبل'],
];
const TRUTHS = [
  'ما أكبر كذبة قلتها في حياتك؟','ما أحرج موقف مررت فيه؟',
  'من أكثر شخص تكرهه في هذه المحادثة؟','ما الشيء الذي تندم عليه أكثر شيء؟',
  'هل سرقت شيئاً في حياتك؟','ما أغرب حلم حلمته؟',
];
const DARES = [
  'أرسل آخر صورة في معرضك','اكتب رسالة حب لأول شخص في قائمتك',
  'أرسل أطول رسالة ممكنة بكلمة واحدة متكررة',
  'أرسل "أحبك" لصديقك المقرب بدون سياق',
  'اكتب ما تفكر فيه الآن بصدق',
];
const FORTUNES = [
  'حظك اليوم ممتاز! فرصة ذهبية تنتظرك 🌟',
  'المال والرزق في طريقه إليك قريباً 💰',
  'شخص يفكر فيك الآن بشكل إيجابي جداً ❤️',
  'أسبوع مميز ينتظرك — استعد للخير! 🌈',
  'كن حذراً في قراراتك هذا اليوم ⚠️',
  'هدفك القادم سيتحقق بسرعة مفاجئة 🎯',
  'شخص غائب سيعود قريباً إلى حياتك 🌙',
];
module.exports = [
  {
    name:'joke5', aliases:['نكتة5','جوك5','haha5'],
    description:'نكتة عربية عشوائية مضحكة', category:'متعة',
    execute(message) { message.reply('😂 **نكتة:**\n> '+JOKES_AR[Math.floor(Math.random()*JOKES_AR.length)]); }
  },
  {
    name:'8ball2', aliases:['magic2','كرة2','yesno2'],
    description:'كرة السحر — اسأل سؤالاً واحصل على إجابة', category:'متعة',
    execute(message, args, cm) {
      const q=args.slice(1).join(' ');
      if(!q) return message.reply('❌ `'+cm.getMainPrefix()+'8ball2 <سؤالك>`');
      message.reply('🎱 **سؤالك:** '+q+'\n\n**الإجابة:** '+EIGHTS[Math.floor(Math.random()*EIGHTS.length)]);
    }
  },
  {
    name:'wouldyou', aliases:['wy2','هل_تفضل','أيهما'],
    description:'لعبة هل تفضّل...؟', category:'متعة',
    execute(message) {
      const q=WOULD_YOU[Math.floor(Math.random()*WOULD_YOU.length)];
      message.reply('**🤔 هل تفضل...؟**\n\n**أ)** '+q[0]+'\n\nأم\n\n**ب)** '+q[1]+'\n\n💬 أيهما تختار؟');
    }
  },
  {
    name:'truthordare', aliases:['tod2','tod'],
    description:'لعبة الحق أو الجرأة', category:'متعة',
    execute(message, args, cm) {
      const sub=args[1]?.toLowerCase();
      if(sub==='truth'||sub==='حق') return message.reply('**💯 الحق:**\n> '+TRUTHS[Math.floor(Math.random()*TRUTHS.length)]);
      if(sub==='dare'||sub==='جرأة') return message.reply('**🔥 الجرأة:**\n> '+DARES[Math.floor(Math.random()*DARES.length)]);
      message.reply('**🎮 الحق أو الجرأة?**\n`'+cm.getMainPrefix()+'truthordare truth` — للحق\n`'+cm.getMainPrefix()+'truthordare dare` — للجرأة');
    }
  },
  {
    name:'fortune2', aliases:['حظ2','luck2'],
    description:'حظك وطالعك اليوم', category:'متعة',
    execute(message) {
      const f=FORTUNES[Math.floor(Math.random()*FORTUNES.length)];
      message.reply('**🔮 حظك اليوم:**\n\n' + f + '\n\n' + '⭐'.repeat(5));
    }
  },
  {
    name:'compliment2', aliases:['comp2','مدح2'],
    description:'مدح ومديح لأي شخص 💕', category:'متعة',
    execute(message, args) {
      const compliments=['أنت رائع بشكل لا يصدق!','الدنيا أجمل بوجودك!','أنت من الأشخاص النادرين الطيبين!','حظ من يعرفك!','اسمك دائماً يذكر بالخير 💕'];
      const target=message.mentions?.users?.first();
      const name=target?('<@'+target.id+'>'):(args[1]||'أنت');
      message.reply('**💕 '+name+':**\n> '+compliments[Math.floor(Math.random()*compliments.length)]);
    }
  },
  {
    name:'insult2', aliases:['ins2','شتيمة2'],
    description:'شتيمة مضحكة لشخص 😈', category:'متعة',
    execute(message, args) {
      const insults=['جهازك أسرع منك في التفكير 💻','لو الغباء يطير، أنت طيار أول 🚀','أنت برهان أن التطور يسير بالعكس 🐒','معك كيلو مخ ولكن نص كيلو هواء 💨'];
      const target=message.mentions?.users?.first();
      const name=target?('<@'+target.id+'>'):(args[1]||'حد ما');
      message.reply('**😈 لـ '+name+':**\n> '+insults[Math.floor(Math.random()*insults.length)]);
    }
  },
  {
    name:'rate2', aliases:['تقييم2'],
    description:'تقييم عشوائي لأي شيء /10', category:'متعة',
    execute(message, args, cm) {
      const thing=args.slice(1).join(' ');
      if(!thing) return message.reply('❌ `'+cm.getMainPrefix()+'rate2 <شيء>`');
      const r=Math.floor(Math.random()*11);
      const comments={0:'💀 الأسوأ',1:'😱 كارثة',2:'😬 سيء جداً',3:'😞 تحت المتوسط',4:'😕 أقل من المتوسط',5:'😐 عادي',6:'🙂 لا بأس',7:'😊 جيد',8:'😁 جيد جداً',9:'🤩 رائع',10:'👑 مثالي!'};
      const bar='█'.repeat(r)+'░'.repeat(10-r);
      message.reply('**📊 تقييم: '+thing+'**\n`'+bar+'` **'+r+'/10**\n'+comments[r]);
    }
  },
  {
    name:'ship2', aliases:['couple2','توافق2'],
    description:'نسبة التوافق بين شخصين', category:'متعة',
    execute(message, args, cm) {
      const users=[...(message.mentions?.users?.values()||[])];
      const names=users.length>=2?[users[0].username,users[1].username]:args.slice(1).join(' ').split('و').map(s=>s.trim()).filter(Boolean);
      if(names.length<2) return message.reply('❌ `'+cm.getMainPrefix()+'ship2 @يوزر1 @يوزر2`');
      const seed=(names[0]+names[1]).split('').reduce((a,c)=>a+c.charCodeAt(0),0);
      const pct=seed%101;
      const bar='💗'.repeat(Math.floor(pct/10))+'🤍'.repeat(10-Math.floor(pct/10));
      const label=pct<20?'💔 لا توافق':pct<40?'😅 ضعيف':pct<60?'😐 متوسط':pct<80?'💕 جيد':pct<95?'❤️ رائع':'💑 أرواح توأم!';
      message.reply('**💘 '+names[0]+' & '+names[1]+'**\n`'+bar+'` **'+pct+'%**\n'+label);
    }
  },
  {
    name:'dare2', aliases:['challenge2','تحدي'],
    description:'تحدٍّ جريء عشوائي', category:'متعة',
    execute(message) {
      const dares2=['أرسل "أنا أحبك" لأول شخص في قائمة DM','غير صورتك لصورة مضحكة لمدة ساعة','اكتب أطول رسالة ممكنة بكلمة واحدة متكررة','احذف آخر 5 رسائل أرسلتها'];
      message.reply('**🔥 تحديك هو:**\n> '+dares2[Math.floor(Math.random()*dares2.length)]);
    }
  },
  {
    name:'bigtext', aliases:['wide2','bigfont2'],
    description:'نص كبير ومميز بالفصل بين الحروف', category:'متعة',
    execute(message, args, cm) {
      const text=(args.slice(1).join(' ')||'SNODIX').toUpperCase().slice(0,15);
      const spaced = text.split('').join(' ');
      message.reply('**✨ '+spaced+' ✨**');
    }
  },
];
