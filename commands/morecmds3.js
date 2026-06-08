'use strict';
// ══════════════════════════════════════════════════════
//   Snodix Ultra Legend v5 — Extra Commands Batch 3
//   قسم 1-16 | 38 أمر إضافي أسطوري
// ══════════════════════════════════════════════════════
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const os     = require('os');

const COLS = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
const delay = ms => new Promise(r => setTimeout(r, ms));

// ── قسم 1: السبام ──────────────────────────────────────────────────
const slowspam = {
    name: 'slowspam', aliases: ['سبام_بطيء'],
    description: 'سبام بطيء مع فاصل زمني مخصص بالثواني',
    async execute(message, args) {
        const count = Math.min(parseInt(args[1]) || 5, 30);
        const secs  = Math.min(parseInt(args[2]) || 3, 30);
        const text  = args.slice(3).join(' ') || '⚡ Snodix Ultra Legend v5';
        await message.delete().catch(() => {});
        for (let i = 0; i < count; i++) {
            await message.channel.send(`[${i+1}/${count}] ${text}`).catch(() => {});
            await delay(secs * 1000);
        }
    }
};

const counterspam = {
    name: 'counterspam', aliases: ['cspam','عداد_سبام'],
    description: 'سبام بعداد رقمي من رقم لرقم',
    async execute(message, args) {
        const from = parseInt(args[1]) || 1;
        const to   = Math.min(parseInt(args[2]) || 10, from + 50);
        const text  = args.slice(3).join(' ') || '';
        await message.delete().catch(() => {});
        for (let i = from; i <= to; i++) {
            await message.channel.send(`${i}${text ? ' ' + text : ''}`).catch(() => {});
            await delay(500);
        }
    }
};

const rotatespam = {
    name: 'rotatespam', aliases: ['rspam','دوران_سبام'],
    description: 'سبام يدور بين رسائل متعددة (مفصولة بـ |)',
    async execute(message, args) {
        const count  = Math.min(parseInt(args[1]) || 10, 50);
        const texts  = args.slice(2).join(' ').split('|').map(s => s.trim()).filter(Boolean);
        if (texts.length < 2) return message.reply('❌ الصيغة: `!rotatespam <عدد> نص1|نص2|نص3`');
        await message.delete().catch(() => {});
        for (let i = 0; i < count; i++) {
            await message.channel.send(texts[i % texts.length]).catch(() => {});
            await delay(800);
        }
    }
};

// ── قسم 2: معلومات الحساب ──────────────────────────────────────────
const showperms2 = {
    name: 'showperms2', aliases: ['sp2','myperms2'],
    description: 'صلاحياتي الكاملة في السيرفر الحالي بتنظيم',
    async execute(message) {
        if (!message.guild) return message.reply('❌ هذا الأمر للسيرفرات فقط');
        const member = message.guild.members.cache.get(message.author.id);
        if (!member) return message.reply('❌ لم أجد حسابك في السيرفر');
        const perms = member.permissions.toArray();
        const icons = { ADMINISTRATOR:'👑', MANAGE_GUILD:'⚙️', MANAGE_CHANNELS:'📺', MANAGE_ROLES:'🎭', BAN_MEMBERS:'🔨', KICK_MEMBERS:'👢', MANAGE_MESSAGES:'✉️', SEND_MESSAGES:'💬', READ_MESSAGE_HISTORY:'📖', MENTION_EVERYONE:'📢', MANAGE_NICKNAMES:'✏️', MANAGE_WEBHOOKS:'🔗', VIEW_AUDIT_LOG:'📋', MUTE_MEMBERS:'🔇', DEAFEN_MEMBERS:'🎧', MOVE_MEMBERS:'🚶', CONNECT:'🔊', SPEAK:'🎙️', EMBED_LINKS:'🌐', ATTACH_FILES:'📎', ADD_REACTIONS:'❤️', USE_EXTERNAL_EMOJIS:'😎', CHANGE_NICKNAME:'📝', VIEW_CHANNEL:'👁️' };
        const lines = perms.map(p => `${icons[p]||'✅'} \`${p}\``);
        return message.reply(`**🔑 صلاحياتي في ${message.guild.name}:**\n${lines.join('\n') || '`لا يوجد`'}`);
    }
};

const connectionstatus = {
    name: 'connectionstatus', aliases: ['connstatus','حالة_الاتصال'],
    description: 'حالة الاتصال المفصلة بديسكورد',
    async execute(message) {
        const client = message.client;
        const ping   = client.ws.ping;
        const status = ['جاهز','متصل','متعطل','جاري الاتصال','غير متصل','منتهية الصلاحية'][client.ws.status] || 'غير معروف';
        const guilds = client.guilds.cache.size;
        const upMs   = process.uptime() * 1000;
        const upH    = Math.floor(upMs/3600000);
        const upM    = Math.floor((upMs%3600000)/60000);
        const upS    = Math.floor((upMs%60000)/1000);
        return message.reply(
            `**📡 حالة الاتصال:**\n` +
            `🏓 Ping: \`${ping}ms\`\n` +
            `🔌 الحالة: \`${status}\`\n` +
            `🏠 السيرفرات: \`${guilds}\`\n` +
            `⏱️ Uptime: \`${upH}h ${upM}m ${upS}s\`\n` +
            `💾 RAM: \`${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)} MB\``
        );
    }
};

