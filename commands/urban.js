module.exports = {
    name: 'urban',
    description: 'ابحث عن معنى كلمة في Urban Dictionary',
    category: 'أدوات',
    async execute(message, args, commandManager) {
        if (args.length < 2) {
            message.reply('❌ الاستخدام: `!urban <كلمة أو جملة>`\nمثال: `!urban salty`');
            return;
        }

        const term = args.slice(1).join(' ');

        try {
            const res = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`);
            const data = await res.json();

            if (!data.list || data.list.length === 0) {
                message.reply(`❌ مفيش تعريف لـ \`${term}\` في Urban Dictionary.`);
                return;
            }

            const entry = data.list[0];
            const definition = entry.definition.replace(/\[|\]/g, '').slice(0, 400);
            const example = entry.example.replace(/\[|\]/g, '').slice(0, 200);

            const reply = `📖 **Urban Dictionary: ${entry.word}**

📝 **التعريف:**
${definition}${entry.definition.length > 400 ? '...' : ''}

💬 **مثال:**
${example || 'لا يوجد مثال'}

👍 ${entry.thumbs_up} | 👎 ${entry.thumbs_down}`;

            message.reply(reply);
        } catch (err) {
            message.reply('❌ حصل خطأ في جلب التعريف. حاول تاني بعدين.');
        }
    }
};
