'use strict';
// ╔══════════════════════════════════════════════════════════════════╗
// ║  serverclone.js — قسم 19: نسخ السيرفرات — Snodix v5            ║
// ║  مبني على منهجية Roxy Cloner v2 مع تطويرات إضافية              ║
// ╚══════════════════════════════════════════════════════════════════╝
'use strict';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── حالة النسخ النشطة ──────────────────────────────────────────────
let cloneProgress = null;
let clonePaused   = false;
let cloneAborted  = false;

function resetCloneState() {
    cloneProgress = null;
    clonePaused   = false;
    cloneAborted  = false;
}

async function waitIfPaused() {
    while (clonePaused && !cloneAborted) await sleep(1000);
}

// ── خريطة تحويل أنواع القنوات لـ selfbot v13 → djs ──────────────
function chTypeNum(ch) {
    const t = ch.type;
    if (t === 'GUILD_TEXT' || t === 0)     return 0;
    if (t === 'GUILD_VOICE' || t === 2)    return 2;
    if (t === 'GUILD_CATEGORY' || t === 4) return 4;
    if (t === 'GUILD_NEWS' || t === 5)     return 5;
    if (t === 'GUILD_STAGE_VOICE' || t === 13) return 13;
    return 0;
}

// ── بناء الـ Overwrites مع خريطة الرتب ────────────────────────────
function mapOverwrites(overwrites, roleMap, selfGuild) {
    const result = [];
    for (const [, ow] of overwrites) {
        if (ow.type === 'role' || ow.type === 0) {
            const targetId = roleMap.get(ow.id) || (ow.id === selfGuild?.roles?.everyone?.id ? selfGuild.roles.everyone.id : null);
            if (targetId) {
                result.push({
                    id: targetId,
                    allow: ow.allow.bitfield.toString(),
                    deny:  ow.deny.bitfield.toString(),
                });
            }
        }
    }
    return result;
}

