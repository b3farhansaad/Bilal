// ╔══════════════════════════════════════════════════════╗
// ║  morecmds2.js — أوامر إضافية (حزمة 2) — Snodix v5  ║
// ╚══════════════════════════════════════════════════════╝
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
const DATA = path.join(__dirname, '../data');
function jLoad(f, d) { try { const p = path.join(DATA, f); if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch {} return d; }
function jSave(f, d) { try { fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(path.join(DATA, f), JSON.stringify(d, null, 2)); } catch {} }

module.exports = [

    // ════════════════════════════════════════════════════════════
    //  SECTION 1 — السبام والنشر
    // ════════════════════════════════════════════════════════════
    {
        name: 'emojispam', aliases: ['emojiflood', 'سبام_ايموجي'],
        description: 'إرسال إيموجي واحد N مرة', category: 'نشر',
        async execute(message, args, cm) {
            const count = Math.min(parseInt(args[1]) || 5, 15);
            const emoji = args[2] || '💥';
            await message.delete().catch(() => {});
            await message.channel.send((emoji + ' ').repeat(count).trim());
        }
    },
    {
        name: 'formatmsg', aliases: ['fmsg', 'رسالة_منسقة'],
        description: 'إرسال رسالة منسقة (بولد + إيطاليك + سبويلر)', category: 'نشر',
        async execute(message, args, cm) {
            const style = args[1]?.toLowerCase();
            const text = args.slice(2).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'formatmsg <bold/italic/spoiler/code/quote> <النص>`');
            const formats = { bold: '**' + text + '**', italic: '*' + text + '*', spoiler: '||' + text + '||', code: '`' + text + '`', quote: '> ' + text };
            const result = formats[style] || text;
            await message.delete().catch(() => {});
            await message.channel.send(result);
        }
    },
    {
        name: 'bigtext2', aliases: ['emojialpha2', 'نص_كبير2'],
        description: 'تحويل كل حرف لإيموجي Regional Indicator', category: 'نشر',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ').toLowerCase();
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'bigtext <النص>`');
            const result = text.split('').map(c => {
                if (c >= 'a' && c <= 'z') return ':regional_indicator_' + c + ': ';
                if (c === ' ') return '    ';
                if (c >= '0' && c <= '9') return ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'][parseInt(c)] + ' ';
                return c + ' ';
            }).join('');
            if (result.length > 1700) return message.reply('❌ النص طويل جداً!');
            message.reply(result.trim());
        }
    },
    {
        name: 'whisper', aliases: ['secretmsg', 'همس'],
        description: 'رسالة سرية تحذف نفسها بعد 10 ثواني', category: 'نشر',
        async execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'whisper <الرسالة السرية>`');
            await message.delete().catch(() => {});
            const m = await message.channel.send('🤫 **رسالة سرية** (تختفي بعد 10 ثواني)\n||' + text + '||');
            setTimeout(() => m.delete().catch(() => {}), 10000);
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 2 — الحساب
    // ════════════════════════════════════════════════════════════
    {
        name: 'accountscore', aliases: ['accscore', 'نقاط_حسابي'],
        description: 'تقييم أمان وقوة حسابك', category: 'حساب',
        execute(message) {
            const u = message.client.user;
            let score = 0; const tips = [];
            const created = new Date(Number((BigInt(u.id) >> 22n) + 1420070400000n));
            const ageDays = Math.floor((Date.now() - created.getTime()) / 86400000);
            if (ageDays > 365) { score += 30; } else if (ageDays > 90) { score += 15; } else tips.push('⚠️ الحساب جديد (أقل من 3 أشهر)');
            if (u.avatar) { score += 20; } else tips.push('⚠️ لا يوجد صورة بروفايل');
            if (u.discriminator && u.discriminator !== '0') score += 10;
            if (message.client.guilds.cache.size > 5) { score += 20; } else if (message.client.guilds.cache.size > 0) score += 10;
            score = Math.min(score + 20, 100);
            const levels = [[80, '🟢 ممتاز'], [60, '🟡 جيد'], [40, '🟠 متوسط'], [0, '🔴 ضعيف']];
            const [, level] = levels.find(([min]) => score >= min);
            message.reply([
                '**🏆 تقييم أمان حسابك**',
                '```',
                '📊 النقاط   : ' + score + '/100',
                '⭐ المستوى : ' + level,
                '📅 عمر الحساب: ' + ageDays + ' يوم',
                '🏠 السيرفرات : ' + message.client.guilds.cache.size,
                '```',
                tips.length ? '**نصائح:**\n' + tips.join('\n') : '✅ حسابك يبدو في حالة جيدة!'
            ].join('\n'));
        }
    },
    {
        name: 'setname', aliases: ['changename2', 'غير_الاسم'],
        description: 'تغيير اسم المستخدم الخاص بك', category: 'حساب',
        async execute(message, args, cm) {
            const name = args.slice(1).join(' ');
            if (!name) return message.reply('❌ `' + cm.getMainPrefix() + 'setname <الاسم الجديد>`');
            try {
                await message.client.user.setUsername(name);
                message.reply('✅ **تم تغيير اسمك إلى: ' + name + '**');
            } catch (e) { message.reply('❌ فشل: `' + e.message + '`'); }
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 3 — السيرفرات
    // ════════════════════════════════════════════════════════════
    {
        name: 'serversticker', aliases: ['stickers', 'ستيكرات'],
        description: 'قائمة ستيكرات السيرفر', category: 'سيرفر',
        execute(message) {
            if (!message.guild) return message.reply('❌ يعمل فقط في السيرفرات.');
            const stickers = message.guild.stickers.cache;
            if (!stickers.size) return message.reply('❌ لا يوجد ستيكرات في هذا السيرفر.');
            let text = '**😂 ستيكرات ' + message.guild.name + ' (' + stickers.size + '):**\n';
            [...stickers.values()].slice(0, 20).forEach((s, i) => {
                text += '**' + (i + 1) + '.** ' + s.name + (s.description ? ' — ' + s.description : '') + '\n';
            });
            message.reply(text.slice(0, 1900));
        }
    },
    {
        name: 'serverbanner', aliases: ['guildbanner', 'بانر_سيرفر'],
        description: 'بانر السيرفر الحالي', category: 'سيرفر',
        execute(message) {
            if (!message.guild) return message.reply('❌ يعمل فقط في السيرفرات.');
            const banner = message.guild.bannerURL({ size: 4096 });
            if (!banner) return message.reply('❌ هذا السيرفر ليس لديه بانر.');
            message.reply('**🖼️ بانر سيرفر ' + message.guild.name + ':**\n' + banner);
        }
    },
    {
        name: 'serverperks', aliases: ['boostperks', 'مزايا_بوست'],
        description: 'مزايا بوستات السيرفر الحالية', category: 'سيرفر',
        execute(message) {
            if (!message.guild) return message.reply('❌ يعمل فقط في السيرفرات.');
            const tier = message.guild.premiumTier;
            const count = message.guild.premiumSubscriptionCount || 0;
            const perks = {
                NONE: ['😢 لا مزايا', 'تحتاج 2 بوست للمستوى الأول'],
                TIER_1: ['😊 مستوى 1', '128kbps صوت • 100MB ملفات • إيموجي مخصص 100'],
                TIER_2: ['😎 مستوى 2', '256kbps صوت • 50MB ملفات • إيموجي 150 • بانر سيرفر'],
                TIER_3: ['🤩 مستوى 3', '384kbps صوت • 100MB ملفات • إيموجي 250 • Vanity URL'],
            };
            const [icon, desc] = perks[tier] || perks['NONE'];
            message.reply([
                '**🚀 مزايا ' + message.guild.name + '**',
                '```',
                '⭐ المستوى   : ' + icon,
                '🎯 البوستات : ' + count,
                '🎁 المزايا   : ' + desc,
                '```'
            ].join('\n'));
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 4 — الإدارة
    // ════════════════════════════════════════════════════════════
    {
        name: 'slowall', aliases: ['slowmodeall', 'بطء_كل'],
        description: 'تفعيل Slow Mode في كل القنوات النصية دفعة واحدة', category: 'إدارة',
        async execute(message, args, cm) {
            if (!message.guild) return message.reply('❌ يعمل فقط في السيرفرات.');
            const seconds = Math.min(parseInt(args[1]) || 5, 21600);
            const channels = message.guild.channels.cache.filter(c => c.type === 'GUILD_TEXT');
            let done = 0;
            const m = await message.reply('⏳ **جاري تفعيل Slow Mode على ' + channels.size + ' قناة...**');
            for (const ch of channels.values()) {
                try { await ch.setRateLimitPerUser(seconds); done++; await sleep(400); } catch {}
            }
            await m.edit('✅ **تم تفعيل Slow Mode (' + seconds + 'ث) على ' + done + '/' + channels.size + ' قناة.**');
        }
    },
    {
        name: 'channelinfo', aliases: ['chinfo', 'معلومات_قناة'],
        description: 'معلومات تفصيلية عن القناة الحالية', category: 'إدارة',
        execute(message) {
            const ch = message.channel;
            const created = new Date(Number((BigInt(ch.id) >> 22n) + 1420070400000n));
            const lines = [
                '**📁 معلومات القناة**',
                '```',
                '📌 الاسم    : ' + ch.name,
                '🆔 ID       : ' + ch.id,
                '📝 النوع    : ' + (ch.type || 'GUILD_TEXT'),
                '📅 تاريخ الإنشاء: ' + created.toLocaleDateString('ar-EG'),
                '🔢 الترتيب  : ' + (ch.position ?? 'N/A'),
                '⏱️ Slow Mode : ' + ((ch.rateLimitPerUser || 0) + ' ثانية'),
                '🔒 NSFW     : ' + (ch.nsfw ? 'نعم' : 'لا'),
            ];
            if (ch.topic) lines.push('📋 الموضوع  : ' + ch.topic.slice(0, 50));
            lines.push('```');
            message.reply(lines.join('\n'));
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 5 — الخطيرة
    // ════════════════════════════════════════════════════════════
    {
        name: 'selfnuke', aliases: ['mynuke', 'نيوك_رسائلي'],
        description: 'حذف كل رسائلك في جميع القنوات المرئية', category: 'خطيرة',
        async execute(message, args, cm) {
            if (args[1] !== 'confirm') return message.reply('⚠️ هذا الأمر يحذف **كل رسائلك** في القناة!\nلتأكيد: `' + cm.getMainPrefix() + 'selfnuke confirm`');
            const m = await message.reply('🔥 **جاري الحذف...**');
            let deleted = 0;
            const msgs = await message.channel.messages.fetch({ limit: 100 }).catch(() => null);
            if (!msgs) return m.edit('❌ فشل جلب الرسائل.');
            const mine = msgs.filter(msg => msg.author.id === message.client.user.id);
            for (const msg of mine.values()) {
                if (msg.id === m.id) continue;
                try { await msg.delete(); deleted++; await sleep(600); } catch {}
            }
            await m.edit('🔥 **تم حذف ' + deleted + ' رسالة!**');
            setTimeout(() => m.delete().catch(() => {}), 4000);
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 6 — الأصدقاء
    // ════════════════════════════════════════════════════════════
    {
        name: 'bestfriend', aliases: ['bf2', 'صديق_مقرب'],
        description: 'حفظ وعرض قائمة أصدقائك المقربين', category: 'أصدقاء',
        execute(message, args, cm) {
            const bfFile = 'bestfriends.json';
            const sub = args[1]?.toLowerCase();
            const prefix = cm.getMainPrefix();
            let list = jLoad(bfFile, []);
            if (sub === 'add') {
                const user = message.mentions?.users?.first();
                if (!user) return message.reply('❌ `' + prefix + 'bestfriend add @يوزر`');
                if (list.some(u => u.id === user.id)) return message.reply('❌ ' + user.username + ' موجود بالفعل!');
                list.push({ id: user.id, name: user.username, addedAt: Date.now() });
                jSave(bfFile, list);
                return message.reply('❤️ تمت إضافة **' + user.username + '** لقائمة أصدقائك المقربين!');
            }
            if (sub === 'remove') {
                const user = message.mentions?.users?.first();
                if (!user) return message.reply('❌ `' + prefix + 'bestfriend remove @يوزر`');
                list = list.filter(u => u.id !== user.id);
                jSave(bfFile, list);
                return message.reply('💔 تمت إزالة **' + user.username + '** من القائمة.');
            }
            if (!list.length) return message.reply('📭 قائمة أصدقائك المقربين فارغة.\n`' + prefix + 'bestfriend add @يوزر`');
            message.reply('**❤️ أصدقاؤك المقربون (' + list.length + '):**\n' + list.map((u, i) => '**' + (i + 1) + '.** ' + u.name + ' `(' + u.id + ')`').join('\n'));
        }
    },
    {
        name: 'friendnote', aliases: ['fnote', 'ملاحظة_صديق'],
        description: 'إضافة ملاحظة خاصة عن صديق', category: 'أصدقاء',
        execute(message, args, cm) {
            const file = 'friend_notes.json';
            const sub = args[1]?.toLowerCase();
            const prefix = cm.getMainPrefix();
            let notes = jLoad(file, {});
            if (sub === 'add') {
                const userId = args[2];
                const note = args.slice(3).join(' ');
                if (!userId || !note) return message.reply('❌ `' + prefix + 'friendnote add <userID> <الملاحظة>`');
                notes[userId] = note;
                jSave(file, notes);
                return message.reply('✅ تم حفظ الملاحظة عن `' + userId + '`');
            }
            if (sub === 'get') {
                const userId = args[2];
                if (!userId) return message.reply('❌ `' + prefix + 'friendnote get <userID>`');
                return message.reply(notes[userId] ? '📝 ملاحظة `' + userId + '`:\n> ' + notes[userId] : '❌ لا توجد ملاحظة.');
            }
            if (sub === 'list') {
                if (!Object.keys(notes).length) return message.reply('📭 لا توجد ملاحظات.');
                let text = '**📝 كل ملاحظاتك:**\n';
                Object.entries(notes).slice(0, 15).forEach(([id, note]) => { text += '• `' + id + '`: ' + note.slice(0, 60) + '\n'; });
                return message.reply(text.slice(0, 1900));
            }
            message.reply('`' + prefix + 'friendnote add <id> <ملاحظة>` | `list` | `get <id>`');
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 8 — الألعاب
    // ════════════════════════════════════════════════════════════
    {
        name: 'wordguess', aliases: ['guessword', 'كلمة_محجوبة'],
        description: 'خمّن الكلمة المخفية (عربية)', category: 'ألعاب',
        execute(message, args, cm) {
            const words = [
                ['برمجة', 'عملية كتابة تعليمات للحاسوب'],
                ['ديسكورد', 'منصة تواصل للمجتمعات'],
                ['ذكاء', 'القدرة على الفهم والتعلم'],
                ['سيرفر', 'خادم لاستضافة البيانات والمحادثات'],
                ['شاشة', 'الجهاز الذي تعرض عليه الصور'],
                ['مفتاح', 'أداة لفتح الأقفال'],
                ['بوتسلاغ', 'مدير الخدمات البرمجية'],
                ['انترنت', 'شبكة التواصل العالمية الكبرى'],
            ];
            const [word, hint] = words[Math.floor(Math.random() * words.length)];
            const guess = args.slice(1).join(' ');
            if (!guess) {
                const hidden = word.split('').map((c, i) => i === 0 || i === word.length - 1 ? c : '_').join(' ');
                return message.reply('🔤 **خمّن الكلمة!**\n\nالكلمة: **' + hidden + '**\nتلميح: *' + hint + '*\n\n`' + cm.getMainPrefix() + 'wordguess <كلمتك>`');
            }
            if (guess.trim() === word) return message.reply('🎉 **ممتاز! أجبت صح!**\nالكلمة كانت: **' + word + '**');
            message.reply('❌ **غلط!** الكلمة كانت: ||**' + word + '**||');
        }
    },
    {
        name: 'emojirace', aliases: ['race2', 'سباق_ايموجي'],
        description: 'سباق إيموجيات مرح 🏁', category: 'ألعاب',
        execute(message, args, cm) {
            const runners = ['🐢', '🐇', '🦊', '🐺', '🦁', '🐯', '🦅', '🚀'];
            const selected = runners.sort(() => Math.random() - 0.5).slice(0, 4);
            const positions = selected.map(() => Math.floor(Math.random() * 15));
            const maxPos = Math.max(...positions);
            let text = '**🏁 سباق الإيموجيات!**\n\n';
            selected.forEach((runner, i) => {
                const pos = positions[i];
                const bar = '─'.repeat(pos) + runner + '─'.repeat(15 - pos) + '🏁';
                text += bar + '\n';
            });
            const winner = selected[positions.indexOf(maxPos)];
            text += '\n🏆 **الفائز: ' + winner + '**';
            message.reply(text);
        }
    },
    {
        name: 'cardgame', aliases: ['drawcard', 'سحب_بطاقة'],
        description: 'سحب بطاقة عشوائية من الكوتشينة', category: 'ألعاب',
        execute(message, args, cm) {
            const suits = ['♠️ سباستي', '♥️ قلوب', '♦️ ديناري', '♣️ ترفل'];
            const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
            const count = Math.min(parseInt(args[1]) || 1, 5);
            const cards = [];
            for (let i = 0; i < count; i++) {
                const s = suits[Math.floor(Math.random() * 4)];
                const v = values[Math.floor(Math.random() * 13)];
                cards.push(v + ' ' + s);
            }
            message.reply('🃏 **بطاقاتك:**\n' + cards.map((c, i) => '**' + (i + 1) + '.** ' + c).join('\n'));
        }
    },
    {
        name: 'predict', aliases: ['predict2', 'توقع'],
        description: 'الكرة السحرية تتوقع مستقبلك 🔮', category: 'ألعاب',
        execute(message) {
            const predictions = [
                '🔮 المستقبل يبدو مشرقاً! ستحقق أهدافك قريباً.',
                '⚡ تحدٍّ كبير ينتظرك، لكنك ستنتصر عليه.',
                '💰 نجاح مالي في الأفق — ابقَ صبوراً.',
                '❤️ علاقة جميلة تقترب منك.',
                '🌟 قرار مهم سيغير مجرى حياتك للأفضل.',
                '⚠️ كن حذراً في قراراتك القادمة.',
                '🎯 التركيز هو مفتاحك للنجاح الآن.',
                '🌈 بعد العاصفة قوس قزح — الأمور ستتحسن.',
                '😂 لا أعرف! هذا ليس Hogwarts!',
                '🧿 اسأل مرة ثانية، النجوم لم تحسم أمرها بعد.',
            ];
            message.reply('**🔮 توقع الكرة السحرية:**\n> ' + predictions[Math.floor(Math.random() * predictions.length)]);
        }
    },
    {
        name: 'typerace', aliases: ['typerace2', 'سباق_كتابة'],
        description: 'تحدي سرعة كتابة مع جملة عشوائية', category: 'ألعاب',
        execute(message, args, cm) {
            const challenges = [
                { text: 'The quick brown fox jumps over the lazy dog', difficulty: 'Easy', wpm: 40 },
                { text: 'Programming is the art of telling another human what one wants the computer to do', difficulty: 'Medium', wpm: 35 },
                { text: 'To be or not to be, that is the question that Shakespeare asked', difficulty: 'Medium', wpm: 30 },
                { text: 'Discord is a voice, video and text communication service', difficulty: 'Easy', wpm: 45 },
                { text: 'Artificial intelligence will change the world in the next decade', difficulty: 'Hard', wpm: 50 },
            ];
            const ch = challenges[Math.floor(Math.random() * challenges.length)];
            const guess = args.slice(1).join(' ');
            if (!guess) {
                return message.reply([
                    '**⌨️ تحدي سرعة الكتابة!** — المستوى: `' + ch.difficulty + '`',
                    '',
                    '```',
                    ch.text,
                    '```',
                    '> اكتب `' + cm.getMainPrefix() + 'typerace <النص>` وتحقق من دقتك!'
                ].join('\n'));
            }
            const accuracy = Math.round((1 - levenshtein(guess, ch.text) / Math.max(guess.length, ch.text.length)) * 100);
            const emoji = accuracy >= 95 ? '🏆' : accuracy >= 80 ? '✅' : accuracy >= 60 ? '🟡' : '❌';
            message.reply(emoji + ' **دقة الكتابة: ' + accuracy + '%**\n' + (accuracy >= 95 ? '🎉 ممتاز! كتابة مثالية!' : accuracy >= 80 ? '👍 جيد جداً!' : '💪 استمر في التدريب!'));
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 9 — التفاعلات التلقائية
    // ════════════════════════════════════════════════════════════
    {
        name: 'antiping', aliases: ['antipingme', 'مكافح_البينج'],
        description: 'حذف أي رسالة تذكر اسمك تلقائياً', category: 'أوتوماتيك',
        execute(message, args, cm) {
            const file = 'antiping.json';
            const sub = args[1]?.toLowerCase();
            let cfg = jLoad(file, { enabled: false, channel: null });
            if (sub === 'on') { cfg.enabled = true; cfg.channel = message.channel.id; jSave(file, cfg); return message.reply('✅ **AntiPing مفعّل في هذا الشات.** (رسائل المنشن تُحذف)'); }
            if (sub === 'off') { cfg.enabled = false; jSave(file, cfg); return message.reply('❌ **AntiPing معطّل.**'); }
            message.reply('**🛡️ AntiPing**\n`' + cm.getMainPrefix() + 'antiping on/off`\nالحالة: ' + (cfg.enabled ? '✅ مفعّل' : '❌ معطّل'));
        }
    },
    {
        name: 'autogreet', aliases: ['greet2', 'ترحيب_تلقائي'],
        description: 'إعداد رسالة ترحيب تلقائية لكلمات معينة', category: 'أوتوماتيك',
        execute(message, args, cm) {
            const file = 'autogreet.json';
            const sub = args[1]?.toLowerCase();
            let greets = jLoad(file, {});
            const prefix = cm.getMainPrefix();
            if (sub === 'add') {
                const trigger = args[2]?.toLowerCase();
                const reply = args.slice(3).join(' ');
                if (!trigger || !reply) return message.reply('❌ `' + prefix + 'autogreet add <كلمة> <الرد>`');
                greets[trigger] = reply;
                jSave(file, greets);
                return message.reply('✅ تم إضافة ترحيب: `' + trigger + '` ← `' + reply + '`');
            }
            if (sub === 'list') {
                if (!Object.keys(greets).length) return message.reply('📭 لا توجد ردود ترحيب.');
                return message.reply('**👋 الردود التلقائية:**\n' + Object.entries(greets).slice(0, 15).map(([k, v]) => '`' + k + '` → ' + v.slice(0, 40)).join('\n'));
            }
            if (sub === 'clear') { jSave(file, {}); return message.reply('🗑️ تم مسح كل ردود الترحيب.'); }
            message.reply('`' + prefix + 'autogreet add <كلمة> <رد>` | `list` | `clear`');
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 10 — أدوات النص
    // ════════════════════════════════════════════════════════════
    {
        name: 'zalgo2', aliases: ['zalgo3', 'نص_مشوش2'],
        description: 'نص Zalgo مخيف ومشوش', category: 'نصوص',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'zalgo <النص>`');
            const up = ['̍','̎','̄','̅','̿','̑','̆','̐','͒','͗','͑','̇','̈','̊','͂','̓','̈́','͊','͋','͌','̃','̂','̌','͐','̀','́','̋','̏','̒','̓'];
            const mid = ['̕','̛','̀','́','͘','̡','̢','̧','̨','̴','̵','̶','͜','͝','͞','͟','͠','͢','̸','̷','͡'];
            const result = text.split('').map(c => {
                if (c === ' ') return c;
                let r = c;
                for (let i = 0; i < 3; i++) r += up[Math.floor(Math.random() * up.length)];
                for (let i = 0; i < 2; i++) r += mid[Math.floor(Math.random() * mid.length)];
                return r;
            }).join('');
            if (result.length > 1800) return message.reply('❌ النص طويل جداً!');
            message.reply(result);
        }
    },
    {
        name: 'repeatchars', aliases: ['stretch2', 'مط_نص'],
        description: 'مط الحروف وتكرارها (تأثير مطاطي)', category: 'نصوص',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            const repeat = Math.min(parseInt(args[1]) || 3, 8);
            const actualText = isNaN(parseInt(args[1])) ? text : args.slice(2).join(' ');
            if (!actualText) return message.reply('❌ `' + cm.getMainPrefix() + 'repeatchars [عدد] <النص>`');
            const result = actualText.split('').map(c => c === ' ' ? '   ' : c.repeat(repeat)).join('');
            if (result.length > 1800) return message.reply('❌ النص طويل جداً!');
            message.reply(result);
        }
    },
    {
        name: 'reversewords', aliases: ['wordrev', 'عكس_كلمات'],
        description: 'عكس ترتيب الكلمات (وليس الحروف)', category: 'نصوص',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'reversewords <النص>`');
            message.reply(text.split(' ').reverse().join(' '));
        }
    },
    {
        name: 'shadowtext', aliases: ['shadow2', 'نص_ظل'],
        description: 'نص مع ظل/صدى باستخدام Unicode', category: 'نصوص',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'shadowtext <النص>`');
            const shadow = text.split('').map(c => {
                const code = c.codePointAt(0);
                if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D400 - 65);
                if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D41A - 97);
                return c;
            }).join('');
            message.reply(shadow || text);
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 11 — البحث
    // ════════════════════════════════════════════════════════════
    {
        name: 'numfacts', aliases: ['numfact', 'حقيقة_رقم'],
        description: 'حقيقة مثيرة عن رقم معين', category: 'بحث',
        execute(message, args, cm) {
            const n = parseInt(args[1]);
            if (isNaN(n)) return message.reply('❌ `' + cm.getMainPrefix() + 'numfacts <رقم>`');
            const facts = {
                0: 'الصفر هو العدد الوحيد الذي لا يصنّف لا موجباً ولا سالباً.',
                7: 'الرقم 7 يُعتبر الأكثر حظاً في ثقافات كثيرة حول العالم.',
                42: 'الرقم 42 هو "الإجابة على سؤال الحياة والكون وكل شيء" في رواية هيتشهايكر.',
                13: 'الرقم 13 يُعتبر نحساً في الثقافة الغربية.',
                100: 'الرقم 100 رمز الكمال وهو المئة في العربية.',
                1000: 'الألف خُتمت به سورة الألف ليلة وليلة العربية.',
            };
            if (facts[n]) return message.reply('**🔢 الرقم ' + n + ':**\n> ' + facts[n]);
            // Generated fact
            const isPrime = n > 1 && Array.from({ length: Math.floor(Math.sqrt(n)) }, (_, i) => i + 2).every(i => n % i !== 0);
            const isEven = n % 2 === 0;
            message.reply('**🔢 الرقم ' + n + ':**\n> هو عدد ' + (isEven ? 'زوجي' : 'فردي') + (isPrime ? ' وأولي (يقبل القسمة على 1 وعلى نفسه فقط)' : '') + '.\n> مربعه: **' + (n * n) + '** | مكعبه: **' + (n * n * n) + '**');
        }
    },
    {
        name: 'funfact', aliases: ['fact2', 'حقيقة'],
        description: 'حقيقة ممتعة ومثيرة عشوائية', category: 'بحث',
        execute(message) {
            const facts = [
                '🐙 الأخطبوط لديه ثلاثة قلوب وكل منها يضخ دماً أزرق اللون.',
                '🍯 العسل لا يفسد أبداً — تم اكتشاف عسل قابل للأكل عمره 3000 سنة في مقابر مصر.',
                '🐘 الفيلة هي الحيوانات الوحيدة التي لا تستطيع القفز.',
                '🌙 يمكن رؤية سور الصين العظيم من الفضاء — هذه خرافة! لا يمكن رؤيته بالعين المجردة.',
                '🦈 القرش يوجد على الأرض منذ أكثر من 450 مليون سنة — قبل الديناصورات!',
                '🧠 الدماغ البشري لديه ما يزيد عن 100 تريليون اتصال عصبي.',
                '🌍 لو صُهرت كل الذهب المستخرج من الأرض، لملأت مكعباً بجانب 20 متراً.',
                '🎵 الموسيقى تستطيع تغيير معدل ضربات القلب لتتزامن مع إيقاعها.',
                '🐦 البطريق الإمبراطور يستطيع الغوص لعمق 500 متر.',
                '⚡ البرق يمكن أن يسخّن الهواء حوله لـ 30,000 درجة كلفن — أكثر من سطح الشمس!',
            ];
            message.reply('**💡 هل تعلم؟**\n> ' + facts[Math.floor(Math.random() * facts.length)]);
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 14 — ميزات متقدمة
    // ════════════════════════════════════════════════════════════
    {
        name: 'reactall4', aliases: ['reactmany4', 'تفاعلجماعي4'],
        description: 'ضع تفاعلاً على آخر N رسالة في القناة', category: 'متقدم',
        async execute(message, args, cm) {
            const count = Math.min(parseInt(args[1]) || 5, 15);
            const emoji = args[2] || '✅';
            const msgs = await message.channel.messages.fetch({ limit: count + 1 }).catch(() => null);
            if (!msgs) return message.reply('❌ تعذر جلب الرسائل.');
            let reacted = 0;
            for (const m of [...msgs.values()].slice(0, count)) {
                try { await m.react(emoji); reacted++; await sleep(500); } catch {}
            }
            const r = await message.reply('✅ **تم التفاعل بـ ' + emoji + ' على ' + reacted + ' رسالة.**');
            setTimeout(() => { r.delete().catch(() => {}); message.delete().catch(() => {}); }, 4000);
        }
    },
    {
        name: 'bulkforward2', aliases: ['forwardall2', 'ارسل_للكل2'],
        description: 'إرسال رسالة لعدة قنوات بالأسماء', category: 'متقدم',
        async execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            const channels = text.split('|').map(s => s.trim()).filter(s => s);
            const msgText = channels.pop();
            if (!channels.length || !msgText) return message.reply('❌ `' + cm.getMainPrefix() + 'bulkforward <اسم1>|<اسم2>|<الرسالة>`');
            let sent = 0;
            for (const chName of channels) {
                const ch = message.guild?.channels.cache.find(c => c.name.toLowerCase().includes(chName.toLowerCase()) && c.type === 'GUILD_TEXT');
                if (ch) { try { await ch.send(msgText); sent++; await sleep(600); } catch {} }
            }
            message.reply('📤 **تم الإرسال لـ ' + sent + '/' + channels.length + ' قناة.**');
        }
    },
    {
        name: 'selfmute', aliases: ['muteme', 'كتم_نفسي'],
        description: 'كتم نفسك في الروم الصوتي', category: 'متقدم',
        async execute(message) {
            if (!message.guild) return message.reply('❌ يعمل فقط في السيرفرات.');
            const member = message.guild.members.cache.get(message.client.user.id);
            if (!member?.voice?.channel) return message.reply('❌ لست في روم صوتي!');
            try {
                await member.voice.setMute(!member.voice.serverMute);
                message.reply(member.voice.serverMute ? '🔇 **تم كتم الميك!**' : '🎙️ **تم فتح الميك!**');
            } catch (e) { message.reply('❌ فشل: `' + e.message + '`'); }
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 15 — الأمان
    // ════════════════════════════════════════════════════════════
    {
        name: 'ciphertext', aliases: ['cipher2', 'تشفير_سيزر'],
        description: 'تشفير/فك تشفير نص بشفرة Caesar مخصصة', category: 'أمان',
        execute(message, args, cm) {
            const sub = args[1]?.toLowerCase();
            const shift = parseInt(args[2]);
            const text = args.slice(3).join(' ');
            if (!sub || isNaN(shift) || !text) return message.reply('❌ `' + cm.getMainPrefix() + 'ciphertext encode/decode <shift> <النص>`');
            const s = sub === 'decode' ? (26 - (shift % 26)) : (shift % 26);
            const result = text.replace(/[a-zA-Z]/g, c => {
                const base = c <= 'Z' ? 65 : 97;
                return String.fromCharCode(((c.charCodeAt(0) - base + s) % 26) + base);
            });
            message.reply('**🔐 Caesar (shift=' + shift + '):**\n`' + result + '`');
        }
    },
    {
        name: 'iprange', aliases: ['ipclass', 'نطاق_اي_بي'],
        description: 'معلومات عن نطاق وفئة عنوان IP', category: 'أمان',
        execute(message, args, cm) {
            const ip = args[1];
            if (!ip) return message.reply('❌ `' + cm.getMainPrefix() + 'iprange <IP>`');
            if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return message.reply('❌ IP غير صالح.');
            const first = parseInt(ip.split('.')[0]);
            let cls = '', range = '', type = '';
            if (first >= 1 && first <= 126) { cls = 'Class A'; range = '1.0.0.0 — 126.255.255.255'; type = '🔵 عام كبير'; }
            else if (first === 127) { cls = 'Loopback'; range = '127.0.0.1'; type = '🔄 محلي (Loopback)'; }
            else if (first >= 128 && first <= 191) { cls = 'Class B'; range = '128.0.0.0 — 191.255.255.255'; type = '🟢 عام متوسط'; }
            else if (first >= 192 && first <= 223) { cls = 'Class C'; range = '192.0.0.0 — 223.255.255.255'; type = '🟡 عام صغير'; }
            else { cls = 'Class D/E'; range = '224.0.0.0+'; type = '🔴 خاص/محجوز'; }
            const isPrivate = ip.startsWith('10.') || ip.startsWith('192.168.') || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip);
            message.reply([
                '**🌐 معلومات IP: ' + ip + '**',
                '```',
                '📊 الفئة    : ' + cls,
                '🌍 النطاق   : ' + range,
                '🏷️ النوع    : ' + type,
                '🔒 خاص؟    : ' + (isPrivate ? 'نعم (Private)' : 'لا (Public)'),
                '```'
            ].join('\n'));
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 16 — عام
    // ════════════════════════════════════════════════════════════
    {
        name: 'shortcuts', aliases: ['aliases2', 'اختصارات'],
        description: 'عرض اختصارات (aliases) أمر معين', category: 'أدوات',
        execute(message, args, cm) {
            const cmdName = args[1];
            if (!cmdName) return message.reply('❌ `' + cm.getMainPrefix() + 'shortcuts <اسم_الأمر>`');
            const cmd = cm.commands.get(cmdName);
            if (!cmd) return message.reply('❌ الأمر `' + cmdName + '` غير موجود.');
            const aliases = cmd.aliases || [];
            message.reply('**⚡ اختصارات الأمر `' + cmdName + '`:**\n' + (aliases.length ? aliases.map(a => '`' + cm.getMainPrefix() + a + '`').join(' • ') : '❌ لا توجد اختصارات'));
        }
    },
    {
        name: 'rng', aliases: ['random2', 'عشوائي'],
        description: 'رقم عشوائي بين حدين مع إحصائيات', category: 'أدوات',
        execute(message, args, cm) {
            const min = parseInt(args[1] ?? 1);
            const max = parseInt(args[2] ?? 100);
            const count = Math.min(parseInt(args[3]) || 1, 10);
            if (isNaN(min) || isNaN(max) || min >= max) return message.reply('❌ `' + cm.getMainPrefix() + 'rng <أدنى> <أقصى> [عدد]`');
            const nums = Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min);
            const sum = nums.reduce((a, b) => a + b, 0);
            message.reply([
                '**🎲 أرقام عشوائية بين ' + min + ' و ' + max + ':**',
                nums.map((n, i) => '**' + (i + 1) + '.** ' + n).join('  '),
                count > 1 ? '\n📊 المجموع: **' + sum + '** | المتوسط: **' + (sum / count).toFixed(1) + '**' : ''
            ].filter(Boolean).join('\n'));
        }
    },
    {
        name: 'wordofday', aliases: ['wod', 'كلمة_اليوم'],
        description: 'كلمة يومية مع تعريفها واستخدامها', category: 'أدوات',
        execute(message) {
            const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
            const words = [
                { word: 'إبداع', definition: 'توليد أفكار جديدة وأصيلة وذات قيمة', example: 'الإبداع هو روح الفن والتكنولوجيا' },
                { word: 'تقنية', definition: 'تطبيق المعرفة العلمية لحل المشكلات', example: 'التقنية الحديثة غيّرت طريقة حياتنا' },
                { word: 'انسجام', definition: 'التوافق والتناغم بين الأشياء', example: 'انسجام الألوان يجعل التصميم جميلاً' },
                { word: 'استراتيجية', definition: 'خطة منظمة لتحقيق هدف معين', example: 'الاستراتيجية الجيدة مفتاح النجاح في الأعمال' },
                { word: 'منظومة', definition: 'مجموعة عناصر مترابطة تعمل معاً', example: 'منظومة التعليم تحتاج إلى إصلاح شامل' },
                { word: 'بلاغة', definition: 'حسن التعبير وقوة الكلام', example: 'البلاغة في العربية علم قائم بذاته' },
                { word: 'تحقيق', definition: 'التأكد من صحة شيء ما', example: 'يجب تحقيق الأخبار قبل نشرها' },
            ];
            const w = words[dayOfYear % words.length];
            message.reply([
                '**📖 كلمة اليوم: ' + w.word + '**',
                '',
                '📝 **التعريف:** ' + w.definition,
                '💬 **مثال:** *' + w.example + '*',
                '',
                '> احفظ هذه الكلمة اليوم! 🌟'
            ].join('\n'));
        }
    },
    {
        name: 'dice2', aliases: ['rolldice2', 'نرد2'],
        description: 'رمي نرد مخصص (مثال: 3d6 أو d20)', category: 'أدوات',
        execute(message, args, cm) {
            const input = args[1] || '1d6';
            const match = input.match(/^(\d+)?d(\d+)$/i);
            if (!match) return message.reply('❌ `' + cm.getMainPrefix() + 'dice2 <NdM>` مثال: `2d6` أو `d20`');
            const count = Math.min(parseInt(match[1]) || 1, 20);
            const sides = Math.min(parseInt(match[2]), 1000);
            if (sides < 2) return message.reply('❌ يجب أن يكون للنرد وجهان على الأقل!');
            const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
            const total = rolls.reduce((a, b) => a + b, 0);
            message.reply([
                '🎲 **رمي ' + count + 'd' + sides + ':**',
                rolls.join(' + ') + (count > 1 ? ' = **' + total + '**' : ''),
                count > 1 ? '🏆 المجموع: **' + total + '** | المتوسط: **' + (total / count).toFixed(1) + '**' : '**نتيجة: ' + total + '**'
            ].join('\n'));
        }
    },
];

// Helper: Levenshtein distance for typerace
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
}
