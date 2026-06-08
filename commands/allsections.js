'use strict';
// ╔══════════════════════════════════════════════════════════════════╗
// ║   allsections.js — أوامر إضافية لكل الأقسام — Snodix Control   ║
// ╚══════════════════════════════════════════════════════════════════╝
const https  = require('https');
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');

const sleep  = ms => new Promise(r => setTimeout(r, ms));
const pick   = arr => arr[Math.floor(Math.random() * arr.length)];
const DATA   = path.join(__dirname, '../data');
function jLoad(f, d) { try { const p = path.join(DATA, f); if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p,'utf8')); } catch {} return d; }
function jSave(f, d) { try { fs.mkdirSync(DATA,{recursive:true}); fs.writeFileSync(path.join(DATA,f), JSON.stringify(d,null,2)); } catch {} }

function discordAPI(token,method,p,body){return new Promise((res,rej)=>{const d=body?JSON.stringify(body):null;const req=https.request({hostname:'discord.com',path:'/api/v9'+p,method,headers:{'Authorization':token,'Content-Type':'application/json','User-Agent':'Mozilla/5.0',...(d?{'Content-Length':Buffer.byteLength(d)}:{})},timeout:8000},(r)=>{let data='';r.on('data',c=>data+=c);r.on('end',()=>{try{res({status:r.statusCode,data:JSON.parse(data)});}catch{res({status:r.statusCode,data:{}});}});});req.on('error',rej);req.on('timeout',()=>{req.destroy();rej(new Error('timeout'));});if(d)req.write(d);req.end();});}

