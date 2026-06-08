// أوامر مرح وألعاب متقدمة 🎮
const crypto = require('crypto');

// Active games
const tttGames = new Map();
const guessGames = new Map();

function makeBoard(cells) {
    const r = (i) => cells[i] || `${i+1}`;
    return `\`\`\`\n${r(0)} │ ${r(1)} │ ${r(2)}\n──┼───┼──\n${r(3)} │ ${r(4)} │ ${r(5)}\n──┼───┼──\n${r(6)} │ ${r(7)} │ ${r(8)}\n\`\`\``;
}

function checkWinner(cells) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,b,c] of wins) {
        if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) return cells[a];
    }
    return cells.every(c => c) ? 'draw' : null;
}

function aiMove(cells) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    // Win
    for (const [a,b,c] of wins) {
        const line = [cells[a],cells[b],cells[c]];
        if (line.filter(x=>x==='O').length===2 && line.filter(x=>!x).length===1) {
            return [a,b,c].find(i=>!cells[i]);
        }
    }
    // Block
    for (const [a,b,c] of wins) {
        const line = [cells[a],cells[b],cells[c]];
        if (line.filter(x=>x==='X').length===2 && line.filter(x=>!x).length===1) {
            return [a,b,c].find(i=>!cells[i]);
        }
    }
    // Center
    if (!cells[4]) return 4;
    // Corner
    const corners = [0,2,6,8].filter(i=>!cells[i]);
    if (corners.length) return corners[Math.floor(Math.random()*corners.length)];
    // Any
    return cells.findIndex(c=>!c);
}

