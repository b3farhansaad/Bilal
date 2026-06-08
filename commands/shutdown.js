module.exports = {
    name: 'shutdown',
    description: 'إيقاف البوت تماماً',
    category: 'نظام',
    async execute(message, args, commandManager) {
        if (!commandManager.isAllowedUser(message.author.id)) return;
        await message.reply('🔴 **جاري إيقاف البوت...**\nباي باي! 👋').catch(() => {});
        setTimeout(() => process.exit(0), 1000);
    }
};
