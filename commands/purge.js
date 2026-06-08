module.exports = {
    name: 'purge',
    description: 'مسح رسائلك',
    category: 'نظام',
    async execute(message, args, commandManager) {
        if (!commandManager.isAllowedUser(message.author.id)) return;

        const count = parseInt(args[1]);
        if (isNaN(count) || count < 1 || count > 100) {
            message.reply('❌ الاستخدام: `!purge <1-100>`\nمثال: `!purge 10`');
            return;
        }

        try {
            const messages = await message.channel.messages.fetch({ limit: 100 });
            const myMessages = messages
                .filter(m => m.author.id === message.client.user.id)
                .first(count + 1); // +1 للأمر نفسه

            let deleted = 0;
            for (const msg of myMessages) {
                try {
                    await msg.delete();
                    deleted++;
                    await new Promise(r => setTimeout(r, 300));
                } catch {}
            }

            const confirm = await message.channel.send(`🗑️ تم مسح **${deleted}** رسالة.`);
            setTimeout(() => confirm.delete().catch(() => {}), 3000);
        } catch (err) {
            console.error('Purge error:', err);
        }
    }
};