module.exports = [
    // ─── XO ضد الكمبيوتر ─────────────────────────────────
    {
        name: 'ttt',
        aliases: ['xo', 'tictactoe', 'xox'],
        description: 'لعبة XO ضد الكمبيوتر',
        category: 'مرح',
        async execute(message, args, commandManager) {
            const prefix = commandManager.getMainPrefix();
            const cid = message.channel.id;
            const move = parseInt(args[1]);

            if (!args[1] || args[1] === 'new' || args[1] === 'start') {
                tttGames.set(cid, { cells: Array(9).fill(null), turn: 'X' });
                return message.reply(`**🎮 XO — أنت (X) ضد الكمبيوتر (O)**\n${makeBoard(Array(9).fill(null))}\n📌 اكتب \`${prefix}ttt <1-9>\` لتضع حركتك!`);
            }

            const game = tttGames.get(cid);
            if (!game) return message.reply(`❌ مفيش لعبة شغّالة. ابدأ بـ \`${prefix}ttt new\``);
            if (isNaN(move) || move < 1 || move > 9) return message.reply('❌ اختار رقم من 1 لـ 9');
            if (game.cells[move - 1]) return message.reply('❌ الخانة دي مشغولة!');

            game.cells[move - 1] = 'X';
            let result = checkWinner(game.cells);
            if (result) {
                tttGames.delete(cid);
                if (result === 'draw') return message.reply(`**🎮 XO**\n${makeBoard(game.cells)}\n🤝 **تعادل!**`);
                return message.reply(`**🎮 XO**\n${makeBoard(game.cells)}\n🏆 **إنت كسبت! أحسنت!** 🎉`);
            }

            const aiIdx = aiMove(game.cells);
            game.cells[aiIdx] = 'O';
            result = checkWinner(game.cells);
            if (result) {
                tttGames.delete(cid);
                if (result === 'draw') return message.reply(`**🎮 XO**\n${makeBoard(game.cells)}\n🤝 **تعادل!**`);
                return message.reply(`**🎮 XO**\n${makeBoard(game.cells)}\n💀 **الكمبيوتر كسب!** حاول مرة تانية.`);
            }

            tttGames.set(cid, game);
            return message.reply(`**🎮 XO — دورك (X)**\n${makeBoard(game.cells)}\n📌 \`${prefix}ttt <1-9>\``);
        }
    },
    // ─── لعبة تخمين الرقم ────────────────────────────────
    {
        name: 'guess',
        aliases: ['guessnumber', 'numguess', 'خمّن'],
        description: 'لعبة تخمين رقم — خمّن الرقم السري!',
        category: 'مرح',
        async execute(message, args, commandManager) {
            const prefix = commandManager.getMainPrefix();
            const cid = message.channel.id;
            const input = parseInt(args[1]);

            if (args[1] === 'new' || args[1] === 'start' || !args[1]) {
                const max = parseInt(args[2]) || 100;
                const secret = Math.floor(Math.random() * max) + 1;
                guessGames.set(cid, { secret, max, attempts: 0, hints: [] });
                return message.reply(`🎲 **لعبة تخمين الأرقام!**\nخمّنت رقماً بين **1** و **${max}**\n\n📌 اكتب \`${prefix}guess <رقم>\` لتجرب!\n💡 \`${prefix}guess new 50\` للعب لـ 50`);
            }

            const game = guessGames.get(cid);
            if (!game) return message.reply(`❌ مفيش لعبة. ابدأ بـ \`${prefix}guess new\``);
            if (isNaN(input) || input < 1 || input > game.max) return message.reply(`❌ اكتب رقم بين 1 و ${game.max}`);

            game.attempts++;
            const diff = Math.abs(input - game.secret);

            if (input === game.secret) {
                const stars = game.attempts <= 3 ? '⭐⭐⭐' : game.attempts <= 6 ? '⭐⭐' : '⭐';
                guessGames.delete(cid);
                return message.reply(`🎉 **صح! الرقم كان ${game.secret}!**\n${stars} وصلتله في **${game.attempts}** محاولة!`);
            }

            if (game.attempts >= 10) {
                guessGames.delete(cid);
                return message.reply(`💀 **خلصت المحاولات!** الرقم كان **${game.secret}**`);
            }

            const hint = input < game.secret ? '📈 أكبر من كده!' : '📉 أصغر من كده!';
            const warmth = diff <= 5 ? '🔥 ساخن جداً!' : diff <= 15 ? '🌡️ دافي' : diff <= 30 ? '🌤️ بارد' : '🥶 بعيد جداً';
            return message.reply(`${hint}\n${warmth} (${10 - game.attempts} محاولات متبقية)`);
        }
    },
    // ─── تريفيا عامة ─────────────────────────────────────
    {
        name: 'trivia',
        aliases: ['quiz', 'كويز', 'سؤال'],
        description: 'سؤال معلومات عامة عشوائي',
        category: 'مرح',
        execute(message, args, commandManager) {
            const questions = [
                { q: 'ما هي عاصمة اليابان؟', a: 'طوكيو', choices: ['أوساكا', 'طوكيو', 'كيوتو', 'سيول'] },
                { q: 'كم عدد أضلاع المثلث؟', a: '3', choices: ['2', '3', '4', '5'] },
                { q: 'من هو مخترع الهاتف؟', a: 'ألكسندر غراهام بيل', choices: ['إديسون', 'نيوتن', 'ألكسندر غراهام بيل', 'أينشتاين'] },
                { q: 'ما هي أكبر دولة في العالم مساحةً؟', a: 'روسيا', choices: ['الصين', 'كندا', 'روسيا', 'البرازيل'] },
                { q: 'في أي عام بدأت الحرب العالمية الثانية؟', a: '1939', choices: ['1914', '1939', '1945', '1936'] },
                { q: 'ما هو أعمق بحيرة في العالم؟', a: 'بحيرة بايكال', choices: ['بحيرة تيتيكاكا', 'بحيرة فيكتوريا', 'بحيرة بايكال', 'بحيرة سبيريور'] },
                { q: 'كم عدد كواكب المجموعة الشمسية؟', a: '8', choices: ['7', '8', '9', '10'] },
                { q: 'ما هو أكبر كوكب في المجموعة الشمسية؟', a: 'المشتري', choices: ['زحل', 'المشتري', 'أورانوس', 'نبتون'] },
                { q: 'ما هي عملة المملكة المتحدة؟', a: 'الجنيه الإسترليني', choices: ['اليورو', 'الدولار', 'الجنيه الإسترليني', 'الكرون'] },
                { q: 'من كتب رواية 1984؟', a: 'جورج أورويل', choices: ['ألدوس هكسلي', 'فرانز كافكا', 'جورج أورويل', 'أوسكار وايلد'] },
                { q: 'ما هو رمز الذهب في الجدول الدوري؟', a: 'Au', choices: ['Ag', 'Go', 'Au', 'Gd'] },
                { q: 'ما هي أسرع حيوانات العالم البرية؟', a: 'الفهد', choices: ['الأسد', 'النمر', 'الفهد', 'الحصان'] },
            ];
            const { q, a, choices } = questions[Math.floor(Math.random() * questions.length)];
            const shuffled = [...choices].sort(() => Math.random() - 0.5);
            const letters = ['🇦', '🇧', '🇨', '🇩'];
            const answerIdx = shuffled.indexOf(a);
            const text = shuffled.map((c, i) => `${letters[i]} ${c}`).join('\n');
            message.reply(`**🧠 سؤال تريفيا:**\n❓ ${q}\n\n${text}\n\n||**الإجابة:** ${letters[answerIdx]} ${a}||`);
        }
    },
    // ─── كلمة مقلوبة ─────────────────────────────────────
    {
        name: 'wordscramble',
        aliases: ['scramble', 'ws', 'unscramble'],
        description: 'كلمة إنجليزية مقلوبة — خمّن الكلمة',
        category: 'مرح',
        execute(message, args, commandManager) {
            const words = [
                'python', 'discord', 'music', 'coding', 'keyboard', 'monitor',
                'database', 'network', 'server', 'browser', 'gaming', 'laptop',
                'software', 'internet', 'program', 'function', 'variable', 'memory'
            ];
            const word = words[Math.floor(Math.random() * words.length)];
            const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
            message.reply(`🔀 **الكلمة المقلوبة:**\n## \`${scrambled.toUpperCase()}\`\n\n📌 خمّن الكلمة!\n||**الإجابة:** \`${word}\`||`);
        }
    },
    // ─── محاكاة رمي نرد متعدد ────────────────────────────
    {
        name: 'roll',
        aliases: ['rolldice', 'diceroll', 'rd'],
        description: 'رمي عدة نرد في نفس الوقت',
        category: 'مرح',
        execute(message, args, commandManager) {
            // Format: !roll 3d6 or !roll 2d20
            const input = args[1] || '2d6';
            const match = input.match(/^(\d+)d(\d+)$/i);
            if (!match) return message.reply(`❌ الصيغة: \`${commandManager.getMainPrefix()}roll <عدد>d<وجوه>\`\nمثال: \`!roll 2d6\` أو \`!roll 3d20\``);
            const count = Math.min(parseInt(match[1]), 10);
            const sides = Math.min(parseInt(match[2]), 1000);
            if (count < 1 || sides < 2) return message.reply('❌ عدد نرد 1-10، وجوه 2-1000');
            const results = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
            const total = results.reduce((a, b) => a + b, 0);
            const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
            const emoji = sides === 6 ? results.map(r => faces[r-1]).join(' ') : '🎲'.repeat(count);
            message.reply(`**🎲 رمي ${count}d${sides}:**\n${emoji}\n${results.join(' + ')} = **${total}**\n📊 معدّل: ${(total/count).toFixed(1)} | الحد الأقصى: ${count*sides}`);
        }
    },
    // ─── نسبة التوافق ─────────────────────────────────────
    {
        name: 'compat',
        aliases: ['compatibility', 'match', 'توافق'],
        description: 'نسبة التوافق بين شخصين أو شيئين',
        category: 'مرح',
        execute(message, args, commandManager) {
            const text = args.slice(1).join(' ');
            if (!text.includes('|')) return message.reply(`❌ الصيغة: \`${commandManager.getMainPrefix()}compat اسم1 | اسم2\``);
            const [a, b] = text.split('|').map(s => s.trim());
            if (!a || !b) return message.reply('❌ لازم اسمين!');
            const seed = (a + b).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
            const pct = (seed * 13 + 17) % 101;
            const bar = '█'.repeat(Math.floor(pct/10)) + '░'.repeat(10-Math.floor(pct/10));
            const msg = pct >= 90 ? '💞 توافق مثالي!' : pct >= 70 ? '💕 توافق ممتاز!' : pct >= 50 ? '🤝 توافق كويس' : pct >= 30 ? '😅 فيه فرصة' : '💔 الجمع مش مناسب';
            message.reply(`**💫 مقياس التوافق**\n\n✨ **${a}** × **${b}**\n\n[${bar}] **${pct}%**\n\n${msg}`);
        }
    },
    // ─── محاكاة حظ اليانصيب ──────────────────────────────
    {
        name: 'lottery',
        aliases: ['lotto', 'يانصيب', 'jackpot'],
        description: 'محاكاة تذكرة يانصيب',
        category: 'مرح',
        execute(message, args, commandManager) {
            const nums = Array.from({ length: 6 }, () => Math.floor(Math.random() * 49) + 1);
            const bonus = Math.floor(Math.random() * 10) + 1;
            const sorted = [...nums].sort((a, b) => a - b);
            const display = sorted.map(n => `\`${String(n).padStart(2,'0')}\``).join(' ');
            const bonusDisplay = `\`✨${String(bonus).padStart(2,'0')}\``;
            message.reply(`**🎰 تذكرة يانصيب عشوائية!**\n\n${display} + ${bonusDisplay}\n\n🍀 بالحظ السعيد!`);
        }
    }
];
