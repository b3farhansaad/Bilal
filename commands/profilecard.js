// Profile Card — بطاقة الملف الشخصي الكاملة
module.exports = {
    name: 'profilecard',
    aliases: ['profile', 'card', 'me', 'mycard', 'pc'],
    description: 'بطاقة الملف الشخصي التفصيلية',
    category: 'حساب',

    async execute(message, args, commandManager) {
        const target = message.mentions?.users?.first() || message.author;
        const member = message.guild?.members.cache.get(target.id);
        const prefix = commandManager.getMainPrefix();

        const created = new Date(target.createdAt);
        const ageDays = Math.floor((Date.now() - created) / 86400000);
        const ageYears = (ageDays / 365).toFixed(1);

        const joinedAt = member?.joinedAt ? new Date(member.joinedAt) : null;
        const joinDays = joinedAt ? Math.floor((Date.now() - joinedAt) / 86400000) : null;

        const status = member?.presence?.status || 'offline';
        const statusEmoji = { online: '🟢', idle: '🌙', dnd: '🔴', offline: '⚫' }[status] || '⚫';
        const statusAr = { online: 'متصل', idle: 'غائب', dnd: 'لا تزعج', offline: 'غير متصل' }[status] || status;

        const roles = member ? [...member.roles.cache.values()].filter(r => r.name !== '@everyone').sort((a, b) => b.position - a.position).slice(0, 5) : [];
        const rolesText = roles.length ? roles.map(r => `\`${r.name}\``).join(', ') : 'لا يوجد';

        const activities = member?.presence?.activities || [];
        const currentActivity = activities.find(a => a.type !== 'CUSTOM') || activities[0];
        const activityText = currentActivity
            ? `${currentActivity.name}${currentActivity.details ? ` — ${currentActivity.details}` : ''}`
            : 'لا يوجد';

        const isBot = target.bot;
        const discriminator = target.discriminator !== '0' ? `#${target.discriminator}` : '';

        const lines = [
            `**👤 بطاقة الملف الشخصي**`,
            ``,
            `${statusEmoji} **${target.username}${discriminator}**${isBot ? ' 🤖' : ''}`,
            `🆔 ID: \`${target.id}\``,
            ``,
            `**📅 معلومات الحساب:**`,
            `├ تاريخ الإنشاء: \`${created.toLocaleDateString('ar-EG')}\``,
            `├ عمر الحساب: \`${ageDays} يوم (${ageYears} سنة)\``,
            `└ الحالة: \`${statusAr}\``,
        ];

        if (joinedAt) {
            lines.push(``, `**🏠 في السيرفر:**`);
            lines.push(`├ انضم: \`${joinedAt.toLocaleDateString('ar-EG')}\``);
            lines.push(`├ منذ: \`${joinDays} يوم\``);
            lines.push(`└ الرتب: ${rolesText}`);
        }

        if (currentActivity) {
            lines.push(``, `**🎮 النشاط الحالي:**`);
            lines.push(`└ ${activityText.slice(0, 80)}`);
        }

        lines.push(``, `🔗 الصورة: ${target.displayAvatarURL({ size: 256 })}`);

        message.reply(lines.join('\n'));
    }
};
