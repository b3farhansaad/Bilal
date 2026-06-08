// أوامر متقدمة وأسطورية ✨
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

function httpGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { resolve(data); }
            });
        }).on('error', reject);
    });
}

module.exports = [
    // ─── معلومات المستخدم المتقدمة ────────────────────────
    {
        name: 'avatar',
        description: 'جيب أفاتار مستخدم',
        category: 'أدوات',
        async execute(message, args, commandManager) {
            const mention = message.mentions?.users?.first();
            const target = mention || message.client.user;
            const url = target.displayAvatarURL({ dynamic: true, size: 4096 });
            const urlPng = target.displayAvatarURL({ format: 'png', size: 4096 });
            message.reply(`🖼️ **أفاتار ${target.username}:**\n🔗 WebP: ${url}\n🔗 PNG: ${urlPng}`);
        }
    },
    {
        name: 'serverinfo',
        description: 'معلومات السيرفر',
        category: 'أدوات',
        execute(message, args, commandManager) {
            const guild = message.guild;
            if (!guild) return message.reply('❌ هذا الأمر يعمل في السيرفرات فقط.');
            const created = new Date(guild.createdTimestamp).toLocaleDateString('ar-EG');
            const boost = guild.premiumTier ? `Tier ${guild.premiumTier} (${guild.premiumSubscriptionCount} boost)` : 'مفيش';
            message.reply(`
**🏰 معلومات السيرفر**

🏷️ الاسم: **${guild.name}**
🆔 الـ ID: \`${guild.id}\`
👑 الأونر: \`${guild.ownerId}\`
📅 تاريخ الإنشاء: \`${created}\`
👥 الأعضاء: \`${guild.memberCount}\`
💬 الشاتات: \`${guild.channels.cache.size}\`
🎭 الرولز: \`${guild.roles.cache.size}\`
😊 الإيموجيز: \`${guild.emojis.cache.size}\`
🚀 البوست: \`${boost}\`
🌐 المنطقة: \`${guild.preferredLocale || 'عالمي'}\``);
        }
    },
    {
        name: 'roleinfo',
        description: 'معلومات رول معين',
        category: 'أدوات',
        execute(message, args, commandManager) {
            if (!message.guild) return message.reply('❌ هذا الأمر يعمل في السيرفرات فقط.');
            const roleName = args.slice(1).join(' ');
            if (!roleName) return message.reply('❌ الصيغة: `!roleinfo <اسم الرول>`');
            const role = message.guild.roles.cache.find(r => r.name.toLowerCase().includes(roleName.toLowerCase()));
            if (!role) return message.reply(`❌ مش لاقي رول باسم: \`${roleName}\``);
            const created = new Date(role.createdTimestamp).toLocaleDateString('ar-EG');
            const perms = role.permissions.toArray().slice(0, 5).join(', ') || 'مفيش';
            message.reply(`
**🎭 معلومات الرول**

🏷️ الاسم: **${role.name}**
🆔 الـ ID: \`${role.id}\`
🎨 اللون: \`${role.hexColor}\`
📅 الإنشاء: \`${created}\`
👥 الأعضاء: \`${role.members.size}\`
📌 مثبّت: ${role.hoist ? '✅' : '❌'}
🏆 الموقع: \`${role.position}\`
🔑 صلاحيات (أول 5): \`${perms}\``);
        }
    },

    // ─── أدوات الأمان ──────────────────────────────────────
    {
        name: 'password',
        description: 'توليد كلمة مرور آمنة',
        category: 'أدوات',
        execute(message, args, commandManager) {
            const length = parseInt(args[1]) || 16;
            if (length < 4 || length > 128) return message.reply('❌ الطول لازم يكون بين 4 و 128.');
            const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
            const bytes = crypto.randomBytes(length);
            const password = Array.from(bytes).map(b => charset[b % charset.length]).join('');
            const strength = length >= 20 ? '🟢 قوية جداً' : length >= 12 ? '🟡 قوية' : '🔴 ضعيفة';
            message.reply(`🔐 **كلمة المرور (${length} حرف):**\n\`\`\`\n${password}\n\`\`\`${strength}`);
        }
    },
    {
        name: 'hash',
        description: 'تشفير نص بـ SHA-256',
        category: 'أدوات',
        execute(message, args, commandManager) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ الصيغة: `!hash <النص>`');
            const sha256 = crypto.createHash('sha256').update(text).digest('hex');
            const md5 = crypto.createHash('md5').update(text).digest('hex');
            message.reply(`🔒 **تشفير النص:** \`${text.slice(0, 30)}${text.length > 30 ? '...' : ''}\`\n\n**SHA-256:**\n\`${sha256}\`\n\n**MD5:**\n\`${md5}\``);
        }
    },

    // ─── أدوات المرح ───────────────────────────────────────
    {
        name: 'aesthetic',
        description: 'حول نص لـ aesthetic',
        category: 'مرح',
        execute(message, args, commandManager) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!aesthetic`');
            const result = text.split('').join(' ');
            if (result.length > 1800) return message.reply('❌ النص طويل أوي.');
            message.reply(result);
        }
    },
    {
        name: 'zalgo',
        description: 'حول نص لـ Zalgo مرعب',
        category: 'مرح',
        execute(message, args, commandManager) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!zalgo`');
            const zalgoChars = ['̴','̵','̶','̷','̸','̡','̢','̧','̨','͇','͈','͉','͍','͎','͓','͔','͕','͖','͙','͚'];
            const result = text.split('').map(c => {
                if (c === ' ') return c;
                const count = Math.floor(Math.random() * 4) + 2;
                let z = c;
                for (let i = 0; i < count; i++) z += zalgoChars[Math.floor(Math.random() * zalgoChars.length)];
                return z;
            }).join('');
            if (result.length > 1800) return message.reply('❌ النص طويل أوي.');
            message.reply(result);
        }
    },
    {
        name: 'vaporwave',
        description: 'حول نص لـ vaporwave',
        category: 'مرح',
        execute(message, args, commandManager) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!vaporwave`');
            const map = 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ'.split('');
            const en = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
            const result = text.toUpperCase().split('').map(c => {
                const idx = en.indexOf(c);
                return idx >= 0 ? map[idx] : c === ' ' ? '　' : c;
            }).join('');
            if (result.length > 1800) return message.reply('❌ النص طويل أوي.');
            message.reply(result);
        }
    },
    {
        name: 'small',
        description: 'حول نص لحروف صغيرة unicode',
        category: 'مرح',
        execute(message, args, commandManager) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!small`');
            const normal = 'abcdefghijklmnopqrstuvwxyz0123456789';
            const small  = 'ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖꟷʳˢᵗᵘᵛʷˣʸᶻ⁰¹²³⁴⁵⁶⁷⁸⁹';
            const result = text.toLowerCase().split('').map(c => {
                const idx = normal.indexOf(c);
                return idx >= 0 ? small[idx] : c;
            }).join('');
            message.reply(result);
        }
    },
    {
        name: 'bold',
        description: 'حول نص لـ unicode bold',
        category: 'مرح',
        execute(message, args, commandManager) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!bold`');
            const normal = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const bold   = '𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵';
            const result = text.split('').map(c => {
                const idx = normal.indexOf(c);
                return idx >= 0 ? bold[idx] : c;
            }).join('');
            message.reply(result);
        }
    },

    // ─── مرح وألعاب ────────────────────────────────────────
    {
        name: 'compliment',
        description: 'كومبليمنت عشوائي',
        category: 'مرح',
        execute(message, args, commandManager) {
            const compliments = [
                'أنت شخص رائع وموهوب بشكل لا يُصدق! 🌟',
                'إبداعك لا حدود له، واصل! ✨',
                'الدنيا أحلى بوجودك 💖',
                'أنت نجم في كل اللي بتعمله 🎯',
                'موهبتك فريدة، متوقفش أبداً 🚀',
                'كل يوم بتتحسن وده مش سهل 💪',
                'ذكاؤك واضح في كل حاجة بتعملها 🧠',
                'الحماس اللي عندك ملهم جداً 🔥'
            ];
            const mention = message.mentions?.users?.first();
            const target = mention ? `@${mention.username}` : 'أنت';
            const compliment = compliments[Math.floor(Math.random() * compliments.length)];
            message.reply(`💝 **${target}:** ${compliment}`);
        }
    },
    {
        name: 'insult',
        description: 'شتيمة خفيفة عشوائية',
        category: 'مرح',
        execute(message, args, commandManager) {
            const insults = [
                'يا نعسان 😴', 'يا بتاع الكنبة 🛋️', 'يا تقيل 🐘',
                'يا مسوي إيه في الحياة 🤔', 'يا نينجا النوم 💤',
                'يا كسول من درجة ألفا 🦥', 'يا ماكل نوم 😪'
            ];
            const mention = message.mentions?.users?.first();
            const target = mention ? `@${mention.username}` : 'أنت';
            const insult = insults[Math.floor(Math.random() * insults.length)];
            message.reply(`😤 **${target}** ${insult}`);
        }
    },
    {
        name: 'love',
        description: 'احسب نسبة الحب 💕',
        category: 'مرح',
        execute(message, args, commandManager) {
            const name1 = args[1] || message.author.username;
            const name2 = args[2] || 'Discord';
            const seed = (name1 + name2).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
            const percent = ((seed * 7 + 13) % 101);
            const hearts = percent >= 80 ? '💖💖💖💖💖' : percent >= 60 ? '💕💕💕💕' : percent >= 40 ? '💝💝💝' : percent >= 20 ? '💔💔' : '💀';
            message.reply(`💘 **${name1}** ❤️ **${name2}**\n\n${hearts}\n**${percent}%** نسبة الحب!\n${'█'.repeat(Math.floor(percent / 10))}${'░'.repeat(10 - Math.floor(percent / 10))} ${percent}%`);
        }
    },
    {
        name: 'rate',
        description: 'قيّم أي حاجة',
        category: 'مرح',
        execute(message, args, commandManager) {
            const thing = args.slice(1).join(' ');
            if (!thing) return message.reply('❌ الصيغة: `!rate <حاجة>`');
            const seed = thing.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
            const rating = (seed * 3 + 7) % 11;
            const bars = '█'.repeat(rating) + '░'.repeat(10 - rating);
            const emojis = ['💀', '😭', '😬', '😕', '🙂', '😊', '👍', '🌟', '🔥', '💯', '⭐'];
            message.reply(`📊 **تقييم:** \`${thing}\`\n${bars} **${rating}/10** ${emojis[rating]}`);
        }
    },

    // ─── أدوات نصية ────────────────────────────────────────
    {
        name: 'pigify',
        description: 'حول نص لـ Pig Latin',
        category: 'مرح',
        execute(message, args, commandManager) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!pigify`');
            const vowels = 'aeiouAEIOU';
            const result = text.split(' ').map(word => {
                if (!word.match(/[a-zA-Z]/)) return word;
                if (vowels.includes(word[0])) return word + 'yay';
                let i = 0;
                while (i < word.length && !vowels.includes(word[i])) i++;
                return word.slice(i) + word.slice(0, i) + 'ay';
            }).join(' ');
            message.reply(`🐷 ${result}`);
        }
    },
    {
        name: 'binary',
        description: 'حول نص لـ binary',
        category: 'أدوات',
        execute(message, args, commandManager) {
            const sub = args[1]?.toLowerCase();
            const text = args.slice(2).join(' ') || args.slice(1).join(' ');
            if (!text) return message.reply('❌ الصيغة: `!binary <نص>` أو `!binary decode <بايناري>`');
            if (sub === 'decode') {
                try {
                    const decoded = args.slice(2).join('').split(' ')
                        .map(b => String.fromCharCode(parseInt(b, 2))).join('');
                    return message.reply(`🔓 **المفكوك:** \`${decoded}\``);
                } catch {
                    return message.reply('❌ البايناري مش صح.');
                }
            }
            const result = args.slice(1).join(' ').split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
            if (result.length > 1800) return message.reply('❌ النص طويل أوي.');
            message.reply(`💻 **Binary:**\n\`${result}\``);
        }
    },

    // ─── الإعداد والمساعدة ─────────────────────────────────
    {
        name: 'setup',
        description: 'مساعدة في إعداد البوت',
        category: 'نظام',
        execute(message, args, commandManager) {
            const userId = message.author.id;
            const prefix = commandManager.getMainPrefix();
            const isAllowed = commandManager.isAllowedUser(userId);
            const tokenSet = !!process.env.DISCORD_TOKEN;
            const geminiSet = !!process.env.GEMINI_API_KEY;

            const steps = [
                `${tokenSet ? '✅' : '❌'} Discord Token في ملف .env`,
                `${geminiSet ? '✅' : '❌'} Gemini API Key في ملف .env`,
                `${isAllowed ? '✅' : '❌'} ID حسابك في allowedUserIds (ID الحالي: \`${userId}\`)`,
            ];

            let extra = '';
            if (!isAllowed) {
                extra = `\n\n⚠️ **مهم:** أضف ID الحسابك للـ config.json:\n\`"allowedUserIds": ["${userId}"]\``;
            }

            message.reply(`**⚙️ حالة الإعداد:**\n${steps.join('\n')}${extra}\n\n📌 البادئة الحالية: \`${prefix}\`\n💡 استخدم \`${prefix}help\` لشوف الأوامر.`);
        }
    },
    {
        name: 'myid',
        description: 'اعرف الـ Discord ID بتاعك',
        category: 'نظام',
        execute(message, args, commandManager) {
            message.reply(`🆔 **ID حسابك:** \`${message.author.id}\`\n🏷️ **التاج:** \`${message.author.tag}\``);
        }
    }
];
