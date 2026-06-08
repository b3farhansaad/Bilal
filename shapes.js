// ╔══════════════════════════════════════════════════════════════╗
// ║   Snodix AI Engine — Gemini 2.5 Flash | V3.0 (Ultra Safe)  ║
// ╚══════════════════════════════════════════════════════════════╝
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs   = require('fs');
const path = require('path');
require('dotenv').config();

const BOT_NAME = 'سنودكس';

// ── النظام الأساسي: السماح بالترجمة مع الحظر القاطع للأعمار والتكاثر ──
const SYSTEM_PROMPT = `أنت ${BOT_NAME}، مساعد ذكي شبابي عربي — خبير، ظريف، ومترجم محترف.

**صلاحيات الترجمة (مهم جداً):**
- مسموح لك بترجمة أي نص يطلبه المستخدم من وإلى أي لغة في العالم باحترافية.

**قواعدك الصارمة والوحيدة للحماية (خطوط حمراء):**
1. يُمنع منعاً باتاً التحدث عن الأعمار أو السنين بأي شكل. (الرد: "مش بتكلم في الأعمار 😅")
2. يُمنع منعاً باتاً التحدث عن التكاثر، التكاثر الجنسي، أو كيفية الإنجاب وجلب الأطفال بأي شكل وبأي لغة. (الرد: "عذراً، مش مسموح لي أتكلم في المواضيع دي 😅")

**قواعدك العامة:**
- رُد بالعربية بشكل أساسي (إلا لو طلب المستخدم الترجمة للغة أخرى).
- اجعل ردودك مختصرة، مفيدة، وودودة.
- لا تذكر أبداً أنك ذكاء اصطناعي أو روبوت.
- اذكر اسمك "${BOT_NAME}" فقط عندما يُسأل عنه مباشرة.
- استعمل الإيموجي بشكل طبيعي وغير مبالغ فيه.`;

class GeminiAI {
    constructor() {
        this.genAI     = null;
        this.textModel = null;
        this._init();
    }

    _historyFile() {
        const dataDir = require('./utils/dataDir');
        return dataDir('chat_history.json');
    }

    _init() {
        try {
            if (process.env.GEMINI_API_KEY) {
                this.genAI     = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                this.textModel = this.genAI.getGenerativeModel({
                    model: 'gemini-2.5-flash',
                    systemInstruction: SYSTEM_PROMPT,
                    generationConfig: {
                        temperature:    0.3,
                        topP:           0.95,
                        maxOutputTokens: 800,
                    }
                });
            }
        } catch (e) {
            console.error('⚠️ Gemini init error:', e.message);
        }
    }

    _ensureModel() {
        if (!this.textModel) {
            if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY غير موجود في .env');
            this._init();
            if (!this.textModel) throw new Error('فشل تهيئة الذكاء الاصطناعي');
        }
    }

