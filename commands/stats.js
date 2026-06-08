module.exports = {
    name: 'stats',
    description: 'إحصائيات الرسائل والنشاط',
    category: 'نظام',
    execute(message, args, commandManager) {
        const stats = commandManager.getStats();
        const today = new Date().toDateString();

        if (today !== stats.lastResetDay) {
            stats.dailyMessages = 0;
            stats.dailyUsers = [];
            stats.lastResetDay = today;
            commandManager.saveStats(stats);
        }

        let voiceStats = '';
        if (stats.voiceActivity) {
            const totalMs = stats.voiceActivity.totalTime;
            const hours = Math.floor(totalMs / 3600000);
            const minutes = Math.floor((totalMs % 3600000) / 60000);
            const totalTimeStr = hours > 0 ? `${hours}س ${minutes}د` : `${minutes}د`;

            const todaySessions = stats.voiceActivity.sessions?.filter(s =>
                new Date(s.startTime).toDateString() === today
            ) || [];

            voiceStats = `\n\n🎤 **نشاط الصوت**\n• إجمالي الوقت: \`${totalTimeStr}\``;
            if (todaySessions.length > 0) {
                const channelMap = {};
                todaySessions.forEach(s => {
                    const key = `${s.channelName}|${s.guildName}`;
                    if (!channelMap[key]) channelMap[key] = { ...s, totalDuration: 0, count: 0 };
                    channelMap[key].totalDuration += s.duration;
                    channelMap[key].count++;
                });
                voiceStats += '\n• جلسات اليوم:';
                Object.values(channelMap).forEach(c => {
                    const secs = Math.floor(c.totalDuration / 1000);
                    const m = Math.floor(secs / 60), s2 = secs % 60;
                    const t = m > 0 ? `${m}د ${s2}ث` : `${s2}ث`;
                    voiceStats += `\n  └ **${c.channelName}** (${c.guildName}): \`${t}\` (${c.count}x)`;
                });
            } else {
                voiceStats += '\n• مفيش جلسات النهارده';
            }
        }

        message.reply(`📊 **إحصائيات البوت**

💬 رسائل اليوم: \`${stats.dailyMessages}\` (${stats.dailyUsers.length} مستخدم)
📈 إجمالي الرسائل: \`${stats.totalMessages}\` (${stats.allTimeUsers.length} مستخدم)
⌚ وقت التشغيل: \`${commandManager.formatUptime()}\`${voiceStats}`);
    }
};
