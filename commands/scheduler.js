const crypto = require('crypto');
const scheduledMsgs = new Map();
const autodeleteChannels2 = new Map(); // renamed to avoid conflict with automation2.js
function parseTime(t) {
    if (!t) return null;
    const m = t.match(/^(\d+)(s|m|h|d)$/i);
    if (!m) return null;
    const n = parseInt(m[1]);
    const mul = { s:1000, m:60000, h:3600000, d:86400000 };
    const ms = n * mul[m[2].toLowerCase()];
    if (ms < 5000 || ms > 86400000*7) return null;
    return ms;
}

module.exports = [
    {
        name: 'schedule', aliases: ['sched', 'sendlater'],
        description: 'جدولة رسالة لتُرسل بعد وقت محدد', category: 'أدوات',
        execute(message, args, cm) {
            const sub = args[1]?.toLowerCase();
            const prefix = cm.getMainPrefix();
            if (!sub || sub === 'help') return message.reply(
                '**⏰ جدولة الرسائل**\n\n' +
                '`' + prefix + 'schedule <وقت> <رسالة>` — جدول رسالة\n' +
                '`' + prefix + 'schedule list` — الرسائل المجدولة\n' +
                '`' + prefix + 'schedule cancel <id>` — إلغاء\n\n' +
                '**الوقت:** `5s` ثواني | `10m` دقائق | `2h` ساعات | `1d` يوم\n' +
                '**مثال:** `' + prefix + 'schedule 30m مرحباً!`'
            );
            if (sub === 'list') {
                if (!scheduledMsgs.size) return message.reply('📭 لا توجد رسائل مجدولة.');
                let t = '**⏰ الرسائل المجدولة (' + scheduledMsgs.size + ')**\n```\n';
                for (const [id, s] of scheduledMsgs.entries()) {
                    const rem = Math.max(0, s.sendAt - Date.now());
                    t += id.slice(-6) + ' — "' + s.text.slice(0, 30) + '..." — بعد ' + Math.floor(rem/60000) + 'm ' + Math.floor((rem%60000)/1000) + 's\n';
                }
                return message.reply(t + '```');
            }
            if (sub === 'cancel') {
                const id = args[2];
                if (!id) return message.reply('❌ اكتب ID.');
                const f = [...scheduledMsgs.keys()].find(k => k.endsWith(id));
                if (!f) return message.reply('❌ مش لاقي: `' + id + '`');
                const s = scheduledMsgs.get(f);
                clearTimeout(s.timer);
                scheduledMsgs.delete(f);
                return message.reply('✅ **تم الإلغاء:** `' + s.text.slice(0, 40) + '`');
            }
            const ms = parseTime(sub);
            const text = args.slice(2).join(' ');
            if (!ms) return message.reply('❌ وقت غير صحيح. **صيغ:** `5s` `10m` `2h` `1d` (5 ثواني — 7 أيام)');
            if (!text) return message.reply('❌ اكتب الرسالة.\n**مثال:** `' + prefix + 'schedule 10m مرحباً!`');
            if (scheduledMsgs.size >= 10) return message.reply('❌ الحد 10 رسائل. ألغِ بعضها.');
            const id = crypto.randomUUID();
            const sendAt = Date.now() + ms;
            const td = ms >= 3600000 ? Math.floor(ms/3600000) + 'h' : ms >= 60000 ? Math.floor(ms/60000) + 'm' : Math.floor(ms/1000) + 's';
            const timer = setTimeout(async () => {
                try { await message.channel.send('⏰ **رسالة مجدولة:**\n' + text); } catch {}
                scheduledMsgs.delete(id);
            }, ms);
            scheduledMsgs.set(id, { text, sendAt, timer, channelId: message.channel.id });
            message.reply('✅ **تم جدولة الرسالة!**\n⏱️ ستُرسل بعد: `' + td + '`\n🆔 ID: `' + id.slice(-6) + '`');
        }
    },
    {
        // ✅ FIX: renamed from 'autodelete' (مكرر مع automation2.js) → 'autodel2'
        name: 'autodel2', aliases: ['scheddelete', 'selfautodel'],
        description: 'حذف رسائلك تلقائياً (نسخة scheduler)', category: 'أدوات',
        execute(message, args, cm) {
            const sub = args[1]?.toLowerCase();
            const prefix = cm.getMainPrefix();
            if (!sub || sub === 'help') return message.reply(
                '**🗑️ Auto Delete 2**\n\n' +
                '`' + prefix + 'autodel2 on <وقت>` — تفعيل (مثال: `30s` أو `5m`)\n' +
                '`' + prefix + 'autodel2 off` — تعطيل\n' +
                '`' + prefix + 'autodel2 status` — الحالة'
            );
            if (sub === 'on') {
                const ms = parseTime(args[2]);
                if (!ms || ms > 3600000) return message.reply('❌ وقت غير صحيح. **مثال:** `30s` أو `5m`');
                autodeleteChannels2.set(message.channel.id, { ms, enabled: true });
                const s = Math.floor(ms/1000);
                message.reply('✅ **تم تفعيل الحذف التلقائي!**\n🗑️ رسائلك تُحذف بعد `' + s + 's`')
                    .then(m => setTimeout(() => m.delete().catch(() => {}), ms));
                return;
            }
            if (sub === 'off') { autodeleteChannels2.delete(message.channel.id); return message.reply('❌ **تم تعطيل الحذف التلقائي.**'); }
            if (sub === 'status') {
                const s = autodeleteChannels2.get(message.channel.id);
                return message.reply(s ? '✅ مفعّل — بعد `' + Math.floor(s.ms/1000) + 's`' : '📴 معطّل');
            }
            message.reply('❌ استخدم `' + prefix + 'autodel2 help`');
        }
    },
    {
        // ✅ FIX: renamed from 'countdown' (مكرر مع newtools.js) → 'countdate'
        name: 'countdate', aliases: ['countdownto', 'timeleft'],
        description: 'عداد تنازلي حتى تاريخ معين', category: 'أدوات',
        execute(message, args, cm) {
            const input = args.slice(1).join(' ');
            if (!input) return message.reply('❌ `' + cm.getMainPrefix() + 'countdate <تاريخ>`\n**مثال:** `!countdate 2025-12-31`');
            const t = new Date(input);
            if (isNaN(t.getTime())) return message.reply('❌ تاريخ غير صحيح. **مثال:** `2025-12-31`');
            const diff = t - new Date();
            if (diff < 0) {
                const d = Math.floor(Math.abs(diff)/86400000);
                return message.reply('⏰ **هذا التاريخ مضى منذ ' + d + ' يوم.**');
            }
            const days = Math.floor(diff/86400000), hours = Math.floor((diff%86400000)/3600000),
                  minutes = Math.floor((diff%3600000)/60000), seconds = Math.floor((diff%60000)/1000);
            message.reply(
                '**⏳ عداد تنازلي حتى ' + t.toLocaleDateString('ar-EG') + '**\n```\n' +
                '📅 أيام   : ' + String(days).padStart(4) + '\n' +
                '⏰ ساعات  : ' + String(hours).padStart(4) + '\n' +
                '⏱️ دقائق  : ' + String(minutes).padStart(4) + '\n' +
                '⚡ ثواني  : ' + String(seconds).padStart(4) + '\n```'
            );
        }
    }
];