module.exports = [

    // ══════════════════════════════════════════════════════════════
    // قسم 1 — السبام والنشر (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'pingspam', aliases: ['pspam', 'منشن_سبام'],
        description: 'منشن شخص عدد مرات', category: 'نشر',
        async execute(message, args, cm) {
            const user = message.mentions?.users?.first();
            const count = Math.min(parseInt(args[2]) || 3, 10);
            if (!user) return message.reply('❌ `' + cm.getMainPrefix() + 'pingspam @يوزر <عدد>`');
            await message.delete().catch(()=>{});
            for (let i = 0; i < count; i++) {
                await message.channel.send('<@' + user.id + '>').catch(()=>{});
                await sleep(700);
            }
        }
    },
    {
        name: 'sendfile', aliases: ['fileshare', 'ارسل_ملف'],
        description: 'إرسال ملف نصي من البوت', category: 'نشر',
        async execute(message, args, cm) {
            const name = args[1];
            const content = args.slice(2).join(' ');
            if (!name || !content) return message.reply('❌ `' + cm.getMainPrefix() + 'sendfile <اسم_الملف.txt> <المحتوى>`');
            const tmpPath = path.join(os.tmpdir(), name.replace(/[^a-zA-Z0-9._-]/g, '_'));
            fs.writeFileSync(tmpPath, content, 'utf8');
            try {
                await message.channel.send({ files: [tmpPath] });
                await message.delete().catch(()=>{});
            } catch(e) { message.reply('❌ فشل: `' + e.message + '`'); }
            finally { try { fs.unlinkSync(tmpPath); } catch {} }
        }
    },
    {
        name: 'linksend', aliases: ['sendlink', 'ارسل_رابط'],
        description: 'إرسال رابط مع عنوان مخصص', category: 'نشر',
        async execute(message, args, cm) {
            const title = args[1];
            const url = args[2];
            if (!title || !url) return message.reply('❌ `' + cm.getMainPrefix() + 'linksend <العنوان> <الرابط>`');
            await message.delete().catch(()=>{});
            await message.channel.send('**' + title + '**\n' + url);
        }
    },
    {
        name: 'announce', aliases: ['إعلان', 'اعلان'],
        description: 'إرسال إعلان منسق احترافي', category: 'نشر',
        async execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'announce <النص>`');
            await message.delete().catch(()=>{});
            const line = '━'.repeat(30);
            await message.channel.send('**' + line + '**\n📢 **إعلان**\n\n' + text + '\n**' + line + '**');
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 2 — الحساب والمعلومات (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'accountcheck', aliases: ['acccheck', 'checkaccount', 'فحص_حساب'],
        description: 'فحص حالة الحساب ومعلوماته الأساسية', category: 'حساب',
        async execute(message, args, cm) {
            const msg = await message.reply('🔍 جاري فحص الحساب...');
            try {
                const token = message.client.token;
                const { data, status } = await discordAPI(token, 'GET', '/users/@me');
                if (!data.id) return msg.edit('❌ فشل الاتصال. Status: ' + status);
                const nitroMap = { 0: '❌ لا يوجد', 1: '📦 Classic', 2: '💎 Nitro', 3: '🌟 Basic' };
                const age = Math.floor((Date.now() - Number((BigInt(data.id) >> 22n) + 1420070400000n)) / 86400000);
                await msg.edit([
                    '**🔎 فحص الحساب**',
                    '```',
                    '👤 الاسم     : ' + data.username,
                    '🆔 الـ ID    : ' + data.id,
                    '📅 عمر الحساب: ' + age + ' يوم',
                    '📧 الإيميل  : ' + (data.email || 'غير متاح'),
                    '📱 2FA       : ' + (data.mfa_enabled ? '✅ مفعّل' : '❌ معطّل'),
                    '💳 نيترو    : ' + (nitroMap[data.premium_type] || '❌ لا يوجد'),
                    '🌍 المنطقة  : ' + (data.locale || 'غير محدد'),
                    '✅ الحساب نشط ومتصل',
                    '```'
                ].join('\n'));
            } catch (e) { await msg.edit('❌ **خطأ:** `' + e.message + '`'); }
        }
    },
    {
        name: 'setavatar', aliases: ['changeavatar', 'avatar_set', 'غير_صورة'],
        description: 'تغيير صورة البروفايل عبر رابط صورة', category: 'حساب',
        async execute(message, args, cm) {
            const url = args[1];
            if (!url) return message.reply('❌ `' + cm.getMainPrefix() + 'setavatar <رابط_الصورة>`');
            const msg = await message.reply('🖼️ جاري تغيير الصورة...');
            try {
                await message.client.user.setAvatar(url);
                await msg.edit('✅ **تم تغيير صورة البروفايل بنجاح!**');
            } catch (e) { await msg.edit('❌ فشل: `' + e.message + '`\n⚠️ تأكد أن الرابط صورة PNG/JPG مباشرة'); }
        }
    },
    {
        name: 'mybadges', aliases: ['badges3', 'بادجات'],
        description: 'عرض بادجاتك وشاراتك بالتفصيل', category: 'حساب',
        async execute(message) {
            const token = message.client.token;
            try {
                const { data } = await discordAPI(token, 'GET', '/users/@me');
                const f = data.flags || 0;
                const badges = [];
                if (f & 1)       badges.push('👨‍💼 Discord Staff');
                if (f & 2)       badges.push('🤝 Partnered Server Owner');
                if (f & 4)       badges.push('🏅 HypeSquad Events');
                if (f & 8)       badges.push('🐛 Bug Hunter Level 1');
                if (f & 64)      badges.push('🏠 HypeSquad Bravery');
                if (f & 128)     badges.push('🏠 HypeSquad Brilliance');
                if (f & 256)     badges.push('🏠 HypeSquad Balance');
                if (f & 512)     badges.push('⭐ Early Supporter');
                if (f & 16384)   badges.push('🐛 Bug Hunter Level 2');
                if (f & 131072)  badges.push('👾 Early Verified Bot Developer');
                if (f & 4194304) badges.push('🛡️ Active Developer');
                if (data.premium_type === 2) badges.push('💎 Nitro Subscriber');
                const txt = badges.length ? badges.join('\n') : '❌ لا يوجد شارات';
                message.reply('**🏆 شاراتك وبادجاتك:**\n```\n' + txt + '\n```\n📊 إجمالي: **' + badges.length + '** شارة');
            } catch (e) { message.reply('❌ فشل: `' + e.message + '`'); }
        }
    },
    {
        name: 'setglobalnick', aliases: ['globalnick', 'نيك_عام'],
        description: 'تغيير نيكك في كل السيرفرات دفعة واحدة', category: 'حساب',
        async execute(message, args, cm) {
            const nick = args.slice(1).join(' ') || null;
            const msg = await message.reply('✏️ جاري تغيير النيك في كل السيرفرات...');
            let done = 0, failed = 0;
            for (const guild of message.client.guilds.cache.values()) {
                try {
                    const me = guild.members.cache.get(message.client.user.id);
                    if (me) { await me.setNickname(nick); done++; }
                } catch { failed++; }
                await sleep(700);
            }
            await msg.edit('✅ **تم تغيير النيك في ' + done + ' سيرفر**' + (failed ? '\n❌ فشل في ' + failed + ' سيرفر' : ''));
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 3 — السيرفرات (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'countservers', aliases: ['servercount', 'عدد_السيرفرات'],
        description: 'عدد كل السيرفرات مع الإحصائيات', category: 'سيرفر',
        execute(message) {
            const guilds = message.client.guilds.cache;
            const total = guilds.size;
            const totalMembers = guilds.reduce((s, g) => s + g.memberCount, 0);
            const biggest = [...guilds.values()].sort((a,b) => b.memberCount - a.memberCount).slice(0, 3);
            let txt = '**🌐 إحصائيات السيرفرات**\n```\n📊 إجمالي السيرفرات : ' + total + '\n👥 إجمالي الأعضاء  : ' + totalMembers.toLocaleString() + '\n```\n**🏆 أكبر 3 سيرفرات:**\n';
            biggest.forEach((g, i) => txt += (i+1) + '. **' + g.name + '** — ' + g.memberCount.toLocaleString() + ' عضو\n');
            message.reply(txt);
        }
    },
    {
        name: 'leaveall', aliases: ['leaveallservers', 'اترك_كل'],
        description: 'مغادرة كل السيرفرات (مع تأكيد)', category: 'سيرفر',
        async execute(message, args, cm) {
            if (args[1] !== 'confirm') return message.reply('⚠️ **هذا الأمر سيغادر كل السيرفرات!**\n`' + cm.getMainPrefix() + 'leaveall confirm` للتأكيد');
            const guilds = [...message.client.guilds.cache.values()].filter(g => g.ownerId !== message.client.user.id);
            const msg = await message.reply('🚪 جاري مغادرة ' + guilds.length + ' سيرفر...');
            let left = 0;
            for (const g of guilds) {
                try { await g.leave(); left++; } catch {}
                await sleep(800);
            }
            await msg.edit('✅ **غادرت ' + left + ' سيرفر بنجاح.**').catch(()=>{});
        }
    },
    {
        name: 'serveremojis', aliases: ['emojis2', 'ايموجيات_سيرفر'],
        description: 'قائمة كل إيموجيات السيرفر', category: 'سيرفر',
        execute(message) {
            if (!message.guild) return message.reply('❌ في السيرفرات فقط.');
            const emojis = message.guild.emojis.cache;
            if (!emojis.size) return message.reply('❌ لا يوجد إيموجيات مخصصة.');
            const list = [...emojis.values()].slice(0, 30).map(e => '<' + (e.animated ? 'a' : '') + ':' + e.name + ':' + e.id + '>').join(' ');
            message.reply('**😊 إيموجيات ' + message.guild.name + ' (' + emojis.size + '):**\n' + list + (emojis.size > 30 ? '\n... و ' + (emojis.size - 30) + ' أكتر' : ''));
        }
    },
    {
        name: 'serverroles', aliases: ['roles2', 'رتب_سيرفر'],
        description: 'قائمة كل رتب السيرفر مع الألوان', category: 'سيرفر',
        execute(message) {
            if (!message.guild) return message.reply('❌ في السيرفرات فقط.');
            const roles = [...message.guild.roles.cache.values()]
                .filter(r => r.name !== '@everyone')
                .sort((a, b) => b.position - a.position)
                .slice(0, 20);
            if (!roles.length) return message.reply('❌ لا توجد رتب.');
            let txt = '**🎭 رتب ' + message.guild.name + ' (' + message.guild.roles.cache.size + '):**\n```\n';
            roles.forEach(r => txt += r.name + ' — ' + (r.hexColor !== '#000000' ? r.hexColor : 'بدون لون') + ' — ' + r.members.size + ' عضو\n');
            message.reply(txt + '```');
        }
    },
    {
        name: 'serverinvite', aliases: ['getinvite', 'انشاء_دعوة'],
        description: 'إنشاء كود دعوة للسيرفر الحالي', category: 'سيرفر',
        async execute(message, args, cm) {
            if (!message.guild) return message.reply('❌ في السيرفرات فقط.');
            const maxAge = parseInt(args[1]) || 86400;
            const maxUses = parseInt(args[2]) || 0;
            try {
                const invite = await message.channel.createInvite({ maxAge, maxUses, unique: true });
                message.reply('**🔗 كود الدعوة الجديد:**\nhttps://discord.gg/' + invite.code + '\n⏰ ينتهي بعد: ' + (maxAge === 0 ? 'لا ينتهي' : (maxAge / 3600) + ' ساعة') + '\n🔢 الاستخدامات: ' + (maxUses === 0 ? 'غير محدود' : maxUses));
            } catch (e) { message.reply('❌ فشل: `' + e.message + '`'); }
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 4 — إدارة السيرفر (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'mentionall', aliases: ['pingall', 'منشن_كل'],
        description: 'منشن كل الأعضاء الأونلاين (حد أقصى 10)', category: 'إدارة',
        async execute(message, args, cm) {
            if (!message.guild) return message.reply('❌ في السيرفرات فقط.');
            const online = [...message.guild.members.cache.values()]
                .filter(m => m.presence?.status === 'online' && !m.user.bot && m.id !== message.client.user.id)
                .slice(0, 10);
            if (!online.length) return message.reply('❌ لا يوجد أعضاء أونلاين الآن.');
            const mentions = online.map(m => '<@' + m.id + '>').join(' ');
            const prefix = args.slice(1).join(' ') || '👋';
            await message.delete().catch(()=>{});
            await message.channel.send(prefix + ' ' + mentions);
        }
    },
    {
        name: 'massrole', aliases: ['rolemass', 'رول_جماعي'],
        description: 'إعطاء رتبة لعدة أعضاء دفعة', category: 'إدارة',
        async execute(message, args, cm) {
            if (!message.guild) return message.reply('❌ في السيرفرات فقط.');
            const roleName = args[1];
            const ids = args.slice(2);
            if (!roleName || !ids.length) return message.reply('❌ `' + cm.getMainPrefix() + 'massrole <الرتبة> <id1> <id2>...`');
            const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
            if (!role) return message.reply('❌ الرتبة غير موجودة.');
            const msg = await message.reply('⚙️ جاري إضافة الرتبة لـ ' + ids.length + ' عضو...');
            let done = 0;
            for (const id of ids) {
                try { const m = message.guild.members.cache.get(id); if (m) { await m.roles.add(role); done++; } } catch {}
                await sleep(600);
            }
            await msg.edit('✅ تم إعطاء **' + role.name + '** لـ **' + done + '** عضو.');
        }
    },
    {
        name: 'clearmymsg', aliases: ['deletemymsgs', 'مسح_رسائلي'],
        description: 'مسح كل رسائلك في القناة الحالية (حتى 100)', category: 'إدارة',
        async execute(message) {
            const msg = await message.reply('🗑️ جاري مسح رسائلك...');
            let deleted = 0;
            try {
                const messages = await message.channel.messages.fetch({ limit: 100 });
                const mine = [...messages.values()].filter(m => m.author.id === message.client.user.id && m.id !== msg.id);
                for (const m of mine) { try { await m.delete(); deleted++; } catch {} await sleep(300); }
                await msg.edit('✅ تم مسح **' + deleted + '** رسالة.').catch(()=>{});
                setTimeout(() => msg.delete().catch(()=>{}), 3000);
            } catch (e) { await msg.edit('❌ ' + e.message); }
        }
    },
    {
        name: 'voicelist', aliases: ['vclist', 'روومات_صوتية'],
        description: 'قائمة الروومات الصوتية وأعضاءها', category: 'إدارة',
        execute(message) {
            if (!message.guild) return message.reply('❌ في السيرفرات فقط.');
            const vcs = message.guild.channels.cache.filter(c => c.type === 'GUILD_VOICE');
            if (!vcs.size) return message.reply('❌ لا توجد روومات صوتية.');
            let txt = '**🔊 الروومات الصوتية في ' + message.guild.name + ':**\n';
            vcs.forEach(vc => {
                txt += '\n📢 **' + vc.name + '** (' + vc.members.size + '/' + (vc.userLimit || '∞') + ')\n';
                if (vc.members.size) vc.members.forEach(m => txt += '   └ ' + m.user.username + '\n');
            });
            message.reply(txt.slice(0, 1900));
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 5 — الأمان والحماية (جديد)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'antibot', aliases: ['blockbots', 'حماية_بوت'],
        description: 'قائمة البوتات في السيرفر', category: 'حماية',
        execute(message) {
            if (!message.guild) return message.reply('❌ في السيرفرات فقط.');
            const bots = message.guild.members.cache.filter(m => m.user.bot);
            if (!bots.size) return message.reply('✅ لا يوجد بوتات في هذا السيرفر.');
            let txt = '**🤖 البوتات في ' + message.guild.name + ' (' + bots.size + '):**\n```\n';
            [...bots.values()].slice(0, 20).forEach(b => txt += b.user.username + ' — ID: ' + b.id + '\n');
            message.reply(txt + '```');
        }
    },
    {
        name: 'securitycheck', aliases: ['seccheck', 'فحص_امان'],
        description: 'فحص أمان حسابك الشامل', category: 'حماية',
        async execute(message) {
            const msg = await message.reply('🔐 جاري فحص الأمان...');
            try {
                const token = message.client.token;
                const { data } = await discordAPI(token, 'GET', '/users/@me');
                let score = 0, tips = [];
                if (data.mfa_enabled) { score += 30; } else { tips.push('⚠️ فعّل المصادقة الثنائية (2FA)'); }
                if (data.email) { score += 20; } else { tips.push('⚠️ أضف بريد إلكتروني للحساب'); }
                if (data.verified) { score += 20; } else { tips.push('⚠️ فعّل البريد الإلكتروني'); }
                if (data.premium_type > 0) score += 10;
                const age = Math.floor((Date.now() - Number((BigInt(data.id) >> 22n) + 1420070400000n)) / 86400000);
                if (age > 365) score += 20; else if (age > 30) score += 10; else tips.push('⚠️ حساب جديد (أقل من شهر)');
                const level = score >= 70 ? '🟢 آمن' : score >= 40 ? '🟡 متوسط' : '🔴 ضعيف';
                await msg.edit([
                    '**🔐 تقرير الأمان**',
                    '```',
                    '📊 درجة الأمان : ' + score + '/100 ' + level,
                    '👤 الاسم       : ' + data.username,
                    '📱 2FA         : ' + (data.mfa_enabled ? '✅ مفعّل' : '❌ معطّل'),
                    '📧 إيميل       : ' + (data.email ? '✅ موجود' : '❌ غير موجود'),
                    '✅ تحقق        : ' + (data.verified ? '✅ مفعّل' : '❌ غير مفعّل'),
                    '📅 عمر الحساب : ' + age + ' يوم',
                    '```',
                    tips.length ? '\n**💡 توصيات:**\n' + tips.join('\n') : '✅ حسابك بوضع جيد!'
                ].join('\n'));
            } catch (e) { await msg.edit('❌ فشل: `' + e.message + '`'); }
        }
    },
    {
        name: 'encryptmsg', aliases: ['encrypt2', 'تشفير'],
        description: 'تشفير رسالة بكلمة مرور', category: 'حماية',
        execute(message, args, cm) {
            const pass = args[1];
            const text = args.slice(2).join(' ');
            if (!pass || !text) return message.reply('❌ `' + cm.getMainPrefix() + 'encryptmsg <كلمة_المرور> <النص>`');
            try {
                const key = crypto.scryptSync(pass, 'salt', 32);
                const iv = crypto.randomBytes(16);
                const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
                const encrypted = Buffer.concat([cipher.update(text,'utf8'), cipher.final()]);
                const result = iv.toString('hex') + ':' + encrypted.toString('hex');
                message.reply('**🔐 نص مشفّر:**\n```\n' + result + '\n```\n> استخدم `' + cm.getMainPrefix() + 'decryptmsg <كلمة_المرور> <النص_المشفر>` لفكه');
            } catch { message.reply('❌ فشل التشفير.'); }
        }
    },
    {
        name: 'decryptmsg', aliases: ['decrypt2', 'فك_تشفير'],
        description: 'فك تشفير رسالة مشفّرة', category: 'حماية',
        execute(message, args, cm) {
            const pass = args[1];
            const enc = args[2];
            if (!pass || !enc) return message.reply('❌ `' + cm.getMainPrefix() + 'decryptmsg <كلمة_المرور> <النص_المشفر>`');
            try {
                const [ivHex, encHex] = enc.split(':');
                const key = crypto.scryptSync(pass, 'salt', 32);
                const iv = Buffer.from(ivHex, 'hex');
                const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
                const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex,'hex')), decipher.final()]);
                message.reply('**🔓 النص المفكوك:**\n```\n' + decrypted.toString('utf8') + '\n```');
            } catch { message.reply('❌ كلمة المرور غير صحيحة أو النص تالف.'); }
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 6 — الأصدقاء (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'friendscount', aliases: ['fcount', 'عدد_اصدقاء'],
        description: 'إحصائيات علاقاتك بالأرقام', category: 'أصدقاء',
        async execute(message) {
            const msg = await message.reply('👥 جاري جلب الإحصائيات...');
            try {
                const { data } = await discordAPI(message.client.token, 'GET', '/users/@me/relationships');
                if (!Array.isArray(data)) return msg.edit('❌ فشل الجلب.');
                const fr = data.filter(r=>r.type===1), inc = data.filter(r=>r.type===3);
                const out = data.filter(r=>r.type===4), bl = data.filter(r=>r.type===2);
                const online = fr.filter(r => r.user?.presence?.status === 'online' || false);
                await msg.edit([
                    '**👥 إحصائيات علاقاتك**',
                    '```',
                    '✅ أصدقاء      : ' + fr.length,
                    '📨 طلبات واردة : ' + inc.length,
                    '📤 طلبات صادرة : ' + out.length,
                    '🚫 محجوبين     : ' + bl.length,
                    '─────────────',
                    '📊 المجموع     : ' + data.length,
                    '```'
                ].join('\n'));
            } catch (e) { await msg.edit('❌ ' + e.message); }
        }
    },
    {
        name: 'senddm', aliases: ['dmid', 'سند_دم'],
        description: 'إرسال DM لشخص عبر الـ ID', category: 'أصدقاء',
        async execute(message, args, cm) {
            const userId = args[1];
            const text = args.slice(2).join(' ');
            if (!userId || !text) return message.reply('❌ `' + cm.getMainPrefix() + 'senddm <user_id> <الرسالة>`');
            const msg = await message.reply('📨 جاري الإرسال...');
            try {
                const user = await message.client.users.fetch(userId);
                const dm = await user.createDM();
                await dm.send(text);
                await msg.edit('✅ **تم إرسال الرسالة لـ ' + user.username + '!**');
            } catch (e) { await msg.edit('❌ فشل: `' + e.message + '`'); }
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 7 — الذكاء الاصطناعي (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'aihelp', aliases: ['ai_help', 'مساعدة_AI'],
        description: 'قائمة كل أوامر الذكاء الاصطناعي', category: 'ذكاء اصطناعي',
        execute(message, args, cm) {
            const p = cm.getMainPrefix();
            const cmds = [
                ['chat <رسالة>', 'دردشة مع AI'],
                ['ask <سؤال>', 'اسأل AI سؤالاً'],
                ['explain <موضوع>', 'شرح مفهوم'],
                ['poem [موضوع]', 'قصيدة عربية'],
                ['summarize <نص>', 'تلخيص نص'],
                ['roastai [@يوزر]', 'روست ذكي'],
                ['aistory [موضوع]', 'قصة قصيرة'],
                ['rewrite [أسلوب] <نص>', 'إعادة صياغة'],
                ['aitranslate <لغة> <نص>', 'ترجمة'],
                ['aicode <طلب>', 'كتابة كود'],
                ['aiadvice <موقف>', 'نصيحة'],
                ['aijoke [موضوع]', 'نكتة'],
                ['airiddle', 'لغز'],
                ['aimood <نص>', 'تحليل مشاعر'],
                ['aifix <نص>', 'تصحيح إملائي'],
                ['aiclear', 'مسح التاريخ'],
                ['ai on/off', 'تفعيل/تعطيل AI'],
            ];
            let txt = '**🤖 أوامر الذكاء الاصطناعي:**\n```\n';
            cmds.forEach(([cmd, desc]) => txt += p + cmd + ' — ' + desc + '\n');
            message.reply(txt + '```');
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 8 — الألعاب (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'coinflip', aliases: ['coin', 'flip4', 'عملة'],
        description: 'رمي عملة وحدة بمكافأة', category: 'ألعاب',
        execute(message) {
            const result = Math.random() < 0.5 ? 'صورة 🦅' : 'كتابة 📜';
            const lucky = Math.random() < 0.05;
            let txt = '🪙 **رمي العملة!**\n\n**النتيجة: ' + result + '**';
            if (lucky) txt += '\n\n🌟 **LUCKY SPIN! +100 نقطة خيالية!**';
            message.reply(txt);
        }
    },
    {
        name: 'diceroll', aliases: ['rolldice', 'dice4', 'نرد'],
        description: 'رمي نرد مخصص (مثال: 2d6)', category: 'ألعاب',
        execute(message, args, cm) {
            const input = args[1] || '1d6';
            const match = input.match(/^(\d+)d(\d+)$/i);
            if (!match) return message.reply('❌ `' + cm.getMainPrefix() + 'diceroll 2d6` (عدد × نوع النرد)');
            const count = Math.min(parseInt(match[1]), 20);
            const sides = Math.min(parseInt(match[2]), 100);
            const rolls = Array.from({length: count}, () => Math.floor(Math.random() * sides) + 1);
            const total = rolls.reduce((s, n) => s + n, 0);
            const max = count * sides;
            message.reply([
                '🎲 **نرد ' + count + 'd' + sides + '**',
                '```',
                '🎯 النتائج : ' + rolls.join(' + '),
                '📊 المجموع : ' + total + ' / ' + max,
                '📈 النسبة  : ' + Math.round(total/max*100) + '%',
                '```'
            ].join('\n'));
        }
    },
    {
        name: 'numberguess', aliases: ['nguess', 'خمن_رقم'],
        description: 'لعبة تخمين الأرقام الكلاسيكية', category: 'ألعاب',
        execute(message, args, cm) {
            const guess = parseInt(args[1]);
            const max = parseInt(args[2]) || 100;
            const secret = Math.floor(Math.random() * max) + 1;
            if (!guess || isNaN(guess)) return message.reply('🎯 **خمّن رقماً من 1 إلى ' + max + '**\n`' + cm.getMainPrefix() + 'numberguess <رقمك> [الحد الأقصى]`');
            let result;
            if (guess === secret) result = '🎉 **صح! الرقم كان ' + secret + '!**';
            else if (Math.abs(guess - secret) <= 5) result = '🔥 **قريب جداً!** الرقم ' + (guess < secret ? 'أكبر' : 'أصغر') + ' من ' + guess;
            else result = '❌ **غلط!** الرقم كان **' + secret + '**\n' + (guess < secret ? '📈 كان لازم أكبر' : '📉 كان لازم أصغر');
            message.reply('🎯 **تخمينك: ' + guess + '** | الرقم السري: ' + secret + '\n' + result);
        }
    },
    {
        name: 'rpsbattle', aliases: ['rpsbat', 'حجر_ورق_مقص'],
        description: 'حجر ورق مقص مع إحصائيات', category: 'ألعاب',
        execute(message, args, cm) {
            const choices = { 'حجر': '🪨', 'ورق': '📄', 'مقص': '✂️', 'rock': '🪨', 'paper': '📄', 'scissors': '✂️', 'h': '🪨', 'w': '📄', 'm': '✂️' };
            const keys = ['حجر', 'ورق', 'مقص'];
            const userChoice = args[1]?.toLowerCase();
            if (!userChoice || !choices[userChoice]) return message.reply('✂️ **حجر ورق مقص!**\n`' + cm.getMainPrefix() + 'rpsbattle حجر/ورق/مقص`');
            const botIdx = Math.floor(Math.random() * 3);
            const botChoice = keys[botIdx];
            const userKey = userChoice === 'rock' || userChoice === 'h' ? 'حجر' : userChoice === 'paper' || userChoice === 'w' ? 'ورق' : userChoice === 'scissors' || userChoice === 'm' ? 'مقص' : userChoice;
            const wins = { 'حجر': 'مقص', 'ورق': 'حجر', 'مقص': 'ورق' };
            let result;
            if (userKey === botChoice) result = '🟡 **تعادل!**';
            else if (wins[userKey] === botChoice) result = '🟢 **فزت!**';
            else result = '🔴 **خسرت!**';
            message.reply(choices[userKey] + ' **أنت** vs **البوت** ' + choices[botChoice] + '\n' + result);
        }
    },
    {
        name: 'wheeloffortune', aliases: ['wheel', 'عجلة_الحظ'],
        description: 'عجلة الحظ — اختر من قائمتك', category: 'ألعاب',
        execute(message, args, cm) {
            const items = args.slice(1).join(' ').split('|').map(s => s.trim()).filter(Boolean);
            if (items.length < 2) return message.reply('❌ `' + cm.getMainPrefix() + 'wheeloffortune خيار1 | خيار2 | خيار3`');
            const winner = pick(items);
            message.reply('🎡 **عجلة الحظ تدور...**\n\n🎯 **الفائز:** `' + winner + '`\n\n📋 الخيارات: ' + items.map((x,i) => (x===winner?'**✅ '+x+'**':x)).join(' | '));
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 9 — التفاعلات التلقائية (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'autoecho', aliases: ['echo2', 'رد_تلقائي'],
        description: 'تفعيل/تعطيل ردود الصدى (تكرار رسائل معينة)', category: 'تلقائي',
        execute(message, args, cm) {
            const sub = args[1]?.toLowerCase();
            const p = cm.getMainPrefix();
            const data = jLoad('autoecho.json', {});
            if (sub === 'add') {
                const trigger = args[2]; const reply = args.slice(3).join(' ');
                if (!trigger || !reply) return message.reply('❌ `' + p + 'autoecho add <كلمة> <الرد>`');
                data[trigger.toLowerCase()] = reply;
                jSave('autoecho.json', data);
                return message.reply('✅ تم إضافة رد تلقائي: **' + trigger + '** ← ' + reply);
            }
            if (sub === 'remove') {
                const trigger = args[2];
                if (!trigger || !data[trigger.toLowerCase()]) return message.reply('❌ المحفّز غير موجود.');
                delete data[trigger.toLowerCase()]; jSave('autoecho.json', data);
                return message.reply('✅ تم حذف الرد.');
            }
            if (sub === 'list') {
                const keys = Object.keys(data);
                if (!keys.length) return message.reply('❌ لا يوجد ردود.');
                return message.reply('**🤖 الردود التلقائية (' + keys.length + '):**\n' + keys.map(k => '• `' + k + '` ← ' + data[k]).join('\n'));
            }
            if (sub === 'clear') { jSave('autoecho.json', {}); return message.reply('✅ تم مسح كل الردود.'); }
            message.reply('**🤖 autoecho**\n`' + p + 'autoecho add <كلمة> <رد>` — إضافة\n`' + p + 'autoecho remove <كلمة>` — حذف\n`' + p + 'autoecho list` — عرض\n`' + p + 'autoecho clear` — مسح');
        }
    },
    {
        name: 'selfdelete', aliases: ['autodel3', 'حذف_تلقائي'],
        description: 'إرسال رسالة تحذف نفسها بعد ثواني', category: 'تلقائي',
        async execute(message, args, cm) {
            const secs = Math.min(parseInt(args[1]) || 5, 60);
            const text = args.slice(2).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'selfdelete <ثواني> <الرسالة>`');
            await message.delete().catch(()=>{});
            const sent = await message.channel.send('⏳ [' + secs + 's] ' + text);
            setTimeout(() => sent.delete().catch(()=>{}), secs * 1000);
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 10 — أدوات النص (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'capitalize3', aliases: ['cap3', 'كابيتال'],
        description: 'تحويل أول حرف كل كلمة لكبير', category: 'نصوص',
        execute(message, args, cm) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'capitalize <النص>`');
            const result = text.replace(/\b\w/g, c => c.toUpperCase());
            message.reply('**🅰️ النص:** `' + result + '`');
        }
    },
    {
        name: 'wordreplace', aliases: ['replace3', 'استبدال'],
        description: 'استبدال كلمة بأخرى في النص', category: 'نصوص',
        execute(message, args, cm) {
            const from = args[1]; const to = args[2]; const text = args.slice(3).join(' ');
            if (!from || !to || !text) return message.reply('❌ `' + cm.getMainPrefix() + 'wordreplace <من> <إلى> <النص>`');
            const result = text.split(from).join(to);
            message.reply('**🔄 بعد الاستبدال:**\n`' + result + '`');
        }
    },
    {
        name: 'repeat3', aliases: ['repeattext', 'تكرار'],
        description: 'تكرار نص عدة مرات', category: 'نصوص',
        execute(message, args, cm) {
            const count = Math.min(parseInt(args[1]) || 3, 20);
            const text = args.slice(2).join(' ');
            if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'repeat3 <عدد> <النص>`');
            message.reply((text + ' ').repeat(count).trim().slice(0, 1900));
        }
    },
    {
        name: 'hashtag', aliases: ['hastag', 'هاشتاق'],
        description: 'تحويل كلمات لهاشتاقات', category: 'نصوص',
        execute(message, args, cm) {
            const words = args.slice(1);
            if (!words.length) return message.reply('❌ `' + cm.getMainPrefix() + 'hashtag كلمة1 كلمة2 ...`');
            const tags = words.map(w => '#' + w.replace(/\s+/g, '')).join(' ');
            message.reply(tags);
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 11 — البحث والمعلومات (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'timezone3', aliases: ['tz3', 'توقيت'],
        description: 'الوقت الحالي في أي مدينة/دولة', category: 'بحث',
        execute(message, args, cm) {
            const zones = {
                'السعودية': 'Asia/Riyadh', 'مصر': 'Africa/Cairo', 'الإمارات': 'Asia/Dubai',
                'الكويت': 'Asia/Kuwait', 'قطر': 'Asia/Qatar', 'البحرين': 'Asia/Bahrain',
                'عمان': 'Asia/Muscat', 'الأردن': 'Asia/Amman', 'لبنان': 'Asia/Beirut',
                'العراق': 'Asia/Baghdad', 'اليمن': 'Asia/Aden', 'ليبيا': 'Africa/Tripoli',
                'تونس': 'Africa/Tunis', 'الجزائر': 'Africa/Algiers', 'المغرب': 'Africa/Casablanca',
                'تركيا': 'Europe/Istanbul', 'لندن': 'Europe/London', 'باريس': 'Europe/Paris',
                'نيويورك': 'America/New_York', 'لوس_انجلس': 'America/Los_Angeles',
                'طوكيو': 'Asia/Tokyo', 'بكين': 'Asia/Shanghai',
            };
            const key = args[1];
            if (!key) return message.reply('❌ `' + cm.getMainPrefix() + 'timezone3 مصر`\n**المتاح:** ' + Object.keys(zones).join(', '));
            const zone = zones[key] || key;
            try {
                const now = new Date().toLocaleString('ar-EG', { timeZone: zone, dateStyle: 'full', timeStyle: 'medium' });
                message.reply('**🕐 الوقت في ' + key + ':**\n`' + now + '`');
            } catch { message.reply('❌ منطقة غير معروفة: `' + key + '`'); }
        }
    },
    {
        name: 'percentage', aliases: ['percent', 'نسبة'],
        description: 'حساب نسبة مئوية', category: 'بحث',
        execute(message, args, cm) {
            const part = parseFloat(args[1]);
            const total = parseFloat(args[2]);
            if (isNaN(part) || isNaN(total) || total === 0) return message.reply('❌ `' + cm.getMainPrefix() + 'percentage <الجزء> <الكل>`\nمثال: `!percentage 25 100` = 25%');
            const pct = (part / total * 100).toFixed(2);
            const bar = '█'.repeat(Math.round(part/total*10)) + '░'.repeat(10 - Math.round(part/total*10));
            message.reply('**📊 النسبة المئوية:**\n`' + bar + '`\n**' + pct + '%** من **' + total + '**');
        }
    },
    {
        name: 'distance', aliases: ['calctime', 'مسافة'],
        description: 'حساب الوقت بين تاريخين', category: 'بحث',
        execute(message, args, cm) {
            const d1 = new Date(args[1]);
            const d2 = args[2] ? new Date(args[2]) : new Date();
            if (isNaN(d1)) return message.reply('❌ `' + cm.getMainPrefix() + 'distance <YYYY-MM-DD> [YYYY-MM-DD]`');
            const diff = Math.abs(d2 - d1);
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const years = Math.floor(days / 365);
            const months = Math.floor((days % 365) / 30);
            message.reply([
                '**📅 الفرق الزمني:**',
                '```',
                '📆 من   : ' + d1.toLocaleDateString('ar-EG'),
                '📆 إلى  : ' + d2.toLocaleDateString('ar-EG'),
                '─────────────',
                '📊 أيام  : ' + days.toLocaleString(),
                '⏰ ساعات : ' + hours,
                '📅 سنوات : ' + years,
                '📅 أشهر  : ' + months,
                '```'
            ].join('\n'));
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 12 — النظام والتحكم (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'botinfo2', aliases: ['info2', 'معلومات_بوت'],
        description: 'معلومات شاملة عن البوت والنظام', category: 'نظام',
        execute(message, args, cm) {
            const up = process.uptime();
            const h = Math.floor(up/3600), m = Math.floor((up%3600)/60), s = Math.floor(up%60);
            const mem = (process.memoryUsage().heapUsed / 1048576).toFixed(2);
            const guilds = message.client.guilds.cache.size;
            message.reply([
                '**⚡ معلومات Snodix Control Bot**',
                '```',
                '🌐 السيرفرات : ' + guilds,
                '⏱️ وقت التشغيل: ' + h + 'h ' + m + 'm ' + s + 's',
                '🧠 RAM       : ' + mem + ' MB',
                '💻 Node.js   : ' + process.version,
                '🖥️ النظام    : ' + os.platform() + ' ' + os.arch(),
                '📡 WebSocket : ' + Math.round(message.client.ws.ping) + 'ms',
                '🎯 البريفكس  : ' + cm.getMainPrefix(),
                '```'
            ].join('\n'));
        }
    },
    {
        name: 'clearstatus', aliases: ['removestatus', 'مسح_حالة'],
        description: 'مسح الـ status الحالي بالكامل', category: 'نظام',
        async execute(message) {
            try {
                await message.client.user.setActivity(null);
                message.reply('✅ **تم مسح الـ status بالكامل.** الحساب بدون أي حالة الآن.');
            } catch (e) { message.reply('❌ فشل: `' + e.message + '`'); }
        }
    },
    {
        name: 'setonline', aliases: ['statusonline', 'اونلاين'],
        description: 'تغيير حالة الحساب لأونلاين فقط بدون تغيير النشاط', category: 'نظام',
        async execute(message) {
            try {
                await message.client.user.setStatus('online');
                message.reply('🟢 **تم تغيير الحالة لأونلاين.**');
            } catch (e) { message.reply('❌ فشل: `' + e.message + '`'); }
        }
    },
    {
        name: 'setdnd', aliases: ['dnd2', 'لا_ازعج'],
        description: 'تغيير الحالة لـ Do Not Disturb', category: 'نظام',
        async execute(message) {
            try {
                await message.client.user.setStatus('dnd');
                message.reply('🔴 **تم تغيير الحالة لـ Do Not Disturb.**');
            } catch (e) { message.reply('❌ فشل: `' + e.message + '`'); }
        }
    },
    {
        name: 'setidle', aliases: ['idle2', 'مشغول'],
        description: 'تغيير الحالة لـ Idle', category: 'نظام',
        async execute(message) {
            try {
                await message.client.user.setStatus('idle');
                message.reply('🟡 **تم تغيير الحالة لـ Idle.**');
            } catch (e) { message.reply('❌ فشل: `' + e.message + '`'); }
        }
    },
    {
        name: 'prefixlist', aliases: ['prefixes', 'قائمة_بريفكس'],
        description: 'عرض كل البريفكسات المضبوطة', category: 'نظام',
        execute(message, args, cm) {
            const prefixes = cm.getPrefixes();
            message.reply('**🎯 البريفكسات المضبوطة:**\n' + prefixes.map((p,i) => (i===0?'✅ الرئيسي':'➕ بديل') + ': `' + p + '`').join('\n'));
        }
    },

    // ══════════════════════════════════════════════════════════════
    // قسم 13 — المتعة والترفيه (إضافات)
    // ══════════════════════════════════════════════════════════════

    {
        name: 'randomquote', aliases: ['quote3', 'اقتباس'],
        description: 'اقتباس عشوائي ملهم', category: 'متعة',
        execute(message) {
            const quotes = [
                'النجاح ليس نهاية المطاف، والفشل ليس أمراً مميتاً — الشجاعة للاستمرار هي ما يهم.',
                'الحياة ليست عن إيجاد نفسك. الحياة عن خلق نفسك.',
                'لا تقس نجاحك بما حققته، بل بما تغلبت عليه.',
                'كل ما يمكنك تخيّله حقيقي.',
                'الطريق الوحيد للقيام بعمل عظيم هو أن تحب ما تفعله.',
                'في منتصف الصعوبة تكمن الفرصة.',
                'أنت لا تفشل حتى تتوقف عن المحاولة.',
                'الخوف هو وهم يتلاشى أمام الجرأة والإقبال.',
            ];
            message.reply('**✨ اقتباس اليوم:**\n> ' + pick(quotes));
        }
    },
    {
        name: 'randomfact2', aliases: ['fact2', 'حقيقة2'],
        description: 'حقيقة مثيرة عشوائية', category: 'متعة',
        execute(message) {
            const facts = [
                'الأخطبوط لديه 3 قلوب و 9 أدمغة.',
                'النمل يمكنه حمل 50 ضعف وزنه.',
                'الضوء يستغرق 8 دقائق ليصل من الشمس للأرض.',
                'البشر مشتركون في 60% من جيناتهم مع الموز.',
                'الشمس تمثل 99.86% من كتلة المجموعة الشمسية.',
                'قلب الكركند يوجد في رأسه.',
                'العسل لا يفسد أبداً، وُجد عسل عمره 3000 سنة في مقابر مصر.',
                'الفيل هو الحيوان الوحيد الذي لا يستطيع القفز.',
            ];
            message.reply('**💡 حقيقة مثيرة:**\n> ' + pick(facts));
        }
    },
    {
        name: 'compliment', aliases: ['praise', 'مدح'],
        description: 'مدح وثناء عشوائي', category: 'متعة',
        execute(message, args, cm) {
            const user = message.mentions?.users?.first()?.username || 'أنت';
            const compliments = [
                'أنت شخص رائع ومميز حقاً!',
                'ذكاؤك وإبداعك ملهم للآخرين.',
                'العالم أفضل بوجودك فيه.',
                'موهبتك وطاقتك لا تُقدّر بثمن.',
                'أنت قدوة حقيقية لكل من حولك.',
            ];
            message.reply('**💐 ' + user + ':** ' + pick(compliments));
        }
    },
    {
        name: 'roast2', aliases: ['روست2', 'troll2'],
        description: 'روست مرح بالعربي', category: 'متعة',
        execute(message, args, cm) {
            const user = message.mentions?.users?.first()?.username || 'المستخدم';
            const roasts = [
                'وجهك أجمل من إيقاف Wi-Fi وسط اجتماع مهم.',
                'ذكاؤك يُذكّرني بكابل HDMI في لاب تيب ما عنده منفذ.',
                'أنت دليل إن الأوكسجين لا يتحول دائماً لشيء مفيد.',
                'فكرك مثل اللود المستمر — كلنا نستنى لكن ما في نتيجة.',
            ];
            message.reply('🔥 **روست لـ ' + user + ':**\n> ' + pick(roasts) + '\n\n*(مزحة! كله احترام 😄)*');
        }
    },

];