// ── دالة النسخ الرئيسية ────────────────────────────────────────────
async function runClone(message, sourceGuild, targetGuild, opts, logFn) {
    const roleMap = new Map();
    roleMap.set(sourceGuild.roles.everyone.id, targetGuild.roles.everyone.id);

    // 1. حذف القنوات
    if (opts.deleteChannels) {
        await logFn('🗑️ **حذف القنوات الحالية...**');
        const chs = targetGuild.channels.cache.filter(c => c.deletable);
        for (const [, ch] of chs) {
            if (cloneAborted) return await logFn('⛔ **تم إيقاف النسخ.**');
            await waitIfPaused();
            try { await ch.delete(); await sleep(1200); } catch {}
        }
    }

    // 2. حذف الرتب
    if (opts.deleteRoles) {
        await logFn('🗑️ **حذف الرتب الحالية...**');
        const roles = targetGuild.roles.cache.filter(r => r.name !== '@everyone' && !r.managed && r.editable);
        for (const [, role] of roles) {
            if (cloneAborted) return await logFn('⛔ **تم إيقاف النسخ.**');
            await waitIfPaused();
            try { await role.delete(); await sleep(1200); } catch {}
        }
    }

    // 3. حذف الإيموجيات
    if (opts.deleteEmojis) {
        await logFn('🗑️ **حذف الإيموجيات الحالية...**');
        const emojis = targetGuild.emojis.cache.filter(e => e.deletable);
        for (const [, em] of emojis) {
            if (cloneAborted) return await logFn('⛔ **تم إيقاف النسخ.**');
            await waitIfPaused();
            try { await em.delete(); await sleep(1200); } catch {}
        }
    }

    await logFn('✅ **انتهى التنظيف — بدأ نسخ المحتوى...**');

    // 4. نسخ الرتب
    if (opts.cloneRoles) {
        await logFn('🎭 **نسخ الرتب...**');
        const sortedRoles = [...sourceGuild.roles.cache.values()]
            .filter(r => r.name !== '@everyone' && !r.managed)
            .sort((a, b) => b.position - a.position);

        for (const role of sortedRoles) {
            if (cloneAborted) return await logFn('⛔ **تم إيقاف النسخ.**');
            await waitIfPaused();
            try {
                const newRole = await targetGuild.roles.create({
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    permissions: role.permissions.bitfield.toString(),
                    mentionable: role.mentionable,
                    reason: 'Snodix Clone'
                });
                roleMap.set(role.id, newRole.id);
                await logFn(`  ✅ رتبة: **${role.name}**`);
                await sleep(1300);
            } catch {
                await logFn(`  ⚠️ فشل نسخ رتبة: ${role.name}`);
            }
        }
    }

    // 5. نسخ القنوات
    if (opts.cloneChannels) {
        await logFn('📂 **نسخ القنوات...**');
        const catMap = new Map();

        // كاتيجوريات أولاً
        const cats = [...sourceGuild.channels.cache.values()]
            .filter(c => c.type === 'GUILD_CATEGORY' || c.type === 4)
            .sort((a, b) => a.position - b.position);

        for (const cat of cats) {
            if (cloneAborted) return await logFn('⛔ **تم إيقاف النسخ.**');
            await waitIfPaused();
            try {
                const nc = await targetGuild.channels.create({
                    name: cat.name, type: 4, position: cat.position,
                    permissionOverwrites: mapOverwrites(cat.permissionOverwrites.cache, roleMap, targetGuild)
                });
                catMap.set(cat.id, nc.id);
                await logFn(`  📁 كاتيجوري: **${cat.name}**`);
                await sleep(1200);
            } catch { await logFn(`  ⚠️ فشل: ${cat.name}`); }
        }

        // قنوات نصية
        const texts = [...sourceGuild.channels.cache.values()]
            .filter(c => c.type === 'GUILD_TEXT' || c.type === 0 || c.type === 'GUILD_NEWS' || c.type === 5)
            .sort((a, b) => a.position - b.position);

        for (const ch of texts) {
            if (cloneAborted) return await logFn('⛔ **تم إيقاف النسخ.**');
            await waitIfPaused();
            try {
                await targetGuild.channels.create({
                    name: ch.name, type: ch.type === 'GUILD_NEWS' || ch.type === 5 ? 5 : 0,
                    parent: ch.parentId ? catMap.get(ch.parentId) : null,
                    topic: ch.topic || '', nsfw: ch.nsfw || false, position: ch.position,
                    permissionOverwrites: mapOverwrites(ch.permissionOverwrites.cache, roleMap, targetGuild)
                });
                await logFn(`  💬 نصي: **${ch.name}**`);
                await sleep(1200);
            } catch { await logFn(`  ⚠️ فشل: ${ch.name}`); }
        }

        // قنوات صوتية
        const voices = [...sourceGuild.channels.cache.values()]
            .filter(c => c.type === 'GUILD_VOICE' || c.type === 2 || c.type === 'GUILD_STAGE_VOICE' || c.type === 13)
            .sort((a, b) => a.position - b.position);

        for (const ch of voices) {
            if (cloneAborted) return await logFn('⛔ **تم إيقاف النسخ.**');
            await waitIfPaused();
            try {
                const maxBitrate = targetGuild.maximumBitrate || 96000;
                await targetGuild.channels.create({
                    name: ch.name, type: chTypeNum(ch),
                    parent: ch.parentId ? catMap.get(ch.parentId) : null,
                    bitrate: Math.min(ch.bitrate || 64000, maxBitrate),
                    userLimit: ch.userLimit || 0, position: ch.position,
                    permissionOverwrites: mapOverwrites(ch.permissionOverwrites.cache, roleMap, targetGuild)
                });
                await logFn(`  🔊 صوتي: **${ch.name}**`);
                await sleep(1200);
            } catch { await logFn(`  ⚠️ فشل: ${ch.name}`); }
        }
    }

    // 6. نسخ الإيموجيات
    if (opts.cloneEmojis) {
        await logFn('😊 **نسخ الإيموجيات...**');
        const tier = targetGuild.premiumTier || 0;
        const maxEmojis = [50, 100, 150, 250][Math.min(tier, 3)];
        const curStatic   = targetGuild.emojis.cache.filter(e => !e.animated).size;
        const curAnimated = targetGuild.emojis.cache.filter(e => e.animated).size;
        const availStatic   = Math.max(0, maxEmojis - curStatic);
        const availAnimated = Math.max(0, maxEmojis - curAnimated);

        const srcStatic   = [...sourceGuild.emojis.cache.filter(e => !e.animated).values()].slice(0, availStatic);
        const srcAnimated = [...sourceGuild.emojis.cache.filter(e => e.animated).values()].slice(0, availAnimated);

        for (const em of [...srcStatic, ...srcAnimated]) {
            if (cloneAborted) return await logFn('⛔ **تم إيقاف النسخ.**');
            await waitIfPaused();
            try {
                await Promise.race([
                    targetGuild.emojis.create({ attachment: em.url, name: em.name }),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), 15000))
                ]);
                await logFn(`  ${em.animated ? '🎞️' : '😊'} إيموجي: **${em.name}**`);
                await sleep(1500);
            } catch (e) {
                if (e.code === 429 || e.message === 'TIMEOUT') {
                    await logFn('  ⚠️ Rate limit — توقف الإيموجيات هنا.');
                    break;
                }
                await logFn(`  ⚠️ فشل: ${em.name}`);
            }
        }
    }

    // 7. نسخ إعدادات السيرفر
    if (opts.cloneSettings) {
        await logFn('⚙️ **نسخ إعدادات السيرفر...**');
        try {
            const data = {};
            if (sourceGuild.name)         data.name = sourceGuild.name;
            if (sourceGuild.description)  data.description = sourceGuild.description;
            if (sourceGuild.icon)         data.icon = sourceGuild.iconURL({ size: 512, format: 'png' });
            if (sourceGuild.banner)       data.banner = sourceGuild.bannerURL({ size: 512, format: 'png' });
            await targetGuild.edit(data);
            await logFn('  ✅ تم نسخ الإعدادات (اسم، أيقونة، بانر)');
        } catch { await logFn('  ⚠️ فشل نسخ بعض الإعدادات'); }
    }

    cloneProgress = null;
    await logFn(`\n✅ **اكتملت عملية النسخ بنجاح!**`);
}

