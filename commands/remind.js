module.exports = {
    name: 'remind',
    description: 'ضبط تذكير بعد وقت معين',
    category: 'أدوات',
    execute(message, args, commandManager) {
        if (args.length < 3) {
            message.reply(`❌ الاستخدام: \`!remind <الوقت> <الرسالة>\`

**أمثلة:**
• \`!remind 5m روح ذاكر\`
• \`!remind 1h ابعت الرسالة\`
• \`!remind 30s شيل الأكل من النار\`

**وحدات الوقت:**
• \`s\` = ثواني | \`m\` = دقائق | \`h\` = ساعات`);
            return;
        }

        const timeStr = args[1].toLowerCase();
        const reminderText = args.slice(2).join(' ');

        const timeRegex = /^(\d+)(s|m|h)$/;
        const match = timeStr.match(timeRegex);

        if (!match) {
            message.reply('❌ صيغة الوقت غلط. استخدم مثلاً: `5m`, `1h`, `30s`');
            return;
        }

        const amount = parseInt(match[1]);
        const unit = match[2];

        let ms;
        let unitAr;
        switch (unit) {
            case 's': ms = amount * 1000; unitAr = `${amount} ثانية`; break;
            case 'm': ms = amount * 60000; unitAr = `${amount} دقيقة`; break;
            case 'h': ms = amount * 3600000; unitAr = `${amount} ساعة`; break;
        }

        if (ms > 24 * 3600000) {
            message.reply('❌ أقصى وقت للتذكير هو 24 ساعة.');
            return;
        }

        message.reply(`⏰ تمام! هأذكرك بعد **${unitAr}**.\nالتذكير: \`${reminderText}\``);

        setTimeout(async () => {
            try {
                await message.reply(`🔔 **تذكير!**\n${reminderText}\n\n*(كان مضبوط من ${unitAr} فاتوا)*`);
            } catch (err) {
                console.error('Reminder error:', err);
            }
        }, ms);
    }
};
