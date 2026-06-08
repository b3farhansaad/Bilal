
const sessions = new Map();
const RIDDLES = [
  { q: 'ما الشيء الذي له أسنان ولا يعض؟', a: ['مشط'] },
  { q: 'ما الذي يُملأ كل يوم ويفرغ كل ليلة؟', a: ['المعدة','البطن'] },
  { q: 'ما الشيء الذي إذا أخذت منه كثُر؟', a: ['الحفرة'] },
  { q: 'ما الذي يتكلم بلا لسان؟', a: ['الكتاب','الصدى'] },
  { q: 'ما هو الشيء الذي إذا ذُكر اسمه كُسر؟', a: ['الصمت'] },
  { q: 'أنا بلا صوت ولكن أجيب. ما أنا؟', a: ['الصدى'] },
  { q: 'ما الذي يسير بلا أرجل؟', a: ['النهر','الوقت','الماء'] },
];
const TRIVIA = [
  { q: 'ما هي عاصمة اليابان؟', a: 'طوكيو', opts: ['بكين','طوكيو','سيول','بانكوك'] },
  { q: 'كم كوكبًا في المجموعة الشمسية؟', a: '8', opts: ['7','8','9','10'] },
  { q: 'ما هو أطول نهر في العالم؟', a: 'النيل', opts: ['الأمازون','النيل','الميسيسيبي','الفولغا'] },
  { q: 'ما أكبر كوكب في المجموعة الشمسية؟', a: 'المشتري', opts: ['زحل','أورانوس','المشتري','نبتون'] },
  { q: 'من اخترع الهاتف؟', a: 'غراهام بيل', opts: ['إديسون','نيوتن','غراهام بيل','تيسلا'] },
  { q: 'ما هو أصغر دولة في العالم؟', a: 'الفاتيكان', opts: ['موناكو','سان مارينو','الفاتيكان','ليختنشتاين'] },
];
const WORDS = [
  { word:'ديناصور', hint:'حيوان منقرض ضخم' },{ word:'كمبيوتر', hint:'جهاز إلكتروني' },
  { word:'برتقالة', hint:'فاكهة حمضية' },{ word:'موسيقى', hint:'فن سماعي' },
  { word:'مستشفى', hint:'مكان العلاج' },{ word:'رياضيات', hint:'علم الأرقام' },
  { word:'فيلسوف', hint:'صاحب حكمة وفلسفة' },{ word:'برمجة', hint:'كتابة الكود' },
];
module.exports = [
  {
    name: 'rps3', aliases: ['رpس','حجر3','rock2'], description: 'حجر ورقة مقص ضد الـ AI', category: 'العاب',
    execute(message, args, cm) {
      const choices = ['حجر','ورقة','مقص'];
      const em = { حجر:'🪨', ورقة:'📄', مقص:'✂️' };
      const map = { rock:'حجر', paper:'ورقة', scissors:'مقص' };
      const raw = args[1]?.toLowerCase();
      const userChoice = choices.find(c => raw === c) || choices.find(c => raw === ['rock','paper','scissors'][choices.indexOf(c)]) || map[raw];
      if (!userChoice) return message.reply('❌ الخيارات: `حجر` | `ورقة` | `مقص`');
      const aiChoice = choices[Math.floor(Math.random() * 3)];
      let result;
      if (userChoice === aiChoice) result = '🤝 **تعادل!**';
      else if ((userChoice==='حجر'&&aiChoice==='مقص')||(userChoice==='ورقة'&&aiChoice==='حجر')||(userChoice==='مقص'&&aiChoice==='ورقة')) result = '🏆 **أنت كسبت!**';
      else result = '🤖 **الـ AI كسب!**';
      message.reply(em[userChoice] + ' **' + userChoice + '** vs ' + em[aiChoice] + ' **' + aiChoice + '**\n' + result);
    }
  },
  {
    name: 'flip3', aliases: ['coin3','toss2'], description: 'رمي العملة: صورة أو كتابة؟', category: 'العاب',
    execute(message) {
      const result = Math.random() < 0.5 ? '🦅 صورة! (HEADS)' : '📜 كتابة! (TAILS)';
      message.reply('🪙 **رمية العملة:**\n# ' + result);
    }
  },
  {
    name: 'dice3', aliases: ['roll3','diceroll2'], description: 'رمي نرد: !dice3 2d6', category: 'العاب',
    execute(message, args, cm) {
      const input = args[1] || '1d6';
      const match = input.match(/^(\d+)d(\d+)$/i);
      if (!match) return message.reply('❌ `' + cm.getMainPrefix() + 'dice3 2d6`');
      const count = Math.min(parseInt(match[1]) || 1, 10);
      const sides = Math.min(Math.max(parseInt(match[2]) || 6, 2), 100);
      const rolls = Array.from({length:count}, () => Math.floor(Math.random()*sides)+1);
      const total = rolls.reduce((a,b)=>a+b,0);
      const em = ['⚀','⚁','⚂','⚃','⚄','⚅'];
      message.reply('🎲 **' + count + 'd' + sides + '**\n' + rolls.map(r => em[r-1] || '['+r+']').join(' + ') + ' = **' + total + '**');
    }
  },
  {
    name: 'riddle3', aliases: ['rd3','lghz2'], description: 'لغز عشوائي — فكّره!', category: 'العاب',
    execute(message, args, cm) {
      const cid = message.channel.id;
      const sub = args[1]?.toLowerCase();
      if ((sub==='answer'||sub==='ans') && sessions.has('rd_'+cid)) {
        const s = sessions.get('rd_'+cid); sessions.delete('rd_'+cid);
        return message.reply('💡 **الإجابة:** ' + s.a[0]);
      }
      const riddle = RIDDLES[Math.floor(Math.random()*RIDDLES.length)];
      sessions.set('rd_'+cid, riddle);
      message.reply('**🧩 اللغز:**\n> ' + riddle.q + '\n\n💬 ارسل إجابتك! أو `' + cm.getMainPrefix() + 'riddle3 answer` للحل');
    }
  },
  {
    name: 'trivia3', aliases: ['quiz3','معلومات2'], description: 'سؤال ثقافي مع خيارات', category: 'العاب',
    execute(message, args, cm) {
      const cid = message.channel.id;
      const sub = args[1]?.toLowerCase();
      const s = sessions.get('tri_'+cid);
      if (sub && s) {
        const guess = args.slice(1).join(' ');
        if (guess.toLowerCase().includes(s.a.toLowerCase())) { sessions.delete('tri_'+cid); return message.reply('🏆 **صح!** الإجابة هي **' + s.a + '**'); }
        return message.reply('❌ **غلط!** حاول تاني.');
      }
      const q = TRIVIA[Math.floor(Math.random()*TRIVIA.length)];
      sessions.set('tri_'+cid, q);
      const opts = q.opts.map((o,i) => '**' + (i+1) + '.** ' + o).join('\n');
      message.reply('**❓ سؤال ثقافي:**\n> ' + q.q + '\n\n' + opts + '\n\n💬 ارسل رقم الإجابة أو النص!');
    }
  },
  {
    name: 'wordscramble3', aliases: ['ws3','scramble3'], description: 'كلمة مشفوفة — فكّها!', category: 'العاب',
    execute(message, args, cm) {
      const cid = message.channel.id;
      const sub = args[1]?.toLowerCase();
      const s = sessions.get('ws_'+cid);
      if (sub==='hint'&&s) return message.reply('💡 **تلميح:** ' + s.hint);
      if ((sub==='answer'||sub==='ans')&&s) { sessions.delete('ws_'+cid); return message.reply('💡 **الإجابة:** `' + s.word + '`'); }
      if (sub && s) {
        if (sub===s.word) { sessions.delete('ws_'+cid); return message.reply('🏆 **ممتاز!** الكلمة: `' + s.word + '`'); }
        return message.reply('❌ **غلط!** `' + cm.getMainPrefix() + 'wordscramble3 hint` للمساعدة');
      }
      const w = WORDS[Math.floor(Math.random()*WORDS.length)];
      const scrambled = w.word.split('').sort(()=>Math.random()-0.5).join('');
      sessions.set('ws_'+cid, { word:w.word, hint:w.hint, scrambled });
      message.reply('**🔤 فكّ الكلمة:**\n```\n' + scrambled.split('').join(' ─ ') + '\n```\n💬 ارسل إجابتك | `' + cm.getMainPrefix() + 'wordscramble3 hint` للتلميح');
    }
  },
  {
    name: 'numguess2', aliases: ['number2','guess3','خمن2'], description: 'لعبة تخمين الرقم', category: 'العاب',
    execute(message, args, cm) {
      const cid = message.channel.id;
      const sub = args[1]?.toLowerCase();
      if (sub==='new'||!sessions.has('num_'+cid)) {
        const max = Math.min(parseInt(args[2])||100,1000);
        sessions.set('num_'+cid, { secret:Math.floor(Math.random()*max)+1, max, tries:0 });
        return message.reply('🎯 **لعبة تخمين الأرقام!**\nخمّن رقم بين **1** و **' + max + '**\n💬 ارسل رقمك!');
      }
      const s = sessions.get('num_'+cid);
      const guess = parseInt(sub);
      if (isNaN(guess)) return message.reply('❌ ارسل رقماً بين 1 و ' + s.max);
      s.tries++;
      if (guess===s.secret) { sessions.delete('num_'+cid); return message.reply('🏆 **صح في ' + s.tries + ' محاولة!** الرقم: **' + s.secret + '**'); }
      return message.reply(guess < s.secret ? '📈 **أكبر!** (محاولة ' + s.tries + ')' : '📉 **أصغر!** (محاولة ' + s.tries + ')');
    }
  },
  {
    name: 'lottery3', aliases: ['lotto3','jackpot2'], description: 'شراء تذكرة يانصيب', category: 'العاب',
    execute(message) {
      const ticket = Array.from({length:6}, ()=>Math.floor(Math.random()*49)+1);
      const winning = Array.from({length:6}, ()=>Math.floor(Math.random()*49)+1);
      const matches = ticket.filter(n=>winning.includes(n)).length;
      const prizes = {0:'😢 لا شيء',1:'🎫 مشاركة',2:'🎟️ جائزة صغيرة',3:'🥉 500 دولار',4:'🥈 10,000 دولار',5:'🥇 مليون!',6:'🎉💰 الجائزة الكبرى!'};
      message.reply('🎱 **تذكرتك:** ' + ticket.join(' - ') + '\n🎯 **الأرقام الرابحة:** ' + winning.join(' - ') + '\n\n✅ **تطابقات:** ' + matches + '/6\n🏆 **جائزتك:** ' + prizes[matches]);
    }
  },
  {
    name: 'hangman', aliases: ['hm2','الشنق'], description: 'لعبة Hangman — خمّن الكلمة', category: 'العاب',
    execute(message, args, cm) {
      const cid = message.channel.id;
      const sub = args[1]?.toLowerCase();
      function render(s) {
        const stages = ['😊','😐','😧','😨','😱','💀'];
        const display = s.word.split('').map(c => s.guessed.includes(c) ? c : '_').join(' ');
        return stages[Math.min(s.wrong.length,5)] + ' **Hangman** (' + s.wrong.length + '/5)\n```' + display + '```\n❌ أخطاء: ' + (s.wrong.join(', ')||'لا شيء');
      }
      if (sub==='new'||!sessions.has('hm_'+cid)) {
        const w = WORDS[Math.floor(Math.random()*WORDS.length)];
        const s = { word:w.word, hint:w.hint, guessed:[], wrong:[] };
        sessions.set('hm_'+cid, s);
        return message.reply('🎭 **Hangman!** تلميح: ' + w.hint + '\n' + render(s) + '\n💬 ارسل حرفاً!');
      }
      const s = sessions.get('hm_'+cid);
      if (!sub||sub.length!==1) return message.reply('❌ ارسل حرفاً واحداً!');
      if (s.guessed.includes(sub)||s.wrong.includes(sub)) return message.reply('⚠️ هذا الحرف جربته!');
      if (s.word.includes(sub)) {
        s.guessed.push(sub);
        const won = s.word.split('').every(c=>s.guessed.includes(c));
        if (won) { sessions.delete('hm_'+cid); return message.reply('🏆 **فزت!** الكلمة: `' + s.word + '`\n' + render(s)); }
        return message.reply('✅ **صح!** ' + render(s));
      } else {
        s.wrong.push(sub);
        if (s.wrong.length>=5) { sessions.delete('hm_'+cid); return message.reply('💀 **خسرت!** الكلمة: `' + s.word + '`\n' + render(s)); }
        return message.reply('❌ **غلط!** ' + render(s));
      }
    }
  }
];