// ── قسم 3: السيرفرات ───────────────────────────────────────────────
const serverfeatures = {
    name: 'serverfeatures', aliases: ['srvfeat','مميزات_السيرفر'],
    description: 'مميزات وخصائص السيرفر الحالي المتقدمة',
    async execute(message) {
        if (!message.guild) return message.reply('❌ للسيرفرات فقط');
        const g = message.guild;
        const featureNames = { COMMUNITY:'🌍 مجتمع', PARTNERED:'🤝 شريك', VERIFIED:'✅ موثق', ANIMATED_ICON:'🎞️ أيقونة متحركة', BANNER:'🖼️ بانر', DISCOVERABLE:'🔍 قابل للاكتشاف', FEATURABLE:'⭐ مميز', INVITE_SPLASH:'💦 صورة دعوة', NEWS:'📰 قنوات أخبار', VANITY_URL:'🔗 رابط مخصص', VIP_REGIONS:'💎 مناطق VIP', WELCOME_SCREEN_ENABLED:'👋 شاشة ترحيب', MEMBER_VERIFICATION_GATE_ENABLED:'🛂 تحقق الأعضاء', MONETIZATION_ENABLED:'💰 تحقيق ربح' };
        const feats = g.features.map(f => featureNames[f] || f).join('\n') || 'لا توجد مميزات خاصة';
        return message.reply(
            `**✨ مميزات سيرفر \`${g.name}\`:**\n` +
            `${feats}\n\n` +
            `🔰 مستوى التعزيز: \`${g.premiumTier}\`\n` +
            `🚀 عدد التعزيزات: \`${g.premiumSubscriptionCount || 0}\`\n` +
            `👥 عدد الأعضاء: \`${g.memberCount}\``
        );
    }
};

const serverboosts = {
    name: 'serverboosts', aliases: ['boostcount','تعزيزات'],
    description: 'عرض معلومات تعزيزات السيرفر',
    async execute(message) {
        if (!message.guild) return message.reply('❌ للسيرفرات فقط');
        const g = message.guild;
        const tiers = { 0:'لا يوجد تعزيز 🔘', 1:'المستوى 1 🥉', 2:'المستوى 2 🥈', 3:'المستوى 3 🥇' };
        return message.reply(
            `**🚀 تعزيزات سيرفر ${g.name}:**\n` +
            `${COLS}\n` +
            `🎖️ المستوى: \`${tiers[g.premiumTier] || 'غير معروف'}\`\n` +
            `🔢 عدد التعزيزات: \`${g.premiumSubscriptionCount || 0}\`\n` +
            `📣 قناة الاندماج: ${g.systemChannel ? `<#${g.systemChannel.id}>` : '`لا يوجد`'}`
        );
    }
};

// ── قسم 4: إدارة السيرفر ──────────────────────────────────────────
const setnsfw = {
    name: 'setnsfw', aliases: ['nsfw','وضع_بالغين'],
    description: 'تفعيل/تعطيل وضع NSFW في القناة الحالية',
    async execute(message, args) {
        if (!message.guild) return message.reply('❌ للسيرفرات فقط');
        const target = args[1] === 'off' ? false : true;
        await message.channel.setNSFW(target).catch(e => { return message.reply(`❌ ${e.message}`); });
        return message.reply(`🔞 وضع NSFW: ${target ? '**مفعّل ✅**' : '**معطّل ⛔**'}`);
    }
};

const setchannel = {
    name: 'setchannel', aliases: ['editchan','تعديل_قناة'],
    description: 'تعديل اسم أو موضوع القناة الحالية',
    async execute(message, args) {
        if (!message.guild) return message.reply('❌ للسيرفرات فقط');
        const sub = args[1];
        if (sub === 'name') {
            const n = args.slice(2).join(' ');
            if (!n) return message.reply('❌ اكتب الاسم الجديد');
            await message.channel.setName(n).catch(e => { return message.reply(`❌ ${e.message}`); });
            return message.reply(`✅ تم تغيير اسم القناة إلى: **${n}**`);
        }
        if (sub === 'topic') {
            const t = args.slice(2).join(' ');
            await message.channel.setTopic(t || null).catch(e => { return message.reply(`❌ ${e.message}`); });
            return message.reply(`✅ تم تغيير موضوع القناة.`);
        }
        return message.reply('❌ الصيغة: `!setchannel name <اسم>` أو `!setchannel topic <موضوع>`');
    }
};

