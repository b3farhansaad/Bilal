// أوامر إضافية خيالية 🎴

const MAGIC_8BALL = [
    '✅ نعم بالتأكيد!',
    '🟢 آه، ده متأكد منه.',
    '💯 أيوه بكل تأكيد.',
    '🎯 كل الإشارات بتقول آه.',
    '🌟 يبدو إيجابي جداً.',
    '🤔 في الوقت الحالي مش واضح.',
    '😶 مش قادر أحدد دلوقتي.',
    '🌫️ الإجابة ضبابية، حاول تاني.',
    '❓ افضل متسألش دلوقتي.',
    '❌ لأ.',
    '🚫 بكل وضوح لأ.',
    '💀 مش في المزاج. لأ.',
    '😂 ده مش هيحصل.',
    '🔮 أشكّ في ده.',
    '⚠️ الأوراق مش في صفّك.'
];

const CITY_TIMEZONES = {
    cairo: 'Africa/Cairo',
    london: 'Europe/London',
    newyork: 'America/New_York',
    dubai: 'Asia/Dubai',
    tokyo: 'Asia/Tokyo',
    paris: 'Europe/Paris',
    moscow: 'Europe/Moscow',
    sydney: 'Australia/Sydney',
    riyadh: 'Asia/Riyadh',
    berlin: 'Europe/Berlin'
};

const EMOJI_MAP = {
    a:'🇦', b:'🇧', c:'🇨', d:'🇩', e:'🇪', f:'🇫', g:'🇬',
    h:'🇭', i:'🇮', j:'🇯', k:'🇰', l:'🇱', m:'🇲', n:'🇳',
    o:'🇴', p:'🇵', q:'🇶', r:'🇷', s:'🇸', t:'🇹', u:'🇺',
    v:'🇻', w:'🇼', x:'🇽', y:'🇾', z:'🇿',
    '0':'0️⃣', '1':'1️⃣', '2':'2️⃣', '3':'3️⃣', '4':'4️⃣',
    '5':'5️⃣', '6':'6️⃣', '7':'7️⃣', '8':'8️⃣', '9':'9️⃣',
    '!':'❗', '?':'❓', ' ':'  '
};

