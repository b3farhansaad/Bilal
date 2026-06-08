module.exports = {
    name: 'block',
    description: 'حجب مستخدم من AI',
    category: 'مستخدمين',
    execute(message, args, commandManager) {
        if (args.length < 2) {
            message.reply('❌ الاستخدام: `!block <user_id>`');
            return;
        }
        const userId = args[1];
        if (commandManager.config.blockedUsers.includes(userId)) {
            message.reply(`⚠️ اليوزر \`${userId}\` محجوب بالفعل.`);
            return;
        }
        commandManager.config.blockedUsers.push(userId);
        commandManager.saveConfig();
        message.reply(`✅ تم حجب اليوزر \`${userId}\` من الـ AI.`);
    }
};
