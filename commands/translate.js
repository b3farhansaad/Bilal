module.exports = {
    name: 'translate',
    aliases: ['tr'],
    description: 'ترجمة نص لأي لغة',
    category: 'أدوات',
    async execute(message, args, commandManager) {
        if (args.length < 3) {
            message.reply(`❌ الاستخدام: \`!translate <اللغة> <النص>\`

**أمثلة:**
• \`!translate en مرحبا كيف حالك\`
• \`!translate ar Hello how are you\`
• \`!translate fr Good morning\`

**لغات متاحة:** en, ar, fr, de, es, it, ja, ko, zh, ru, tr, pt`);
            return;
        }

        const targetLang = args[1].toLowerCase();
        const text = args.slice(2).join(' ');

        const validLangs = { en: 'الإنجليزية', ar: 'العربية', fr: 'الفرنسية', de: 'الألمانية', es: 'الإسبانية', it: 'الإيطالية', ja: 'اليابانية', ko: 'الكورية', zh: 'الصينية', ru: 'الروسية', tr: 'التركية', pt: 'البرتغالية' };

        if (!validLangs[targetLang]) {
            message.reply(`❌ اللغة \`${targetLang}\` مش متاحة.\nاللغات المتاحة: ${Object.keys(validLangs).join(', ')}`);
            return;
        }

        try {
            // Using MyMemory free translation API
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`);
            const data = await res.json();

            if (data.responseStatus !== 200) throw new Error('فشل الترجمة');

            const translated = data.responseData.translatedText;

            const reply = `🌍 **الترجمة**

📥 **النص الأصلي:**
${text}

📤 **الترجمة (${validLangs[targetLang]}):**
${translated}`;

            message.reply(reply);
        } catch (err) {
            message.reply('❌ حصل خطأ في الترجمة. حاول تاني.');
        }
    }
};
