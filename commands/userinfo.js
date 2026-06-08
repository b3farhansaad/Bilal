module.exports = {
    name: 'userinfo',
    aliases: ['ui', 'whois'],
    description: 'معلومات عن يوزر',
    category: 'أدوات',
    async execute(message, args, commandManager) {
        let target;

        if (message.mentions?.users?.size > 0) {
            target = message.mentions.users.first();
        } else if (args[1]) {
            try {
                target = await message.client.users.fetch(args[1]);
            } catch {
                message.reply('❌ مش قادر ألاقي اليوزر ده. تأكد من الـ ID.');
                return;
            }
        } else {
            target = message.author;
        }

        const member = message.guild?.members.cache.get(target.id);
        const joinedAt = member?.joinedAt ? new Date(member.joinedAt).toLocaleDateString('ar-EG') : 'غير معروف';
        const createdAt = new Date(target.createdAt).toLocaleDateString('ar-EG');
        const roles = member?.roles?.cache
            .filter(r => r.name !== '@everyone')
            .map(r => r.name)
            .slice(0, 5)
            .join(', ') || 'لا يوجد';

        const badges = [];
        const flags = target.flags?.toArray() || [];
        if (flags.includes('DISCORD_EMPLOYEE')) badges.push('👨‍💼 موظف ديسكورد');
        if (flags.includes('PARTNERED_SERVER_OWNER')) badges.push('🤝 شريك');
        if (flags.includes('HYPESQUAD_EVENTS')) badges.push('🏅 HypeSquad');
        if (flags.includes('BUG_HUNTER_LEVEL_1')) badges.push('🐛 Bug Hunter');
        if (flags.includes('EARLY_SUPPORTER')) badges.push('⭐ مساهم مبكر');
        if (target.bot) badges.push('🤖 بوت');

        const reply = `👤 **معلومات المستخدم**

🏷️ الاسم: \`${target.username}\`
🆔 الـ ID: \`${target.id}\`
📅 تاريخ إنشاء الحساب: \`${createdAt}\`
${member ? `📥 انضم للسيرفر: \`${joinedAt}\`` : ''}
${badges.length > 0 ? `🏆 الشارات: ${badges.join(' | ')}` : ''}
${member ? `🎭 الرتب: \`${roles}\`` : ''}
🟢 الحالة: \`${member?.presence?.status || 'غير معروف'}\``;

        message.reply(reply);
    }
};
