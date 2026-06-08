module.exports = {
    name: 'ascii',
    description: 'تحويل نص لـ ASCII art',
    category: 'مرح',
    async execute(message, args, commandManager) {
        if (args.length < 2) {
            message.reply('❌ الاستخدام: `!ascii <النص>`\nمثال: `!ascii BILAL`');
            return;
        }
        const text = args.slice(1).join(' ').slice(0, 15).toUpperCase();
        try {
            const res = await fetch(`https://artii.herokuapp.com/make?text=${encodeURIComponent(text)}&font=banner3-D`);
            if (!res.ok) throw new Error();
            const ascii = await res.text();
            message.reply(`\`\`\`\n${ascii.slice(0, 1800)}\n\`\`\``);
        } catch {
            // Fallback simple ASCII
            message.reply(`\`\`\`\n  ${text.split('').join('  ')}\n\`\`\``);
        }
    }
};
