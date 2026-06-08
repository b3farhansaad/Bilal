// Auto React — تفاعل تلقائي ذكي
const fs = require('fs'), path = require('path');
const dataDir = require('../utils/dataDir');
const DATA_PATH = () => dataDir('autoreact.json');

function load() {
    const p = DATA_PATH();
    try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
    return { enabled: false, emoji: '🔥', rules: [], reacted: 0 };
}
function save(d) {
    const p = DATA_PATH();
    try { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(d, null, 2)); } catch {}
}

module.exports = {
    name: 'autoreact',
    aliases: ['ar3', 'autolike', 'reactauto'],
    description: 'تفاعل تلقائي ذكي مع قواعد مخصصة',
    category: 'أتوماتيك',

    handleAutoReact(message) {
        try {
            const data = load();
            if (!data.enabled) return;
            if (message.author.id === message.client?.user?.id) return;
            const content = message.content.toLowerCase();
            // Rule-based reactions
            for (const rule of (data.rules || [])) {
                if (!rule.enabled) continue;
                if (content.includes(rule.trigger.toLowerCase())) {
                    message.react(rule.emoji).catch(() => {});
                    data.reacted = (data.reacted || 0) + 1;
                    save(data);
                    return;
                }
            }
            // Default emoji
            message.react(data.emoji || '🔥').catch(() => {});
            data.reacted = (data.reacted || 0) + 1;
            save(data);
        } catch {}
    },

    execute(message, args, commandManager) {
        const sub = args[1]?.toLowerCase();
        const data = load();
        const prefix = commandManager.getMainPrefix();

        if (sub === 'on') {
            data.enabled = true; save(data);
            return message.reply(`✅ **Auto React مفعّل!** ${data.emoji || '🔥'}\n💡 كل رسالة في الشات ستحصل على ردّ فعل تلقائي.`);
        }

        if (sub === 'off') {
            data.enabled = false; save(data);
            return message.reply('❌ **Auto React معطّل.**');
        }

        if (sub === 'emoji' || sub === 'set') {
            const emoji = args[2];
            if (!emoji) return message.reply(`❌ الصيغة: \`${prefix}autoreact emoji <إيموجي>\``);
            data.emoji = emoji; save(data);
            return message.reply(`✅ **الإيموجي الافتراضي:** ${emoji}`);
        }

        if (sub === 'add') {
            const text = args.slice(2).join(' ');
            if (!text.includes('|')) return message.reply(`❌ الصيغة: \`${prefix}autoreact add <كلمة> | <إيموجي>\``);
            const [trigger, emoji] = text.split('|').map(s => s.trim());
            if (!trigger || !emoji) return message.reply('❌ الكلمة والإيموجي مطلوبين.');
            if (!data.rules) data.rules = [];
            if (data.rules.length >= 20) return message.reply('❌ الحد الأقصى 20 قاعدة.');
            data.rules.push({ trigger, emoji, enabled: true });
            save(data);
            return message.reply(`✅ قاعدة جديدة: \`${trigger}\` → ${emoji}`);
        }

        if (sub === 'list') {
            if (!data.rules?.length) return message.reply(`📭 لا توجد قواعد. أضف بـ \`${prefix}autoreact add\``);
            const list = data.rules.map((r, i) => `**${i+1}.** [${r.enabled?'✅':'❌'}] \`${r.trigger}\` → ${r.emoji}`).join('\n');
            return message.reply(`**⚡ قواعد Auto React:**\n${list}\n\n💡 الحالة: ${data.enabled ? '🟢 مفعّل' : '🔴 معطّل'} | 📊 مجموع التفاعلات: **${data.reacted || 0}**`);
        }

        if (sub === 'remove' || sub === 'del') {
            const idx = parseInt(args[2]) - 1;
            if (!data.rules || isNaN(idx) || idx < 0 || idx >= data.rules.length) return message.reply('❌ رقم غير صحيح.');
            const removed = data.rules.splice(idx, 1)[0]; save(data);
            return message.reply(`🗑️ تم حذف: \`${removed.trigger}\` → ${removed.emoji}`);
        }

        if (sub === 'stats') {
            return message.reply(`**📊 Auto React إحصائيات**\n🟢 الحالة: ${data.enabled ? 'مفعّل' : 'معطّل'}\n${data.emoji || '🔥'} الإيموجي الافتراضي\n📝 القواعد: ${data.rules?.length || 0}\n❤️ إجمالي التفاعلات: **${data.reacted || 0}**`);
        }

        if (sub === 'clear') {
            data.rules = []; save(data);
            return message.reply('🗑️ تم مسح كل القواعد.');
        }

        return message.reply([
            `**⚡ Auto React**`,
            `\`${prefix}autoreact on/off\` — تفعيل/تعطيل`,
            `\`${prefix}autoreact emoji <إيموجي>\` — تغيير الإيموجي`,
            `\`${prefix}autoreact add <كلمة> | <إيموجي>\` — إضافة قاعدة`,
            `\`${prefix}autoreact list\` — قائمة القواعد`,
            `\`${prefix}autoreact remove <رقم>\` — حذف قاعدة`,
            `\`${prefix}autoreact stats\` — إحصائيات`,
            `\`${prefix}autoreact clear\` — مسح الكل`,
        ].join('\n'));
    }
};