// ══════════════════════════════════════════════════════════════════
//  الأوامر
// ══════════════════════════════════════════════════════════════════

module.exports = [

    // ── clone — النسخ الكامل ────────────────────────────────────
    {
        name: 'clone', aliases: ['serverclone', 'cloneserver', 'نسخ'],
        description: 'نسخ سيرفر كامل (قنوات + رتب + إيموجيات)', category: 'نسخ',
        async execute(message, args, cm) {
            const sourceId = args[1];
            const targetId = args[2];
            if (!sourceId || !targetId)
                return message.reply(`❌ **الاستخدام:** \`${cm.getMainPrefix()}clone <source_id> <target_id>\``);
            if (sourceId === targetId)
                return message.reply('❌ السيرفر المصدر والهدف لا يمكن أن يكونا نفس السيرفر.');
            if (cloneProgress)
                return message.reply('⚠️ توجد عملية نسخ نشطة الآن. استخدم `!clonestop` لإيقافها أولاً.');

            const sourceGuild = message.client.guilds.cache.get(sourceId);
            const targetGuild = message.client.guilds.cache.get(targetId);
            if (!sourceGuild) return message.reply('❌ لا يمكن الوصول للسيرفر المصدر. تأكد أن البوت/الحساب عضو فيه.');
            if (!targetGuild) return message.reply('❌ لا يمكن الوصول للسيرفر الهدف.');

            resetCloneState();
            cloneProgress = { sourceId, targetId, startedAt: Date.now() };

            const logFn = async (text) => {
                try { await message.channel.send(text.slice(0, 2000)); } catch {}
            };

            await logFn(
                `**🔁 بدأت عملية النسخ**\n` +
                `> **المصدر:** ${sourceGuild.name} (\`${sourceId}\`)\n` +
                `> **الهدف:** ${targetGuild.name} (\`${targetId}\`)\n` +
                `> استخدم \`!clonepause\` / \`!cloneresume\` / \`!clonestop\``
            );

            await runClone(message, sourceGuild, targetGuild, {
                deleteChannels: true,
                deleteRoles: true,
                deleteEmojis: true,
                cloneRoles: true,
                cloneChannels: true,
                cloneEmojis: true,
                cloneSettings: false,
            }, logFn);
        }
    },

    // ── quickclone — نسخ سريع (بدون حذف الموجود) ───────────────
    {
        name: 'quickclone', aliases: ['fastclone', 'qclone'],
        description: 'نسخ سريع (بدون حذف الموجود)', category: 'نسخ',
        async execute(message, args, cm) {
            const sourceId = args[1];
            const targetId = args[2];
            if (!sourceId || !targetId)
                return message.reply(`❌ **الاستخدام:** \`${cm.getMainPrefix()}quickclone <source_id> <target_id>\``);
            if (cloneProgress) return message.reply('⚠️ توجد عملية نسخ نشطة.');

            const sourceGuild = message.client.guilds.cache.get(sourceId);
            const targetGuild = message.client.guilds.cache.get(targetId);
            if (!sourceGuild) return message.reply('❌ لا يمكن الوصول للمصدر.');
            if (!targetGuild) return message.reply('❌ لا يمكن الوصول للهدف.');

            resetCloneState();
            cloneProgress = { sourceId, targetId, startedAt: Date.now() };

            const logFn = async t => { try { await message.channel.send(t.slice(0, 2000)); } catch {} };
            await logFn(`**⚡ نسخ سريع** — المصدر: **${sourceGuild.name}** → الهدف: **${targetGuild.name}**`);

            await runClone(message, sourceGuild, targetGuild, {
                deleteChannels: false, deleteRoles: false, deleteEmojis: false,
                cloneRoles: true, cloneChannels: true, cloneEmojis: true, cloneSettings: false,
            }, logFn);
        }
    },

    // ── deepclone — نسخ عميق مع الإعدادات ──────────────────────
    {
        name: 'deepclone', aliases: ['fullclone', 'dclone'],
        description: 'نسخ عميق كامل مع الإعدادات والأيقونة والبانر', category: 'نسخ',
        async execute(message, args, cm) {
            const sourceId = args[1];
            const targetId = args[2];
            if (!sourceId || !targetId)
                return message.reply(`❌ **الاستخدام:** \`${cm.getMainPrefix()}deepclone <source_id> <target_id>\``);
            if (cloneProgress) return message.reply('⚠️ توجد عملية نسخ نشطة.');

            const sourceGuild = message.client.guilds.cache.get(sourceId);
            const targetGuild = message.client.guilds.cache.get(targetId);
            if (!sourceGuild) return message.reply('❌ لا يمكن الوصول للمصدر.');
            if (!targetGuild) return message.reply('❌ لا يمكن الوصول للهدف.');

            resetCloneState();
            cloneProgress = { sourceId, targetId, startedAt: Date.now() };

            const logFn = async t => { try { await message.channel.send(t.slice(0, 2000)); } catch {} };
            await logFn(`**🔁 نسخ عميق** — المصدر: **${sourceGuild.name}** → الهدف: **${targetGuild.name}**`);

            await runClone(message, sourceGuild, targetGuild, {
                deleteChannels: true, deleteRoles: true, deleteEmojis: true,
                cloneRoles: true, cloneChannels: true, cloneEmojis: true, cloneSettings: true,
            }, logFn);
        }
    },

    // ── clonechannels — نسخ القنوات فقط ─────────────────────────
    {
        name: 'clonechannels', aliases: ['clonechs', 'copychannels'],
        description: 'نسخ القنوات فقط من سيرفر لآخر', category: 'نسخ',
        async execute(message, args, cm) {
            const sourceId = args[1], targetId = args[2];
            if (!sourceId || !targetId) return message.reply(`❌ \`${cm.getMainPrefix()}clonechannels <source_id> <target_id>\``);
            if (cloneProgress) return message.reply('⚠️ توجد عملية نسخ نشطة.');
            const src = message.client.guilds.cache.get(sourceId);
            const tgt = message.client.guilds.cache.get(targetId);
            if (!src || !tgt) return message.reply('❌ تأكد من صحة الـ IDs والوصول للسيرفرين.');
            resetCloneState();
            cloneProgress = { sourceId, targetId, startedAt: Date.now() };
            const logFn = async t => { try { await message.channel.send(t.slice(0, 2000)); } catch {} };
            await logFn(`**📂 نسخ القنوات فقط** — من **${src.name}** → **${tgt.name}**`);
            await runClone(message, src, tgt, {
                deleteChannels: false, deleteRoles: false, deleteEmojis: false,
                cloneRoles: false, cloneChannels: true, cloneEmojis: false, cloneSettings: false,
            }, logFn);
        }
    },

    // ── cloneroles — نسخ الرتب فقط ──────────────────────────────
    {
        name: 'cloneroles', aliases: ['copyroles', 'rolesfrom'],
        description: 'نسخ الرتب فقط من سيرفر لآخر', category: 'نسخ',
        async execute(message, args, cm) {
            const sourceId = args[1], targetId = args[2];
            if (!sourceId || !targetId) return message.reply(`❌ \`${cm.getMainPrefix()}cloneroles <source_id> <target_id>\``);
            if (cloneProgress) return message.reply('⚠️ توجد عملية نسخ نشطة.');
            const src = message.client.guilds.cache.get(sourceId);
            const tgt = message.client.guilds.cache.get(targetId);
            if (!src || !tgt) return message.reply('❌ تأكد من صحة الـ IDs.');
            resetCloneState();
            cloneProgress = { sourceId, targetId, startedAt: Date.now() };
            const logFn = async t => { try { await message.channel.send(t.slice(0, 2000)); } catch {} };
            await logFn(`**🎭 نسخ الرتب فقط** — من **${src.name}** → **${tgt.name}**`);
            await runClone(message, src, tgt, {
                deleteChannels: false, deleteRoles: false, deleteEmojis: false,
                cloneRoles: true, cloneChannels: false, cloneEmojis: false, cloneSettings: false,
            }, logFn);
        }
    },

    // ── cloneemojis — نسخ الإيموجيات فقط ────────────────────────
    {
        name: 'cloneemojis', aliases: ['copyemojis', 'emojisfrom', 'stealemojis2'],
        description: 'نسخ الإيموجيات فقط من سيرفر لآخر', category: 'نسخ',
        async execute(message, args, cm) {
            const sourceId = args[1], targetId = args[2];
            if (!sourceId || !targetId) return message.reply(`❌ \`${cm.getMainPrefix()}cloneemojis <source_id> <target_id>\``);
            if (cloneProgress) return message.reply('⚠️ توجد عملية نسخ نشطة.');
            const src = message.client.guilds.cache.get(sourceId);
            const tgt = message.client.guilds.cache.get(targetId);
            if (!src || !tgt) return message.reply('❌ تأكد من صحة الـ IDs.');
            resetCloneState();
            cloneProgress = { sourceId, targetId, startedAt: Date.now() };
            const logFn = async t => { try { await message.channel.send(t.slice(0, 2000)); } catch {} };
            await logFn(`**😊 نسخ الإيموجيات فقط** — من **${src.name}** → **${tgt.name}**`);
            await runClone(message, src, tgt, {
                deleteChannels: false, deleteRoles: false, deleteEmojis: false,
                cloneRoles: false, cloneChannels: false, cloneEmojis: true, cloneSettings: false,
            }, logFn);
        }
    },

    // ── clonesettings — نسخ إعدادات السيرفر ─────────────────────
    {
        name: 'clonesettings', aliases: ['cloneicon', 'copysettings'],
        description: 'نسخ إعدادات السيرفر (اسم، أيقونة، بانر)', category: 'نسخ',
        async execute(message, args, cm) {
            const sourceId = args[1], targetId = args[2];
            if (!sourceId || !targetId) return message.reply(`❌ \`${cm.getMainPrefix()}clonesettings <source_id> <target_id>\``);
            const src = message.client.guilds.cache.get(sourceId);
            const tgt = message.client.guilds.cache.get(targetId);
            if (!src || !tgt) return message.reply('❌ تأكد من صحة الـ IDs.');
            const msg = await message.reply('⚙️ جاري نسخ الإعدادات...');
            try {
                const data = {};
                if (src.name) data.name = src.name;
                if (src.description) data.description = src.description;
                if (src.icon) data.icon = src.iconURL({ size: 512, format: 'png' });
                if (src.banner) data.banner = src.bannerURL({ size: 512, format: 'png' });
                await tgt.edit(data);
                await msg.edit(`✅ **تم نسخ إعدادات** **${src.name}** → **${tgt.name}**`);
            } catch (e) {
                await msg.edit(`❌ فشل: \`${e.message}\``);
            }
        }
    },

    // ── cloneinfo — معلومات سيرفر قبل النسخ ─────────────────────
    {
        name: 'cloneinfo', aliases: ['previewclone', 'clonescan'],
        description: 'معلومات سيرفر مصدر قبل بدء النسخ', category: 'نسخ',
        async execute(message, args, cm) {
            const id = args[1];
            if (!id) return message.reply(`❌ \`${cm.getMainPrefix()}cloneinfo <server_id>\``);
            const guild = message.client.guilds.cache.get(id);
            if (!guild) return message.reply('❌ لا يمكن الوصول لهذا السيرفر.');
            const cats    = guild.channels.cache.filter(c => c.type === 'GUILD_CATEGORY' || c.type === 4).size;
            const texts   = guild.channels.cache.filter(c => c.type === 'GUILD_TEXT' || c.type === 0).size;
            const voices  = guild.channels.cache.filter(c => c.type === 'GUILD_VOICE' || c.type === 2).size;
            const roles   = guild.roles.cache.filter(r => r.name !== '@everyone').size;
            const emojis  = guild.emojis.cache.size;
            const staticE = guild.emojis.cache.filter(e => !e.animated).size;
            const animE   = guild.emojis.cache.filter(e => e.animated).size;
            return message.reply([
                `**🔍 معاينة للنسخ — ${guild.name}**`,
                '```',
                `🆔 الـ ID       : ${guild.id}`,
                `👥 الأعضاء     : ${guild.memberCount}`,
                `📁 كاتيجوريات : ${cats}`,
                `💬 قنوات نصية : ${texts}`,
                `🔊 قنوات صوتية: ${voices}`,
                `🎭 رتب         : ${roles}`,
                `😊 إيموجيات   : ${emojis} (${staticE} ثابت + ${animE} متحرك)`,
                `🚀 مستوى بوست : ${guild.premiumTier}`,
                '```',
                `> استخدم \`${cm.getMainPrefix()}clone ${guild.id} <target_id>\` لبدء النسخ`
            ].join('\n'));
        }
    },

    // ── clonestatus — حالة النسخ ─────────────────────────────────
    {
        name: 'clonestatus', aliases: ['cloneprogress', 'cstatus'],
        description: 'حالة عملية النسخ الجارية', category: 'نسخ',
        execute(message, args, cm) {
            if (!cloneProgress)
                return message.reply('✅ لا توجد عملية نسخ جارية حالياً.');
            const elapsed = Math.floor((Date.now() - cloneProgress.startedAt) / 1000);
            return message.reply([
                '**🔁 حالة النسخ الجارية**',
                '```',
                `المصدر  : ${cloneProgress.sourceId}`,
                `الهدف   : ${cloneProgress.targetId}`,
                `الوقت   : ${elapsed} ثانية`,
                `الوضع   : ${clonePaused ? '⏸ متوقف مؤقتاً' : '▶ نشط'}`,
                '```'
            ].join('\n'));
        }
    },

    // ── clonepause — إيقاف مؤقت ──────────────────────────────────
    {
        name: 'clonepause', aliases: ['pauseclone', 'cpause'],
        description: 'إيقاف عملية النسخ مؤقتاً', category: 'نسخ',
        execute(message) {
            if (!cloneProgress) return message.reply('❌ لا توجد عملية نسخ جارية.');
            clonePaused = true;
            return message.reply('⏸ **تم إيقاف النسخ مؤقتاً.** استخدم `!cloneresume` للاستمرار.');
        }
    },

    // ── cloneresume — استمرار النسخ ──────────────────────────────
    {
        name: 'cloneresume', aliases: ['resumeclone', 'cresume'],
        description: 'استمرار عملية النسخ بعد الإيقاف', category: 'نسخ',
        execute(message) {
            if (!cloneProgress) return message.reply('❌ لا توجد عملية نسخ متوقفة.');
            clonePaused = false;
            return message.reply('▶ **استمرت عملية النسخ.**');
        }
    },

    // ── clonestop — إيقاف كلي ────────────────────────────────────
    {
        name: 'clonestop', aliases: ['stopclone', 'abortclone', 'cstop'],
        description: 'إيقاف عملية النسخ نهائياً', category: 'نسخ',
        execute(message) {
            if (!cloneProgress) return message.reply('❌ لا توجد عملية نسخ جارية.');
            cloneAborted = true;
            clonePaused  = false;
            setTimeout(resetCloneState, 2000);
            return message.reply('⛔ **تم إيقاف النسخ نهائياً.**');
        }
    },

    // ── compareguilds — مقارنة سيرفرين ──────────────────────────
    {
        name: 'compareguilds', aliases: ['compareservers', 'cmpservers'],
        description: 'مقارنة إحصائيات سيرفرين بجانب بعض', category: 'نسخ',
        execute(message, args, cm) {
            const id1 = args[1], id2 = args[2];
            if (!id1 || !id2) return message.reply(`❌ \`${cm.getMainPrefix()}compareguilds <id1> <id2>\``);
            const g1 = message.client.guilds.cache.get(id1);
            const g2 = message.client.guilds.cache.get(id2);
            if (!g1 || !g2) return message.reply('❌ لا يمكن الوصول لأحد السيرفرين.');
            const stat = (g, fn) => fn(g);
            const chs   = g => g.channels.cache.size;
            const roles  = g => g.roles.cache.size;
            const emojis = g => g.emojis.cache.size;
            return message.reply([
                `**📊 مقارنة: ${g1.name} vs ${g2.name}**`,
                '```',
                `الإحصائية      ${g1.name.slice(0,10).padEnd(12)} ${g2.name.slice(0,10)}`,
                `أعضاء         ${String(g1.memberCount).padEnd(14)} ${g2.memberCount}`,
                `قنوات          ${String(chs(g1)).padEnd(14)} ${chs(g2)}`,
                `رتب            ${String(roles(g1)).padEnd(14)} ${roles(g2)}`,
                `إيموجيات       ${String(emojis(g1)).padEnd(14)} ${emojis(g2)}`,
                `مستوى بوست    ${String(g1.premiumTier).padEnd(14)} ${g2.premiumTier}`,
                '```'
            ].join('\n'));
        }
    },

    // ── clonelog — سجل آخر عملية نسخ ────────────────────────────
    {
        name: 'clonelog', aliases: ['clonerlog', 'clog'],
        description: 'عرض سجل آخر عملية نسخ', category: 'نسخ',
        execute(message) {
            if (!cloneProgress && !cloneAborted)
                return message.reply('📋 لا يوجد سجل لعمليات نسخ سابقة في هذه الجلسة.');
            const prog = cloneProgress || {};
            const status = cloneAborted ? '⛔ تم الإيقاف' : (clonePaused ? '⏸ متوقف' : '✅ منتهي');
            return message.reply(`**📋 سجل النسخ:**\n> الحالة: ${status}\n> المصدر: \`${prog.sourceId || 'N/A'}\`\n> الهدف: \`${prog.targetId || 'N/A'}\``);
        }
    },
];