// ── قسم 6: الأصدقاء ───────────────────────────────────────────────
const whoisonline = {
    name: 'whoisonline', aliases: ['onlinefriends','أصدقاء_أونلاين'],
    description: 'الأصدقاء المتصلون حالياً',
    async execute(message) {
        const friends = message.client.user.relationships?.friends || [];
        if (!friends || friends.length === 0) return message.reply('👥 لا يوجد أصدقاء متصلون أو الميزة غير مدعومة.');
        const onlines = friends.filter(f => ['online','idle','dnd'].includes(f.presence?.status));
        const lines = onlines.slice(0,15).map(f => {
            const st = { online:'🟢', idle:'🌙', dnd:'🔴' }[f.presence?.status] || '⚫';
            return `${st} \`${f.username}\``;
        });
        return message.reply(`**👥 الأصدقاء المتصلون (${onlines.length}):**\n${lines.join('\n') || '`لا يوجد`'}`);
    }
};

// ── قسم 7: الذكاء الاصطناعي ────────────────────────────────────────
const aiemoji = {
    name: 'aiemoji', aliases: ['اقتراح_ايموجي'],
    description: 'اقتراح إيموجي مناسب للكلمة',
    async execute(message, args) {
        const word = args.slice(1).join(' ');
        if (!word) return message.reply('❌ اكتب كلمة: `!aiemoji <كلمة>`');
        const map = { سعيد:'😊', حزين:'😢', غاضب:'😠', حب:'❤️', نار:'🔥', برد:'❄️', سرعة:'⚡', قوة:'💪', نوم:'😴', طعام:'🍔', موسيقى:'🎵', لعب:'🎮', عمل:'💼', مال:'💰', كتاب:'📚', رياضة:'⚽', طبيعة:'🌿', ليل:'🌙', شمس:'☀️', مطر:'🌧️', كود:'💻', أمان:'🔐', خطر:'☢️', نصر:'🏆', سفر:'✈️', بيت:'🏠', قلب:'💕', نجم:'⭐', قمر:'🌕', ابتسام:'😄' };
        const emoji = map[word] || '🤔';
        return message.reply(`🤖 **اقتراح إيموجي لـ "${word}":** ${emoji}`);
    }
};

const aistory = {
    name: 'aistory2', aliases: ['shortstory2', 'قصة2'],
    description: 'توليد قصة قصيرة بالذكاء الاصطناعي',
    async execute(message, args) {
        const topic = args.slice(1).join(' ') || 'مغامرة';
        const stories = [
            `في عالم ${topic}، كان هناك بطل وحيد يحمل سيفاً من نور يمشي عبر الظلام... حتى وجد كنزاً لا يُقدَّر بثمن: الأصدقاء الحقيقيون. 🌟`,
            `يُحكى أن ${topic} كان مكاناً مسحوراً حيث كل الأمنيات تتحقق، لكن الثمن كان الشجاعة والإرادة لمواجهة الحقيقة. ⚔️`,
            `في زمن ${topic}، قرر شاب صغير أن يغير العالم بكلمة طيبة... ونجح. 💫`
        ];
        const story = stories[Math.floor(Math.random()*stories.length)];
        return message.reply(`**📖 قصة قصيرة عن "${topic}":**\n${story}`);
    }
};

// ── قسم 8: الألعاب ─────────────────────────────────────────────────
const mathquiz = {
    name: 'mathquiz2', aliases: ['مسابقة_رياضيات2', 'mathgame2'],
    description: 'تحدي رياضيات سريع',
    async execute(message) {
        const ops = ['+', '-', '×'];
        const op  = ops[Math.floor(Math.random()*ops.length)];
        const a = Math.floor(Math.random()*50)+1;
        const b = Math.floor(Math.random()*50)+1;
        let ans, q;
        if (op==='+')  { ans = a+b; q = `${a} + ${b}`; }
        else if(op==='-') { ans = a-b; q = `${a} - ${b}`; }
        else { ans = a*b; q = `${a} × ${b}`; }
        await message.reply(`🧮 **مسابقة رياضيات!**\n\`${q} = ?\`\nلديك **15 ثانية** للإجابة!`);
        const filter = m => m.author.id === message.author.id && m.channel.id === message.channel.id;
        try {
            const collected = await message.channel.awaitMessages({ filter, max:1, time:15000, errors:['time'] });
            const guess = parseInt(collected.first().content.trim());
            if (guess === ans) return message.reply(`🎉 **إجابة صحيحة!** \`${q} = ${ans}\` ✅`);
            return message.reply(`❌ **خطأ!** الإجابة الصحيحة: \`${ans}\``);
        } catch {
            return message.reply(`⏰ **انتهى الوقت!** الإجابة: \`${ans}\``);
        }
    }
};

