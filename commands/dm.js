module.exports = {
    name: 'dm',
    description: 'إرسال رسالة خاصة',
    category: 'مستخدمين',
    async execute(message, args, commandManager) {
        if (args.length < 3) {
            message.reply('❌ الاستخدام: `!dm <user_id> <الرسالة>`');
            return;
        }
        const userId = args[1];
        const content = args.slice(2).join(' ');
        try {
            const user = await message.client.users.fetch(userId);
            await user.send(content);
            message.reply(`✅ تم إرسال الرسالة لـ \`${user.tag}\`.`);
        } catch (err) {
            message.reply(`❌ فشل الإرسال. تأكد من الـ ID أو إن اليوزر مش بلوك DMs.`);
        }
    }
};
