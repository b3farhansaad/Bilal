module.exports = {
    name: 'img', aliases: ['image', 'genimg'],
    description: 'توليد صور بالذكاء الاصطناعي', category: 'ذكاء',
    execute(message) {
        message.reply([
            '**🖼️ أمر توليد الصور**',
            '',
            '⚠️ هذا الأمر يتطلب مكتبة `@google/generative-ai`.',
            'لتفعيله:',
            '```',
            'npm install @google/generative-ai',
            '```',
            'ثم أضف `GEMINI_API_KEY` في ملف `.env`.',
        ].join('\n'));
    }
};
