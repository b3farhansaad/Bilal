module.exports = {
    name: 'stop',
    description: 'وضع التخفي (صامت) — بدون تغيير حالة الحساب',
    category: 'نظام',
    async execute(message, args, commandManager) {
        if (!commandManager.isAllowedUser(message.author.id)) return;
        commandManager.setStealthMode(true);
        // ✅ لا نغير الـ status — الحساب يفضل متصل كما هو
        await message.reply('🌑 **وضع التخفي مفعّل**\nالبوت صامت الآن لكن الحساب لا يزال متصلاً.').catch(() => {});
    }
};
