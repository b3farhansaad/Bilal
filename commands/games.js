module.exports = [
    {
        name: 'flip',
        description: 'رمي عملة (صورة أو كتابة)',
        category: 'مرح',
        execute(message, args, commandManager) {
            const results = ['🪙 **صورة!**', '🪙 **كتابة!**'];
            const result = results[Math.floor(Math.random() * 2)];
            message.reply(`🎰 رميت العملة...\n${result}`);
        }
    },
    {
        name: 'dice',
        description: 'رمي نرد',
        category: 'مرح',
        execute(message, args, commandManager) {
            const sides = args[1] ? parseInt(args[1]) : 6;
            if (isNaN(sides) || sides < 2 || sides > 100) {
                message.reply('❌ عدد الأوجه لازم يكون بين 2 و 100.\nمثال: `!dice 20`');
                return;
            }
            const result = Math.floor(Math.random() * sides) + 1;
            const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
            const emoji = sides === 6 ? faces[result - 1] : '🎲';
            message.reply(`${emoji} النرد (${sides} وجوه)... **${result}**`);
        }
    },
    {
        name: 'choose',
        description: 'اختار من بين خيارات',
        category: 'مرح',
        execute(message, args, commandManager) {
            if (args.length < 3) {
                message.reply('❌ الاستخدام: `!choose خيار1 | خيار2 | خيار3`\nمثال: `!choose بيتزا | كشري | فراخ`');
                return;
            }
            const text = args.slice(1).join(' ');
            const options = text.split('|').map(o => o.trim()).filter(o => o.length > 0);
            if (options.length < 2) {
                message.reply('❌ لازم تكتب خيارين على الأقل مفصولين بـ `|`');
                return;
            }
            const chosen = options[Math.floor(Math.random() * options.length)];
            message.reply(`🎯 من بين ${options.length} خيارات... اخترت:\n**${chosen}**`);
        }
    },
    {
        name: 'rps',
        description: 'حجر ورقة مقص',
        category: 'مرح',
        execute(message, args, commandManager) {
            const choices = { حجر: 'rock', ورقة: 'paper', مقص: 'scissors', rock: 'rock', paper: 'paper', scissors: 'scissors', r: 'rock', p: 'paper', s: 'scissors' };
            const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
            const arNames = { rock: 'حجر', paper: 'ورقة', scissors: 'مقص' };

            if (!args[1]) {
                message.reply('❌ الاستخدام: `!rps <حجر/ورقة/مقص>`');
                return;
            }

            const userChoice = choices[args[1].toLowerCase()];
            if (!userChoice) {
                message.reply('❌ اختار: `حجر`, `ورقة`, أو `مقص`');
                return;
            }

            const botOptions = ['rock', 'paper', 'scissors'];
            const botChoice = botOptions[Math.floor(Math.random() * 3)];

            let outcome;
            if (userChoice === botChoice) outcome = '🤝 **تعادل!**';
            else if ((userChoice === 'rock' && botChoice === 'scissors') || (userChoice === 'paper' && botChoice === 'rock') || (userChoice === 'scissors' && botChoice === 'paper')) outcome = '🏆 **انت كسبت!**';
            else outcome = '💀 **انت خسرت!**';

            message.reply(`${emojis[userChoice]} أنت: **${arNames[userChoice]}** vs ${emojis[botChoice]} البوت: **${arNames[botChoice]}**\n${outcome}`);
        }
    }
];
