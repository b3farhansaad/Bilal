const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Core Gemini caller with Arabic system prompt ─────────────────────────────
async function callGemini(prompt, maxTokens = 600) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY غير موجود في .env');

    const body = JSON.stringify({
        system_instruction: { parts: [{ text: 'أنت مساعد ذكي عربي. رُد دائماً بالعربية. كن مختصراً وواضحاً ومفيداً. إذا سألك أحد عن أعمار أي شخص أو "كم عمرك" أو أي سؤال يتعلق بالأعمار، قل فقط: "مش بتكلم في الأعمار 😅" ولا تجاوب.' }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.8 }
    });

    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'generativelanguage.googleapis.com',
            path: '/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + apiKey,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
            timeout: 20000
        }, r => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => {
                try {
                    const j = JSON.parse(d);
                    const text = j.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) resolve(text.trim());
                    else reject(new Error('لم يأتِ رد من الذكاء الاصطناعي'));
                } catch { reject(new Error('خطأ في تحليل رد الـ AI')); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('انتهت مهلة الاتصال بالـ AI')); });
        req.write(body);
        req.end();
    });
}

const HIST_FILE = path.join(__dirname, '../data/chat_history.json');

function loadHist(tag) {
    try {
        if (fs.existsSync(HIST_FILE)) return (JSON.parse(fs.readFileSync(HIST_FILE, 'utf8'))[tag] || []);
    } catch {}
    return [];
}

function saveHist(tag, user, ai) {
    try {
        let all = {};
        if (fs.existsSync(HIST_FILE)) all = JSON.parse(fs.readFileSync(HIST_FILE, 'utf8'));
        if (!all[tag]) all[tag] = [];
        all[tag].push({ user: user.slice(0, 200), ai: ai.slice(0, 400), time: Date.now() });
        if (all[tag].length > 15) all[tag] = all[tag].slice(-15);
        fs.mkdirSync(path.dirname(HIST_FILE), { recursive: true });
        fs.writeFileSync(HIST_FILE, JSON.stringify(all, null, 2));
    } catch {}
}

// ─── Helper: format reply ──────────────────────────────────────────────────────
async function aiReply(message, thinking, prompt, header, maxTokens = 600) {
    const msg = await message.reply(thinking);
    try {
        const result = await callGemini(prompt, maxTokens);
        await msg.edit(header + '\n' + result.slice(0, 1900));
        const tag = message.author?.tag || message.author?.username || 'user';
        saveHist(tag, prompt.slice(0, 200), result.slice(0, 400));
    } catch (err) {
        await msg.edit('❌ فشل الـ AI: `' + err.message + '`');
    }
}

