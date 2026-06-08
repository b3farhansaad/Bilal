module.exports = {
    name: 'status',
    description: 'تغيير حالتك على Discord',
    category: 'حالة',
    async execute(message, args, commandManager) {
        if (args.length < 2) {
            message.reply(`❌ الاستخدام: \`!status <online/idle/dnd/offline> [إيموجي] [نص]\`

**أمثلة:**
• \`!status dnd 🎮 بلعب\`
• \`!status idle 😴 نايم\`
• \`!status online 💻 شغال\`
• \`!status offline\``);
            return;
        }

        const statusMap = { online: 'online', idle: 'idle', dnd: 'dnd', offline: 'invisible', invisible: 'invisible' };
        const statusAr = { online: 'أونلاين', idle: 'مشغول', dnd: 'لا تزعجني', offline: 'مخفي' };
        const statusEmoji = { online: '🟢', idle: '🟡', dnd: '🔴', offline: '⚫' };

        const statusKey = args[1].toLowerCase();
        if (!statusMap[statusKey]) {
            message.reply('❌ حالة غير صحيحة. الخيارات: `online`, `idle`, `dnd`, `offline`');
            return;
        }

        const statusText = args.slice(2).join(' ');
        await message.client.user.setStatus(statusMap[statusKey]);

        if (statusText) {
            await message.client.user.setActivity(statusText, { type: 'CUSTOM', state: statusText });
            message.reply(`${statusEmoji[statusKey]} الحالة: **${statusAr[statusKey]}**\n💬 النص: \`${statusText}\``);
        } else {
            message.reply(`${statusEmoji[statusKey]} الحالة تم تغييرها لـ **${statusAr[statusKey]}**`);
        }
    }
};