module.exports = [
    {
        name: '8ball',
        description: 'كرة المصير السحرية',
        category: 'مرح',
        execute(message, args, commandManager) {
            const question = args.slice(1).join(' ');
            if (!question) return message.reply('❓ اكتب سؤالك بعد `!8ball`\nمثال: `!8ball هيكون يومي كويس؟`');
            const answer = MAGIC_8BALL[Math.floor(Math.random() * MAGIC_8BALL.length)];
            message.reply(`🔮 **السؤال:** ${question}\n**الإجابة:** ${answer}`);
        }
    },
    {
        name: 'mock',
        description: 'موكيه نص بأسلوب spongebob',
        category: 'مرح',
        execute(message, args, commandManager) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!mock`');
            const mocked = text.split('').map((c, i) =>
                i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()
            ).join('');
            message.reply(`🧽 ${mocked}`);
        }
    },
    {
        name: 'reverse',
        description: 'عكس النص',
        category: 'مرح',
        execute(message, args, commandManager) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!reverse`');
            message.reply(`🔃 ${text.split('').reverse().join('')}`);
        }
    },
    {
        name: 'repeat',
        description: 'كرر نص X مرة',
        category: 'مرح',
        execute(message, args, commandManager) {
            const count = parseInt(args[1]);
            if (isNaN(count) || count < 1 || count > 10)
                return message.reply('❌ الصيغة: `!repeat <1-10> <النص>`\nمثال: `!repeat 3 واو`');
            const text = args.slice(2).join(' ');
            if (!text) return message.reply('❌ اكتب النص اللي تعيده');
            message.reply(Array(count).fill(text).join('\n'));
        }
    },
    {
        name: 'clap',
        description: 'ضيف 👏 بين كل كلمة',
        category: 'مرح',
        execute(message, args, commandManager) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!clap`');
            message.reply(text.split(' ').join(' 👏 '));
        }
    },
    {
        name: 'emojify',
        description: 'حول الحروف لإيموجي أعلام',
        category: 'مرح',
        execute(message, args, commandManager) {
            const text = args.slice(1).join(' ').toLowerCase();
            if (!text) return message.reply('❌ اكتب النص بعد `!emojify`');
            const result = text.split('').map(c => EMOJI_MAP[c] || c).join(' ');
            if (result.length > 1800) return message.reply('❌ النص أطول من اللازم!');
            message.reply(result);
        }
    },
    {
        name: 'encode',
        description: 'تشفير base64',
        category: 'أدوات',
        execute(message, args, commandManager) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!encode`');
            const encoded = Buffer.from(text, 'utf8').toString('base64');
            message.reply(`🔐 **مشفّر:**\n\`${encoded}\``);
        }
    },
    {
        name: 'decode',
        description: 'فك تشفير base64',
        category: 'أدوات',
        execute(message, args, commandManager) {
            const text = args[1];
            if (!text) return message.reply('❌ اكتب النص المشفر بعد `!decode`');
            try {
                const decoded = Buffer.from(text, 'base64').toString('utf8');
                message.reply(`🔓 **مفكوك:**\n\`${decoded}\``);
            } catch {
                message.reply('❌ النص ده مش base64 صح.');
            }
        }
    },
    {
        name: 'random',
        description: 'رقم عشوائي',
        category: 'مرح',
        execute(message, args, commandManager) {
            const min = parseInt(args[1]);
            const max = parseInt(args[2]);
            if (isNaN(min) || isNaN(max) || min >= max)
                return message.reply('❌ الصيغة: `!random <أقل رقم> <أكبر رقم>`\nمثال: `!random 1 100`');
            const result = Math.floor(Math.random() * (max - min + 1)) + min;
            message.reply(`🎲 الرقم العشوائي بين ${min} و ${max}: **${result}**`);
        }
    },
    {
        name: 'pick',
        description: 'اختيار عشوائي من قائمة مفصولة بـ |',
        category: 'مرح',
        execute(message, args, commandManager) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ الصيغة: `!pick خيار1|خيار2|خيار3`');
            const options = text.split('|').map(o => o.trim()).filter(o => o);
            if (options.length < 2) return message.reply('❌ لازم خيارين على الأقل مفصولين بـ `|`');
            const chosen = options[Math.floor(Math.random() * options.length)];
            message.reply(`🎯 من بين **${options.length}** خيارات اخترت:\n**${chosen}**`);
        }
    },
    {
        name: 'charcount',
        description: 'عد الحروف والكلمات',
        category: 'أدوات',
        execute(message, args, commandManager) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!charcount`');
            const chars = text.length;
            const noSpaces = text.replace(/\s/g, '').length;
            const words = text.trim().split(/\s+/).filter(w => w).length;
            const lines = text.split('\n').length;
            message.reply(`📊 **إحصائيات النص:**\n🔤 الحروف: \`${chars}\`\n🔡 بدون مسافات: \`${noSpaces}\`\n💬 الكلمات: \`${words}\`\n📄 الأسطر: \`${lines}\``);
        }
    },
    {
        name: 'time',
        description: 'الوقت الحالي لأي مدينة',
        category: 'أدوات',
        execute(message, args, commandManager) {
            const city = args[1]?.toLowerCase() || 'cairo';
            const tz = CITY_TIMEZONES[city] || 'Africa/Cairo';
            const now = new Date();
            const timeStr = now.toLocaleTimeString('ar-EG', { timeZone: tz, hour12: true });
            const dateStr = now.toLocaleDateString('ar-EG', { timeZone: tz, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const cityName = city.charAt(0).toUpperCase() + city.slice(1);
            message.reply(`🕐 **وقت ${cityName}:**\n🕰️ ${timeStr}\n📅 ${dateStr}\n\n🌍 المدن المتاحة: cairo, london, newyork, dubai, tokyo, paris, moscow, sydney, riyadh, berlin`);
        }
    },
    {
        name: 'date',
        description: 'تاريخ اليوم بالعربي والإنجليزي',
        category: 'أدوات',
        execute(message, args, commandManager) {
            const now = new Date();
            const arDate = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const enDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const timeStr = now.toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour12: true });
            message.reply(`📅 **تاريخ اليوم:**\n🇪🇬 ${arDate}\n🇺🇸 ${enDate}\n🕐 الوقت (القاهرة): ${timeStr}`);
        }
    },
    {
        name: 'botinfo',
        description: 'معلومات البوت الكاملة',
        category: 'نظام',
        execute(message, args, commandManager) {
            const uptime = commandManager.formatUptime();
            const cmdsCount = commandManager.commands.size;
            const prefix = commandManager.getMainPrefix();
            const version = require('../package.json').version;
            const { getSignature } = require('../utils/song');
            message.reply(`
**✨ Snodix SelfBot - معلومات البوت**

🤖 **البوت:** Snodix SelfBot
📦 **الإصدار:** v${version}
⌚ **وقت التشغيل:** \`${uptime}\`
🔢 **عدد الأوامر:** \`${cmdsCount}\` أمر
🎯 **البادئة:** \`${prefix}\`
💻 **Node.js:** \`${process.version}\`
🌐 **المنصة:** \`${process.platform}\`

${getSignature()}`);
        }
    }
];
