module.exports = {
    name: 'tag',
    description: 'هل AI يحتاج mention للرد؟',
    category: 'AI',
    execute(message, args, commandManager) {
        if (args.length < 2) {
            message.reply('❌ الاستخدام: `!tag off` أو `!tag on`\n• `off` = الرد على كل الرسائل\n• `on` = الرد عند المنشن بس');
            return;
        }
        if (args[1] === 'off') {
            if (!commandManager.config.tagOff.includes(message.channel.id)) {
                commandManager.config.tagOff.push(message.channel.id);
                commandManager.saveConfig();
                message.reply('✅ AI هيرد على كل الرسائل في الشات ده.');
            } else {
                message.reply('⚠️ المنشن معطل بالفعل في الشات ده.');
            }
        } else if (args[1] === 'on') {
            const index = commandManager.config.tagOff.indexOf(message.channel.id);
            if (index > -1) {
                commandManager.config.tagOff.splice(index, 1);
                commandManager.saveConfig();
                message.reply('✅ AI هيرد بس لما تمنشنه في الشات ده.');
            } else {
                message.reply('⚠️ المنشن مفعّل بالفعل في الشات ده.');
            }
        } else {
            message.reply('❌ خيار غلط. استخدم `on` أو `off`');
        }
    }
};
