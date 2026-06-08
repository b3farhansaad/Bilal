const fs = require('fs');
const path = require('path');
const dataDir = require('../utils/dataDir');
const notesFile = () => dataDir('notes.json');

function loadNotes(userId) {
    const f = notesFile();
    try { if (fs.existsSync(f)) { const data = JSON.parse(fs.readFileSync(f, 'utf8')); return data[userId] || []; } } catch {}
    return [];
}
function saveNotes(userId, notes) {
    const f = notesFile();
    let all = {};
    try { if (fs.existsSync(f)) all = JSON.parse(fs.readFileSync(f, 'utf8')); } catch {}
    all[userId] = notes;
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, JSON.stringify(all, null, 2));
}

module.exports = {
    name: 'note',
    description: 'حفظ وإدارة ملاحظاتك',
    category: 'أدوات',
    execute(message, args, commandManager) {
        const userId = message.author.id;
        const sub = args[1]?.toLowerCase();
        if (!sub || sub === 'list' || sub === 'قائمة') {
            const notes = loadNotes(userId);
            if (notes.length === 0) { message.reply('📝 مفيش ملاحظات محفوظة.\nاستخدم `!note add <النص>` تضيف ملاحظة.'); return; }
            const list = notes.map((n, i) => `**${i + 1}.** ${n.text} *(${new Date(n.time).toLocaleDateString('ar-EG')})*`).join('\n');
            message.reply(`📝 **ملاحظاتك (${notes.length}):**\n${list}`);
            return;
        }
        if (sub === 'add' || sub === 'إضافة') {
            const text = args.slice(2).join(' ');
            if (!text) { message.reply('❌ اكتب نص الملاحظة.'); return; }
            const notes = loadNotes(userId);
            if (notes.length >= 20) { message.reply('❌ وصلت للحد الأقصى (20 ملاحظة).'); return; }
            notes.push({ text, time: Date.now() });
            saveNotes(userId, notes);
            message.reply(`✅ **تمت الإضافة!**\nالملاحظة: \`${text}\`\nعندك ${notes.length} ملاحظة دلوقتي.`);
            return;
        }
        if (sub === 'delete' || sub === 'del' || sub === 'مسح') {
            const index = parseInt(args[2]) - 1;
            const notes = loadNotes(userId);
            if (isNaN(index) || index < 0 || index >= notes.length) { message.reply(`❌ رقم غلط. عندك ${notes.length} ملاحظة.`); return; }
            const deleted = notes.splice(index, 1)[0];
            saveNotes(userId, notes);
            message.reply(`🗑️ اتمسحت الملاحظة: \`${deleted.text}\``);
            return;
        }
        if (sub === 'clear' || sub === 'مسح_الكل') { saveNotes(userId, []); message.reply('🗑️ تم مسح كل ملاحظاتك.'); return; }
        message.reply(`❓ **أوامر الملاحظات:**\n\`!note list\` - شوف ملاحظاتك\n\`!note add <النص>\` - أضف ملاحظة\n\`!note delete <الرقم>\` - امسح ملاحظة\n\`!note clear\` - امسح كل الملاحظات`);
    }
};