const wordchain = {
    name: 'wordchain', aliases: ['سلسلة_كلمات'],
    description: 'لعبة سلسلة الكلمات — كل كلمة تبدأ بآخر حرف السابقة',
    async execute(message, args) {
        const startWord = args[1] || 'ديسكورد';
        let lastChar = startWord[startWord.length-1];
        await message.reply(`🔤 **لعبة سلسلة الكلمات!**\nالكلمة الأولى: **${startWord}**\nأرسل كلمة تبدأ بحرف \`${lastChar}\` — لديك 20 ثانية!`);
        const filter = m => m.author.id === message.author.id && m.channel.id === message.channel.id;
        try {
            const col = await message.channel.awaitMessages({ filter, max:1, time:20000, errors:['time'] });
            const word = col.first().content.trim();
            if (word[0].toLowerCase() === lastChar.toLowerCase()) {
                return message.reply(`✅ **ممتاز!** الكلمة \`${word}\` صحيحة! الحرف التالي: \`${word[word.length-1]}\``);
            }
            return message.reply(`❌ **خطأ!** يجب أن تبدأ الكلمة بـ \`${lastChar}\``);
        } catch {
            return message.reply(`⏰ **انتهى الوقت!**`);
        }
    }
};

const colorguess = {
    name: 'colorguess', aliases: ['خمن_اللون'],
    description: 'خمّن اسم اللون من رمزه HEX',
    async execute(message) {
        const colors = [
            { hex:'#FF0000', name:'أحمر', ar:'RED' },
            { hex:'#00FF00', name:'أخضر', ar:'GREEN' },
            { hex:'#0000FF', name:'أزرق', ar:'BLUE' },
            { hex:'#FFFF00', name:'أصفر', ar:'YELLOW' },
            { hex:'#FF00FF', name:'بنفسجي', ar:'MAGENTA' },
            { hex:'#00FFFF', name:'سماوي', ar:'CYAN' },
            { hex:'#FF8C00', name:'برتقالي', ar:'ORANGE' },
            { hex:'#800080', name:'بنفسجي غامق', ar:'PURPLE' },
        ];
        const c = colors[Math.floor(Math.random()*colors.length)];
        await message.reply(`🎨 **خمّن اللون!**\nرمز HEX: \`${c.hex}\`\nاكتب اسم اللون خلال 15 ثانية!`);
        const filter = m => m.author.id === message.author.id && m.channel.id === message.channel.id;
        try {
            const col = await message.channel.awaitMessages({ filter, max:1, time:15000, errors:['time'] });
            const guess = col.first().content.trim().toLowerCase();
            if ([c.name.toLowerCase(), c.ar.toLowerCase()].some(v => guess.includes(v.toLowerCase()))) {
                return message.reply(`✅ **صح!** اللون هو **${c.name}** \`${c.hex}\` 🎉`);
            }
            return message.reply(`❌ **خطأ!** اللون كان **${c.name}** \`${c.hex}\``);
        } catch {
            return message.reply(`⏰ **انتهى الوقت!** اللون: **${c.name}** \`${c.hex}\``);
        }
    }
};

// ── قسم 9: التفاعلات التلقائية ─────────────────────────────────────
const autotype2 = {
    name: 'autotype2', aliases: ['at2','كتابة_مستمرة'],
    description: 'مؤشر الكتابة المستمر لمدة محددة بالثواني',
    async execute(message, args) {
        const secs = Math.min(parseInt(args[1]) || 10, 60);
        await message.delete().catch(() => {});
        const end = Date.now() + secs * 1000;
        while (Date.now() < end) {
            await message.channel.sendTyping().catch(() => {});
            await delay(7000);
        }
    }
};

// ── قسم 10: أدوات النص ─────────────────────────────────────────────
const wingdings2 = {
    name: 'wingdings2', aliases: ['wding','ونجدينجز'],
    description: 'تحويل النص إلى رموز wingdings-style',
    async execute(message, args) {
        const text = args.slice(1).join(' ');
        if (!text) return message.reply('❌ اكتب نصاً بعد الأمر');
        const map = {'a':'✌','b':'👁','c':'✂','d':'✏','e':'✒','f':'✦','g':'✧','h':'❤','i':'☞','j':'☟','k':'☝','l':'☜','m':'♣','n':'♦','o':'●','p':'❖','q':'■','r':'□','s':'◆','t':'◇','u':'○','v':'◎','w':'★','x':'☆','y':'✱','z':'✲',' ':' '};
        const out = text.toLowerCase().split('').map(c => map[c]||c).join('');
        return message.reply(`**🎭 ونجدينجز:**\n${out}`);
    }
};

