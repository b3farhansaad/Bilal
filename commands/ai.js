module.exports = {
    name: 'ai',
    description: 'تحكم في نظام الذكاء الاصطناعي',
    category: 'ذكاء',
    execute(message, args, commandManager) {
        const prefix = commandManager.getMainPrefix();
        if (args.length < 2) {
            return message.reply([
                '**🤖 التحكم في الذكاء الاصطناعي**',
                '',
                '`' + prefix + 'ai on` — تفعيل AI في هذا الشات',
                '`' + prefix + 'ai off` — تعطيل AI في هذا الشات',
                '`' + prefix + 'ai all on/off` — تفعيل/تعطيل لكل السيرفر',
                '`' + prefix + 'ai global on/off` — تفعيل/تعطيل لكل مكان',
                '`' + prefix + 'ai list` — عرض الإعدادات الحالية',
            ].join('\n'));
        }

        const sub = args[1].toLowerCase();

        if (sub === 'list') {
            const ailistCmd = commandManager.commands.get('ailist');
            if (ailistCmd) return ailistCmd.execute(message, args, commandManager);
            const cfg = commandManager.config.ai || {};
            return message.reply(
                '**🤖 إعدادات الـ AI الحالية**\n' +
                '```\n' +
                '🌐 عالمي   : ' + (cfg.global ? '✅ مفعّل' : '❌ معطّل') + '\n' +
                '🏠 السيرفر : ' + (cfg.perGuild?.[message.guild?.id] === true ? '✅' : cfg.perGuild?.[message.guild?.id] === false ? '❌' : '⬜ غير محدد') + '\n' +
                '💬 الشات   : ' + (cfg.perChannel?.[message.channel.id] === true ? '✅' : cfg.perChannel?.[message.channel.id] === false ? '❌' : '⬜ غير محدد') + '\n' +
                '```'
            );
        }

        if (sub === 'on' || sub === 'off') {
            const val = sub === 'on';
            if (!commandManager.config.ai) commandManager.config.ai = {};
            if (!commandManager.config.ai.perChannel) commandManager.config.ai.perChannel = {};
            commandManager.config.ai.perChannel[message.channel.id] = val;
            commandManager.saveConfig();
            return message.reply(val
                ? '✅ **تم تفعيل الـ AI في هذا الشات!**\nكل الرسائل التي تذكرك ستُرد عليها تلقائياً.'
                : '❌ **تم تعطيل الـ AI في هذا الشات.**'
            );
        }

        if (sub === 'all') {
            if (!message.guild) return message.reply('❌ هذا الأمر يُستخدم فقط داخل سيرفر.');
            const val = args[2] === 'on';
            if (!commandManager.config.ai) commandManager.config.ai = {};
            if (!commandManager.config.ai.perGuild) commandManager.config.ai.perGuild = {};
            commandManager.config.ai.perGuild[message.guild.id] = val;
            commandManager.saveConfig();
            return message.reply(val
                ? '✅ **الـ AI مفعّل لكل قنوات السيرفر!**'
                : '❌ **الـ AI معطّل لكل قنوات السيرفر.**'
            );
        }

        if (sub === 'global') {
            const val = args[2] === 'on';
            if (!commandManager.config.ai) commandManager.config.ai = {};
            commandManager.config.ai.global = val;
            commandManager.saveConfig();
            return message.reply(val
                ? '🌐 **الـ AI مفعّل بشكل عام في كل مكان!**'
                : '🌐 **الـ AI معطّل بشكل عام.**'
            );
        }

        return message.reply('❌ خيار غير معروف. استخدم `' + prefix + 'ai on/off/all/global/list`');
    }
};
