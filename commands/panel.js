'use strict';
// ╔══════════════════════════════════════════════════════════════════╗
// ║   panel.js — قسم 19: لوحة التحكم والإدارة — Snodix v5          ║
// ╚══════════════════════════════════════════════════════════════════╝
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const dataDir = require('../utils/dataDir');

module.exports = [

    {
        name: 'panel', aliases: ['لوحة', 'dashboard2'],
        description: 'عرض لوحة التحكم الشخصية بالبوت', category: 'لوحة',
        execute(message, args, cm) {
            const prefix = cm.getMainPrefix();
            const cfg = cm.config || {};
            const uptime = cm.formatUptime ? cm.formatUptime() : 'N/A';
            const cmdCount = cm.commands ? cm.commands.size : 0;
            const prefixes = cm.getPrefixes ? cm.getPrefixes().join(', ') : prefix;
            const stealth = cm.stealthMode ? '🔴 مفعّل' : '🟢 معطّل';
            const aiStatus = (cfg.ai?.global) ? '🟢 مفعّل' : '🔴 معطّل';
            const D = '━'.repeat(32);
            return message.reply([
                `**${D}**`,
                `**🎛️  Snodix Ultra Legend v5 — لوحة التحكم**`,
                `**${D}**`,
                '```',
                `👤 الحساب   : ${message.client.user.username}`,
                `🆔 الـ ID   : ${message.client.user.id}`,
                `⏱️ Uptime   : ${uptime}`,
                `🎯 Prefix   : ${prefixes}`,
                `⚡ أوامر    : ${cmdCount}`,
                `👻 الاستيلث : ${stealth}`,
                `🤖 الـ AI   : ${aiStatus}`,
                '```',
                `**${D}**`,
                `> \`${prefix}help\` — الأوامر  |  \`${prefix}stats\` — الإحصائيات`,
                `**${D}**`
            ].join('\n'));
        }
    },

    {
        name: 'panelinfo', aliases: ['myinfo2', 'botdetails'],
        description: 'معلومات لوحة التحكم الخاصة بك', category: 'لوحة',
        execute(message, args, cm) {
            const cfg = cm.config || {};
            const allowed = cfg.allowedUserIds || [];
            const blocked = cfg.blockedUsers || [];
            const prefixes = cm.getPrefixes ? cm.getPrefixes() : ['!'];
            const D = '━'.repeat(32);
            return message.reply([
                `**${D}**`,
                `**📊 معلومات لوحة التحكم**`,
                `**${D}**`,
                '```',
                `🎯 البريفكسات    : ${prefixes.join(', ')}`,
                `✅ مسموح لهم    : ${allowed.length === 0 ? 'الكل' : allowed.length + ' شخص'}`,
                `🚫 محجوبون      : ${blocked.length} شخص`,
                `🌐 السيرفرات    : ${message.client.guilds.cache.size}`,
                '```',
                `**${D}**`
            ].join('\n'));
        }
    },

    {
        name: 'allowuser', aliases: ['addallow', 'trustuser'],
        description: 'إضافة مستخدم لقائمة المسموح لهم', category: 'لوحة',
        execute(message, args, cm) {
            const id = args[1];
            if (!id || !/^\d{17,20}$/.test(id))
                return message.reply(`❌ الاستخدام: \`${cm.getMainPrefix()}allowuser <user_id>\``);
            const cfg = cm.config || {};
            if (!cfg.allowedUserIds) cfg.allowedUserIds = [];
            if (cfg.allowedUserIds.includes(id)) return message.reply('⚠️ هذا المستخدم مضاف مسبقاً.');
            cfg.allowedUserIds.push(id);
            cm.config = cfg;
            try { cm.saveConfig(); } catch {}
            return message.reply(`✅ **تم إضافة** \`${id}\` لقائمة المسموح لهم.`);
        }
    },

    {
        name: 'removeuser', aliases: ['unallow', 'disallowuser'],
        description: 'إزالة مستخدم من قائمة المسموح لهم', category: 'لوحة',
        execute(message, args, cm) {
            const id = args[1];
            if (!id) return message.reply(`❌ الاستخدام: \`${cm.getMainPrefix()}removeuser <user_id>\``);
            const cfg = cm.config || {};
            if (!cfg.allowedUserIds || !cfg.allowedUserIds.includes(id))
                return message.reply('⚠️ هذا المستخدم غير موجود في القائمة.');
            cfg.allowedUserIds = cfg.allowedUserIds.filter(u => u !== id);
            cm.config = cfg;
            try { cm.saveConfig(); } catch {}
            return message.reply(`✅ **تم إزالة** \`${id}\` من قائمة المسموح لهم.`);
        }
    },

    {
        name: 'allowedlist', aliases: ['listallowed', 'whocan'],
        description: 'قائمة المستخدمين المسموح لهم', category: 'لوحة',
        execute(message, args, cm) {
            const cfg = cm.config || {};
            const list = cfg.allowedUserIds || [];
            if (list.length === 0)
                return message.reply('✅ **الجميع مسموح لهم** — قائمة المسموح فارغة (وضع مفتوح).');
            return message.reply(`**✅ المسموح لهم (${list.length}):**\n${list.map(id => `\`${id}\``).join('\n')}`);
        }
    },

    {
        name: 'blacklist', aliases: ['bl', 'blocklist'],
        description: 'إدارة قائمة الحظر', category: 'لوحة',
        execute(message, args, cm) {
            const sub = args[1]?.toLowerCase();
            const id  = args[2];
            const cfg = cm.config || {};
            if (!cfg.blockedUsers) cfg.blockedUsers = [];
            const prefix = cm.getMainPrefix();
            if (!sub || sub === 'list') {
                const list = cfg.blockedUsers;
                return message.reply(list.length
                    ? `**🚫 المحجوبون (${list.length}):**\n${list.map(i => `\`${i}\``).join('\n')}`
                    : '✅ قائمة الحظر فارغة.');
            }
            if (sub === 'add') {
                if (!id || !/^\d{17,20}$/.test(id)) return message.reply(`❌ \`${prefix}blacklist add <user_id>\``);
                if (cfg.blockedUsers.includes(id)) return message.reply('⚠️ مضاف مسبقاً.');
                cfg.blockedUsers.push(id);
                cm.config = cfg;
                try { cm.saveConfig(); } catch {}
                return message.reply(`✅ **تم حجب** \`${id}\`.`);
            }
            if (sub === 'remove') {
                if (!id) return message.reply(`❌ \`${prefix}blacklist remove <user_id>\``);
                cfg.blockedUsers = cfg.blockedUsers.filter(u => u !== id);
                cm.config = cfg;
                try { cm.saveConfig(); } catch {}
                return message.reply(`✅ **تم رفع الحجب عن** \`${id}\`.`);
            }
            return message.reply(`❌ الاستخدام: \`${prefix}blacklist <add/remove/list> [id]\``);
        }
    },

    {
        name: 'cmdlog', aliases: ['commandlog', 'history'],
        description: 'آخر الأوامر المستخدمة مع التوقيت', category: 'لوحة',
        execute(message, args, cm) {
            const count = Math.min(parseInt(args[1]) || 10, 20);
            const logFile = path.join(dataDir(), 'cmdlog.json');
            let logs = [];
            try {
                if (fs.existsSync(logFile)) logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
            } catch {}
            if (!logs.length) return message.reply('📝 لا يوجد سجل أوامر حتى الآن.');
            const recent = logs.slice(-count).reverse();
            const lines = recent.map((l, i) => {
                const t = new Date(l.ts).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
                return `\`${String(i + 1).padStart(2)}\` [${t}] \`${l.cmd}\``;
            }).join('\n');
            return message.reply(`**📝 آخر ${count} أوامر:**\n${lines}`);
        }
    },

    {
        name: 'activity', aliases: ['botactivity', 'usage'],
        description: 'نشاط البوت خلال الـ 24 ساعة الأخيرة', category: 'لوحة',
        execute(message, args, cm) {
            let stats = { totalMessages: 0, dailyMessages: 0, allTimeUsers: [] };
            try { stats = cm.getStats ? cm.getStats() : stats; } catch {}
            const uptime = cm.formatUptime ? cm.formatUptime() : 'N/A';
            const cmdCount = cm.commands ? cm.commands.size : 0;
            return message.reply([
                '**📈 نشاط البوت**',
                '```',
                `📨 رسائل الكل      : ${stats.totalMessages}`,
                `📅 رسائل اليوم     : ${stats.dailyMessages}`,
                `👥 مستخدمون كل الكل : ${stats.allTimeUsers?.length || 0}`,
                `⚡ أوامر محملة    : ${cmdCount}`,
                `⏱️ وقت التشغيل    : ${uptime}`,
                '```'
            ].join('\n'));
        }
    },

    {
        name: 'botbackup', aliases: ['backup', 'saveconfig'],
        description: 'نسخ احتياطي كامل من إعدادات البوت', category: 'لوحة',
        execute(message, args, cm) {
            try {
                const cfg = { ...cm.config };
                const backup = { exportedAt: new Date().toISOString(), version: '5.0', config: cfg };
                const json = JSON.stringify(backup, null, 2);
                const tmpFile = path.join(os.tmpdir(), `snodix_backup_${Date.now()}.json`);
                fs.writeFileSync(tmpFile, json);
                message.channel.send({ content: '✅ **نسخة احتياطية جاهزة!**', files: [tmpFile] })
                    .catch(() => message.reply('✅ **النسخة الاحتياطية:**\n```json\n' + json.slice(0, 1500) + '\n```'));
                try { setTimeout(() => fs.unlinkSync(tmpFile), 15000); } catch {}
            } catch (err) {
                message.reply('❌ فشل إنشاء النسخة الاحتياطية: `' + err.message + '`');
            }
        }
    },

    {
        name: 'botrestore', aliases: ['restore', 'restoreconfig'],
        description: 'استعادة إعدادات البوت من نسخة احتياطية', category: 'لوحة',
        execute(message, args, cm) {
            const jsonStr = args.slice(1).join(' ');
            if (!jsonStr) return message.reply(`❌ الاستخدام: \`${cm.getMainPrefix()}botrestore <json>\``);
            try {
                const backup = JSON.parse(jsonStr);
                const cfg = backup.config || backup;
                if (!cfg.prefixes) return message.reply('❌ النسخة الاحتياطية غير صالحة — تأكد من الـ JSON.');
                cm.config = cfg;
                try { cm.saveConfig(); } catch {}
                return message.reply('✅ **تم استعادة الإعدادات بنجاح!**');
            } catch (err) {
                return message.reply('❌ JSON غير صالح: `' + err.message + '`');
            }
        }
    },

    {
        name: 'resetall', aliases: ['factoryreset', 'resetconfig'],
        description: 'إعادة ضبط جميع إعدادات البوت للافتراضي', category: 'لوحة',
        execute(message, args, cm) {
            if (args[1]?.toLowerCase() !== 'confirm')
                return message.reply(`⚠️ **تحذير!** هذا سيمسح كل إعداداتك!\nللتأكيد: \`${cm.getMainPrefix()}resetall confirm\``);
            cm.config = { prefixes: { main: '!', aliases: [] } };
            try { cm.saveConfig(); } catch {}
            return message.reply('✅ **تم إعادة ضبط البوت للإعدادات الافتراضية.**');
        }
    },

    {
        name: 'debugmode', aliases: ['debug', 'devmode'],
        description: 'تفعيل/تعطيل وضع التصحيح', category: 'لوحة',
        execute(message, args, cm) {
            const sub = args[1]?.toLowerCase();
            const cfg = cm.config || {};
            if (sub === 'on') {
                cfg.debug = true; cm.config = cfg;
                try { cm.saveConfig(); } catch {}
                return message.reply('🐛 **وضع التصحيح مفعّل.**');
            }
            if (sub === 'off') {
                cfg.debug = false; cm.config = cfg;
                try { cm.saveConfig(); } catch {}
                return message.reply('✅ **وضع التصحيح معطّل.**');
            }
            const current = cfg.debug ? '🟢 مفعّل' : '🔴 معطّل';
            return message.reply(`**🐛 وضع التصحيح:** ${current}\nاستخدم: \`${cm.getMainPrefix()}debugmode on/off\``);
        }
    },

    {
        name: 'cmdcount', aliases: ['countcmds', 'totalcmds'],
        description: 'عدد الأوامر المحملة في كل فئة', category: 'لوحة',
        execute(message, args, cm) {
            const cmds = cm.commands;
            if (!cmds) return message.reply('❌ لا توجد بيانات أوامر.');
            const cats = {};
            for (const [, cmd] of cmds) {
                const cat = cmd.category || 'عام';
                cats[cat] = (cats[cat] || 0) + 1;
            }
            const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
            const lines = sorted.map(([cat, n]) => `  ${cat.padEnd(12)} : ${n}`).join('\n');
            return message.reply(`**📊 الأوامر حسب الفئة (${cmds.size} إجمالي):**\n\`\`\`\n${lines}\n\`\`\``);
        }
    },

    {
        name: 'botversion', aliases: ['version', 'ver', 'about'],
        description: 'إصدار البوت ومعلومات التحديث', category: 'لوحة',
        execute(message, args, cm) {
            return message.reply([
                '**🆕 Snodix Ultra Legend**',
                '```',
                'الإصدار    : v5.0.0 LEGENDARY EDITION',
                'المحرك     : Node.js ' + process.version,
                'المكتبة    : discord.js-selfbot-v13',
                'الذكاء     : Gemini 2.5 Flash',
                'المطور     : Snodix Team',
                '```'
            ].join('\n'));
        }
    },

    {
        name: 'healthcheck', aliases: ['health', 'checkhealth', 'syscheck'],
        description: 'فحص صحة جميع أنظمة البوت', category: 'لوحة',
        async execute(message, args, cm) {
            const msg = await message.reply('🔍 جاري فحص الأنظمة...');
            const checks = [];
            const ws = message.client.ws?.ping;
            checks.push({ name: 'WebSocket', ok: ws > 0 && ws < 500, detail: ws > 0 ? `${ws}ms` : 'N/A' });
            checks.push({ name: 'الأوامر', ok: (cm.commands?.size || 0) > 0, detail: `${cm.commands?.size || 0} أمر` });
            const cfg = cm.config || {};
            checks.push({ name: 'الكونفيج', ok: !!cfg.prefixes, detail: cfg.prefixes ? 'سليم ✅' : 'مفقود ❌' });
            checks.push({ name: 'Discord API', ok: !!message.client.user, detail: message.client.user ? 'متصل ✅' : 'منفصل ❌' });
            checks.push({ name: 'الذاكرة', ok: true, detail: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB` });
            const lines = checks.map(c => `${c.ok ? '✅' : '❌'} ${c.name.padEnd(12)} ${c.detail}`).join('\n');
            const allOk = checks.every(c => c.ok);
            await msg.edit(`**${allOk ? '✅ كل الأنظمة سليمة' : '⚠️ يوجد مشكلة'}:**\n\`\`\`\n${lines}\n\`\`\``);
        }
    },

    {
        name: 'performance', aliases: ['perf', 'monitor'],
        description: 'مراقبة أداء البوت في الوقت الفعلي', category: 'لوحة',
        async execute(message, args, cm) {
            const start = Date.now();
            const msg = await message.reply('⚡ قياس الأداء...');
            const latency = Date.now() - start;
            const mem = process.memoryUsage();
            const ws = message.client.ws?.ping || 0;
            const up = process.uptime();
            const uptimeFmt = `${Math.floor(up / 3600)}h ${Math.floor((up % 3600) / 60)}m ${Math.floor(up % 60)}s`;
            await msg.edit([
                '**⚡ أداء البوت — الوقت الفعلي**',
                '```',
                `📡 استجابة الرسالة : ${latency}ms`,
                `🌐 WebSocket Ping  : ${ws}ms`,
                `💾 Heap Used       : ${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
                `💾 Heap Total      : ${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
                `🖥️  RSS Memory      : ${Math.round(mem.rss / 1024 / 1024)}MB`,
                `⏱️  Node Uptime     : ${uptimeFmt}`,
                `🔢 CPU Platform    : ${os.platform()} (${os.arch()})`,
                '```'
            ].join('\n'));
        }
    },

    {
        name: 'exportconfig', aliases: ['export', 'configexport'],
        description: 'تصدير إعدادات البوت كملف JSON', category: 'لوحة',
        execute(message, args, cm) {
            try {
                const cfg = { ...cm.config };
                delete cfg.allowedUserIds;
                const json = JSON.stringify(cfg, null, 2);
                return message.reply('**📄 إعدادات البوت:**\n```json\n' + json.slice(0, 1800) + '\n```');
            } catch (err) {
                return message.reply('❌ فشل التصدير: `' + err.message + '`');
            }
        }
    },

    {
        name: 'reloadcmds', aliases: ['reload', 'refreshcmds'],
        description: 'إعادة تحميل الأوامر بدون إعادة تشغيل', category: 'لوحة',
        execute(message, args, cm) {
            try {
                if (cm.loadCommands) {
                    cm.loadCommands();
                    return message.reply(`✅ **تم إعادة تحميل ${cm.commands?.size || 0} أمر بنجاح!**`);
                }
                return message.reply('⚠️ وظيفة إعادة التحميل غير متاحة في هذا الإصدار.');
            } catch (err) {
                return message.reply('❌ فشل إعادة التحميل: `' + err.message + '`');
            }
        }
    },

    {
        name: 'cmdstats', aliases: ['commandstats', 'usagestats'],
        description: 'إحصائيات استخدام الأوامر بالتفصيل', category: 'لوحة',
        execute(message, args, cm) {
            const statsFile = path.join(dataDir(), 'cmdstats.json');
            let stats = {};
            try {
                if (fs.existsSync(statsFile))
                    stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
            } catch {}
            const entries = Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 10);
            if (!entries.length)
                return message.reply('📊 لا توجد إحصائيات استخدام بعد.');
            const lines = entries.map(([cmd, count], i) =>
                `${String(i + 1).padStart(2)}. \`${cmd}\` — ${count} مرة`
            ).join('\n');
            return message.reply(`**📊 أكثر 10 أوامر استخداماً:**\n${lines}`);
        }
    },

    {
        name: 'cleandata', aliases: ['cleanup', 'cleartemp'],
        description: 'تنظيف الملفات المؤقتة والكاش', category: 'لوحة',
        execute(message, args, cm) {
            const tmpFiles = ['cmdlog.json', 'tempdata.json'];
            let cleaned = 0;
            for (const f of tmpFiles) {
                try {
                    const fp = path.join(dataDir(), f);
                    if (fs.existsSync(fp)) { fs.unlinkSync(fp); cleaned++; }
                } catch {}
            }
            return message.reply(`🧹 **تم تنظيف ${cleaned} ملف مؤقت بنجاح.**`);
        }
    },

    {
        name: 'importconfig', aliases: ['import', 'loadconfig'],
        description: 'استيراد إعدادات بوت من JSON', category: 'لوحة',
        execute(message, args, cm) {
            const jsonStr = args.slice(1).join(' ');
            if (!jsonStr) return message.reply(`❌ الاستخدام: \`${cm.getMainPrefix()}importconfig <json>\``);
            try {
                const data = JSON.parse(jsonStr);
                const cfg = data.config || data;
                if (!cfg.prefixes) cfg.prefixes = { main: '!', aliases: [] };
                cm.config = { ...cm.config, ...cfg };
                try { cm.saveConfig(); } catch {}
                return message.reply('✅ **تم استيراد الإعدادات بنجاح!**');
            } catch (err) {
                return message.reply('❌ JSON غير صالح: `' + err.message + '`');
            }
        }
    }
];