const braille = {
    name: 'braille', aliases: ['برايل'],
    description: 'تحويل النص إلى رموز برايل',
    async execute(message, args) {
        const text = args.slice(1).join(' ');
        if (!text) return message.reply('❌ اكتب نصاً بعد الأمر');
        const brailleMap = { a:'⠁',b:'⠃',c:'⠉',d:'⠙',e:'⠑',f:'⠋',g:'⠛',h:'⠓',i:'⠊',j:'⠚',k:'⠅',l:'⠇',m:'⠍',n:'⠝',o:'⠕',p:'⠏',q:'⠟',r:'⠗',s:'⠎',t:'⠞',u:'⠥',v:'⠧',w:'⠺',x:'⠭',y:'⠽',z:'⠵',' ':'⠀' };
        const out = text.toLowerCase().split('').map(c=>brailleMap[c]||c).join('');
        return message.reply(`**⠿ برايل:**\n${out}`);
    }
};

const reverse2 = {
    name: 'reverse2', aliases: ['rev2','عكس2'],
    description: 'عكس النص بالكامل بشكل متقدم',
    async execute(message, args) {
        const text = args.slice(1).join(' ');
        if (!text) return message.reply('❌ اكتب نصاً');
        const reversed = [...text].reverse().join('');
        return message.reply(`**🔄 النص المعكوس:**\n${reversed}`);
    }
};

const textjoin = {
    name: 'textjoin', aliases: ['tjoin','ربط_نص'],
    description: 'ربط كلمات بفاصل مخصص',
    async execute(message, args) {
        const sep = args[1] || '-';
        const words = args.slice(2);
        if (!words.length) return message.reply('❌ الصيغة: `!textjoin <فاصل> كلمة1 كلمة2 ...`');
        return message.reply(`**🔗 النص المربوط:** ${words.join(sep)}`);
    }
};

// ── قسم 11: البحث والمعلومات ────────────────────────────────────────
const bmi = {
    name: 'bmi', aliases: ['حاسبة_bmi'],
    description: 'حاسبة مؤشر كتلة الجسم BMI',
    async execute(message, args) {
        const weight = parseFloat(args[1]);
        const height = parseFloat(args[2]);
        if (!weight || !height) return message.reply('❌ الصيغة: `!bmi <الوزن_كغ> <الطول_متر>` مثال: `!bmi 70 1.75`');
        const bmiVal = (weight / (height * height)).toFixed(1);
        let cat = '';
        if      (bmiVal < 18.5) cat = '⚠️ نقص في الوزن';
        else if (bmiVal < 25)   cat = '✅ وزن طبيعي';
        else if (bmiVal < 30)   cat = '⚠️ زيادة في الوزن';
        else                    cat = '🔴 سمنة';
        return message.reply(`**⚖️ مؤشر كتلة الجسم:**\n${COLS}\n📊 BMI: \`${bmiVal}\`\n${cat}\n\`${weight}kg\` ÷ (\`${height}m\`)²`);
    }
};

const ascii2num = {
    name: 'ascii2num', aliases: ['asciinums', 'أسكي_لرقم'],
    description: 'تحويل نص إلى أكواد ASCII الرقمية',
    async execute(message, args) {
        const text = args.slice(1).join(' ');
        if (!text) return message.reply('❌ اكتب نصاً بعد الأمر');
        const codes = [...text].map(c => c.charCodeAt(0)).join(' ');
        return message.reply(`**🔢 أكواد ASCII:**\n\`${codes}\``);
    }
};

const num2ascii = {
    name: 'num2ascii', aliases: ['n2a','رقم_لأسكي'],
    description: 'تحويل أرقام ASCII إلى نص',
    async execute(message, args) {
        const nums = args.slice(1).map(n => parseInt(n)).filter(n => !isNaN(n) && n > 0 && n < 65536);
        if (!nums.length) return message.reply('❌ الصيغة: `!num2ascii 72 101 108 108 111`');
        const text = nums.map(n => String.fromCharCode(n)).join('');
        return message.reply(`**🔤 النص المُحوَّل:**\n\`${text}\``);
    }
};

