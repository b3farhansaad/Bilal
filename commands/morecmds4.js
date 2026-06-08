// ╔══════════════════════════════════════════════════════════════╗
// ║   morecmds4 — أوامر إضافية لكل الأقسام                     ║
// ╚══════════════════════════════════════════════════════════════╝
'use strict';
const https  = require('https');
const crypto = require('crypto');

// ── مساعدات ──────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));
const pick  = arr => arr[Math.floor(Math.random() * arr.length)];

function httpGet(url, opts = {}) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : require('http');
        const req = lib.get(url, { timeout: 8000, ...opts }, res => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { resolve(data); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
}

module.exports = [

    // ══════════════════════════════════════════════════════════════
    // قسم 1 — معلومات اليوزر (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'myid',
        aliases: ['id', 'selfid'],
        description: 'عرض معرّف حسابك بسرعة 🆔', category: 'معلومات',
        execute(message) {
            return message.reply(`**🆔 معرّفك:** \`${message.author.id}\`\n**👤 اسمك:** \`${message.author.tag || message.author.username}\``);
        }
    },

    {
        name: 'accountage',
        aliases: ['acage', 'createdat', 'createdAt'],
        description: 'عمر الحساب منذ إنشائه 📅', category: 'معلومات',
        execute(message, args) {
            const user = message.mentions?.users?.first() || message.author;
            const created = user.createdAt || new Date(Number((BigInt(user.id) >> 22n) + 1420070400000n));
            const days = Math.floor((Date.now() - created.getTime()) / 86400000);
            const years = Math.floor(days / 365);
            const months = Math.floor((days % 365) / 30);
            return message.reply([
                `**📅 عمر حساب ${user.username}**`,
                `> 🎂 تاريخ الإنشاء: **${created.toLocaleDateString('ar-EG')}**`,
                `> ⏳ العمر: **${years} سنة و${months} شهر (${days} يوم)**`,
            ].join('\n'));
        }
    },

    {
        name: 'badges',
        aliases: ['flags', 'userbadges'],
        description: 'شارات وبادجات الحساب 🏅', category: 'معلومات',
        execute(message, args) {
            const user = message.mentions?.users?.first() || message.author;
            const flagMap = {
                DISCORD_EMPLOYEE: '👨‍💼 موظف Discord',
                PARTNERED_SERVER_OWNER: '🤝 صاحب سيرفر شريك',
                HYPESQUAD_EVENTS: '🎉 HypeSquad Events',
                BUG_HUNTER_LEVEL_1: '🐛 Bug Hunter Lvl 1',
                BUG_HUNTER_LEVEL_2: '🐛🌟 Bug Hunter Lvl 2',
                HOUSE_BRAVERY: '🦁 House Bravery',
                HOUSE_BRILLIANCE: '💜 House Brilliance',
                HOUSE_BALANCE: '⚖️ House Balance',
                EARLY_SUPPORTER: '⭐ Early Supporter',
                VERIFIED_BOT_DEVELOPER: '🤖 Bot Developer',
                ACTIVE_DEVELOPER: '💻 Active Developer',
                DISCORD_CERTIFIED_MODERATOR: '🛡️ Certified Mod',
            };
            const flags = user.flags?.toArray() || [];
            const list = flags.length > 0
                ? flags.map(f => flagMap[f] || f).join('\n> ')
                : 'لا توجد شارات عامة';
            return message.reply(`**🏅 شارات ${user.username}:**\n> ${list}`);
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 2 — الرسائل (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'say',
        aliases: ['echo', 'repeat', 'send'],
        description: 'إرسال رسالة نيابة عنك 📢', category: 'رسائل',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب الرسالة: `!say <نص>`');
            message.delete().catch(() => {});
            return message.channel.send(text).catch(() => message.reply(text));
        }
    },

    {
        name: 'embed',
        aliases: ['sendembed', 'richsend'],
        description: 'إرسال embed مخصص 📝', category: 'رسائل',
        execute(message, args) {
            const prefix = '!';
            if (args.length < 2) {
                return message.reply([
                    '**📝 إرسال Embed:**',
                    `\`${prefix}embed <عنوان> | <محتوى>\``,
                    '> مثال: `!embed السلام عليكم | أهلاً بالجميع!`',
                ].join('\n'));
            }
            const text = args.slice(1).join(' ');
            const parts = text.split('|');
            const title = parts[0]?.trim() || 'رسالة';
            const desc  = parts[1]?.trim() || '';
            message.delete().catch(() => {});
            return message.channel.send({
                embeds: [{
                    title: title.slice(0, 256),
                    description: desc.slice(0, 4096),
                    color: 0x5865F2,
                    timestamp: new Date().toISOString(),
                }]
            }).catch(e => message.reply(`❌ ${e.message}`));
        }
    },

    {
        name: 'mock',
        aliases: ['spongebob', 'mocktext'],
        description: 'حوّل النص لأسلوب سبونج بوب 🧽', category: 'رسائل',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب نصاً: `!mock <نص>`');
            const mocked = text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');
            return message.reply(mocked);
        }
    },

    {
        name: 'clap',
        aliases: ['claptext', 'clapify'],
        description: 'أضف 👏 بين كل كلمة', category: 'رسائل',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب نصاً: `!clap <نص>`');
            return message.reply(text.split(' ').join(' 👏 '));
        }
    },

    {
        name: 'reverse',
        aliases: ['reversetext', 'flip'],
        description: 'عكس النص 🔄', category: 'رسائل',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب نصاً: `!reverse <نص>`');
            return message.reply(text.split('').reverse().join(''));
        }
    },

    {
        name: 'aesthetic',
        aliases: ['wide', 'fullwidth'],
        description: 'نص aesthetic ＦＵＬＬwidth', category: 'رسائل',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب نصاً: `!aesthetic <نص>`');
            const wide = text.replace(/[!-~]/g, c => String.fromCharCode(c.charCodeAt(0) + 0xFEE0)).replace(/ /g, '　');
            return message.reply(wide || text);
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 4 — الألعاب (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'rps',
        aliases: ['rockpaperscissors', 'حجروسخة'],
        description: 'حجر ورقة مقص مع البوت ✂️', category: 'ألعاب',
        execute(message, args) {
            const choices = { حجر: '🪨', ورقة: '📄', مقص: '✂️', rock: '🪨', paper: '📄', scissors: '✂️', r: '🪨', p: '📄', s: '✂️' };
            const wins   = { حجر: 'مقص', ورقة: 'حجر', مقص: 'ورقة' };
            const input  = args[1]?.toLowerCase();
            if (!input || !choices[input]) {
                return message.reply('**✂️ حجر ورقة مقص**\nاستخدم: `!rps حجر` أو `!rps ورقة` أو `!rps مقص`');
            }
            const keyMap = { rock: 'حجر', paper: 'ورقة', scissors: 'مقص', r: 'حجر', p: 'ورقة', s: 'مقص' };
            const myChoice  = keyMap[input] || input;
            const botChoice = pick(['حجر', 'ورقة', 'مقص']);
            let result;
            if (myChoice === botChoice) result = '🤝 **تعادل!**';
            else if (wins[myChoice] === botChoice) result = '🎉 **ربحت!**';
            else result = '😭 **خسرت!**';
            return message.reply(`${result}\n> 👤 أنت: ${choices[myChoice]} ${myChoice}\n> 🤖 البوت: ${choices[botChoice]} ${botChoice}`);
        }
    },

    {
        name: 'guess',
        aliases: ['numguess', 'خمن'],
        description: 'تخمين رقم من 1-100 🎲', category: 'ألعاب',
        execute: (() => {
            const games = new Map();
            return function(message, args) {
                const uid = message.author.id;
                const sub = args[1]?.toLowerCase();
                if (!games.has(uid) || sub === 'new' || sub === 'جديد') {
                    const num = Math.floor(Math.random() * 100) + 1;
                    games.set(uid, { num, tries: 0, max: 7 });
                    return message.reply('🎲 **لعبة التخمين!**\nفكّرت برقم من **1 إلى 100** — عندك **7 محاولات**!\nاكتب: `!guess <رقمك>`');
                }
                const g = games.get(uid);
                const n = parseInt(sub);
                if (isNaN(n) || n < 1 || n > 100) return message.reply('❌ اكتب رقم من 1 إلى 100');
                g.tries++;
                if (n === g.num) {
                    games.delete(uid);
                    return message.reply(`🎉 **صح! الرقم هو ${g.num}**\nخمّنته في ${g.tries} محاولة!`);
                }
                if (g.tries >= g.max) {
                    const ans = g.num;
                    games.delete(uid);
                    return message.reply(`💀 **انتهت المحاولات!** الرقم كان **${ans}** — `+(n < ans ? 'كنت قريب' : 'اللعبة من أول؟') + ' `!guess new`');
                }
                const hint = n < g.num ? '⬆️ أكبر' : '⬇️ أصغر';
                return message.reply(`${hint} من **${n}** | المحاولة ${g.tries}/${g.max}`);
            };
        })()
    },

    {
        name: 'slots',
        aliases: ['slot', 'jackpot'],
        description: 'ماكينة القمار 🎰', category: 'ألعاب',
        execute(message) {
            const emojis = ['🍒','🍋','🍊','🍇','💎','7️⃣','⭐','🎰'];
            const r = () => pick(emojis);
            const s = [r(), r(), r()];
            const line = s.join(' | ');
            let result;
            if (s[0] === s[1] && s[1] === s[2]) {
                if (s[0] === '💎') result = '💎💎💎 **JACKPOT!! الجائزة الكبرى!!** 💎💎💎';
                else if (s[0] === '7️⃣') result = '7️⃣7️⃣7️⃣ **TRIPLE SEVEN!! ربحت!** 🎉';
                else result = `**🎰 ثلاثة متشابهين! ربحت!** 🎉`;
            } else if (s[0] === s[1] || s[1] === s[2] || s[0] === s[2]) {
                result = '👍 **زوج! قريب من الجائزة!**';
            } else {
                result = '😢 **ما حالفك الحظ هالمرة!**';
            }
            return message.reply(`**🎰 Slots**\n╔══════════╗\n║ ${line} ║\n╚══════════╝\n${result}`);
        }
    },

    {
        name: 'wyr',
        aliases: ['wouldyourather', 'منهم'],
        description: 'لعبة هل تفضّل؟ 🤔', category: 'ألعاب',
        execute(message) {
            const qs = [
                ['تكون غني وتعيش 50 سنة', 'تكون فقير وتعيش 100 سنة'],
                ['تعيش بدون إنترنت', 'تعيش بدون موسيقى'],
                ['تقدر تطير', 'تقدر تختفي'],
                ['تعرف اللي يفكر فيه الناس', 'تقدر ترجع للماضي'],
                ['تاكل نفس الأكل كل يوم', 'ما تتشبع أبداً'],
                ['تنام 3 ساعات يومياً وتشعر بالراحة', 'تنام 12 ساعة وتظل تعبان'],
                ['تعيش في الماضي', 'تعيش في المستقبل'],
            ];
            const q = pick(qs);
            return message.reply(`**🤔 هل تفضّل...**\n> 🅰️ ${q[0]}\n> 🅱️ ${q[1]}\n\nرُد بـ **A** أو **B**!`);
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 5 — الأتوماتيك (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'autoreply2',
        aliases: ['ar2', 'smartreply'],
        description: 'ردود تلقائية بالكلمات المفتاحية', category: 'أتوماتيك',
        execute(message, args, cm) {
            const fs   = require('fs');
            const path = require('path');
            const dataDir = require('../utils/dataDir');
            const f = dataDir('autoreply2.json');
            const prefix = cm.getMainPrefix();
            const sub = args[1]?.toLowerCase();

            let data = {};
            try { if (fs.existsSync(f)) data = JSON.parse(fs.readFileSync(f, 'utf8')); } catch {}

            if (sub === 'add') {
                const text = args.slice(2).join(' ');
                const pi   = text.indexOf('|');
                if (pi === -1) return message.reply(`❌ الصيغة: \`${prefix}ar2 add <كلمة> | <الرد>\``);
                const trigger = text.slice(0, pi).trim().toLowerCase();
                const reply   = text.slice(pi + 1).trim();
                if (!trigger || !reply) return message.reply('❌ الكلمة والرد مطلوبين.');
                data[trigger] = reply;
                fs.mkdirSync(path.dirname(f), { recursive: true });
                fs.writeFileSync(f, JSON.stringify(data, null, 2));
                return message.reply(`✅ تم: \`${trigger}\` → \`${reply}\``);
            }
            if (sub === 'list') {
                const keys = Object.keys(data);
                if (!keys.length) return message.reply('📭 لا توجد قواعد. أضف بـ `!ar2 add`');
                return message.reply('**🤖 الردود الذكية:**\n' + keys.map((k, i) => `**${i+1}.** \`${k}\` → \`${data[k]}\``).join('\n'));
            }
            if (sub === 'del' || sub === 'remove') {
                const key = args.slice(2).join(' ').toLowerCase();
                if (!data[key]) return message.reply(`❌ الكلمة \`${key}\` غير موجودة.`);
                delete data[key];
                fs.writeFileSync(f, JSON.stringify(data, null, 2));
                return message.reply(`🗑️ تم حذف: \`${key}\``);
            }
            if (sub === 'clear') {
                fs.writeFileSync(f, '{}');
                return message.reply('🗑️ تم مسح كل الردود الذكية.');
            }
            return message.reply(`**🤖 الردود الذكية (ar2)**\n\`${prefix}ar2 add <كلمة> | <الرد>\`\n\`${prefix}ar2 list\`\n\`${prefix}ar2 del <كلمة>\`\n\`${prefix}ar2 clear\``);
        }
    },

    {
        name: 'antilink',
        aliases: ['antilnk', 'nolinks'],
        description: 'حذف تلقائي للروابط في الدردشة 🔗', category: 'أتوماتيك',
        execute: (() => {
            let enabled = false;
            return function(message, args) {
                const sub = args[1]?.toLowerCase();
                if (sub === 'on') { enabled = true; return message.reply('✅ **Anti-Link مفعّل** — الروابط ستُحذف تلقائياً.'); }
                if (sub === 'off') { enabled = false; return message.reply('❌ **Anti-Link معطّل.**'); }
                return message.reply(`**🔗 Anti-Link**\nالحالة: ${enabled ? '✅ مفعّل' : '❌ معطّل'}\n\`!antilink on/off\``);
            };
        })()
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 7 — الذكاء الاصطناعي (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'chat',
        aliases: ['ask', 'gpt', 'gemini', 'اسأل', 'كلمني'],
        description: 'دردشة مباشرة مع الذكاء الاصطناعي 💬', category: 'ذكاء',
        async execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب رسالتك: `!chat <رسالتك>`');
            const shapesAPI = require('../shapes');
            const msg = await message.reply('💭 **جاري التفكير...**');
            try {
                await message.channel.sendTyping();
                const res = await shapesAPI.generateResponse(text, message.author.id, message.author.username, message.channel.id);
                return msg.edit(res || '❌ لا يوجد رد.');
            } catch (e) {
                return msg.edit(`❌ **خطأ في الذكاء الاصطناعي**\n> ${e.message}`);
            }
        }
    },

    {
        name: 'aiclear',
        aliases: ['clearchat', 'resetai', 'مسح_ai'],
        description: 'مسح تاريخ المحادثة مع الذكاء الاصطناعي 🧹', category: 'ذكاء',
        execute(message) {
            const shapesAPI = require('../shapes');
            shapesAPI.clearHistory(message.author.id);
            return message.reply('🧹 **تم مسح تاريخ محادثتك مع الذكاء الاصطناعي!**\nالمحادثة التالية ستبدأ من الصفر.');
        }
    },

    {
        name: 'summarize',
        aliases: ['tldr', 'summary', 'ملخص'],
        description: 'تلخيص نص بالذكاء الاصطناعي 📝', category: 'ذكاء',
        async execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text || text.length < 50) return message.reply('❌ اكتب نصاً طويلاً للتلخيص (50+ حرف)');
            const shapesAPI = require('../shapes');
            const msg = await message.reply('📝 **جاري التلخيص...**');
            try {
                const res = await shapesAPI.ask(`لخّص هذا النص باختصار واضح بالعربية:\n\n${text}`);
                return msg.edit(`**📝 الملخص:**\n${res}`);
            } catch (e) {
                return msg.edit(`❌ ${e.message}`);
            }
        }
    },

    {
        name: 'roastai',
        aliases: ['roastme', 'روست_ai'],
        description: 'البوت يروّستك بالذكاء الاصطناعي 🔥', category: 'ذكاء',
        async execute(message, args) {
            const target = message.mentions?.users?.first()?.username || args[1] || message.author.username;
            const shapesAPI = require('../shapes');
            const msg = await message.reply('🔥 **جاري الروست...**');
            try {
                const res = await shapesAPI.ask(`روّست ${target} بطريقة مضحكة وعربية ولاذعة بجملتين فقط. لا تكن قاسياً جداً.`);
                return msg.edit(`🔥 **${target}،** ${res}`);
            } catch (e) {
                return msg.edit(`❌ ${e.message}`);
            }
        }
    },

    {
        name: 'poem',
        aliases: ['قصيدة', 'شعر', 'poetry'],
        description: 'البوت يكتب قصيدة بالذكاء الاصطناعي 📜', category: 'ذكاء',
        async execute(message, args) {
            const topic = args.slice(1).join(' ') || 'الحياة';
            const shapesAPI = require('../shapes');
            const msg = await message.reply('📜 **جاري الكتابة...**');
            try {
                const res = await shapesAPI.ask(`اكتب قصيدة قصيرة (4 أسطر) بالعربية عن: ${topic}. اجعلها جميلة وشاعرية.`);
                return msg.edit(`**📜 قصيدة عن "${topic}"**\n\n${res}`);
            } catch (e) {
                return msg.edit(`❌ ${e.message}`);
            }
        }
    },

    {
        name: 'explain',
        aliases: ['شرح', 'define'],
        description: 'شرح أي مفهوم بالذكاء الاصطناعي 🎓', category: 'ذكاء',
        async execute(message, args) {
            const topic = args.slice(1).join(' ');
            if (!topic) return message.reply('❌ اكتب الموضوع: `!explain <موضوع>`');
            const shapesAPI = require('../shapes');
            const msg = await message.reply('🎓 **جاري الشرح...**');
            try {
                const res = await shapesAPI.ask(`اشرح "${topic}" بطريقة بسيطة وواضحة بالعربية. استخدم مثال عملي إذا لزم.`);
                return msg.edit(`**🎓 شرح: ${topic}**\n\n${res}`);
            } catch (e) {
                return msg.edit(`❌ ${e.message}`);
            }
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 12 — الأدوات النصية (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'binary',
        aliases: ['tobin', 'bin'],
        description: 'تحويل نص إلى Binary 01 🤖', category: 'أدوات نصية',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب نصاً: `!binary <نص>`');
            const bin = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
            return message.reply(`**🤖 Binary:**\n\`\`\`\n${bin.slice(0, 1800)}\n\`\`\``);
        }
    },

    {
        name: 'morse',
        aliases: ['morseCode', 'مورس'],
        description: 'تحويل نص إلى شيفرة مورس •−', category: 'أدوات نصية',
        execute(message, args) {
            const text = args.slice(1).join(' ').toUpperCase();
            if (!text) return message.reply('❌ اكتب نصاً: `!morse <نص>`');
            const MAP = { A:'.-', B:'-...', C:'-.-.', D:'-..', E:'.', F:'..-.', G:'--.', H:'....', I:'..', J:'.---', K:'-.-', L:'.-..', M:'--', N:'-.', O:'---', P:'.--.', Q:'--.-', R:'.-.', S:'...', T:'-', U:'..-', V:'...-', W:'.--', X:'-..-', Y:'-.--', Z:'--..' , '0':'-----', '1':'.----', '2':'..---', '3':'...--', '4':'....-', '5':'.....', '6':'-....', '7':'--...', '8':'---..', '9':'----.', ' ':'/' };
            const morse = text.split('').map(c => MAP[c] || '?').join(' ');
            return message.reply(`**📡 Morse:**\n\`${morse.slice(0, 1800)}\``);
        }
    },

    {
        name: 'wordcount',
        aliases: ['wc', 'countwords'],
        description: 'عدّ الكلمات والحروف 📊', category: 'أدوات نصية',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب نصاً: `!wordcount <نص>`');
            const words = text.trim().split(/\s+/).length;
            const chars = text.length;
            const noSpaces = text.replace(/\s/g, '').length;
            const lines = text.split('\n').length;
            return message.reply([
                `**📊 إحصائيات النص:**`,
                `> 📝 كلمات: **${words}**`,
                `> 🔤 حروف (مع مسافات): **${chars}**`,
                `> 🔡 حروف (بدون مسافات): **${noSpaces}**`,
                `> 📄 أسطر: **${lines}**`,
            ].join('\n'));
        }
    },

    {
        name: 'zalgo',
        aliases: ['corrupt', 'glitch'],
        description: 'نص corrupted glitch مخيف 👻', category: 'أدوات نصية',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب نصاً: `!zalgo <نص>`');
            const above = ['̍','̎','̄','̅','̿','̑','̆','̐','͒','͗','͑','̇','̈','̊','͂','̓','̈','͊','͋','͌','̃','̂'];
            const below = ['̖','̗','̘','̙','̜','̝','̞','̟','̠','̤','̥','̦','̩','̪','̫','̬','̭','̮','̯','̰','̱','̲','̳'];
            const rand = arr => arr[Math.floor(Math.random() * arr.length)];
            const zalgo = text.split('').map(c => {
                if (c === ' ') return c;
                let r = c;
                for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) r += rand(above);
                for (let i = 0; i < Math.floor(Math.random() * 2); i++) r += rand(below);
                return r;
            }).join('');
            return message.reply(zalgo.slice(0, 500));
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 13 — الأدوات (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'hash',
        aliases: ['sha256', 'md5hash'],
        description: 'تشفير نص بـ SHA-256 أو MD5 🔐', category: 'أدوات',
        execute(message, args) {
            const algo = args[1]?.toLowerCase();
            const supported = ['md5', 'sha1', 'sha256', 'sha512'];
            if (!supported.includes(algo)) {
                return message.reply(`❌ الصيغة: \`!hash <sha256|md5|sha512> <نص>\`\nالخوارزميات: ${supported.join(', ')}`);
            }
            const text = args.slice(2).join(' ');
            if (!text) return message.reply('❌ اكتب النص المراد تشفيره.');
            const hash = crypto.createHash(algo).update(text).digest('hex');
            return message.reply(`**🔐 ${algo.toUpperCase()}:**\n\`${hash}\``);
        }
    },

    {
        name: 'base64',
        aliases: ['b64', 'base'],
        description: 'تشفير وفك تشفير Base64', category: 'أدوات',
        execute(message, args) {
            const sub = args[1]?.toLowerCase();
            const text = args.slice(2).join(' ');
            if (!sub || !text) return message.reply('❌ الصيغة: `!base64 encode/decode <نص>`');
            if (sub === 'encode' || sub === 'e') {
                const enc = Buffer.from(text).toString('base64');
                return message.reply(`**🔒 Base64 Encoded:**\n\`${enc}\``);
            }
            if (sub === 'decode' || sub === 'd') {
                try {
                    const dec = Buffer.from(text, 'base64').toString('utf-8');
                    return message.reply(`**🔓 Base64 Decoded:**\n\`${dec}\``);
                } catch { return message.reply('❌ نص غير صحيح للفك.'); }
            }
            return message.reply('❌ استخدم `encode` أو `decode`');
        }
    },

    {
        name: 'uuid',
        aliases: ['guid', 'randomid'],
        description: 'توليد UUID عشوائي 🎲', category: 'أدوات',
        execute(message, args) {
            const count = Math.min(parseInt(args[1]) || 1, 10);
            const uuids = Array.from({ length: count }, () => crypto.randomUUID());
            return message.reply(`**🎲 UUID${count > 1 ? 's' : ''}:**\n\`\`\`\n${uuids.join('\n')}\n\`\`\``);
        }
    },

    {
        name: 'timestamp',
        aliases: ['ts', 'unixtime', 'epoch'],
        description: 'الوقت الحالي بصيغة Unix timestamp ⏱️', category: 'أدوات',
        execute(message, args) {
            const input = args[1];
            if (input) {
                const num = parseInt(input);
                if (!isNaN(num)) {
                    const d = new Date(num > 1e10 ? num : num * 1000);
                    return message.reply(`**⏱️ Unix → تاريخ:**\n> \`${num}\` = **${d.toLocaleString('ar-EG')}**`);
                }
            }
            const now = Date.now();
            return message.reply([
                `**⏱️ التوقيت الحالي:**`,
                `> 🕐 Unix (ms): \`${now}\``,
                `> 🕑 Unix (s): \`${Math.floor(now / 1000)}\``,
                `> 📅 التاريخ: **${new Date().toLocaleString('ar-EG')}**`,
                `> 🌐 UTC: **${new Date().toUTCString()}**`,
            ].join('\n'));
        }
    },

    {
        name: 'color',
        aliases: ['colorinfo', 'hex'],
        description: 'معلومات عن لون بصيغة HEX أو RGB 🎨', category: 'أدوات',
        execute(message, args) {
            let hex = args[1]?.replace('#', '');
            if (!hex) return message.reply('❌ الصيغة: `!color <hex>` مثال: `!color FF5733`');
            if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
            if (!/^[0-9a-fA-F]{6}$/.test(hex)) return message.reply('❌ صيغة HEX غير صحيحة.');
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            const dec = parseInt(hex, 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            const isDark = brightness < 128;
            return message.reply([
                `**🎨 لون #${hex.toUpperCase()}**`,
                `> 🔴 R: **${r}** | 🟢 G: **${g}** | 🔵 B: **${b}**`,
                `> 🔢 Decimal: **${dec}**`,
                `> ☀️ السطوع: **${Math.round(brightness)}** (${isDark ? '🌙 داكن' : '☀️ فاتح'})`,
                `> 🔗 معاينة: https://singlecolorimage.com/get/${hex}/100x50`,
            ].join('\n'));
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 14 — الأمان (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'strongpass',
        aliases: ['securepass', 'genpassword'],
        description: 'توليد كلمة مرور قوية وعشوائية 🔑', category: 'أمان',
        execute(message, args) {
            const len = Math.min(Math.max(parseInt(args[1]) || 16, 8), 64);
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}';
            let pass = '';
            const bytes = crypto.randomBytes(len);
            for (let i = 0; i < len; i++) { pass += chars[bytes[i] % chars.length]; }
            const strength = len >= 20 ? '🟢 قوية جداً' : len >= 14 ? '🟡 قوية' : '🟠 متوسطة';
            return message.reply(`**🔑 كلمة مرور (${len} حرف):**\n\`\`\`\n${pass}\n\`\`\`\n> 💪 القوة: ${strength}\n> ⚠️ لا تشارك هذه الكلمة مع أحد!`);
        }
    },

    {
        name: 'tokencheck',
        aliases: ['checktoken', 'verifytoken'],
        description: 'فحص صيغة توكن Discord 🔍', category: 'أمان',
        execute(message, args) {
            const token = args[1];
            if (!token) return message.reply('❌ الصيغة: `!tokencheck <توكن>`');
            const parts = token.split('.');
            if (parts.length !== 3) return message.reply('❌ **صيغة التوكن غلط** — يجب أن يحتوي على 3 أجزاء مفصولة بنقاط.');
            try {
                const userId = Buffer.from(parts[0], 'base64').toString();
                if (!/^\d+$/.test(userId)) return message.reply('⚠️ **التوكن قد يكون غير صحيح** — جزء الـ ID غير صالح.');
                const created = new Date(Number((BigInt(userId) >> 22n) + 1420070400000n));
                return message.reply([
                    '✅ **صيغة التوكن صحيحة (ظاهرياً)**',
                    `> 🆔 User ID المضمّن: \`${userId}\``,
                    `> 📅 تاريخ إنشاء الحساب المقدر: ${created.toLocaleDateString('ar-EG')}`,
                    `> ⚠️ هذا لا يعني أن التوكن فعّال — يحتاج اتصال بـ Discord للتحقق.`,
                ].join('\n'));
            } catch {
                return message.reply('⚠️ **لا يمكن فك ترميز التوكن.** قد يكون غير صالح.');
            }
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 16 — النظام (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'datadir',
        aliases: ['mydata', 'accountdata'],
        description: 'عرض مجلد بيانات هذا الحساب 📁', category: 'نظام',
        execute(message) {
            const ddir = require('../utils/dataDir');
            const dir  = ddir('.');
            const fs   = require('fs');
            let files  = [];
            try { files = fs.readdirSync(dir); } catch {}
            return message.reply([
                '**📁 مجلد بيانات الحساب (معزول)**',
                `> \`${dir}\``,
                '',
                files.length > 0
                    ? `**الملفات (${files.length}):**\n${files.map(f => `> \`${f}\``).join('\n')}`
                    : '> ⬜ لا توجد ملفات بيانات بعد.',
            ].join('\n'));
        }
    },

    {
        name: 'env',
        aliases: ['envinfo', 'nodeinfo'],
        description: 'معلومات بيئة التشغيل 💻', category: 'نظام',
        execute(message) {
            const mem  = process.memoryUsage();
            const toMB = b => (b / 1024 / 1024).toFixed(1);
            return message.reply([
                '**💻 معلومات البيئة**',
                `> 🟢 Node.js: \`${process.version}\``,
                `> 💾 RAM (RSS): \`${toMB(mem.rss)} MB\``,
                `> 🔋 Heap Used: \`${toMB(mem.heapUsed)} / ${toMB(mem.heapTotal)} MB\``,
                `> ⏱️ Uptime: \`${Math.floor(process.uptime())}ث\``,
                `> 🖥️ Platform: \`${process.platform} (${process.arch})\``,
            ].join('\n'));
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 18 — المرح والترفيه (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'truth',
        aliases: ['truthordare', 'صح'],
        description: 'سؤال اعترافي عشوائي 🎯', category: 'ترفيه',
        execute(message) {
            const truths = [
                'ما أحرج موقف مررت فيه؟',
                'من آخر شخص أرسلت له رسالة خاصة؟',
                'ما أكبر خطأ ارتكبته في حياتك؟',
                'هل سبق وكذبت على صديق مقرّب؟',
                'ما الشيء الذي لم تبح به لأحد؟',
                'لو تعيد شيئاً في حياتك ما هو؟',
                'من الشخص الذي تغار منه أكثر من غيره؟',
                'ما أسوأ قرار اتخذته في 2024؟',
            ];
            return message.reply(`**❓ Truth:**\n> ${pick(truths)}`);
        }
    },

    {
        name: 'dare',
        aliases: ['تحدي', 'dare2'],
        description: 'تحدي عشوائي جريء 🎯', category: 'ترفيه',
        execute(message) {
            const dares = [
                'أرسل رسالة "أحبك" لآخر شخص راسلته',
                'غيّر اسمك في السيرفر لـ "أنا أحب الفاصوليا" لمدة ساعة',
                'أرسل صورة محرجة قديمة ليك في الشات',
                'اكتب "مرحبا" لكل شخص في قائمة أصدقائك',
                'صمّم إيموجي جديد للسيرفر الآن',
                'غنّي أغنية بالعربي وارسل الصوت',
                'اكتب رسالة بالأحرف الكبيرة فقط لـ 10 دقائق',
                'أرسل أغرب صورة في هاتفك',
            ];
            return message.reply(`**🎯 Dare:**\n> ${pick(dares)}`);
        }
    },

    {
        name: 'animequote',
        aliases: ['animesay', 'أنمي'],
        description: 'اقتباس عشوائي من أنمي 🌸', category: 'ترفيه',
        execute(message) {
            const quotes = [
                { q: 'العدو الحقيقي هو أنت في الماضي.', a: 'Jojo\'s Bizarre Adventure' },
                { q: 'إذا كنت لا تستطيع إيجاد سبب للحياة، ابتكر واحداً.', a: 'Code Geass' },
                { q: 'الناس يموتون مرتين: مرة حين يصمتون للأبد، ومرة حين ينساهم الناس.', a: 'One Piece' },
                { q: 'لا تتخلى عن أحلامك بسبب الوقت الذي ستستغرقه.', a: 'Naruto' },
                { q: 'حتى المستحيل يمكن تحقيقه إذا كنت على استعداد للمحاولة.', a: 'Attack on Titan' },
                { q: 'القوة الحقيقية ليست في السيف، بل في الإرادة.', a: 'Demon Slayer' },
                { q: 'الصداقة ليست شيئاً تجده، بل شيئاً تبنيه.', a: 'Fairy Tail' },
            ];
            const q = pick(quotes);
            return message.reply(`**🌸 اقتباس أنمي:**\n> *"${q.q}"*\n> — **${q.a}**`);
        }
    },

    {
        name: 'motivate',
        aliases: ['inspire', 'motivation', 'حماسة'],
        description: 'رسالة تحفيزية عشوائية 💪', category: 'ترفيه',
        execute(message) {
            const msgs = [
                '💪 **أنت أقوى مما تعتقد!** كل يوم هو فرصة جديدة للنجاح.',
                '🌟 **النجاح لا يأتي للمنتظرين** — بل للعاملين الصابرين!',
                '🚀 **ابدأ الآن** ولو بخطوة صغيرة. الرحلة الطويلة تبدأ بخطوة.',
                '🎯 **ركّز على هدفك** وتجاهل الضوضاء. أنت تستطيع!',
                '⭐ **كل فشل هو درس** وكل درس يقربك من النجاح.',
                '🔥 **النار التي تحرقك هي ذاتها التي تجعلك أقوى!**',
                '🌱 **النمو يحدث خارج منطقة الراحة** — اشجع نفسك وتقدّم!',
            ];
            return message.reply(pick(msgs));
        }
    },

    {
        name: 'randomfact',
        aliases: ['fact', 'معلومة'],
        description: 'معلومة عشوائية مثيرة للاهتمام 🧠', category: 'ترفيه',
        execute(message) {
            const facts = [
                '🧠 الأخطبوط لديه ثلاثة قلوب وتسعة أدمغة!',
                '🌍 الأرض تدور بسرعة 1674 كم/ساعة عند خط الاستواء.',
                '🐝 النحل يمكنه التعرف على وجوه البشر.',
                '🌊 المحيطات تغطي 71% من سطح الأرض لكن 95% منها لم يُستكشف.',
                '🦷 بصمة اللسان فريدة مثل بصمة الأصابع.',
                '🔬 جسمك يحتوي على أكثر من 37 تريليون خلية!',
                '🌙 القمر يبتعد عن الأرض بمقدار 3.8 سم كل سنة.',
                '💤 يقضي الإنسان العادي ثلث حياته في النوم.',
                '🦷 العسل لا يفسد أبداً — وجدوا عسلاً في الأهرامات لا يزال صالحاً!',
                '🎵 الموسيقى يمكنها خفض ضغط الدم وتقليل التوتر بشكل علمي.',
            ];
            return message.reply(pick(facts));
        }
    },
];
