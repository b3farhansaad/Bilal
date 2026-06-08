// أوامر أدوات جديدة خيالية ✨
const https = require('https');
const crypto = require('crypto');

function httpGet(url, headers = {}) {
    return new Promise((resolve, reject) => {
        try {
            const u = new URL(url);
            https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'Mozilla/5.0', ...headers }, timeout: 8000 }, res => {
                let d = '';
                res.on('data', c => d += c);
                res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ _raw: d }); } });
            }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
        } catch (e) { reject(e); }
    });
}

// Active stopwatches and countdowns
const stopwatches = new Map();
const countdownTimers = new Map();

module.exports = [
    // ─── عداد تنازلي حتى تاريخ ───────────────────────────
    {
        name: 'countdown',
        aliases: ['cd', 'timer2', 'event'],
        description: 'عداد تنازلي لحدث قادم',
        category: 'أدوات',
        execute(message, args, commandManager) {
            const dateStr = args.slice(1).join(' ');
            if (!dateStr) return message.reply(`❌ الصيغة: \`${commandManager.getMainPrefix()}countdown <YYYY-MM-DD>\`\nمثال: \`!countdown 2025-12-31\``);
            const target = new Date(dateStr);
            if (isNaN(target.getTime())) return message.reply('❌ التاريخ مش صحيح. استخدم الصيغة: `YYYY-MM-DD`');
            const now = new Date();
            const diff = target - now;
            if (diff < 0) return message.reply('⏰ الحدث ده فات بالفعل!');
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const bar = '█'.repeat(Math.min(10, Math.floor(days / 30))) + '░'.repeat(Math.max(0, 10 - Math.floor(days / 30)));
            message.reply(`**⏳ عداد تنازلي**\n📅 للتاريخ: \`${target.toLocaleDateString('ar-EG')}\`\n\n\`\`\`\n📆 الأيام المتبقية : ${days} يوم\n⏰ الساعات        : ${hours} ساعة\n⏱️ الدقائق        : ${mins} دقيقة\n\`\`\`\n[${bar}] **${days} يوم**`);
        }
    },
    // ─── ساعة إيقاف ─────────────────────────────────────
    {
        name: 'stopwatch',
        aliases: ['sw', 'chrono'],
        description: 'ساعة إيقاف — ابدأ/وقّف/اعرض',
        category: 'أدوات',
        async execute(message, args, commandManager) {
            const sub = args[1]?.toLowerCase();
            const cid = message.channel.id;
            const prefix = commandManager.getMainPrefix();
            if (sub === 'start') {
                if (stopwatches.has(cid)) return message.reply('⚠️ ساعة الإيقاف شغّالة بالفعل. استخدم `stop` أو `check`');
                stopwatches.set(cid, Date.now());
                return message.reply('⏱️ **ساعة الإيقاف بدأت!** استخدم `!stopwatch check` أو `!stopwatch stop`');
            }
            if (sub === 'stop' || sub === 'end') {
                if (!stopwatches.has(cid)) return message.reply('❌ مفيش ساعة شغّالة هنا.');
                const elapsed = Date.now() - stopwatches.get(cid);
                stopwatches.delete(cid);
                const s = (elapsed / 1000).toFixed(2);
                const m = Math.floor(elapsed / 60000);
                const sec = ((elapsed % 60000) / 1000).toFixed(2);
                return message.reply(`⏹️ **الوقت الكلي:**\n\`\`\`\n⏱️  ${m > 0 ? m + 'm ' : ''}${sec}s (${s} ثانية إجمالاً)\n\`\`\``);
            }
            if (sub === 'check' || sub === 'lap') {
                if (!stopwatches.has(cid)) return message.reply('❌ مفيش ساعة شغّالة هنا.');
                const elapsed = Date.now() - stopwatches.get(cid);
                const s = (elapsed / 1000).toFixed(2);
                return message.reply(`⏱️ **الوقت الآن:** \`${s} ثانية\``);
            }
            return message.reply(`**⏱️ ساعة الإيقاف**\n\`${prefix}stopwatch start\` — ابدأ\n\`${prefix}stopwatch check\` — اعرض الوقت\n\`${prefix}stopwatch stop\` — وقّف`);
        }
    },
    // ─── ساعة العالم ─────────────────────────────────────
    {
        name: 'worldclock',
        aliases: ['wc', 'clocks', 'cities'],
        description: 'وقت عدة مدن في نفس الوقت',
        category: 'أدوات',
        execute(message, args, commandManager) {
            const zones = [
                { name: '🇪🇬 القاهرة', tz: 'Africa/Cairo' },
                { name: '🇸🇦 الرياض', tz: 'Asia/Riyadh' },
                { name: '🇦🇪 دبي', tz: 'Asia/Dubai' },
                { name: '🇬🇧 لندن', tz: 'Europe/London' },
                { name: '🇺🇸 نيويورك', tz: 'America/New_York' },
                { name: '🇯🇵 طوكيو', tz: 'Asia/Tokyo' },
                { name: '🇫🇷 باريس', tz: 'Europe/Paris' },
                { name: '🇷🇺 موسكو', tz: 'Europe/Moscow' },
            ];
            const now = new Date();
            let text = '**🌍 ساعة العالم**\n```\n';
            for (const z of zones) {
                const t = now.toLocaleTimeString('en-US', { timeZone: z.tz, hour: '2-digit', minute: '2-digit', hour12: true });
                text += `${z.name.padEnd(16)} ${t}\n`;
            }
            text += '```';
            message.reply(text);
        }
    },
    // ─── نكتة عربية ──────────────────────────────────────
    {
        name: 'joke',
        aliases: ['نكتة3', 'jk', 'laugh'],
        description: 'نكتة عشوائية بالعربي',
        category: 'مرح',
        execute(message, args, commandManager) {
            const jokes = [
                ['واحد راح لدكتور الأسنان قاله: إيه اللي وجعك؟\nقاله: نسيت! 😂', ''],
                ['معلم سأل طالب: قولي على عاصمة مصر؟\nالطالب: القاهرة.\nالمعلم: صح. وعاصمة السعودية؟\nالطالب: المدينة المنورة.\nالمعلم: لأ! الرياض!\nالطالب: والله كنت عارفها بس نسيت! 🤦', ''],
                ['واحد بيدق باب جاره، جاره فتحله: إيه اللي فيه؟\nقاله: عندك ملح؟\nجاره: آه عندي.\nقاله: تمام أنا كمان عندي! 😂', ''],
                ['حسن: ليه إنت دايما بتتأخر على الشغل؟\nعلي: بسبب العلامة اللي على الطريق.\nحسن: إيه العلامة؟\nعلي: مكتوب عليها: "المدرسة أمامك — سر ببطء" 😂', ''],
                ['واحد طلب من صديقه: ممكن تسلفني عشرة جنيه؟\nصديقه: معيش.\nقاله: طيب خمسة؟\nقاله: معيش.\nقاله: تمام، رجع لي العشرة اللي سلفتهولك الأسبوع اللي فات إذن! 😂', ''],
                ['الطالب للأستاذ: أنا ما فهمتش حاجة من اللي شرحته.\nالأستاذ: وقبل كده كنت بتفهم؟\nالطالب: أيوه! كنت مش بيجي على بالي المعلومة خالص! 😂', ''],
                ['واحد اتجوز واحدة طباخة ماهرة. بعد شهر قاله لصاحبه: والله أنا ندمت!\nصاحبه: ليه؟\nقاله: لأني كنت شارب قهوة من الصيدلانية من 20 سنة وأنا مش حاسس! 😂', ''],
                ['طفل بيسأل أبوه: بابا إيه يعني "مستقبل"؟\nأبوه: يعني إللي جاي يا بني.\nالطفل: وإللي راح إيه؟\nأبوه: ده "ماضي".\nالطفل: وإحنا دلوقتي؟\nأبوه: ده "حاضر".\nالطفل: يعني إحنا بلا مستقبل وماضينا راح وإحنا في حاضر مش عارفينه! 😅', ''],
            ];
            const [setup] = jokes[Math.floor(Math.random() * jokes.length)];
            message.reply(`😂 **نكتة اليوم:**\n\n${setup}`);
        }
    },
    // ─── لغز عربي ────────────────────────────────────────
    {
        name: 'riddle',
        aliases: ['لغز2', 'puzzle', 'rd2'],
        description: 'لغز عشوائي بالعربي مع إجابته',
        category: 'مرح',
        execute(message, args, commandManager) {
            const riddles = [
                ['ما هو الشيء الذي يطير بلا أجنحة ويجري بلا أرجل؟', 'الوقت ⏰'],
                ['ما هو الشيء الذي له أسنان ولا يعض؟', 'المشط 🪮'],
                ['كلما أخذت منه زاد. ما هو؟', 'الحفرة 🕳️'],
                ['ما هو الشيء الذي يملأ الغرفة ولا يأخذ مكاناً؟', 'الضوء 💡'],
                ['له رأس وذيل وليس له جسم. ما هو؟', 'العملة 🪙'],
                ['ما هو الشيء الذي يُرى ولا يُلمس، وكلما اقتربت منه ابتعد؟', 'الأفق 🌅'],
                ['أبيض حين يولد، أصفر حين يكبر، وأبيض حين يموت. ما هو؟', 'الشمعة 🕯️'],
                ['كلما أضفت منه أصبح أخف. ما هو؟', 'الثقب 🕳️'],
                ['ما هو الشيء الذي كلما أكلت منه كلما جعت أكثر؟', 'الهواء 💨'],
                ['ما هو الشيء الذي يبكي بلا عيون ويسيل بلا ماء؟', 'السحاب 🌧️'],
            ];
            const [q, a] = riddles[Math.floor(Math.random() * riddles.length)];
            message.reply(`🧩 **لغز:**\n\n${q}\n\n||**الإجابة:** ${a}||`);
        }
    },
    // ─── تشفير AES ───────────────────────────────────────
    {
        name: 'encrypt',
        aliases: ['aesenc', 'enc3'],
        description: 'تشفير نص بـ AES-256',
        category: 'أدوات',
        execute(message, args, commandManager) {
            const prefix = commandManager.getMainPrefix();
            const key = args[1];
            const text = args.slice(2).join(' ');
            if (!key || !text) return message.reply(`❌ الصيغة: \`${prefix}encrypt <مفتاح> <النص>\``);
            const iv = crypto.randomBytes(16);
            const k = crypto.createHash('sha256').update(key).digest();
            const cipher = crypto.createCipheriv('aes-256-cbc', k, iv);
            const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
            const result = iv.toString('hex') + ':' + encrypted.toString('hex');
            message.reply(`🔐 **مشفّر بـ AES-256:**\n\`\`\`\n${result}\n\`\`\`\n⚠️ احتفظ بالمفتاح لفك التشفير.`);
        }
    },
    // ─── فك تشفير AES ────────────────────────────────────
    {
        name: 'decrypt',
        aliases: ['aesdec', 'dec3'],
        description: 'فك تشفير نص AES-256',
        category: 'أدوات',
        execute(message, args, commandManager) {
            const prefix = commandManager.getMainPrefix();
            const key = args[1];
            const cipher_text = args[2];
            if (!key || !cipher_text) return message.reply(`❌ الصيغة: \`${prefix}decrypt <مفتاح> <النص_المشفّر>\``);
            try {
                const parts = cipher_text.split(':');
                if (parts.length !== 2) throw new Error('صيغة خاطئة');
                const iv = Buffer.from(parts[0], 'hex');
                const encrypted = Buffer.from(parts[1], 'hex');
                const k = crypto.createHash('sha256').update(key).digest();
                const decipher = crypto.createDecipheriv('aes-256-cbc', k, iv);
                const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
                message.reply(`🔓 **النص المفكوك:**\n\`\`\`\n${decrypted.toString('utf8')}\n\`\`\``);
            } catch {
                message.reply('❌ فشل فك التشفير. تأكد من المفتاح والنص.');
            }
        }
    },
    // ─── تحويل الأرقام (قاعدة) ──────────────────────────
    {
        name: 'base',
        aliases: ['convert2', 'baseconv', 'numbase'],
        description: 'تحويل أرقام بين الأنظمة (2/8/10/16)',
        category: 'أدوات',
        execute(message, args, commandManager) {
            const prefix = commandManager.getMainPrefix();
            const num = args[1];
            const fromBase = parseInt(args[2]);
            const toBase = parseInt(args[3]);
            if (!num || isNaN(fromBase) || isNaN(toBase)) return message.reply(`❌ الصيغة: \`${prefix}base <رقم> <من> <إلى>\`\nمثال: \`${prefix}base 255 10 16\` → FF`);
            if (![2, 8, 10, 16].includes(fromBase) || ![2, 8, 10, 16].includes(toBase)) return message.reply('❌ الأنظمة المتاحة: 2 (ثنائي)، 8 (ثماني)، 10 (عشري)، 16 (سداسي عشري)');
            try {
                const decimal = parseInt(num, fromBase);
                if (isNaN(decimal)) return message.reply('❌ الرقم مش صحيح للنظام المحدد.');
                const result = decimal.toString(toBase).toUpperCase();
                const bases = { 2: 'ثنائي', 8: 'ثماني', 10: 'عشري', 16: 'سداسي عشري' };
                message.reply(`**🔢 تحويل الأرقام**\n\`\`\`\n${num} (${bases[fromBase]}) = ${result} (${bases[toBase]})\n\nعشري: ${decimal} | ثنائي: ${decimal.toString(2)} | ثماني: ${decimal.toString(8)} | HEX: ${decimal.toString(16).toUpperCase()}\n\`\`\``);
            } catch { message.reply('❌ خطأ في التحويل.'); }
        }
    },
    // ─── معلومات IP متقدمة ──────────────────────────────
    {
        name: 'ip',
        aliases: ['ipinfo', 'myip', 'ipl'],
        description: 'معلومات تفصيلية عن IP',
        category: 'أدوات',
        async execute(message, args, commandManager) {
            const ipInput = args[1] || '';
            const msg = await message.reply(`🔍 جاري البحث عن \`${ipInput || 'IP العام'}\`...`);
            try {
                const url = ipInput ? `https://ipapi.co/${ipInput}/json/` : 'https://ipapi.co/json/';
                const d = await httpGet(url);
                if (d.error) return msg.edit(`❌ IP غير صحيح: \`${ipInput}\``);
                await msg.edit(`**🌐 معلومات IP**\n\`\`\`\n🔢 IP          : ${d.ip}\n🏙️ المدينة     : ${d.city || '?'}\n🌍 الدولة      : ${d.country_name || '?'} ${d.country || ''}\n🗺️ المنطقة    : ${d.region || '?'}\n🕐 المنطقة الزمنية: ${d.timezone || '?'}\n📡 مزود الخدمة : ${(d.org || '?').slice(0, 40)}\n📐 خط العرض  : ${d.latitude || '?'}\n📐 خط الطول  : ${d.longitude || '?'}\n\`\`\``);
            } catch (err) { await msg.edit(`❌ فشل: \`${err.message}\``); }
        }
    },
    // ─── بحث ويكيبيديا ───────────────────────────────────
    {
        name: 'wiki',
        aliases: ['wikipedia', 'w', 'search2'],
        description: 'بحث سريع في ويكيبيديا العربية',
        category: 'أدوات',
        async execute(message, args, commandManager) {
            const query = args.slice(1).join(' ');
            if (!query) return message.reply(`❌ الصيغة: \`${commandManager.getMainPrefix()}wiki <موضوع>\``);
            const msg = await message.reply(`🔍 جاري البحث عن \`${query}\`...`);
            try {
                const searchUrl = `https://ar.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
                const d = await httpGet(searchUrl);
                if (d.type === 'disambiguation' || !d.extract) {
                    return msg.edit(`❌ مش لاقي نتيجة واضحة. جرب: \`!wiki ${query} (توضيح)\``);
                }
                const summary = d.extract.slice(0, 600) + (d.extract.length > 600 ? '...' : '');
                await msg.edit(`**📚 ${d.title}**\n\n${summary}\n\n🔗 ${d.content_urls?.desktop?.page || ''}`);
            } catch (err) { await msg.edit(`❌ فشل: \`${err.message}\``); }
        }
    },
    // ─── QR Code محسّن ───────────────────────────────────
    {
        name: 'qr',
        aliases: ['qrcode', 'qrgen3', 'makeqr'],
        description: 'إنشاء QR Code من أي نص أو رابط',
        category: 'أدوات',
        execute(message, args, commandManager) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply(`❌ الصيغة: \`${commandManager.getMainPrefix()}qr <نص أو رابط>\``);
            const encoded = encodeURIComponent(text.slice(0, 500));
            const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;
            message.reply(`**📱 QR Code لـ:** \`${text.slice(0, 50)}${text.length > 50 ? '...' : ''}\`\n🔗 ${url}`);
        }
    },
    // ─── تحويل درجة الحرارة ─────────────────────────────
    {
        name: 'temp',
        aliases: ['temperature', 'celsius', 'fahrenheit'],
        description: 'تحويل درجات الحرارة',
        category: 'أدوات',
        execute(message, args, commandManager) {
            const val = parseFloat(args[1]);
            const unit = args[2]?.toLowerCase();
            const prefix = commandManager.getMainPrefix();
            if (isNaN(val) || !unit) return message.reply(`❌ الصيغة: \`${prefix}temp <رقم> <c/f/k>\`\nمثال: \`${prefix}temp 100 c\``);
            let c, f, k;
            if (unit === 'c') { c = val; f = val * 9/5 + 32; k = val + 273.15; }
            else if (unit === 'f') { f = val; c = (val - 32) * 5/9; k = c + 273.15; }
            else if (unit === 'k') { k = val; c = val - 273.15; f = c * 9/5 + 32; }
            else return message.reply('❌ الوحدات: `c` (مئوية)، `f` (فهرنهايت)، `k` (كلفن)');
            const emoji = c < 0 ? '🥶' : c < 20 ? '😊' : c < 35 ? '🌤️' : '🔥';
            message.reply(`**🌡️ تحويل درجة الحرارة** ${emoji}\n\`\`\`\n❄️ مئوية     : ${c.toFixed(2)}°C\n🌡️ فهرنهايت : ${f.toFixed(2)}°F\n⚛️ كلفن      : ${k.toFixed(2)}K\n\`\`\``);
        }
    },
    // ─── مولد كلمة المرور المتقدم ─────────────────────────
    {
        name: 'passgen',
        aliases: ['genpass3', 'strongpass'],
        description: 'توليد كلمة مرور قوية مع تحكم كامل',
        category: 'أدوات',
        execute(message, args, commandManager) {
            const length = Math.min(Math.max(parseInt(args[1]) || 16, 4), 128);
            const useSymbols = !args.includes('nosym');
            const useNumbers = !args.includes('nonum');
            const useUpper = !args.includes('noup');
            let charset = 'abcdefghijklmnopqrstuvwxyz';
            if (useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (useNumbers) charset += '0123456789';
            if (useSymbols) charset += '!@#$%^&*()-_=+[]{}|;:,.?';
            const bytes = crypto.randomBytes(length);
            const password = Array.from(bytes).map(b => charset[b % charset.length]).join('');
            const strength = length >= 20 && useSymbols ? '🟢 قوية جداً' : length >= 12 ? '🟡 قوية' : '🟠 مقبولة';
            message.reply(`🔐 **كلمة مرور (${length} حرف):**\n\`\`\`\n${password}\n\`\`\`${strength}\n💡 \`nosym\` لإزالة الرموز | \`nonum\` لإزالة الأرقام`);
        }
    }
];