    // ── الدرع الأول: حماية العمر ──
    _isAgeRelated(text) {
        if (!text) return false;
        const t = text.toLowerCase().trim();
        const agePatterns = [
            /\b\d+\s*(yr|yrs|yo|year|years|old|anno|año|años|ans|jahre|anni|yaş|лет|года?)\b/i,
            /\d+\s*(سنة|سنه|عام|سنين|سنوات)/,
            /(كم عمر|كام عمر|جم عمر|شكد عمر|شو عمر|عمرك|عمري|عمره|عمرها|أعمار|اعمار|كم سن|مواليد|تاريخ ميلاد|سنك|كم سنك)/,
            /\b(how old|what is your age|my age is|his age|her age)\b/i,
            /\b(cuántos años|mi edad|tu edad|tengo\s+\w+\s+años)\b/i,
            /\b(quel âge|mon âge|son âge|j'ai\s+\w+\s+ans)\b/i,
            /\b(wie alt|mein alter|dein alter|ich bin\s+\w+\s+jahre)\b/i,
            /\b(quanti anni|la mia età|ho\s+\w+\s+anni)\b/i,
            /\b(kaç yaş|benim yaşım|yaşın kaç)\b/i,
            /\b(сколько лет|мой возраст)\b/i,
            /(ترجم|translate|traduis|traduce|übersetze|çevir|переведи).*(عمر|سن|age|año|ans|alter|yaş|возраст)/i
        ];
        return agePatterns.some(regex => regex.test(t));
    }

    // ── الدرع الثاني: حماية التكاثر والإنجاب ──
    _isReproductionRelated(text) {
        if (!text) return false;
        const t = text.toLowerCase().trim();
        const reproPatterns = [
            // عربي
            /(تكاثر|التكاثر|جنسي|التزاوج|كيف يجي الاطفال|كيف يأتي الأطفال|من أين يأتي الأطفال|كيفية جلب الاطفال|كيف تصنع الاطفال|انجاب|إنجاب|كيف نحصل على طفل)/i,
            // إنجليزي
            /\b(reproduction|sexual reproduction|how babies are made|where babies come from|mating|making babies|how to get pregnant)\b/i,
            // إسباني
            /\b(reproducción|reproducción sexual|cómo se hacen los bebés|de dónde vienen los bebés|apareamiento)\b/i,
            // فرنسي
            /\b(reproduction|reproduction sexuelle|comment on fait les bébés|d'où viennent les bébés|accouplement)\b/i,
            // ألماني
            /\b(fortpflanzung|sexuelle fortpflanzung|wie babys gemacht werden|woher babys kommen|paarung)\b/i,
            // أوامر الترجمة المتعلقة بهذه الكلمات
            /(ترجم|translate|traduis|traduce|übersetze).*(تكاثر|reproduction|reproducción|fortpflanzung|babies|bébés)/i
        ];
        return reproPatterns.some(regex => regex.test(t));
    }

    // ── تاريخ المحادثات ────────────────────────────────────────────
    saveHistory(userId, userMsg, aiReply) {
        try {
            const f = this._historyFile();
            let history = {};
            if (fs.existsSync(f)) {
                try { history = JSON.parse(fs.readFileSync(f, 'utf8')); } catch {}
            }
            if (!history[userId]) history[userId] = [];
            history[userId].push({
                u: userMsg.slice(0, 400),
                a: aiReply.slice(0, 600),
                t: Date.now()
            });
            if (history[userId].length > 15) {
                history[userId] = history[userId].slice(-15);
            }
            fs.mkdirSync(path.dirname(f), { recursive: true });
            fs.writeFileSync(f, JSON.stringify(history, null, 2));
        } catch (e) { console.error('خطأ حفظ تاريخ المحادثة:', e.message); }
    }

    loadHistory(userId) {
        try {
            const f = this._historyFile();
            if (fs.existsSync(f)) {
                const data = JSON.parse(fs.readFileSync(f, 'utf8'));
                return data[userId] || [];
            }
        } catch {}
        return [];
    }

    clearHistory(userId) {
        try {
            const f = this._historyFile();
            if (!fs.existsSync(f)) return;
            const data = JSON.parse(fs.readFileSync(f, 'utf8'));
            delete data[userId];
            fs.writeFileSync(f, JSON.stringify(data, null, 2));
        } catch {}
    }

    // ── توليد الرد النصي (مع حماية متعددة الطبقات) ──────────────────────────
    async generateResponse(message, userId, username, channelId = null) {
        try {
            // [الحماية الأولى]: فحص العمر
            if (this._isAgeRelated(message)) {
                const blockReply = "مش بتكلم في الأعمار 😅";
                this.saveHistory(userId, message, blockReply);
                return blockReply;
            }

            // [الحماية الثانية]: فحص التكاثر
            if (this._isReproductionRelated(message)) {
                const blockReply = "عذراً، مش مسموح لي أتكلم في المواضيع دي 😅";
                this.saveHistory(userId, message, blockReply);
                return blockReply;
            }

            this._ensureModel();
            const history = this.loadHistory(userId);
            const parts = [];

            if (history.length > 0) {
                const recent = history.slice(-8);
                const ctx = recent.map(h => `${username}: ${h.u}\n${BOT_NAME}: ${h.a}`).join('\n\n');
                parts.push({ text: `[سياق المحادثة السابقة]\n${ctx}\n\n` });
            }

            parts.push({ text: `${username}: ${message}\n${BOT_NAME}: ` });

            const result = await this.textModel.generateContent({
                contents: [{ role: 'user', parts }]
            });
            const responseText = result.response.text().trim();
            
            // [فحص الرد الناتج]: لمنع التسريب
            if (this._isAgeRelated(responseText)) {
                return "مش بتكلم في الأعمار 😅";
            }
            if (this._isReproductionRelated(responseText)) {
                return "عذراً، مش مسموح لي أتكلم في المواضيع دي 😅";
            }

            this.saveHistory(userId, message, responseText);
            return responseText;
        } catch (error) {
            console.error('❌ Gemini error:', error.message);
            throw error;
        }
    }

    // ── معالجة الصور (مع حماية متعددة الطبقات) ──────────────────────────────
    async processImageMessage(textContent, imageUrl, userId, username) {
        try {
            // فحص النصوص المصاحبة للصورة
            if (this._isAgeRelated(textContent)) {
                const blockReply = "مش بتكلم في الأعمار 😅";
                this.saveHistory(userId, textContent || '[صورة]', blockReply);
                return blockReply;
            }
            if (this._isReproductionRelated(textContent)) {
                const blockReply = "عذراً، مش مسموح لي أتكلم في المواضيع دي 😅";
                this.saveHistory(userId, textContent || '[صورة]', blockReply);
                return blockReply;
            }

            this._ensureModel();
            const response = await fetch(imageUrl);
            const arrayBuffer = await response.arrayBuffer();
            const imageBytes = Buffer.from(arrayBuffer).toString('base64');
            const mimeType   = response.headers.get('content-type') || 'image/jpeg';

            const history = this.loadHistory(userId);
            let ctx = '';
            if (history.length > 0) {
                ctx = history.slice(-4).map(h => `${username}: ${h.u}\n${BOT_NAME}: ${h.a}`).join('\n\n') + '\n\n';
            }

            const prompt = ctx + `${username}: ${textContent || 'وصف الصورة دي بالتفصيل'}\n${BOT_NAME}: `;

            const result = await this.textModel.generateContent([
                { text: prompt },
                { inlineData: { data: imageBytes, mimeType } }
            ]);
            const responseText = result.response.text().trim();

            // فحص رد الذكاء الاصطناعي
            if (this._isAgeRelated(responseText)) return "مش بتكلم في الأعمار 😅";
            if (this._isReproductionRelated(responseText)) return "عذراً، مش مسموح لي أتكلم في المواضيع دي 😅";

            this.saveHistory(userId, textContent || '[صورة]', responseText);
            return responseText;
        } catch (error) {
            console.error('❌ Gemini image error:', error.message);
            throw error;
        }
    }

    async handleCommand(command, userId) {
        const supported = ['!reset', '!sleep', '!dashboard', '!info', '!web', '!imagine', '!wack'];
        if (!supported.includes(command)) return null;
        try {
            this._ensureModel();
            const result = await this.textModel.generateContent(
                `المستخدم طلب الأمر: ${command}. رُد بالعربية باختصار.`
            );
            return result.response.text();
        } catch (e) {
            console.error('❌ Gemini command error:', e.message);
            return null;
        }
    }

    async ask(prompt) {
        try {
            if (this._isAgeRelated(prompt)) return "مش بتكلم في الأعمار 😅";
            if (this._isReproductionRelated(prompt)) return "عذراً، مش مسموح لي أتكلم في المواضيع دي 😅";

            this._ensureModel();
            const result = await this.textModel.generateContent(prompt);
            const responseText = result.response.text().trim();

            if (this._isAgeRelated(responseText)) return "مش بتكلم في الأعمار 😅";
            if (this._isReproductionRelated(responseText)) return "عذراً، مش مسموح لي أتكلم في المواضيع دي 😅";

            return responseText;
        } catch (e) {
            throw e;
        }
    }
}

module.exports = new GeminiAI();