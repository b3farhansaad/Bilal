// ╔══════════════════════════════════════════════════════╗
// ║   newcmds.js — أوامر إضافية لكل الأقسام (Snodix v5) ║
// ╚══════════════════════════════════════════════════════╝
const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── helpers ──────────────────────────────────────────────────────────────────
function saveJSON(f, d) { try { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(d, null, 2)); } catch {} }
function loadJSON(f, def) { try { if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8')); } catch {} return def; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const DATA = path.join(__dirname, '../data');

module.exports = [

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 1 — إرسال ونشر
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'sayas', aliases: ['say2', 'echo2', 'قل'],
        description: 'أرسل أي رسالة وتحذف رسالتك', category: 'نشر',
        async execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'sayas <الرسالة>`');
            try { await message.delete().catch(() => {}); await message.channel.send(text); } catch (e) { message.channel.send('❌ فشل: `' + e.message + '`'); }
        }
    },
    {
        name: 'troll', aliases: ['trollmsg', 'prank'],
        description: 'رسالة تمييز مضحكة ومصممة', category: 'مرح',
        async execute(message, args, cm) {
            const target = message.mentions?.users?.first()?.username || args.slice(1).join(' ') || 'صاحبنا';
            const trolls = [
                '⚠️ **تحذير نظام:** تم رصد نشاط مريب من **' + target + '** • قد يكون جاسوساً! 🕵️',
                '🔴 **إشعار:** حساب **' + target + '** يُراقَب الآن من قِبل الإدارة العليا 👀',
                '🧪 **اختبار معدل الذكاء:** **' + target + '** حصل على **12/100** 💀',
                '📢 **إعلان رسمي:** **' + target + '** طُرد من السيرفر رسمياً... أو لا 😂',
                '⚡ **تحديث:** تم اكتشاف أن **' + target + '** يستخدم Internet Explorer عام 2024 💀'
            ];
            await message.delete().catch(() => {});
            await message.channel.send(trolls[Math.floor(Math.random() * trolls.length)]);
        }
    },
    {
        name: 'multiline', aliases: ['ml', 'splittext'],
        description: 'إرسال نص على عدة أسطر منفصلة', category: 'نشر',
        async execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'multiline <نص1|نص2|نص3>`');
            const lines = text.split('|').map(l => l.trim()).filter(l => l).slice(0, 10);
            if (lines.length < 2) return message.reply('❌ افصل الأسطر بـ `|`');
            await message.delete().catch(() => {});
            for (const line of lines) { await message.channel.send(line).catch(() => {}); await sleep(600); }
        }
    },
    {
        name: 'countdown3', aliases: ['timer3', 'عداد'],
        description: 'رسالة عداد تنازلي مرئي في الشات', category: 'نشر',
        async execute(message, args, cm) {
            const secs = Math.min(Math.max(parseInt(args[1]) || 5, 1), 60);
            const label = args.slice(2).join(' ') || 'انتهى الوقت!';
            const msg = await message.reply('⏳ **' + secs + '** ثانية...');
            for (let i = secs - 1; i >= 0; i--) {
                await sleep(1000);
                const bar = '█'.repeat(Math.ceil((i / secs) * 10)) + '░'.repeat(10 - Math.ceil((i / secs) * 10));
                if (i === 0) await msg.edit('🔔 **' + label + '**').catch(() => {});
                else await msg.edit('⏳ `[' + bar + ']` **' + i + '** ثانية...').catch(() => {});
            }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 2 — الحساب والمعلومات
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'accountstats', aliases: ['mystats2', 'acstats', 'احصائياتي'],
        description: 'إحصائيات حسابك الكاملة', category: 'حساب',
        execute(message) {
            const u = message.client.user;
            const guilds = message.client.guilds.cache;
            const created = new Date(Number((BigInt(u.id) >> 22n) + 1420070400000n));
            const ageMs = Date.now() - created.getTime();
            const ageDays = Math.floor(ageMs / 86400000);
            const totalMembers = guilds.reduce((s, g) => s + g.memberCount, 0);
            const totalChannels = guilds.reduce((s, g) => s + g.channels.cache.size, 0);
            message.reply([
                '**📊 إحصائيات الحساب**',
                '```',
                '👤 اليوزر    : ' + u.username,
                '🆔 ID        : ' + u.id,
                '📅 تاريخ الإنشاء : ' + created.toLocaleDateString('ar-EG'),
                '🗓️ عمر الحساب : ' + ageDays + ' يوم',
                '🏠 عدد السيرفرات : ' + guilds.size,
                '👥 مجموع الأعضاء : ' + totalMembers.toLocaleString(),
                '💬 مجموع القنوات : ' + totalChannels,
                '🤖 حالة البوت   : مشغّل ✅',
                '```'
            ].join('\n'));
        }
    },
    {
        name: 'mybio2', aliases: ['showbio', 'بايو'],
        description: 'عرض بايو حسابك الحالي', category: 'حساب',
        execute(message) {
            const u = message.client.user;
            const bio = u.bio || '(لا يوجد بايو مضبوط)';
            message.reply('**📝 بايو حسابك:**\n> ' + bio);
        }
    },
    {
        name: 'myperms', aliases: ['perms2', 'myperms3'],
        description: 'صلاحياتك في هذا السيرفر', category: 'حساب',
        execute(message) {
            if (!message.guild) return message.reply('❌ هذا الأمر يعمل فقط في السيرفرات.');
            const member = message.guild.members.cache.get(message.client.user.id);
            const perms = member?.permissions;
            if (!perms) return message.reply('❌ تعذر جلب الصلاحيات.');
            const permList = [
                ['ADMINISTRATOR', '👑 Admin'],
                ['MANAGE_GUILD', '⚙️ إدارة السيرفر'],
                ['MANAGE_CHANNELS', '📁 إدارة القنوات'],
                ['MANAGE_ROLES', '🎭 إدارة الرتب'],
                ['MANAGE_MESSAGES', '🗑️ إدارة الرسائل'],
                ['BAN_MEMBERS', '🔨 الحظر'],
                ['KICK_MEMBERS', '👢 الطرد'],
                ['MENTION_EVERYONE', '📢 منشن الكل'],
                ['EMBED_LINKS', '🔗 روابط مضمنة'],
                ['ATTACH_FILES', '📎 إرفاق ملفات']
            ];
            const active = permList.filter(([p]) => perms.has(p)).map(([, n]) => n);
            message.reply('**🔐 صلاحياتك في ' + message.guild.name + ':**\n' + (active.length ? active.join(' • ') : '❌ لا صلاحيات خاصة'));
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 3 — السيرفرات والمعلومات
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'biggestservers', aliases: ['topservers2', 'bigservers', 'أكبرسيرفرات'],
        description: 'أكبر 10 سيرفرات أنت فيها', category: 'سيرفر',
        execute(message) {
            const sorted = [...message.client.guilds.cache.values()]
                .sort((a, b) => b.memberCount - a.memberCount)
                .slice(0, 10);
            let text = '**🏆 أكبر 10 سيرفرات:**\n```\n';
            sorted.forEach((g, i) => {
                text += (i + 1).toString().padStart(2) + '. ' + g.name.slice(0, 22).padEnd(22) + ' ' + g.memberCount.toLocaleString() + ' عضو\n';
            });
            message.reply(text + '```');
        }
    },
    {
        name: 'serversummary', aliases: ['ss2', 'ملخصسيرفر'],
        description: 'ملخص إحصائي سريع للسيرفر الحالي', category: 'سيرفر',
        execute(message) {
            const g = message.guild;
            if (!g) return message.reply('❌ استخدم هذا الأمر في سيرفر.');
            const bots = g.members.cache.filter(m => m.user.bot).size;
            const humans = g.memberCount - bots;
            const online = g.members.cache.filter(m => m.presence?.status !== 'offline' && !m.user.bot).size;
            const text_ch = g.channels.cache.filter(c => c.type === 'GUILD_TEXT').size;
            const voice_ch = g.channels.cache.filter(c => c.type === 'GUILD_VOICE').size;
            message.reply([
                '**📋 ملخص سيرفر ' + g.name + '**',
                '```',
                '👥 الأعضاء  : ' + g.memberCount + ' (' + humans + ' إنسان + ' + bots + ' بوت)',
                '🟢 أونلاين  : ~' + online,
                '💬 نصي     : ' + text_ch + ' قناة',
                '🔊 صوتي    : ' + voice_ch + ' قناة',
                '🎭 رتب     : ' + g.roles.cache.size,
                '😀 إيموجي  : ' + g.emojis.cache.size,
                '🚀 بوستات  : ' + (g.premiumSubscriptionCount || 0),
                '```'
            ].join('\n'));
        }
    },
    {
        name: 'myrank', aliases: ['rank2', 'رتبتي'],
        description: 'رتبك وصلاحياتك في السيرفر', category: 'سيرفر',
        execute(message) {
            if (!message.guild) return message.reply('❌ هذا الأمر يعمل فقط في السيرفرات.');
            const member = message.guild.members.cache.get(message.client.user.id);
            if (!member) return message.reply('❌ تعذر جلب بياناتك.');
            const roles = member.roles.cache.filter(r => r.id !== message.guild.id).sort((a, b) => b.position - a.position);
            const topRole = roles.first()?.name || 'لا يوجد';
            message.reply([
                '**🎭 رتبك في ' + message.guild.name + '**',
                '```',
                '👑 أعلى رتبة  : ' + topRole,
                '🎭 عدد الرتب  : ' + roles.size,
                '📋 الرتب      : ' + [...roles.values()].slice(0, 5).map(r => r.name).join(', '),
                '```'
            ].join('\n'));
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 4 — إدارة السيرفر
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'mentionrole2', aliases: ['pingrole2', 'نبهرتبة'],
        description: 'منشن لكل أعضاء رتبة معينة (حتى 15)', category: 'إدارة',
        async execute(message, args, cm) {
            const roleName = args.slice(1).join(' ');
            if (!roleName) return message.reply('❌ `' + cm.getMainPrefix() + 'mentionrole2 <اسم الرتبة>`');
            const role = message.guild?.roles.cache.find(r => r.name.toLowerCase().includes(roleName.toLowerCase()));
            if (!role) return message.reply('❌ رتبة `' + roleName + '` غير موجودة.');
            const members = [...role.members.values()].slice(0, 15);
            if (!members.length) return message.reply('❌ لا يوجد أعضاء في هذه الرتبة.');
            await message.channel.send(members.map(m => '<@' + m.id + '>').join(' '));
        }
    },
    {
        name: 'deletemsg2', aliases: ['delmsg2', 'حذفرسالة'],
        description: 'حذف رسالة بالـ Message ID', category: 'إدارة',
        async execute(message, args, cm) {
            const id = args[1];
            if (!id) return message.reply('❌ `' + cm.getMainPrefix() + 'deletemsg2 <message_id>`');
            try {
                const msg = await message.channel.messages.fetch(id);
                await msg.delete();
                const m = await message.reply('✅ **تم حذف الرسالة.**');
                setTimeout(() => { m.delete().catch(() => {}); message.delete().catch(() => {}); }, 3000);
            } catch (e) { message.reply('❌ فشل: `' + e.message + '`'); }
        }
    },
    {
        name: 'massmove', aliases: ['moveall', 'نقلجماعي'],
        description: 'نقل كل أعضاء روم صوتي لروم آخر', category: 'إدارة',
        async execute(message, args, cm) {
            if (!message.guild) return message.reply('❌ يعمل فقط في السيرفرات.');
            const fromName = args[1]; const toName = args[2];
            if (!fromName || !toName) return message.reply('❌ `' + cm.getMainPrefix() + 'massmove <روم_المصدر> <روم_الهدف>`');
            const from = message.guild.channels.cache.find(c => c.type === 'GUILD_VOICE' && c.name.toLowerCase().includes(fromName.toLowerCase()));
            const to = message.guild.channels.cache.find(c => c.type === 'GUILD_VOICE' && c.name.toLowerCase().includes(toName.toLowerCase()));
            if (!from) return message.reply('❌ روم المصدر مش موجود.');
            if (!to) return message.reply('❌ روم الهدف مش موجود.');
            const members = [...from.members.values()];
            if (!members.length) return message.reply('❌ الروم فاضي.');
            let moved = 0;
            for (const m of members) {
                try { await m.voice.setChannel(to); moved++; await sleep(300); } catch {}
            }
            message.reply('✅ **تم نقل ' + moved + '/' + members.length + ' عضو** من **' + from.name + '** إلى **' + to.name + '**');
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 6 — الأصدقاء
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'mutualservers2', aliases: ['commonservers', 'سيرفراتمشتركة'],
        description: 'السيرفرات المشتركة مع مستخدم', category: 'أصدقاء',
        execute(message, args, cm) {
            const target = message.mentions?.users?.first();
            if (!target) return message.reply('❌ `' + cm.getMainPrefix() + 'mutualservers2 @يوزر`');
            const mutual = message.client.guilds.cache.filter(g => g.members.cache.has(target.id));
            if (!mutual.size) return message.reply('❌ لا توجد سيرفرات مشتركة مع **' + target.username + '**.');
            let text = '**🌐 سيرفرات مشتركة مع ' + target.username + ' (' + mutual.size + '):**\n';
            [...mutual.values()].slice(0, 15).forEach((g, i) => { text += '**' + (i + 1) + '.** ' + g.name + ' — ' + g.memberCount + ' عضو\n'; });
            message.reply(text.slice(0, 1900));
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 8 — الألعاب
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'blackjack', aliases: ['bj', 'twentyone', '21', 'بلاك'],
        description: 'لعبة Blackjack (21) ضد البوت 🃏', category: 'ألعاب',
        async execute(message, args, cm) {
            const suits = ['♠️', '♥️', '♦️', '♣️'];
            const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
            const deck = [];
            suits.forEach(s => values.forEach(v => deck.push({ s, v })));

            function drawCard() { return deck.splice(Math.floor(Math.random() * deck.length), 1)[0]; }
            function cardVal(c) { return ['J', 'Q', 'K'].includes(c.v) ? 10 : c.v === 'A' ? 11 : parseInt(c.v); }
            function handVal(hand) {
                let total = hand.reduce((s, c) => s + cardVal(c), 0);
                let aces = hand.filter(c => c.v === 'A').length;
                while (total > 21 && aces > 0) { total -= 10; aces--; }
                return total;
            }
            function fmt(hand) { return hand.map(c => c.v + c.s).join(' ') + ' = **' + handVal(hand) + '**'; }

            const pHand = [drawCard(), drawCard()];
            const dHand = [drawCard(), drawCard()];

            if (handVal(pHand) === 21) {
                return message.reply('🃏 **Blackjack!**\nبطاقاتك: ' + fmt(pHand) + '\n\n🏆 **فزت بـ Blackjack فوراً!**');
            }

            let text = '🃏 **Blackjack**\n\nبطاقاتك: ' + fmt(pHand) + '\nالبوت: ' + dHand[0].v + dHand[0].s + ' + ❓\n\n`' + cm.getMainPrefix() + 'bj hit` — اسحب بطاقة\n`' + cm.getMainPrefix() + 'bj stand` — قف';
            const msg = await message.reply(text);

            const sub = args[1]?.toLowerCase();
            if (!sub || sub === 'new') return;

            if (sub === 'hit') {
                pHand.push(drawCard());
                const pTotal = handVal(pHand);
                if (pTotal > 21) return msg.edit('🃏 **Bust!** بطاقاتك: ' + fmt(pHand) + '\n\n💀 **خسرت! تجاوزت 21.**');
                return msg.edit('🃏 بطاقاتك: ' + fmt(pHand) + '\n`' + cm.getMainPrefix() + 'bj hit` أو `' + cm.getMainPrefix() + 'bj stand`');
            }

            if (sub === 'stand') {
                while (handVal(dHand) < 17) dHand.push(drawCard());
                const p = handVal(pHand), d = handVal(dHand);
                let result = '';
                if (d > 21 || p > d) result = '🏆 **فزت!** (' + p + ' vs ' + d + ')';
                else if (p === d) result = '🤝 **تعادل!**';
                else result = '💀 **خسرت!** (' + p + ' vs ' + d + ')';
                return msg.edit('🃏 **النتيجة**\nبطاقاتك: ' + fmt(pHand) + '\nالبوت: ' + fmt(dHand) + '\n\n' + result);
            }
        }
    },
    {
        name: 'quiz2', aliases: ['سؤال2', 'فضول'],
        description: 'سؤال ثقافي عربي مع خيارات', category: 'ألعاب',
        execute(message) {
            const questions = [
                { q: 'ما هي عاصمة المملكة العربية السعودية؟', opts: ['الرياض', 'جدة', 'مكة', 'المدينة'], a: 0 },
                { q: 'كم عدد أيام الأسبوع؟', opts: ['5', '6', '7', '8'], a: 2 },
                { q: 'ما هو أطول نهر في العالم؟', opts: ['الأمازون', 'النيل', 'المسيسيبي', 'اليانغتسي'], a: 1 },
                { q: 'في أي قارة تقع مصر؟', opts: ['آسيا', 'أوروبا', 'أفريقيا', 'أمريكا'], a: 2 },
                { q: 'ما هو أكبر كوكب في المجموعة الشمسية؟', opts: ['زحل', 'المريخ', 'المشتري', 'الأرض'], a: 2 },
                { q: 'كم عدد حروف اللغة العربية؟', opts: ['26', '28', '30', '32'], a: 1 },
                { q: 'ما هي لغة البرمجة التي اسمها كاسم ثعبان؟', opts: ['Java', 'Python', 'Ruby', 'Cobra'], a: 1 },
                { q: 'ما هو أصغر دولة في العالم من حيث المساحة؟', opts: ['موناكو', 'سان مارينو', 'الفاتيكان', 'ليختنشتاين'], a: 2 },
            ];
            const q = questions[Math.floor(Math.random() * questions.length)];
            const letters = ['أ', 'ب', 'ج', 'د'];
            const optsText = q.opts.map((o, i) => '**' + letters[i] + ')** ' + o).join('\n');
            message.reply('**🧠 سؤال ثقافي:**\n\n' + q.q + '\n\n' + optsText + '\n\n> الإجابة الصحيحة: **' + letters[q.a] + ') ' + q.opts[q.a] + '**\n*(اعرف الإجابة قبل ما تقرأها!)* 😄');
        }
    },
    {
        name: 'roulette2', aliases: ['روليت', 'روليتة'],
        description: 'روليت روسية — هل ستنجو؟ 🎰', category: 'ألعاب',
        execute(message) {
            const survived = Math.random() < 5 / 6;
            if (survived) {
                const reactions = ['😮‍💨 نجوت هذه المرة... الحظ في صفك!', '🍀 الحظ السعيد معك!', '😅 كانت قريبة... ولكنك نجوت!', '🎉 بالكاد! لكنك لا تزال حياً!'];
                message.reply('🎰 **الروليت الروسية**\n*تدور الطلقة...*\n\n' + reactions[Math.floor(Math.random() * reactions.length)]);
            } else {
                message.reply('🎰 **الروليت الروسية**\n*تدور الطلقة...*\n\n💥 **BANG!** لقد... خسرت هذه الجولة الافتراضية! 💀\n*(لا تقلق، إنها مجرد لعبة!)*');
            }
        }
    },
    {
        name: 'mathchallenge', aliases: ['mathqz', 'تحدي_رياضيات'],
        description: 'تحدي رياضيات سريع 🧮', category: 'ألعاب',
        execute(message, args, cm) {
            const levels = { easy: 10, medium: 50, hard: 200 };
            const level = args[1]?.toLowerCase() || 'medium';
            const max = levels[level] || levels.medium;
            const ops = ['+', '-', '×'];
            const op = ops[Math.floor(Math.random() * ops.length)];
            const a = Math.floor(Math.random() * max) + 1;
            const b = Math.floor(Math.random() * (op === '-' ? a : max)) + 1;
            let answer, question;
            if (op === '+') { answer = a + b; question = a + ' + ' + b; }
            else if (op === '-') { answer = a - b; question = a + ' - ' + b; }
            else { answer = a * b; question = a + ' × ' + b; }
            message.reply('🧮 **تحدي رياضيات!** المستوى: `' + level + '`\n\n**' + question + ' = ؟**\n\n||**الإجابة: ' + answer + '**||');
        }
    },
    {
        name: 'wouldyou2', aliases: ['هل_تفضل2', 'اختار'],
        description: 'هل تفضّل...؟ لعبة الاختيار', category: 'ألعاب',
        execute(message) {
            const choices = [
                ['تكون غني ووحيد', 'تكون فقير ومحبوب'],
                ['تطير كطائر', 'تسبح كسمكة'],
                ['تعيش 200 سنة صحي', 'تعيش 80 سنة مليئة بالمغامرات'],
                ['تعرف كل لغات العالم', 'تعزف كل الموسيقى'],
                ['لا تنام أبداً ولا تتعب', 'لا تأكل أبداً ولا تجوع'],
                ['تعيش في الماضي', 'تعيش في المستقبل'],
                ['تكون مشهور ومكروه', 'تكون مجهول ومحبوب'],
            ];
            const c = choices[Math.floor(Math.random() * choices.length)];
            message.reply('🤔 **هل تفضّل؟**\n\n**🅰️ ' + c[0] + '**\n\nأم\n\n**🅱️ ' + c[1] + '**\n\n*(رُد بـ أ أو ب أو بتعليقك!)*');
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 9 — التفاعلات التلقائية
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'autopurge', aliases: ['autoclean', 'تنظيف_تلقائي'],
        description: 'حذف رسائلك تلقائياً بعد وقت محدد (ثواني)', category: 'أوتوماتيك',
        async execute(message, args, cm) {
            const secs = parseInt(args[1]);
            if (!secs || secs < 1 || secs > 300) return message.reply('❌ `' + cm.getMainPrefix() + 'autopurge <ثواني 1-300> <الرسالة>`');
            const text = args.slice(2).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'autopurge <ثواني> <الرسالة>`');
            await message.delete().catch(() => {});
            const m = await message.channel.send(text);
            setTimeout(() => m.delete().catch(() => {}), secs * 1000);
        }
    },
    {
        name: 'watchkw2', aliases: ['keyword2', 'راقب'],
        description: 'تنبيه عند ظهور كلمة معينة في الشات', category: 'أوتوماتيك',
        execute(message, args, cm) {
            const f = path.join(DATA, 'watchkw.json');
            const sub = args[1]?.toLowerCase();
            let kws = loadJSON(f, []);
            const prefix = cm.getMainPrefix();
            if (sub === 'add') {
                const kw = args.slice(2).join(' ').toLowerCase();
                if (!kw) return message.reply('❌ `' + prefix + 'watchkw2 add <الكلمة>`');
                if (!kws.includes(kw)) { kws.push(kw); saveJSON(f, kws); }
                return message.reply('✅ تمت إضافة `' + kw + '` للمراقبة.');
            }
            if (sub === 'list') {
                if (!kws.length) return message.reply('📭 لا توجد كلمات مراقبة.');
                return message.reply('**👁️ الكلمات المراقبة (' + kws.length + '):**\n' + kws.map((k, i) => (i + 1) + '. `' + k + '`').join('\n'));
            }
            if (sub === 'remove') {
                const kw = args.slice(2).join(' ').toLowerCase();
                kws = kws.filter(k => k !== kw); saveJSON(f, kws);
                return message.reply('✅ تم حذف `' + kw + '`.');
            }
            if (sub === 'clear') { saveJSON(f, []); return message.reply('🗑️ تم مسح كل الكلمات.'); }
            message.reply('**👁️ مراقبة الكلمات**\n`' + prefix + 'watchkw2 add <كلمة>`\n`' + prefix + 'watchkw2 list`\n`' + prefix + 'watchkw2 remove <كلمة>`\n`' + prefix + 'watchkw2 clear`');
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 10 — أدوات النص
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'boxtext', aliases: ['box2', 'frame', 'إطار'],
        description: 'ضع نصك في إطار ASCII جميل', category: 'نصوص',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'boxtext <النص>`');
            const width = Math.min(text.length + 4, 40);
            const top = '╔' + '═'.repeat(width) + '╗';
            const mid = '║  ' + text.padEnd(width - 2) + '  ║';
            const bot = '╚' + '═'.repeat(width) + '╝';
            message.reply('```\n' + top + '\n' + mid + '\n' + bot + '\n```');
        }
    },
    {
        name: 'rainbow2', aliases: ['rgb2', 'radbow', 'ألوان'],
        description: 'نص بتأثير قوس قزح بالإيموجيات', category: 'نصوص',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'rainbow2 <النص>`');
            const colors = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚪'];
            const result = text.split('').map((c, i) => colors[i % colors.length] + c).join('');
            if (result.length > 1800) return message.reply('❌ النص طويل جداً!');
            message.reply(result);
        }
    },
    {
        name: 'spoilertext', aliases: ['spoiler2', 'سبويلر'],
        description: 'حوّل كل حرف لـ spoiler مخفي', category: 'نصوص',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'spoilertext <النص>`');
            const result = text.split('').map(c => c === ' ' ? ' ' : '||' + c + '||').join('');
            if (result.length > 1800) return message.reply('❌ النص طويل جداً!');
            message.reply(result);
        }
    },
    {
        name: 'aesthetictext', aliases: ['aes2', 'جمالي'],
        description: 'نص أستاتيك فاصل بين الحروف', category: 'نصوص',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'aesthetictext <النص>`');
            const wide = text.split('').map(c => {
                const code = c.codePointAt(0);
                if (code >= 0x21 && code <= 0x7E) return String.fromCodePoint(code + 0xFF01 - 0x21);
                return c;
            }).join('');
            message.reply(wide);
        }
    },
    {
        name: 'textart', aliases: ['art2', 'فن_نصي'],
        description: 'حوّل نص لفن ASCII مبسط', category: 'نصوص',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ').toUpperCase().slice(0, 10);
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'textart <النص>` (حتى 10 أحرف)');
            const styles = [
                '✦ ✧ ✦ ' + text + ' ✦ ✧ ✦',
                '━━━━━━━━━━\n  ' + text + '\n━━━━━━━━━━',
                '【 ' + text + ' 】',
                '⟨⟨ ' + text + ' ⟩⟩',
                '◈ ' + text.split('').join(' ◈ ') + ' ◈',
            ];
            message.reply(styles[Math.floor(Math.random() * styles.length)]);
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 11 — البحث والمعلومات
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'define2', aliases: ['معنى', 'تعريف'],
        description: 'تعريف كلمة عربية أو إنجليزية', category: 'بحث',
        execute(message, args, cm) {
            const word = args.slice(1).join(' ');
            if (!word) return message.reply('❌ `' + cm.getMainPrefix() + 'define2 <الكلمة>`');
            // Using a simple built-in dictionary for common words
            const dict = {
                'ذكاء': 'القدرة على التعلم والفهم والحل والتكيف مع مواقف جديدة.',
                'برمجة': 'عملية كتابة تعليمات لجهاز الكمبيوتر لتنفيذ مهام معينة.',
                'إبداع': 'القدرة على توليد أفكار جديدة وأصيلة وذات قيمة.',
                'تكنولوجيا': 'تطبيق المعرفة العلمية لأغراض عملية في الصناعة والحياة اليومية.',
            };
            const def = dict[word.toLowerCase()];
            if (def) return message.reply('**📖 تعريف "' + word + '":**\n> ' + def);
            message.reply('**📖 تعريف "' + word + '":**\n> لم يُعثر على تعريف محدد في القاموس المحلي.\n> جرب `!ask معنى كلمة ' + word + '` للحصول على تعريف من الـ AI!');
        }
    },
    {
        name: 'mathcalc', aliases: ['calc2', 'حاسبة', 'احسب'],
        description: 'حاسبة متقدمة تحل المعادلات', category: 'بحث',
        execute(message, args, cm) {
            const expr = args.slice(1).join(' ').replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**');
            if (!expr) return message.reply('❌ `' + cm.getMainPrefix() + 'mathcalc <المعادلة>`\nأمثلة: `2+2`، `(10*5)/2`، `2**8`');
            try {
                if (!/^[\d\s\+\-\*\/\.\(\)\%\*\^]+$/.test(expr)) return message.reply('❌ معادلة غير صالحة. استخدم الأرقام والعمليات الأساسية فقط.');
                const result = Function('"use strict"; return (' + expr + ')')();
                if (!isFinite(result)) return message.reply('❌ النتيجة غير محددة (قسمة على صفر؟)');
                message.reply('🧮 **' + args.slice(1).join(' ') + ' = ' + result + '**');
            } catch (e) { message.reply('❌ معادلة غير صالحة.'); }
        }
    },
    {
        name: 'colorhex', aliases: ['color2', 'لون'],
        description: 'معلومات تفصيلية عن لون HEX', category: 'بحث',
        execute(message, args, cm) {
            let hex = args[1]?.replace('#', '') || 'FF5733';
            if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return message.reply('❌ `' + cm.getMainPrefix() + 'colorhex <HEX>`\nمثال: `' + cm.getMainPrefix() + 'colorhex FF5733`');
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            const hsl = rgbToHsl(r, g, b);
            message.reply([
                '**🎨 معلومات اللون #' + hex.toUpperCase() + '**',
                '```',
                '🔴 أحمر   : ' + r + ' (' + Math.round(r / 255 * 100) + '%)',
                '🟢 أخضر   : ' + g + ' (' + Math.round(g / 255 * 100) + '%)',
                '🔵 أزرق   : ' + b + ' (' + Math.round(b / 255 * 100) + '%)',
                '☀️ السطوع : ' + Math.round(brightness) + '/255 (' + (brightness > 127 ? 'فاتح' : 'غامق') + ')',
                '🌈 HSL     : hsl(' + hsl[0] + '°, ' + hsl[1] + '%, ' + hsl[2] + '%)',
                '```'
            ].join('\n'));
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 14 — ميزات متقدمة
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'fakereply', aliases: ['fr2', 'replyspoof', 'ردمزيف'],
        description: 'رسالة ترُد على رسالة أخرى وتحذف نفسها', category: 'متقدم',
        async execute(message, args, cm) {
            const msgId = args[1];
            const text = args.slice(2).join(' ');
            if (!msgId || !text) return message.reply('❌ `' + cm.getMainPrefix() + 'fakereply <message_id> <الرسالة>`');
            try {
                const target = await message.channel.messages.fetch(msgId);
                await message.delete().catch(() => {});
                const sent = await target.reply(text);
                setTimeout(() => sent.delete().catch(() => {}), 8000);
            } catch (e) { message.channel.send('❌ فشل: `' + e.message + '`').then(m => setTimeout(() => m.delete().catch(() => {}), 3000)); }
        }
    },
    {
        name: 'autostatus2', aliases: ['statusauto', 'حالةتلقائية'],
        description: 'تدوير تلقائي بين حالات متعددة كل 60 ثانية', category: 'متقدم',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            const prefix = cm.getMainPrefix();
            if (!text) return message.reply('❌ `' + prefix + 'autostatus2 حالة1|حالة2|حالة3`\nمثال: `' + prefix + 'autostatus2 يلعب ماين كرافت|ينام|يأكل`');
            const statuses = text.split('|').map(s => s.trim()).filter(s => s);
            if (statuses.length < 2) return message.reply('❌ أضف على الأقل حالتين مفصولتين بـ `|`');
            // Clear any existing rotation
            if (message.client._statusRotate) clearInterval(message.client._statusRotate);
            let i = 0;
            message.client._statusRotate = setInterval(async () => {
                try {
                    await message.client.user.setActivity(statuses[i % statuses.length], { type: 'CUSTOM' });
                    i++;
                } catch {}
            }, 60000);
            message.reply('🔄 **تدوير الحالة مفعّل!**\n' + statuses.map((s, j) => '**' + (j + 1) + '.** ' + s).join('\n') + '\n\n> يتغير كل 60 ثانية. استخدم `' + prefix + 'clearrotators` للإيقاف.');
        }
    },
    {
        name: 'massedit2', aliases: ['bulkedit', 'تعديلجماعي'],
        description: 'تعديل آخر N رسالة أرسلتها', category: 'متقدم',
        async execute(message, args, cm) {
            const count = Math.min(parseInt(args[1]) || 3, 10);
            const newText = args.slice(2).join(' ');
            if (!newText) return message.reply('❌ `' + cm.getMainPrefix() + 'massedit2 <عدد> <النص الجديد>`');
            const msgs = await message.channel.messages.fetch({ limit: 100 });
            const mine = [...msgs.values()].filter(m => m.author.id === message.client.user.id && m.id !== message.id).slice(0, count);
            if (!mine.length) return message.reply('❌ لا توجد رسائل سابقة.');
            let edited = 0;
            for (const m of mine) { try { await m.edit(newText); edited++; await sleep(500); } catch {} }
            const r = await message.reply('✅ تم تعديل **' + edited + '** رسالة.');
            setTimeout(() => { r.delete().catch(() => {}); message.delete().catch(() => {}); }, 4000);
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 15 — الأمان والحماية
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'passcheck2', aliases: ['checkpass', 'قوةكلمةمرور'],
        description: 'تحليل قوة كلمة المرور', category: 'أمان',
        execute(message, args, cm) {
            const pass = args[1];
            if (!pass) return message.reply('❌ `' + cm.getMainPrefix() + 'passcheck2 <كلمة_المرور>`');
            let score = 0; const tips = [];
            if (pass.length >= 8) score++; else tips.push('❌ أقصر من 8 أحرف');
            if (pass.length >= 12) score++; else tips.push('⚠️ أقل من 12 حرف');
            if (/[A-Z]/.test(pass)) score++; else tips.push('❌ لا يوجد حروف كبيرة');
            if (/[a-z]/.test(pass)) score++; else tips.push('❌ لا يوجد حروف صغيرة');
            if (/[0-9]/.test(pass)) score++; else tips.push('❌ لا يوجد أرقام');
            if (/[^A-Za-z0-9]/.test(pass)) score++; else tips.push('❌ لا يوجد رموز (!@#$)');
            const levels = ['🔴 ضعيفة جداً', '🔴 ضعيفة', '🟠 متوسطة', '🟡 جيدة', '🟢 قوية', '🟢 قوية جداً', '💎 ممتازة'];
            message.reply([
                '**🔐 تحليل كلمة المرور**',
                '```',
                '📏 الطول    : ' + pass.length + ' حرف',
                '⚡ القوة    : ' + levels[Math.min(score, 6)],
                '📊 النقاط   : ' + score + '/6',
                '```',
                tips.length ? '**نصائح للتحسين:**\n' + tips.join('\n') : '✅ **كلمة مرور قوية جداً!**'
            ].join('\n'));
        }
    },
    {
        name: 'urlcheck2', aliases: ['linkcheck2', 'فحصرابط'],
        description: 'فحص رابط: هل هو آمن أم مشبوه؟', category: 'أمان',
        execute(message, args, cm) {
            const url = args[1];
            if (!url) return message.reply('❌ `' + cm.getMainPrefix() + 'urlcheck2 <الرابط>`');
            const suspicious = ['bit.ly', 'tinyurl', 'gg.gg', 't.co', 'goo.gl', 'is.gd', 'rb.gy'];
            const phishing = ['login', 'verify', 'confirm', 'account', 'secure', 'update', 'banking'];
            const isSuspShort = suspicious.some(d => url.includes(d));
            const hasPhish = phishing.some(w => url.toLowerCase().includes(w));
            const isHTTPS = url.startsWith('https://');
            const knownSafe = ['discord.com', 'github.com', 'google.com', 'youtube.com', 'reddit.com', 'twitter.com', 'amazon.com'].some(d => url.includes(d));

            let risk = '🟢 آمن';
            const warnings = [];
            if (!isHTTPS) { risk = '🟡 تحذير'; warnings.push('⚠️ لا يستخدم HTTPS'); }
            if (isSuspShort) { risk = '🟠 مشبوه'; warnings.push('⚠️ رابط مختصر مجهول'); }
            if (hasPhish) { risk = '🔴 خطر!'; warnings.push('🚨 يحتوي كلمات مشبوهة (تسجيل دخول/تحقق)'); }
            if (knownSafe) { risk = '✅ موثوق'; }

            message.reply([
                '**🔍 فحص الرابط**',
                '```',
                '🔗 الرابط  : ' + url.slice(0, 60),
                '🔒 البروتوكول : ' + (isHTTPS ? 'HTTPS ✅' : 'HTTP ⚠️'),
                '⚠️ التقييم  : ' + risk,
                '```',
                warnings.length ? warnings.join('\n') : '✅ الرابط يبدو آمناً.',
                '\n> *التحليل أساسي ولا يضمن الأمان الكامل.*'
            ].join('\n'));
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 16 — أدوات عامة
    // ═══════════════════════════════════════════════════════════════════════════
    {
        name: 'memorycheck', aliases: ['mem2', 'ذاكرة', 'سيستم'],
        description: 'معلومات مفصلة عن النظام والذاكرة', category: 'أدوات',
        execute(message) {
            const mem = process.memoryUsage();
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const mins = Math.floor((uptime % 3600) / 60);
            const guilds = message.client.guilds.cache.size;
            const channels = message.client.channels.cache.size;
            message.reply([
                '**💻 معلومات النظام**',
                '```',
                '🧠 الذاكرة المستخدمة : ' + Math.round(mem.heapUsed / 1024 / 1024) + ' MB',
                '📊 الذاكرة الكلية    : ' + Math.round(mem.heapTotal / 1024 / 1024) + ' MB',
                '⚙️ RSS               : ' + Math.round(mem.rss / 1024 / 1024) + ' MB',
                '⏱️ وقت التشغيل      : ' + (days ? days + 'ي ' : '') + (hours ? hours + 'س ' : '') + mins + 'د',
                '🟢 Node.js          : ' + process.version,
                '💻 المنصة           : ' + process.platform,
                '🏠 السيرفرات        : ' + guilds,
                '💬 القنوات           : ' + channels,
                '```'
            ].join('\n'));
        }
    },
    {
        name: 'remind3', aliases: ['timer4', 'ذكرني'],
        description: 'ضبط تذكير بعد وقت محدد (دقائق)', category: 'أدوات',
        execute(message, args, cm) {
            const mins = parseInt(args[1]);
            const text = args.slice(2).join(' ');
            if (!mins || mins < 1 || mins > 1440) return message.reply('❌ `' + cm.getMainPrefix() + 'remind3 <دقائق 1-1440> <التذكير>`');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'remind3 <دقائق> <نص التذكير>`');
            message.reply('⏰ **حسناً! سأذكرك بعد ' + mins + ' دقيقة بـ:** `' + text + '`');
            setTimeout(() => {
                message.channel.send('⏰ **تذكير!** 🔔\n> ' + text + '\n*(ضُبط منذ ' + mins + ' دقيقة)*').catch(() => {});
            }, mins * 60000);
        }
    },
    {
        name: 'ping4', aliases: ['latency2', 'بينج'],
        description: 'قياس سرعة ولايتنسي البوت المفصل', category: 'أدوات',
        async execute(message) {
            const start = Date.now();
            const msg = await message.reply('🏓 جاري القياس...');
            const latency = Date.now() - start;
            const apiLatency = Math.round(message.client.ws.ping);
            const quality = latency < 100 ? '🟢 ممتاز' : latency < 200 ? '🟡 جيد' : latency < 500 ? '🟠 متوسط' : '🔴 ضعيف';
            await msg.edit([
                '**🏓 نتائج القياس**',
                '```',
                '⚡ Roundtrip : ' + latency + 'ms',
                '📡 API Ping  : ' + (apiLatency > 0 ? apiLatency + 'ms' : 'N/A'),
                '📊 الجودة   : ' + quality,
                '```'
            ].join('\n'));
        }
    },
    {
        name: 'qrcode2', aliases: ['qr2', 'qrgen', 'باركود'],
        description: 'إنشاء QR Code لأي نص أو رابط', category: 'أدوات',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'qrcode2 <النص أو الرابط>`');
            const encoded = encodeURIComponent(text.slice(0, 200));
            const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encoded;
            message.reply('**📱 QR Code**\n> `' + text.slice(0, 60) + '`\n🔗 ' + qrUrl);
        }
    },
    {
        name: 'servertime', aliases: ['time2', 'وقت'],
        description: 'الوقت الحالي في عواصم عربية وعالمية', category: 'أدوات',
        execute(message) {
            const zones = [
                ['🇸🇦 الرياض', 'Asia/Riyadh'], ['🇪🇬 القاهرة', 'Africa/Cairo'],
                ['🇦🇪 دبي', 'Asia/Dubai'], ['🇶🇦 الدوحة', 'Asia/Qatar'],
                ['🇬🇧 لندن', 'Europe/London'], ['🇺🇸 نيويورك', 'America/New_York'],
                ['🇯🇵 طوكيو', 'Asia/Tokyo'],
            ];
            const now = new Date();
            let text = '**🕐 الوقت الحالي حول العالم**\n```\n';
            zones.forEach(([name, tz]) => {
                const t = now.toLocaleTimeString('ar-EG', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true });
                text += name.padEnd(18) + t + '\n';
            });
            message.reply(text + '```');
        }
    },
    {
        name: 'base64', aliases: ['b64', 'تشفيرbase'],
        description: 'تشفير وفك تشفير Base64', category: 'أدوات',
        execute(message, args, cm) {
            const sub = args[1]?.toLowerCase();
            const text = args.slice(2).join(' ');
            const prefix = cm.getMainPrefix();
            if (!sub || !text) return message.reply('❌ `' + prefix + 'base64 encode <نص>` أو `' + prefix + 'base64 decode <نص>`');
            if (sub === 'encode') {
                const encoded = Buffer.from(text, 'utf8').toString('base64');
                return message.reply('🔐 **Base64 مُشفَّر:**\n`' + encoded + '`');
            }
            if (sub === 'decode') {
                try {
                    const decoded = Buffer.from(text, 'base64').toString('utf8');
                    return message.reply('🔓 **Base64 مفكوك:**\n`' + decoded + '`');
                } catch { return message.reply('❌ النص ليس Base64 صحيح.'); }
            }
            message.reply('❌ استخدم `encode` أو `decode`');
        }
    },
];

// ─── color helper ─────────────────────────────────────────────────────────────
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}