// ── قسم 12: الـ Rich Presence ───────────────────────────────────────
const rpctemplate = {
    name: 'rpctemplate', aliases: ['rpctemp','قالب_rpc'],
    description: 'قوالب RPC جاهزة وسريعة التطبيق',
    async execute(message, args) {
        const templates = {
            gaming:  { type:'PLAYING', name:'🎮 Gaming Mode', details:'يلعب بشكل احترافي', state:'Snodix Ultra v5' },
            music:   { type:'LISTENING', name:'🎵 Spotify', details:'يستمع لأغاني رائعة', state:'Snodix Playlist' },
            stream:  { type:'STREAMING', name:'📡 Live Stream', details:'بث مباشر الآن', state:'Snodix Channel' },
            code:    { type:'PLAYING', name:'💻 VSCode', details:'يكتب كود أسطوري', state:'Snodix Project' },
            study:   { type:'WATCHING', name:'📚 Study Time', details:'وقت الدراسة والتركيز', state:'Focused Mode' },
            chill:   { type:'CUSTOM', name:'☕ chill mode', details:'استرخاء تام', state:'Do not disturb' },
        };
        const name = args[1]?.toLowerCase();
        if (!name || !templates[name]) {
            const list = Object.keys(templates).map(k=>`\`${k}\``).join(' · ');
            return message.reply(`**🎨 قوالب RPC المتاحة:**\n${list}\nالصيغة: \`!rpctemplate <اسم_القالب>\``);
        }
        const rpc = require('./rpc');
        const cfg = { ...rpc.loadRPC(), ...templates[name], enabled: true };
        await rpc.applyRPC(message.client, cfg);
        const { saveRPC } = require('./rpc');
        // Save via loadRPC path
        const fs2 = require('fs'), path2 = require('path');
        const rpcPath = path2.join(__dirname, '../data/rpcConfig.json');
        fs2.mkdirSync(path2.dirname(rpcPath), { recursive: true });
        fs2.writeFileSync(rpcPath, JSON.stringify(cfg, null, 2));
        return message.reply(`✅ تم تطبيق قالب RPC: **${name}** [${cfg.type}]`);
    }
};

const rpclist = {
    name: 'rpclist', aliases: ['listrpc','قائمة_rpc'],
    description: 'عرض إعدادات RPC الحالية بشكل منظم',
    async execute(message) {
        const rpc = require('./rpc');
        const cfg = rpc.loadRPC();
        const btn1 = cfg.buttons?.[0] ? `\`${cfg.buttons[0].label}\` → ${cfg.buttons[0].url}` : '`لا يوجد`';
        const btn2 = cfg.buttons?.[1] ? `\`${cfg.buttons[1].label}\` → ${cfg.buttons[1].url}` : '`لا يوجد`';
        return message.reply(
            `**🎭 إعدادات RPC الحالية:**\n${COLS}\n` +
            `⚡ الحالة: ${cfg.enabled ? '🟢 مفعّل' : '🔴 معطّل'}\n` +
            `📌 النوع: \`${cfg.type || 'PLAYING'}\`\n` +
            `🏷️ الاسم: \`${cfg.name || '—'}\`\n` +
            `📝 التفاصيل: \`${cfg.details || '—'}\`\n` +
            `💬 الحالة: \`${cfg.state || '—'}\`\n` +
            `🔘 زر 1: ${btn1}\n` +
            `🔘 زر 2: ${btn2}`
        );
    }
};

// ── قسم 14: الميزات المتقدمة ────────────────────────────────────────
const reactall = {
    name: 'reactall3', aliases: ['ra3','تفاعل_كل3'],
    description: 'تفاعل على آخر N رسالة في القناة دفعة واحدة',
    async execute(message, args) {
        const count = Math.min(parseInt(args[1]) || 5, 20);
        const emoji  = args[2] || '⚡';
        await message.delete().catch(() => {});
        const msgs = await message.channel.messages.fetch({ limit: count }).catch(() => null);
        if (!msgs) return;
        for (const m of msgs.values()) {
            await m.react(emoji).catch(() => {});
            await delay(400);
        }
    }
};