module.exports = [
    // ── اسأل ──────────────────────────────────────────────────────────────────
    {
        name: 'ask', aliases: ['ai3', 'gemini2', 'gpt2', 'chat2', 'سأل'],
        description: 'اسأل الذكاء الاصطناعي Gemini أي سؤال', category: 'ذكاء',
        async execute(message, args, cm) {
            const q = args.slice(1).join(' ');
            if (!q) return message.reply('❌ `' + cm.getMainPrefix() + 'ask <سؤالك>`\nمثال: `' + cm.getMainPrefix() + 'ask ما هي الثقوب السوداء؟`');
            const tag = message.author?.tag || message.author?.username || 'user';
            const hist = loadHist(tag).slice(-4);
            let context = hist.length ? 'السياق السابق:\n' + hist.map(h => 'أنت: ' + h.user + '\nAI: ' + h.ai).join('\n') + '\n\n' : '';
            const prompt = context + 'أجب بالعربية بشكل واضح ومفيد:\n' + q;
            const msg = await message.reply('🤖 **جاري التفكير...**');
            try {
                const answer = await callGemini(prompt, 700);
                await msg.edit('**🤖 الإجابة:**\n' + answer.slice(0, 1900));
                saveHist(tag, q, answer);
            } catch (err) { await msg.edit('❌ فشل: `' + err.message + '`'); }
        }
    },

    // ── تلخيص ─────────────────────────────────────────────────────────────────
    {
        name: 'summarize', aliases: ['sum2', 'tldr2', 'summary2', 'لخص'],
        description: 'تلخيص نص طويل في نقاط', category: 'ذكاء',
        async execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text || text.length < 30) return message.reply('❌ `' + cm.getMainPrefix() + 'summarize <النص>` (30+ حرف على الأقل)');
            await aiReply(message, '📝 **جاري التلخيص...**',
                'لخّص النص التالي بالعربية في 3-5 نقاط واضحة. ابدأ كل نقطة بـ •:\n\n' + text.slice(0, 2500),
                '**📝 الملخص:**');
        }
    },

    // ── إعادة صياغة ───────────────────────────────────────────────────────────
    {
        name: 'rewrite', aliases: ['rephrase2', 'improve2', 'صيغ'],
        description: 'إعادة صياغة نص بأسلوب مختار', category: 'ذكاء',
        async execute(message, args, cm) {
            const styles = { formal: 'رسمي احترافي', casual: 'غير رسمي وعامي', powerful: 'قوي ومقنع', simple: 'بسيط وسهل للجميع', poetic: 'أدبي شاعري' };
            const sub = args[1]?.toLowerCase();
            const style = styles[sub];
            const text = args.slice(style ? 2 : 1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'rewrite [formal/casual/powerful/simple/poetic] <النص>`');
            await aiReply(message, '✍️ **جاري إعادة الصياغة...**',
                'أعد صياغة النص بأسلوب ' + (style || 'رسمي احترافي') + ' بالعربية. أرجع النص المُعاد صياغته فقط:\n\n' + text.slice(0, 1500),
                '**✍️ النص المُعاد صياغته:**');
        }
    },

    // ── ترجمة ─────────────────────────────────────────────────────────────────
    {
        name: 'aitranslate', aliases: ['tr3', 'aitrans', 'ترجم'],
        description: 'ترجمة ذكية لأي لغة', category: 'ذكاء',
        async execute(message, args, cm) {
            const lang = args[1]; const text = args.slice(2).join(' ');
            if (!lang || !text) return message.reply('❌ `' + cm.getMainPrefix() + 'aitranslate <اللغة> <النص>`\nمثال: `' + cm.getMainPrefix() + 'aitranslate انجليزي مرحبا كيف حالك`');
            await aiReply(message, '🌐 **جاري الترجمة...**',
                'ترجم النص التالي إلى ' + lang + '. أعطِ الترجمة فقط بدون شرح:\n\n' + text.slice(0, 1000),
                '**🌐 الترجمة (' + lang + '):**');
        }
    },

    // ── روست AI ───────────────────────────────────────────────────────────────
    {
        name: 'roastai', aliases: ['airoast2', 'smartroast', 'روست'],
        description: 'روست ذكي ومضحك بالعربي 🔥', category: 'ذكاء',
        async execute(message, args, cm) {
            const target = message.mentions?.users?.first()?.username || args.slice(1).join(' ') || 'حد ما';
            await aiReply(message, '🔥 **جاري توليد الروست...**',
                'اكتب روست مضحك وقوي ولاذع باللغة العربية العامية عن شخص اسمه "' + target + '". اجعله مضحكاً وليس مؤذياً. 3 جمل فقط.',
                '🔥 **روست لـ ' + target + ':**\n>');
        }
    },

    // ── غزل AI ────────────────────────────────────────────────────────────────
    {
        name: 'pickupline', aliases: ['flirt2', 'غزل'],
        description: 'خط غزل رومانسي ومميز 💕', category: 'ذكاء',
        async execute(message, args, cm) {
            const target = message.mentions?.users?.first()?.username || args.slice(1).join(' ') || 'حبيبي';
            await aiReply(message, '💕 **جاري التوليد...**',
                'اكتب خط غزل رومانسي أدبي ومميز باللغة العربية لشخص اسمه "' + target + '". اجعله أصيلاً وجميلاً وغير مبتذل.',
                '💕 **لـ ' + target + ':**\n>');
        }
    },

    // ── قصيدة AI ──────────────────────────────────────────────────────────────
    {
        name: 'aipoem', aliases: ['poem2', 'قصيدة', 'شعر'],
        description: 'اطلب من الـ AI كتابة قصيدة عربية 📜', category: 'ذكاء',
        async execute(message, args, cm) {
            const topic = args.slice(1).join(' ') || 'الحب والوطن';
            await aiReply(message, '📜 **الـ AI يكتب قصيدة...**',
                'اكتب قصيدة عربية جميلة وأصيلة عن "' + topic + '". 3-4 أبيات موزونة ومتناسقة.',
                '📜 **قصيدة عن ' + topic + ':**\n', 500);
        }
    },

    // ── قصة قصيرة ─────────────────────────────────────────────────────────────
    {
        name: 'aistory', aliases: ['story2', 'قصة', 'حكاية'],
        description: 'اكتب قصة قصيرة إبداعية', category: 'ذكاء',
        async execute(message, args, cm) {
            const topic = args.slice(1).join(' ') || 'مغامرة في الفضاء';
            await aiReply(message, '📖 **AI يكتب قصة...**',
                'اكتب قصة قصيرة إبداعية ومشوقة بالعربية عن "' + topic + '". حوالي 100-150 كلمة. اجعلها ممتعة ولها نهاية.',
                '**📖 القصة:**\n', 700);
        }
    },

    // ── كود AI ────────────────────────────────────────────────────────────────
    {
        name: 'aicode', aliases: ['code2', 'كود', 'برمجة'],
        description: 'اشرح أو اكتب كود برمجي', category: 'ذكاء',
        async execute(message, args, cm) {
            const request = args.slice(1).join(' ');
            if (!request) return message.reply('❌ `' + cm.getMainPrefix() + 'aicode <وصف الكود أو سؤال برمجي>`');
            await aiReply(message, '💻 **AI يحل مسألة برمجية...**',
                'أنت خبير برمجة. أجب بالعربية على هذا الطلب البرمجي: ' + request + '\nاذكر الكود وشرحه بوضوح.',
                '**💻 الجواب:**\n', 800);
        }
    },

    // ── نصيحة ─────────────────────────────────────────────────────────────────
    {
        name: 'aiadvice', aliases: ['advice2', 'نصيحة', 'نصح'],
        description: 'نصيحة ذكية من الـ AI', category: 'ذكاء',
        async execute(message, args, cm) {
            const situation = args.slice(1).join(' ');
            if (!situation) return message.reply('❌ `' + cm.getMainPrefix() + 'aiadvice <موقفك أو مشكلتك>`');
            await aiReply(message, '💡 **AI يفكر في نصيحة...**',
                'أعطِ نصيحة عملية وحكيمة بالعربية لهذا الموقف: ' + situation + '\nاجعل النصيحة محددة وقابلة للتطبيق.',
                '**💡 النصيحة:**\n');
        }
    },

    // ── اقتباس ────────────────────────────────────────────────────────────────
    {
        name: 'aiquote', aliases: ['quote2', 'اقتباس', 'حكمة'],
        description: 'اقتباس ملهم أو حكمة من الـ AI', category: 'ذكاء',
        async execute(message, args, cm) {
            const topic = args.slice(1).join(' ') || 'الحياة والنجاح';
            await aiReply(message, '✨ **AI يبحث عن حكمة...**',
                'اكتب اقتباساً ملهماً وعميقاً بالعربية عن "' + topic + '". الاقتباس فقط بدون شرح، ثم اذكر اسم قائله إن كان موجوداً أو اكتبه أنت.',
                '**✨ الاقتباس:**\n> ', 300);
        }
    },

    // ── نكتة AI ───────────────────────────────────────────────────────────────
    {
        name: 'aijoke', aliases: ['joke2', 'نكتة', 'ضحك'],
        description: 'نكتة مضحكة من الـ AI 😂', category: 'ذكاء',
        async execute(message, args, cm) {
            const topic = args.slice(1).join(' ') || 'موضوع عشوائي';
            await aiReply(message, '😂 **AI يفكر في نكتة...**',
                'اكتب نكتة مضحكة باللغة العربية العامية' + (topic !== 'موضوع عشوائي' ? ' عن "' + topic + '"' : '') + '. اجعلها خفيفة ولطيفة.',
                '**😂 النكتة:**\n', 300);
        }
    },

    // ── لغز AI ────────────────────────────────────────────────────────────────
    {
        name: 'airiddle', aliases: ['riddle2', 'لغز'],
        description: 'لغز ذكي من الـ AI مع إجابته', category: 'ذكاء',
        async execute(message, args, cm) {
            await aiReply(message, '🧩 **AI يولد لغزاً...**',
                'اكتب لغزاً ذكياً وممتعاً بالعربية. اكتب اللغز أولاً ثم بعد سطر فارغ اكتب "الإجابة:" والجواب.',
                '**🧩 اللغز:**\n', 350);
        }
    },

    // ── تحليل مزاج ─────────────────────────────────────────────────────────────
    {
        name: 'aimood', aliases: ['mood2', 'مزاج', 'مشاعر'],
        description: 'تحليل مشاعر ومزاج رسالة بالـ AI', category: 'ذكاء',
        async execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'aimood <النص المراد تحليله>`');
            await aiReply(message, '🎭 **AI يحلل المشاعر...**',
                'حلل المشاعر والمزاج في النص التالي بالعربية. اذكر: المشاعر الرئيسية، نسبة الإيجابية، ونصيحة قصيرة:\n\n"' + text.slice(0, 500) + '"',
                '**🎭 تحليل المشاعر:**\n', 400);
        }
    },

    // ── تصحيح نص ──────────────────────────────────────────────────────────────
    {
        name: 'aifix', aliases: ['fix2', 'تصحيح', 'درست'],
        description: 'تصحيح الأخطاء الإملائية والنحوية', category: 'ذكاء',
        async execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'aifix <النص المراد تصحيحه>`');
            await aiReply(message, '✅ **AI يصحح النص...**',
                'صحّح الأخطاء الإملائية والنحوية في النص التالي بالعربية. اعطِ النص المصحح ثم اذكر الأخطاء التي صُحِّحت:\n\n"' + text.slice(0, 1000) + '"',
                '**✅ النص المصحح:**\n', 500);
        }
    },

    // ── جدال ──────────────────────────────────────────────────────────────────
    {
        name: 'aidebate', aliases: ['debate2', 'جدال', 'ناقش'],
        description: 'اطرح موضوعاً والـ AI يعطي وجهتي نظر', category: 'ذكاء',
        async execute(message, args, cm) {
            const topic = args.slice(1).join(' ');
            if (!topic) return message.reply('❌ `' + cm.getMainPrefix() + 'aidebate <الموضوع>`\nمثال: `' + cm.getMainPrefix() + 'aidebate العمل عن بُعد أفضل من المكتب`');
            await aiReply(message, '⚖️ **AI يناقش الموضوع...**',
                'قدّم وجهتي نظر مختلفتين بالعربية حول: "' + topic + '"\n\nالرأي الأول (مع) ثم الرأي الثاني (ضد) ثم خلاصتك.',
                '**⚖️ النقاش:**\n', 700);
        }
    },

    // ── أسماء ─────────────────────────────────────────────────────────────────
    {
        name: 'ainame', aliases: ['name2', 'اسم', 'اسماء'],
        description: 'اقتراح أسماء إبداعية بالـ AI', category: 'ذكاء',
        async execute(message, args, cm) {
            const desc = args.slice(1).join(' ') || 'مشروع تقني عربي';
            await aiReply(message, '💭 **AI يقترح أسماء...**',
                'اقترح 7 أسماء مميزة وإبداعية بالعربية لـ "' + desc + '". لكل اسم شرح مختصر لمعناه.',
                '**💭 الأسماء المقترحة:**\n', 500);
        }
    },

    // ── تحليل ─────────────────────────────────────────────────────────────────
    {
        name: 'aianalyze', aliases: ['analyze2', 'حلل', 'تحليل'],
        description: 'تحليل عميق لنص أو موقف', category: 'ذكاء',
        async execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'aianalyze <النص أو الموقف>`');
            await aiReply(message, '🔬 **AI يحلل...**',
                'حلّل النص/الموقف التالي بعمق بالعربية. اذكر: النقاط الرئيسية، المحاور المهمة، والاستنتاجات:\n\n' + text.slice(0, 1500),
                '**🔬 التحليل:**\n', 700);
        }
    },

    // ── برج AI ────────────────────────────────────────────────────────────────
    {
        name: 'aihoroscope', aliases: ['horoscope2', 'برج', 'طالع'],
        description: 'توقعات يومك من الـ AI ✨', category: 'ذكاء',
        async execute(message, args, cm) {
            const sign = args.slice(1).join(' ') || 'الحمل';
            await aiReply(message, '✨ **AI يقرأ النجوم...**',
                'اكتب توقعات مرحة وإيجابية لبرج ' + sign + ' ليوم اليوم بالعربية. اذكر: الحب، العمل، الصحة، ونصيحة اليوم.',
                '**✨ برج ' + sign + ' اليوم:**\n', 450);
        }
    },

    // ── حالة AI ───────────────────────────────────────────────────────────────
    {
        name: 'aistatus', aliases: ['aistat2', 'checkai2', 'حالةai'],
        description: 'حالة نظام الذكاء الاصطناعي', category: 'ذكاء',
        execute(message) {
            const hasKey = !!process.env.GEMINI_API_KEY;
            const histPath = path.join(__dirname, '../data/chat_history.json');
            let totalChats = 0;
            try { const h = JSON.parse(fs.readFileSync(histPath, 'utf8')); totalChats = Object.values(h).reduce((s, v) => s + v.length, 0); } catch {}
            message.reply([
                '**🤖 حالة الذكاء الاصطناعي**',
                '```',
                '🔑 API Key     : ' + (hasKey ? '✅ موجود' : '❌ غير موجود'),
                '🧠 النموذج    : gemini-2.5-flash-lite',
                '💬 المحادثات : ' + totalChats + ' رسالة محفوظة',
                '⚡ الأوامر    : 19 أمر ذكاء اصطناعي',
                '```',
                hasKey ? '✅ **الـ AI جاهز!** استخدم `!ask <سؤالك>`' : '⚠️ أضف `GEMINI_API_KEY=...` في `.env` لتفعيل الـ AI'
            ].join('\n'));
        }
    },

    // ── تاريخ AI ──────────────────────────────────────────────────────────────
    {
        name: 'aihistory', aliases: ['aihist2', 'mychats2', 'تاريخai'],
        description: 'عرض آخر محادثاتك مع الـ AI', category: 'ذكاء',
        execute(message) {
            const tag = message.author?.tag || message.author?.username || 'user';
            const hist = loadHist(tag);
            if (!hist.length) return message.reply('📭 **لا يوجد تاريخ محادثات بعد.**\nجرب `!ask <سؤالك>` للبدء!');
            let text = '**🕐 آخر ' + Math.min(hist.length, 5) + ' محادثات:**\n\n';
            hist.slice(-5).reverse().forEach((h, i) => {
                const time = h.time ? new Date(h.time).toLocaleTimeString('ar-EG') : '';
                text += '**' + (i + 1) + '.** 👤 `' + (h.user || '').slice(0, 60) + '`\n';
                text += '   🤖 `' + (h.ai || '').slice(0, 80) + '`\n';
                if (time) text += '   ⏰ ' + time + '\n';
                text += '\n';
            });
            message.reply(text.slice(0, 1900));
        }
    },

    // ── مسح تاريخ AI ──────────────────────────────────────────────────────────
    {
        name: 'clearai', aliases: ['resetai2', 'clearhistory2', 'مسحai'],
        description: 'مسح تاريخ محادثاتك مع الـ AI', category: 'ذكاء',
        execute(message) {
            try {
                if (!fs.existsSync(HIST_FILE)) return message.reply('📭 لا يوجد تاريخ لمسحه.');
                const all = JSON.parse(fs.readFileSync(HIST_FILE, 'utf8'));
                const tag = message.author?.tag || message.author?.username || 'user';
                const count = (all[tag] || []).length;
                delete all[tag];
                fs.writeFileSync(HIST_FILE, JSON.stringify(all, null, 2));
                message.reply('✅ **تم مسح ' + count + ' محادثة من تاريخك مع الـ AI!**');
            } catch { message.reply('❌ فشل عملية المسح.'); }
        }
    }
];
