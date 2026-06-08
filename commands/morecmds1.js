// ╔══════════════════════════════════════════════════════╗
// ║  morecmds1.js — أوامر إضافية (حزمة 1) — Snodix v5  ║
// ╚══════════════════════════════════════════════════════╝
const fs = require('fs');
const path = require('path');
const https = require('https');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
const DATA = path.join(__dirname, '../data');
function jLoad(f, d) { try { const p = path.join(DATA, f); if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch {} return d; }
function jSave(f, d) { try { fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(path.join(DATA, f), JSON.stringify(d, null, 2)); } catch {} }

module.exports = [

    // ════════════════════════════════════════════════════════════
    //  SECTION 1 — إرسال ونشر
    // ════════════════════════════════════════════════════════════
    {
        name: 'spam3', aliases: ['ultraspam', 'سبام3'],
        description: 'سبام فائق مع تأخير مخصص (ms)', category: 'نشر',
        async execute(message, args, cm) {
            const count = Math.min(parseInt(args[1]) || 5, 20);
            const delay = Math.max(parseInt(args[2]) || 800, 400);
            const text = args.slice(3).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'spam3 <عدد> <تأخير_ms> <رسالة>`');
            await message.delete().catch(() => {});
            for (let i = 0; i < count; i++) {
                await message.channel.send(text).catch(() => {});
                await sleep(delay);
            }
        }
    },
    {
        name: 'typingloop', aliases: ['keeptyping', 'تايبنج'],
        description: 'إرسال مؤشر الكتابة باستمرار لوقت محدد', category: 'نشر',
        async execute(message, args, cm) {
            const secs = Math.min(parseInt(args[1]) || 10, 60);
            const m = await message.reply('⌨️ **مؤشر الكتابة شغّال لـ ' + secs + ' ثانية...**');
            const end = Date.now() + secs * 1000;
            while (Date.now() < end) {
                await message.channel.sendTyping().catch(() => {});
                await sleep(8000);
            }
            await m.edit('⌨️ **انتهى مؤشر الكتابة.**').catch(() => {});
        }
    },
    {
        name: 'masssend', aliases: ['allservers', 'ارسل_لكل'],
        description: 'إرسال رسالة لأول قناة في كل سيرفراتك', category: 'نشر',
        async execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'masssend <الرسالة>`');
            const count = Math.min(parseInt(args[1]) === parseInt(args[1]) ? 0 : 0, 0);
            let sent = 0, failed = 0;
            const msg = await message.reply('📡 **جاري الإرسال لكل السيرفرات...**');
            for (const guild of message.client.guilds.cache.values()) {
                const ch = guild.channels.cache
                    .filter(c => c.type === 'GUILD_TEXT' && c.permissionsFor(guild.members.me || guild.me)?.has('SEND_MESSAGES'))
                    .sort((a, b) => a.position - b.position)
                    .first();
                if (ch) { try { await ch.send(text); sent++; } catch { failed++; } }
                else failed++;
                await sleep(800);
            }
            await msg.edit('📡 **اكتملت العملية!**\n✅ أُرسل لـ **' + sent + '** سيرفر\n❌ فشل في **' + failed + '** سيرفر');
        }
    },
    {
        name: 'codeblock', aliases: ['code3', 'codesend'],
        description: 'إرسال نص داخل code block مع تحديد اللغة', category: 'نشر',
        async execute(message, args, cm) {
            const lang = args[1] || '';
            const text = args.slice(2).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'codeblock [لغة] <النص>`\nمثال: `' + cm.getMainPrefix() + 'codeblock python print("hello")`');
            await message.delete().catch(() => {});
            await message.channel.send('```' + lang + '\n' + text + '\n```');
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 2 — الحساب
    // ════════════════════════════════════════════════════════════
    {
        name: 'mydevices', aliases: ['devices2', 'اجهزتي'],
        description: 'عرض الأجهزة المتصلة بحسابك', category: 'حساب',
        execute(message) {
            const pres = message.client.user.presence;
            const clientStatus = pres?.clientStatus || {};
            const devices = [];
            if (clientStatus.desktop) devices.push('🖥️ ديسكتوب: ' + clientStatus.desktop);
            if (clientStatus.mobile) devices.push('📱 موبايل: ' + clientStatus.mobile);
            if (clientStatus.web) devices.push('🌐 ويب: ' + clientStatus.web);
            if (!devices.length) devices.push('⚠️ لا يوجد أجهزة مرصودة');
            message.reply('**📱 أجهزتك المتصلة:**\n' + devices.join('\n'));
        }
    },
    {
        name: 'tokensplit', aliases: ['splittoken', 'قسمتوكن'],
        description: 'تقسيم التوكن وعرض معلوماته', category: 'حساب',
        execute(message, args, cm) {
            const tok = (args[1] || '').trim();
            if (!tok) return message.reply('❌ `' + cm.getMainPrefix() + 'tokensplit <التوكن>`');
            const parts = tok.split('.');
            if (parts.length < 3) return message.reply('❌ هذا التوكن غير صحيح.');
            try {
                const idDecoded = Buffer.from(parts[0], 'base64').toString();
                const ts = (parseInt(Buffer.from(parts[1], 'base64').toString('hex'), 16) + 1293840000);
                const date = new Date(ts * 1000);
                message.reply([
                    '**🔑 تحليل التوكن:**',
                    '```',
                    '🆔 UserID  : ' + idDecoded,
                    '📅 التاريخ : ' + date.toLocaleDateString('ar-EG'),
                    '🔒 التوقيع : ' + parts[2].slice(0, 10) + '...',
                    '```',
                    '⚠️ لا تشارك هذا التوكن مع أحد!'
                ].join('\n'));
            } catch { message.reply('❌ تعذر تحليل هذا التوكن.'); }
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 3 — السيرفرات
    // ════════════════════════════════════════════════════════════
    {
        name: 'allchannels', aliases: ['serverchannels2', 'كل_قنوات'],
        description: 'قائمة كل أنواع القنوات في السيرفر مع إحصائياتها', category: 'سيرفر',
        execute(message) {
            if (!message.guild) return message.reply('❌ هذا الأمر يعمل فقط في السيرفرات.');
            const ch = message.guild.channels.cache;
            const text = ch.filter(c => c.type === 'GUILD_TEXT').size;
            const voice = ch.filter(c => c.type === 'GUILD_VOICE').size;
            const cat = ch.filter(c => c.type === 'GUILD_CATEGORY').size;
            const stage = ch.filter(c => c.type === 'GUILD_STAGE_VOICE').size;
            const news = ch.filter(c => c.type === 'GUILD_NEWS').size;
            const forum = ch.filter(c => c.type === 'GUILD_FORUM').size;
            message.reply([
                '**📁 قنوات سيرفر ' + message.guild.name + '**',
                '```',
                '💬 نصي      : ' + text,
                '🔊 صوتي     : ' + voice,
                '📂 فئات     : ' + cat,
                '📡 Stage    : ' + stage,
                '📰 أخبار    : ' + news,
                '💬 Forum    : ' + forum,
                '─────────────',
                '📊 المجموع  : ' + ch.size,
                '```'
            ].join('\n'));
        }
    },
    {
        name: 'serveraudit', aliases: ['auditlog2', 'سجل_احداث'],
        description: 'ملخص آخر أحداث الـ Audit Log في السيرفر', category: 'سيرفر',
        async execute(message) {
            if (!message.guild) return message.reply('❌ يعمل فقط في السيرفرات.');
            try {
                const logs = await message.guild.fetchAuditLogs({ limit: 5 }).catch(() => null);
                if (!logs) return message.reply('❌ لا يمكن الوصول لـ Audit Log (تحتاج صلاحيات مدير).');
                let text = '**📋 آخر 5 أحداث في ' + message.guild.name + ':**\n\n';
                const typeMap = {
                    'MEMBER_BAN_ADD': '🔨 حظر', 'MEMBER_KICK': '👢 طرد',
                    'CHANNEL_CREATE': '📁+ إنشاء قناة', 'CHANNEL_DELETE': '📁× حذف قناة',
                    'ROLE_CREATE': '🎭+ رتبة جديدة', 'MESSAGE_DELETE': '🗑️ حذف رسالة',
                    'MEMBER_UPDATE': '✏️ تعديل عضو', 'MEMBER_ROLE_UPDATE': '🎭 تغيير رتبة'
                };
                logs.entries.forEach((e, i) => {
                    const type = typeMap[e.action] || e.action;
                    const who = e.executor?.tag || 'مجهول';
                    text += `**${i + 1}.** ${type}\n   بواسطة: **${who}**\n\n`;
                });
                message.reply(text.slice(0, 1900));
            } catch (e) { message.reply('❌ فشل: `' + e.message + '`'); }
        }
    },
    {
        name: 'onlinemembers', aliases: ['online2', 'اعضاء_اونلاين'],
        description: 'قائمة الأعضاء الأونلاين في السيرفر (أول 20)', category: 'سيرفر',
        execute(message) {
            if (!message.guild) return message.reply('❌ يعمل فقط في السيرفرات.');
            const online = message.guild.members.cache
                .filter(m => m.presence?.status === 'online' && !m.user.bot)
                .first(20);
            if (!online.length) return message.reply('❌ لا يوجد أعضاء أونلاين الآن.');
            message.reply('**🟢 الأعضاء الأونلاين (' + online.length + '):**\n' +
                online.map((m, i) => (i + 1) + '. **' + m.user.username + '**').join('\n'));
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 4 — إدارة السيرفر
    // ════════════════════════════════════════════════════════════
    {
        name: 'bulkpin', aliases: ['pinmulti', 'تثبيت_متعدد'],
        description: 'تثبيت عدة رسائل بالـ IDs', category: 'إدارة',
        async execute(message, args, cm) {
            const ids = args.slice(1);
            if (!ids.length) return message.reply('❌ `' + cm.getMainPrefix() + 'bulkpin <id1> <id2> <id3>...`');
            let pinned = 0;
            for (const id of ids) {
                try {
                    const m = await message.channel.messages.fetch(id);
                    await m.pin();
                    pinned++;
                    await sleep(500);
                } catch {}
            }
            message.reply('📌 **تم تثبيت ' + pinned + '/' + ids.length + ' رسالة.**');
        }
    },
    {
        name: 'cloneandpost', aliases: ['mirrorpost', 'نسخ_ونشر'],
        description: 'نسخ رسالة بالـ ID وإعادة إرسالها', category: 'إدارة',
        async execute(message, args, cm) {
            const id = args[1];
            if (!id) return message.reply('❌ `' + cm.getMainPrefix() + 'cloneandpost <message_id>`');
            try {
                const original = await message.channel.messages.fetch(id);
                await message.delete().catch(() => {});
                await message.channel.send(original.content || '*[لا يوجد نص]*');
            } catch (e) { message.channel.send('❌ فشل: `' + e.message + '`'); }
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 8 — الألعاب
    // ════════════════════════════════════════════════════════════
    {
        name: 'slots', aliases: ['slotmachine', 'سلوت', 'ماكينة'],
        description: 'ماكينة الحظ 🎰', category: 'ألعاب',
        execute(message) {
            const syms = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣', '🔔'];
            const r1 = syms[Math.floor(Math.random() * syms.length)];
            const r2 = syms[Math.floor(Math.random() * syms.length)];
            const r3 = syms[Math.floor(Math.random() * syms.length)];
            let result = '';
            if (r1 === r2 && r2 === r3) {
                if (r1 === '💎') result = '💎 **جاكبوت عملاق!! أنت محظوظ جداً!!** 💎';
                else if (r1 === '7️⃣') result = '🎉 **سبعة! ربحت الجائزة الكبرى!** 🎉';
                else result = '🏆 **ثلاثة مثلية! ربحت!**';
            } else if (r1 === r2 || r2 === r3 || r1 === r3) {
                result = '✨ **زوج! ربحت مبلغاً صغيراً!**';
            } else {
                result = '💸 **خسرت هذه الجولة!**';
            }
            message.reply([
                '🎰 **ماكينة الحظ**',
                '',
                '╔═══╦═══╦═══╗',
                '║ ' + r1 + ' ║ ' + r2 + ' ║ ' + r3 + ' ║',
                '╚═══╩═══╩═══╝',
                '',
                result
            ].join('\n'));
        }
    },
    {
        name: 'highlow', aliases: ['hl', 'اعلى_اقل'],
        description: 'خمّن: البطاقة أعلى أو أقل؟ 🃏', category: 'ألعاب',
        execute(message, args, cm) {
            const current = Math.floor(Math.random() * 13) + 1;
            const next = Math.floor(Math.random() * 13) + 1;
            const names = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
            const fmtCard = n => names[n] || String(n);
            const suits = ['♠', '♥', '♦', '♣'];
            const suit = suits[Math.floor(Math.random() * 4)];
            const guess = args[1]?.toLowerCase();
            if (!guess || !['high', 'low', 'أعلى', 'أقل', 'h', 'l'].includes(guess)) {
                return message.reply('🃏 **High or Low?**\n\nبطاقتك: **' + fmtCard(current) + suit + '**\n\nخمّن البطاقة التالية:\n`' + cm.getMainPrefix() + 'highlow high` أو `' + cm.getMainPrefix() + 'highlow low`');
            }
            const isHigh = ['high', 'أعلى', 'h'].includes(guess);
            const correct = isHigh ? next >= current : next <= current;
            const suit2 = suits[Math.floor(Math.random() * 4)];
            message.reply([
                '🃏 **النتيجة:**',
                'بطاقتك: **' + fmtCard(current) + suit + '** | البطاقة الجديدة: **' + fmtCard(next) + suit2 + '**',
                '',
                correct ? '🎉 **صح! خمّنت صح!**' : '💀 **غلط! الإجابة كانت ' + (next > current ? 'أعلى' : next < current ? 'أقل' : 'متساوية') + '**'
            ].join('\n'));
        }
    },
    {
        name: 'tictactoe2', aliases: ['xogame', 'xo3', 'اكس_اوه2'],
        description: 'لعبة XO ضد نفسك 🎮', category: 'ألعاب',
        execute(message, args, cm) {
            const pos = parseInt(args[1]);
            if (!pos || pos < 1 || pos > 9) {
                return message.reply([
                    '🎮 **لعبة XO**',
                    '',
                    '```',
                    ' 1 │ 2 │ 3 ',
                    '───┼───┼───',
                    ' 4 │ 5 │ 6 ',
                    '───┼───┼───',
                    ' 7 │ 8 │ 9 ',
                    '```',
                    '> `' + cm.getMainPrefix() + 'tictactoe <1-9>` لاختيار موضع'
                ].join('\n'));
            }
            const board = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '];
            board[pos - 1] = 'X';
            const aiMove = board.findIndex((c, i) => c === ' ');
            if (aiMove !== -1) board[aiMove] = 'O';
            const r = (i) => board[i];
            const grid = '```\n ' + r(0) + ' │ ' + r(1) + ' │ ' + r(2) + ' \n───┼───┼───\n ' + r(3) + ' │ ' + r(4) + ' │ ' + r(5) + ' \n───┼───┼───\n ' + r(6) + ' │ ' + r(7) + ' │ ' + r(8) + ' \n```';
            message.reply('🎮 **XO**\n' + grid + '\n> أنت: **X** | الـ AI: **O**\n> `' + cm.getMainPrefix() + 'tictactoe <رقم>` لأدوارك التالية');
        }
    },
    {
        name: 'fasttype', aliases: ['typingtest', 'سرعة_كتابة'],
        description: 'اختبار سرعة الكتابة 🖮', category: 'ألعاب',
        execute(message) {
            const phrases = [
                'سرعة الكتابة أهم مهارة في عالم التقنية',
                'ديسكورد منصة التواصل الأفضل للمجتمعات',
                'البرمجة فن يحتاج صبراً وإبداعاً',
                'كل سطر كود تكتبه يصنع فرقاً في العالم',
                'النجاح يبدأ من خطوة صغيرة واحدة',
            ];
            const phrase = phrases[Math.floor(Math.random() * phrases.length)];
            message.reply([
                '⌨️ **اختبار سرعة الكتابة!**',
                '',
                '**اكتب هذه الجملة الآن:**',
                '```',
                phrase,
                '```',
                '> ⏱️ لا يوجد مؤقت رسمي، لكن راقب وقتك بنفسك!',
                '> طول النص: ' + phrase.length + ' حرف'
            ].join('\n'));
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 10 — أدوات النص
    // ════════════════════════════════════════════════════════════
    {
        name: 'morse2', aliases: ['morsecode2', 'morseconv'],
        description: 'تحويل نص إلى كود مورس', category: 'نصوص',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ').toUpperCase();
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'morse <النص>`');
            const MAP = { A:'.-', B:'-...', C:'-.-.', D:'-..', E:'.', F:'..-.', G:'--.', H:'....', I:'..', J:'.---', K:'-.-', L:'.-..', M:'--', N:'-.', O:'---', P:'.--.', Q:'--.-', R:'.-.', S:'...', T:'-', U:'..-', V:'...-', W:'.--', X:'-..-', Y:'-.--', Z:'--..', '0':'-----', '1':'.----', '2':'..---', '3':'...--', '4':'....-', '5':'.....', '6':'-....', '7':'--...', '8':'---..', '9':'----.' };
            const result = text.split('').map(c => c === ' ' ? '/' : (MAP[c] || '?')).join(' ');
            if (result.length > 1800) return message.reply('❌ النص طويل جداً!');
            message.reply('**📡 كود مورس:**\n`' + result + '`');
        }
    },
    {
        name: 'binary2', aliases: ['binconv2', 'textbin'],
        description: 'تحويل نص إلى نظام ثنائي (Binary)', category: 'نصوص',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'binary <النص>`');
            const result = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
            if (result.length > 1800) return message.reply('❌ النص طويل جداً!');
            message.reply('**💾 Binary:**\n`' + result.slice(0, 500) + '`');
        }
    },
    {
        name: 'upsidedown', aliases: ['fliptext', 'مقلوب3'],
        description: 'نص مقلوب رأساً على عقب', category: 'نصوص',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'upsidedown <النص>`');
            const map = { a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ɓ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z', '0':'0','1':'Ɩ','2':'ᄅ','3':'Ɛ','4':'ㄣ','5':'ϛ','6':'9','7':'ㄥ','8':'8','9':'6','!':'¡','?':'¿',',':'\'','(':')',')':'(' };
            const result = text.toLowerCase().split('').map(c => map[c] || c).reverse().join('');
            message.reply(result);
        }
    },
    {
        name: 'vaporwave2', aliases: ['vapor3', 'aesthetic2'],
        description: 'نص ＡＥＳＴＨＥＴＩＣ vaporwave', category: 'نصوص',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'vaporwave <النص>`');
            const result = text.toUpperCase().split('').map(c => {
                const code = c.codePointAt(0);
                if (code >= 0x21 && code <= 0x7E) return String.fromCodePoint(code + 0xFF01 - 0x21);
                return c;
            }).join(' ');
            message.reply('ａｅｓｔｈｅｔｉｃ ' + result + ' ✦');
        }
    },
    {
        name: 'strikethrough2', aliases: ['strike3', 'شطب2'],
        description: 'نص مشطوب ~~هكذا~~', category: 'نصوص',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'strikethrough <النص>`');
            message.reply('~~' + text + '~~');
        }
    },
    {
        name: 'superscript2', aliases: ['sup3', 'مرتفع2'],
        description: 'نص مرتفع صغير ⁺¹²³', category: 'نصوص',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'superscript <النص>`');
            const map = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','e':'ᵉ','f':'ᶠ','g':'ᵍ','h':'ʰ','i':'ⁱ','j':'ʲ','k':'ᵏ','l':'ˡ','m':'ᵐ','n':'ⁿ','o':'ᵒ','p':'ᵖ','r':'ʳ','s':'ˢ','t':'ᵗ','u':'ᵘ','v':'ᵛ','w':'ʷ','x':'ˣ','y':'ʸ','z':'ᶻ','+':'⁺','-':'⁻','=':'⁼','(':'⁽',')':'⁾' };
            const result = text.toLowerCase().split('').map(c => map[c] || c).join('');
            message.reply(result);
        }
    },
    {
        name: 'rot13', aliases: ['rot132', 'روت13'],
        description: 'تشفير / فك تشفير ROT-13', category: 'نصوص',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'rot13 <النص>`');
            const result = text.replace(/[a-zA-Z]/g, c => {
                const base = c <= 'Z' ? 65 : 97;
                return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
            });
            message.reply('**🔄 ROT-13:**\n`' + result + '`');
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 11 — البحث والمعلومات
    // ════════════════════════════════════════════════════════════
    {
        name: 'romannum', aliases: ['roman2', 'روماني'],
        description: 'تحويل أرقام عربية إلى رومانية والعكس', category: 'بحث',
        execute(message, args, cm) {
            const input = args[1];
            if (!input) return message.reply('❌ `' + cm.getMainPrefix() + 'romannum <رقم أو رقم روماني>`');
            const num = parseInt(input);
            if (!isNaN(num) && num >= 1 && num <= 3999) {
                const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
                const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
                let n = num, res = '';
                for (let i = 0; i < vals.length; i++) while (n >= vals[i]) { res += syms[i]; n -= vals[i]; }
                return message.reply('🔢 **' + num + '** = **' + res + '** (روماني)');
            }
            // Try to decode Roman
            const romMap = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
            let total = 0, prev = 0;
            for (const ch of input.toUpperCase().split('').reverse()) {
                const v = romMap[ch] || 0;
                if (v < prev) total -= v; else total += v;
                prev = v;
            }
            if (total > 0) return message.reply('🔢 **' + input.toUpperCase() + '** = **' + total + '** (عربي)');
            message.reply('❌ إدخال غير صالح.');
        }
    },
    {
        name: 'timestamp2', aliases: ['tsconv', 'وقت_يونكس'],
        description: 'تحويل تاريخ إلى Unix timestamp والعكس', category: 'بحث',
        execute(message, args, cm) {
            const input = args.slice(1).join(' ');
            if (!input) {
                const now = Date.now();
                return message.reply('**⏰ الوقت الحالي:**\n```\nUnix (ms)  : ' + now + '\nUnix (sec) : ' + Math.floor(now / 1000) + '\nISO        : ' + new Date().toISOString() + '\nعربي       : ' + new Date().toLocaleString('ar-EG') + '\n```');
            }
            const ts = parseInt(input);
            if (!isNaN(ts)) {
                const d = new Date(ts < 1e12 ? ts * 1000 : ts);
                return message.reply('**⏰ تحويل Timestamp:**\n```\nUnix : ' + ts + '\nتاريخ : ' + d.toLocaleString('ar-EG') + '\nISO   : ' + d.toISOString() + '\n```');
            }
            const d = new Date(input);
            if (isNaN(d)) return message.reply('❌ تاريخ غير صالح.');
            message.reply('**⏰ تحويل تاريخ:**\n```\nUnix (sec) : ' + Math.floor(d.getTime() / 1000) + '\nUnix (ms)  : ' + d.getTime() + '\n```');
        }
    },
    {
        name: 'unitconv', aliases: ['unit2', 'تحويل_وحدات'],
        description: 'تحويل الوحدات (طول / وزن / سرعة)', category: 'بحث',
        execute(message, args, cm) {
            const val = parseFloat(args[1]);
            const from = args[2]?.toLowerCase();
            const to = args[3]?.toLowerCase();
            if (isNaN(val) || !from || !to) return message.reply('❌ `' + cm.getMainPrefix() + 'unitconv <قيمة> <من> <إلى>`\nمثال: `' + cm.getMainPrefix() + 'unitconv 100 km mi`\n\nالوحدات: km, mi, m, ft, cm, in, kg, lb, oz, g, ms, mph, kmh');
            const toBase = { km:1000, mi:1609.34, m:1, ft:0.3048, cm:0.01, 'in':0.0254, kg:1, lb:0.453592, oz:0.0283495, g:0.001, ms:1, mph:0.44704, kmh:0.277778 };
            const b1 = toBase[from], b2 = toBase[to];
            if (!b1 || !b2) return message.reply('❌ وحدة غير معروفة.');
            const result = (val * b1 / b2).toFixed(4);
            message.reply('**🔄 تحويل الوحدات:**\n**' + val + ' ' + from + '** = **' + result + ' ' + to + '**');
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 15 — الأمان
    // ════════════════════════════════════════════════════════════
    {
        name: 'md5hash', aliases: ['md5', 'md5h'],
        description: 'توليد MD5 hash لأي نص', category: 'أمان',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'md5hash <النص>`');
            // Simple MD5 via Node crypto
            const crypto = require('crypto');
            const hash = crypto.createHash('md5').update(text).digest('hex');
            message.reply('**🔐 MD5 Hash:**\n```\nInput : ' + text.slice(0, 50) + '\nMD5   : ' + hash + '\n```');
        }
    },
    {
        name: 'sha1hash', aliases: ['sha1', 'sha1h'],
        description: 'توليد SHA-1 hash لأي نص', category: 'أمان',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'sha1hash <النص>`');
            const crypto = require('crypto');
            const hash = crypto.createHash('sha1').update(text).digest('hex');
            message.reply('**🔐 SHA-1 Hash:**\n```\nInput : ' + text.slice(0, 50) + '\nSHA1  : ' + hash + '\n```');
        }
    },
    {
        name: 'strongpass2', aliases: ['genpass2', 'passv3'],
        description: 'توليد كلمة مرور قوية مخصصة', category: 'أمان',
        execute(message, args, cm) {
            const len = Math.min(Math.max(parseInt(args[1]) || 16, 8), 64);
            const count = Math.min(parseInt(args[2]) || 3, 10);
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
            const passwords = Array.from({ length: count }, () => {
                let p = '';
                for (let i = 0; i < len; i++) p += chars[Math.floor(Math.random() * chars.length)];
                return p;
            });
            message.reply('**🔑 كلمات مرور قوية (طول: ' + len + '):**\n' + passwords.map((p, i) => '**' + (i + 1) + '.** `' + p + '`').join('\n') + '\n\n> ⚠️ لا تشارك هذه الكلمات مع أحد!');
        }
    },

    // ════════════════════════════════════════════════════════════
    //  SECTION 16 — عام
    // ════════════════════════════════════════════════════════════
    {
        name: 'serverid', aliases: ['guildid', 'ايدي_سيرفر'],
        description: 'عرض ID السيرفر الحالي بسرعة', category: 'أدوات',
        execute(message) {
            if (!message.guild) return message.reply('❌ هذا الأمر يعمل فقط في السيرفرات.');
            message.reply('**🏠 ID السيرفر:**\n> `' + message.guild.id + '`\n> انقر عليه لنسخه!');
        }
    },
    {
        name: 'channelid', aliases: ['chid', 'ايدي_قناة'],
        description: 'عرض ID القناة الحالية', category: 'أدوات',
        execute(message) {
            message.reply('**💬 ID القناة:**\n> `' + message.channel.id + '`');
        }
    },
    {
        name: 'userid', aliases: ['getmyid', 'ايدي_يوزر'],
        description: 'عرض ID أي مستخدم أو ID نفسك', category: 'أدوات',
        execute(message, args, cm) {
            const target = message.mentions?.users?.first() || message.client.user;
            message.reply('**🆔 ID المستخدم:**\n> **' + target.username + '**\n> `' + target.id + '`');
        }
    },
    {
        name: 'uptime2', aliases: ['botuptime', 'وقت_تشغيل'],
        description: 'وقت تشغيل البوت بالتفصيل', category: 'أدوات',
        execute(message) {
            const upMs = process.uptime() * 1000;
            const d = Math.floor(upMs / 86400000);
            const h = Math.floor((upMs % 86400000) / 3600000);
            const m = Math.floor((upMs % 3600000) / 60000);
            const s = Math.floor((upMs % 60000) / 1000);
            const mem = process.memoryUsage();
            message.reply([
                '**⏱️ وقت تشغيل البوت:**',
                '```',
                '⏰ المدة    : ' + (d ? d + 'ي ' : '') + (h ? h + 'س ' : '') + m + 'د ' + s + 'ث',
                '🧠 الذاكرة : ' + Math.round(mem.heapUsed / 1024 / 1024) + 'MB / ' + Math.round(mem.rss / 1024 / 1024) + 'MB',
                '⚡ Node.js : ' + process.version,
                '🏠 السيرفرات: ' + message.client.guilds.cache.size,
                '```'
            ].join('\n'));
        }
    },
    {
        name: 'randomword', aliases: ['rword', 'كلمة_عشوائية'],
        description: 'كلمة عشوائية مع معناها', category: 'أدوات',
        execute(message) {
            const words = [
                ['إبداع', 'توليد أفكار جديدة وأصيلة'], ['شجاعة', 'القدرة على مواجهة الخوف'], ['حكمة', 'العلم مع حسن التصرف'],
                ['إصرار', 'الثبات على الهدف رغم العقبات'], ['تواضع', 'عدم الغرور والكبر'], ['إخلاص', 'الصدق في النية والعمل'],
                ['ابتكار', 'إيجاد طرق جديدة وغير مألوفة'], ['تعاون', 'العمل معاً لتحقيق هدف مشترك'],
                ['مثابرة', 'الاستمرار في العمل حتى النجاح'], ['انضباط', 'الالتزام بالنظام والقواعد'],
            ];
            const [word, meaning] = words[Math.floor(Math.random() * words.length)];
            message.reply('**📖 كلمة اليوم:**\n> **' + word + '**\n> *' + meaning + '*');
        }
    },
];
