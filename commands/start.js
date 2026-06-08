module.exports = {
    name: 'start',
    description: 'إلغاء وضع التخفي',
    category: 'نظام',
    async execute(message, args, commandManager) {
        if (!commandManager.isAllowedUser(message.author.id)) return;
        commandManager.setStealthMode(false);
        // ✅ لا نغير الـ status تلقائياً — الحساب يفضل كما هو
        await message.reply('✅ **تم الرجوع للوضع الطبيعي!**\nالبوت شغال وجاهز.').catch(() => {});
    }
};
