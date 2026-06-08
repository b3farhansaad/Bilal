module.exports = {
    name: 'unblock',
    description: 'رفع الحجب عن مستخدم',
    category: 'مستخدمين',
    execute(message, args, commandManager) {
        if (args.length < 2) {
            message.reply('❌ الاستخدام: `!unblock <user_id>`');
            return;
        }
        const userId = args[1];
        const index = commandManager.config.blockedUsers.indexOf(userId);
        if (index === -1) {
            message.reply(`⚠️ اليوزر \`${userId}\` مش محجوب.`);
            return;
        }
        commandManager.config.blockedUsers.splice(index, 1);
        commandManager.saveConfig();
        message.reply(`✅ تم رفع الحجب عن اليوزر \`${userId}\`.`);
    }
};
