module.exports = {
    name: 'calc',
    description: 'آلة حاسبة متقدمة',
    category: 'أدوات',
    execute(message, args, commandManager) {
        if (args.length < 2) {
            message.reply('❌ الاستخدام: `!calc <العملية الحسابية>`\nمثال: `!calc 5 * (3 + 2) ^ 2`');
            return;
        }

        const expression = args.slice(1).join(' ');

        try {
            // Clean expression - only allow math chars
            const clean = expression.replace(/[^0-9+\-*/()%.^ ]/g, '').trim();
            if (!clean) throw new Error('تعبير غير صالح');

            // Replace ^ with ** for exponentiation
            const jsExpr = clean.replace(/\^/g, '**');

            // Use Function constructor (safer eval alternative)
            const result = Function('"use strict"; return (' + jsExpr + ')')();

            if (!isFinite(result)) throw new Error('نتيجة غير محدودة');

            const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(10));

            message.reply(`🧮 **الآلة الحاسبة**\n\n📥 العملية: \`${expression}\`\n📤 النتيجة: \`${formatted}\``);
        } catch (err) {
            message.reply(`❌ خطأ في الحساب: \`${expression}\`\nتأكد من صحة العملية الحسابية.`);
        }
    }
};