const bulkforward = {
    name: 'bulkforward3', aliases: ['bf3','إرسال_جماعي3'],
    description: 'إرسال رسالة لعدة قنوات بأسمائها (مفصولة بـ |)',
    async execute(message, args) {
        const raw = args.slice(1).join(' ');
        const parts = raw.split('||');
        if (parts.length < 2) return message.reply('❌ الصيغة: `!bulkforward <اسم_قناة1>|<اسم_قناة2> || <الرسالة>`');
        const chanNames = parts[0].split('|').map(s => s.trim().replace(/^#/,''));
        const text      = parts.slice(1).join('||').trim();
        if (!text) return message.reply('❌ اكتب الرسالة بعد `||`');
        await message.delete().catch(() => {});
        let sent = 0;
        for (const name of chanNames) {
            const ch = message.guild?.channels.cache.find(c => c.name === name && c.isText?.());
            if (ch) { await ch.send(text).catch(() => {}); sent++; }
        }
        await message.channel.send(`📤 **تم الإرسال لـ ${sent}/${chanNames.length} قناة.**`);
    }
};

const autoedit2 = {
    name: 'autoedit2', aliases: ['ae2','تعديل_تلقائي'],
    description: 'أرسل رسالة وتُعدَّل تلقائياً بعد ثواني',
    async execute(message, args) {
        const secs    = Math.min(parseInt(args[1]) || 5, 60);
        const before  = args.slice(2).join(' ').split('→')[0]?.trim() || '⏳ ينتهي قريباً...';
        const after   = args.slice(2).join(' ').split('→')[1]?.trim() || '✅ انتهى!';
        const sent = await message.channel.send(before);
        await delay(secs * 1000);
        await sent.edit(after).catch(() => {});
        await message.delete().catch(() => {});
    }
};

const massreact2 = {
    name: 'massreact3', aliases: ['mr3','تفاعل_متعدد3'],
    description: 'تفاعل على رسالة محددة بعدة إيموجي',
    async execute(message, args) {
        const msgId  = args[1];
        const emojis = args.slice(2);
        if (!msgId || !emojis.length) return message.reply('❌ الصيغة: `!massreact2 <msg_id> ❤️ 😂 🔥`');
        const target = await message.channel.messages.fetch(msgId).catch(() => null);
        if (!target) return message.reply('❌ لم أجد الرسالة');
        await message.delete().catch(() => {});
        for (const e of emojis.slice(0,10)) {
            await target.react(e).catch(() => {});
            await delay(400);
        }
    }
};

// ── قسم 15: الأمان والحماية ─────────────────────────────────────────
const hmacgen = {
    name: 'hmacgen', aliases: ['hmac','توليد_hmac'],
    description: 'توليد HMAC-SHA256 للنص',
    async execute(message, args) {
        const key  = args[1];
        const text = args.slice(2).join(' ');
        if (!key || !text) return message.reply('❌ الصيغة: `!hmacgen <مفتاح> <نص>`');
        const hmac = crypto.createHmac('sha256', key).update(text).digest('hex');
        return message.reply(`**🔐 HMAC-SHA256:**\n\`${hmac}\`\n🔑 المفتاح: \`${key}\`\n📝 النص: \`${text}\``);
    }
};

const vigenere = {
    name: 'vigenere', aliases: ['فيجنير'],
    description: 'تشفير/فك تشفير Vigenère',
    async execute(message, args) {
        const mode = args[1]?.toLowerCase();
        const key  = (args[2] || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
        const text = args.slice(3).join(' ');
        if (!['encode','decode'].includes(mode) || !key || !text) {
            return message.reply('❌ الصيغة: `!vigenere encode/decode <مفتاح_إنجليزي> <نص>`');
        }
        const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let out = '', ki = 0;
        for (const ch of text.toUpperCase()) {
            if (alpha.includes(ch)) {
                const shift = key[ki % key.length].charCodeAt(0) - 65;
                const idx   = alpha.indexOf(ch);
                if (mode === 'encode') out += alpha[(idx + shift) % 26];
                else out += alpha[(idx - shift + 26) % 26];
                ki++;
            } else { out += ch; }
        }
        return message.reply(`**🔐 Vigenère ${mode==='encode'?'تشفير':'فك تشفير'}:**\n\`${out}\``);
    }
};

// ── قسم 16: أدوات عامة ─────────────────────────────────────────────
const timer = {
    name: 'timer', aliases: ['مؤقت'],
    description: 'مؤقت مرئي بالثواني مع عداد تصاعدي',
    async execute(message, args) {
        const secs  = Math.min(parseInt(args[1]) || 10, 120);
        const label = args.slice(2).join(' ') || 'المؤقت';
        const start = Date.now();
        const sent  = await message.reply(`⏱️ **${label}** — \`0s / ${secs}s\``);
        for (let i = 1; i <= secs; i++) {
            await delay(1000);
            const bar = '█'.repeat(Math.round(i/secs*10)) + '░'.repeat(10 - Math.round(i/secs*10));
            await sent.edit(`⏱️ **${label}** — \`${i}s / ${secs}s\` [${bar}]`).catch(()=>{});
        }
        await sent.edit(`✅ **${label}** — انتهى الوقت! \`${secs}s\` ⏰`).catch(()=>{});
    }
};

const remind4 = {
    name: 'remind4', aliases: ['r4','تذكير4'],
    description: 'تذكير مع تكرار دوري',
    async execute(message, args) {
        const mins   = Math.min(parseInt(args[1]) || 5, 60);
        const times  = Math.min(parseInt(args[2]) || 3, 10);
        const text   = args.slice(3).join(' ') || 'تذكير Snodix!';
        await message.delete().catch(() => {});
        await message.channel.send(`⏰ **تذكير مكرر** — سيُذكِّرك بـ \`${text}\` كل \`${mins}\` دقيقة لـ \`${times}\` مرات.`);
        for (let i = 1; i <= times; i++) {
            await delay(mins * 60000);
            await message.channel.send(`🔔 **[${i}/${times}] تذكير:** ${text}`);
        }
    }
};

const listcmds = {
    name: 'listcmds', aliases: ['allcmds','قائمة_الكل'],
    description: 'قائمة أبجدية بكل الأوامر المحملة',
    async execute(message, args, commandManager) {
        const all = [...commandManager.commands.keys()].sort();
        const chunks = [];
        for (let i = 0; i < all.length; i += 40) {
            chunks.push(all.slice(i, i+40).map(c=>`\`${c}\``).join(' '));
        }
        for (const chunk of chunks) {
            await message.channel.send(`**📋 الأوامر:**\n${chunk}`);
            await delay(500);
        }
    }
};

const uptime3 = {
    name: 'uptime3', aliases: ['ut3','وقت_التشغيل'],
    description: 'وقت تشغيل البوت بتفاصيل دقيقة',
    async execute(message, args, commandManager) {
        const ms   = Date.now() - commandManager.startTime;
        const d    = Math.floor(ms/86400000);
        const h    = Math.floor((ms%86400000)/3600000);
        const m    = Math.floor((ms%3600000)/60000);
        const s    = Math.floor((ms%60000)/1000);
        const mem  = (process.memoryUsage().rss/1024/1024).toFixed(1);
        return message.reply(
            `**⏱️ وقت التشغيل:**\n${COLS}\n` +
            `📅 الأيام: \`${d}\`\n` +
            `⏰ الساعات: \`${h}\`\n` +
            `🕐 الدقائق: \`${m}\`\n` +
            `⚡ الثواني: \`${s}\`\n` +
            `💾 RAM: \`${mem} MB\`\n` +
            `🖥️ Node.js: \`${process.version}\``
        );
    }
};

const rng = {
    name: 'rng4', aliases: ['randomnum4','رقم_عشوائي4'],
    description: 'توليد أرقام عشوائية مع إحصائيات',
    async execute(message, args) {
        const min   = parseInt(args[1]) || 1;
        const max   = parseInt(args[2]) || 100;
        const count = Math.min(parseInt(args[3]) || 1, 20);
        if (min >= max) return message.reply('❌ الحد الأدنى يجب أن يكون أقل من الحد الأقصى');
        const nums = Array.from({ length: count }, () => Math.floor(Math.random()*(max-min+1))+min);
        const avg  = (nums.reduce((a,b)=>a+b,0)/count).toFixed(1);
        return message.reply(
            `**🎲 أرقام عشوائية (${count}) من ${min} إلى ${max}:**\n` +
            `\`${nums.join(' · ')}\`\n` +
            `📊 المتوسط: \`${avg}\` | أعلى: \`${Math.max(...nums)}\` | أدنى: \`${Math.min(...nums)}\``
        );
    }
};

const wordofday = {
    name: 'wordofday3', aliases: ['wod3','كلمة_اليوم3'],
    description: 'كلمة اليوم مع تعريفها واستخدامها',
    async execute(message) {
        const words = [
            { word:'Ephemeral', ar:'عابر', def:'شيء يدوم فترة قصيرة جداً', ex:'الشهرة عابرة.' },
            { word:'Serendipity', ar:'صدفة سعيدة', def:'اكتشاف شيء جميل بالمصادفة', ex:'لقاؤنا كان صدفة سعيدة.' },
            { word:'Luminous', ar:'مضيء', def:'مشع وساطع بقوة', ex:'نجوم الليل مضيئة.' },
            { word:'Resilience', ar:'مرونة', def:'القدرة على التعافي من الصعاب', ex:'المرونة مفتاح النجاح.' },
            { word:'Eloquent', ar:'بليغ', def:'التعبير بطريقة مؤثرة ومقنعة', ex:'خطابه كان بليغاً.' },
            { word:'Tenacity', ar:'مثابرة', def:'الإصرار والتمسك بالهدف', ex:'بالمثابرة تُحقق المستحيل.' },
            { word:'Serenity', ar:'هدوء', def:'حالة من الهدوء والسكينة التامة', ex:'وجدت الهدوء في الطبيعة.' },
        ];
        const w = words[new Date().getDate() % words.length];
        return message.reply(
            `**📖 كلمة اليوم:**\n${COLS}\n` +
            `🔤 **${w.word}** ← \`${w.ar}\`\n` +
            `📝 التعريف: ${w.def}\n` +
            `💬 مثال: ${w.ex}`
        );
    }
};

module.exports = [
    // Section 1
    slowspam, counterspam, rotatespam,
    // Section 2
    showperms2, connectionstatus,
    // Section 3
    serverfeatures, serverboosts,
    // Section 4
    setnsfw, setchannel,
    // Section 6
    whoisonline,
    // Section 7
    aiemoji, aistory,
    // Section 8
    mathquiz, wordchain, colorguess,
    // Section 9
    autotype2,
    // Section 10
    wingdings2, braille, reverse2, textjoin,
    // Section 11
    bmi, ascii2num, num2ascii,
    // Section 12
    rpctemplate, rpclist,
    // Section 14
    reactall, bulkforward, autoedit2, massreact2,
    // Section 15
    hmacgen, vigenere,
    // Section 16
    timer, remind4, listcmds, uptime3, rng, wordofday,
];
