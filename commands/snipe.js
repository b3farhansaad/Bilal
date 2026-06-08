const deletedMessages = new Map(); // channelId -> { content, author, time }

module.exports = {
    name: 'snipe',
    description: 'شوف آخر رسالة اتمسحت في الشات',
    category: 'أدوات',
    
    // This should be called from messageDelete event in index.js
    onMessageDelete(message) {
        if (!message.content) return;
        if (message.author?.bot) return;
        deletedMessages.set(message.channel.id, {
            content: message.content,
            author: message.author?.tag || 'مجهول',
            authorId: message.author?.id,
            time: Date.now()
        });
        // Keep only 30 min
        setTimeout(() => {
            const entry = deletedMessages.get(message.channel.id);
            if (entry && entry.time === deletedMessages.get(message.channel.id)?.time) {
                deletedMessages.delete(message.channel.id);
            }
        }, 30 * 60 * 1000);
    },

    execute(message, args, commandManager) {
        const sniped = deletedMessages.get(message.channel.id);

        if (!sniped) {
            message.reply('🔍 مفيش رسائل متمسحة قريبة في الشات ده.');
            return;
        }

        const elapsed = Math.floor((Date.now() - sniped.time) / 1000);
        const timeStr = elapsed < 60 ? `${elapsed} ثانية` : `${Math.floor(elapsed / 60)} دقيقة`;

        message.reply(`🗑️ **آخر رسالة اتمسحت** (من ${timeStr})

👤 المرسل: \`${sniped.author}\`
💬 الرسالة:
${sniped.content}`);
    }
};
