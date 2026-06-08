'use strict';
// ╔══════════════════════════════════════════════════════════════════╗
// ║  vc.js — قسم 20: الصوت والفويس — Snodix v5                     ║
// ╚══════════════════════════════════════════════════════════════════╝
const fs   = require('fs');
const path = require('path');
const https = require('https');
let joinVoiceChannel, VoiceConnectionStatus, entersState;
try {
    const dv = require('@discordjs/voice');
    joinVoiceChannel = dv.joinVoiceChannel;
    VoiceConnectionStatus = dv.VoiceConnectionStatus;
    entersState = dv.entersState;
} catch {}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── حالة الاتصالات الصوتية ──────────────────────────────────────
const connections = new Map(); // guildId → { connection, channel, joinTime, guildId }
const vcStats     = { totalSessions: 0, totalMs: 0 };
let vcAutoRejoin  = false;
let vcLoopActive  = false;

function getConn(guildId) { return connections.get(guildId); }

function saveSession(guildId, channelName, durationMs) {
    vcStats.totalSessions++;
    vcStats.totalMs += durationMs;
    try {
        const statsPath = path.join(__dirname, '..', 'data', 'vcstats.json');
        fs.mkdirSync(path.dirname(statsPath), { recursive: true });
        let data = [];
        if (fs.existsSync(statsPath)) data = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        data.push({ guildId, channelName, durationMs, endedAt: Date.now() });
        if (data.length > 100) data = data.slice(-100);
        fs.writeFileSync(statsPath, JSON.stringify(data, null, 2));
    } catch {}
}

function fmtDur(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}س ${m % 60}د ${s % 60}ث`;
    if (m > 0) return `${m}د ${s % 60}ث`;
    return `${s}ث`;
}

async function doJoin(message, channelId) {
    if (!joinVoiceChannel) throw new Error('مكتبة @discordjs/voice غير مثبتة');
    const channel = await message.client.channels.fetch(channelId).catch(() => null);
    if (!channel) throw new Error('لم أجد القناة');
    if (!channel.isVoice?.() && channel.type !== 2 && channel.type !== 'GUILD_VOICE')
        throw new Error('هذه ليست قناة صوتية');

    const guildId = channel.guild.id;
    const existing = getConn(guildId);
    if (existing) {
        try { existing.connection.destroy(); } catch {}
    }

    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
    });
    connections.set(guildId, { connection, channel, joinTime: Date.now(), guildId });
    return channel;
}

async function doLeave(guildId) {
    const conn = getConn(guildId);
    if (!conn) return false;
    const dur = Date.now() - conn.joinTime;
    saveSession(guildId, conn.channel.name, dur);
    try { conn.connection.destroy(); } catch {}
    connections.delete(guildId);
    return { dur, channelName: conn.channel.name };
}

// ══════════════════════════════════════════════════════════════════
module.exports = [

    // ── vcjoin — دخول قناة صوتية ─────────────────────────────────
    {
        name: 'vcjoin', aliases: ['vj', 'joinvc', 'دخول', 'vc'],
        description: 'دخول قناة صوتية بالـ ID', category: 'صوت',
        async execute(message, args, cm) {
            const chId = args[1]?.replace(/\D/g, '');
            if (!chId) {
                // حاول دخول VC الحالي للعضو
                const member = message.guild?.members?.cache?.get(message.author.id);
                const vcId = member?.voice?.channelId;
                if (!vcId) return message.reply(`❌ \`${cm.getMainPrefix()}vcjoin <channel_id>\``);
                args[1] = vcId;
                return module.exports[0].execute(message, args, cm);
            }
            const msg = await message.reply('🔊 جاري الدخول...');
            try {
                const ch = await doJoin(message, chId);
                await msg.edit(`✅ **دخلت القناة الصوتية:** \`${ch.name}\``);
            } catch (e) {
                await msg.edit(`❌ فشل الدخول: \`${e.message}\``);
            }
        }
    },

    // ── vcleave — خروج من القناة الصوتية ─────────────────────────
    {
        name: 'vcleave', aliases: ['vl', 'leavevc', 'خروج'],
        description: 'الخروج من القناة الصوتية الحالية', category: 'صوت',
        async execute(message, args, cm) {
            const guildId = message.guild?.id;
            if (!guildId) return message.reply('❌ هذا الأمر يعمل فقط في السيرفرات.');
            const result = await doLeave(guildId);
            if (!result) return message.reply('❌ البوت ليس في أي قناة صوتية حالياً.');
            const msg = await message.reply(`✅ **خرجت من** \`${result.channelName}\` — الوقت: **${fmtDur(result.dur)}**`);
            setTimeout(() => msg.delete().catch(() => {}), 8000);
        }
    },

    // ── vcstatus — حالة الاتصال الصوتي ──────────────────────────
    {
        name: 'vcstatus', aliases: ['vcinfo', 'voicestatus'],
        description: 'حالة الاتصال الصوتي الحالي', category: 'صوت',
        execute(message) {
            const guildId = message.guild?.id;
            const conn = guildId ? getConn(guildId) : null;
            if (!conn) return message.reply('📴 البوت غير متصل بأي قناة صوتية حالياً.');
            const dur = Date.now() - conn.joinTime;
            const members = conn.channel.members?.size || 0;
            return message.reply([
                '**🔊 حالة الاتصال الصوتي**',
                '```',
                `القناة     : ${conn.channel.name}`,
                `الـ ID     : ${conn.channel.id}`,
                `السيرفر   : ${conn.channel.guild.name}`,
                `الوقت     : ${fmtDur(dur)}`,
                `الأعضاء   : ${members}`,
                `Auto-Rejoin: ${vcAutoRejoin ? 'مفعّل' : 'معطّل'}`,
                '```'
            ].join('\n'));
        }
    },

    // ── vctime — وقت الجلسة الصوتية ──────────────────────────────
    {
        name: 'vctime', aliases: ['vcuptime', 'howlongvc'],
        description: 'مدة الجلسة الصوتية الحالية', category: 'صوت',
        execute(message) {
            const conn = message.guild ? getConn(message.guild.id) : null;
            if (!conn) return message.reply('❌ البوت غير متصل بقناة صوتية.');
            const dur = Date.now() - conn.joinTime;
            return message.reply(`⏱️ **وقت الجلسة الصوتية:** \`${fmtDur(dur)}\` في **${conn.channel.name}**`);
        }
    },

    // ── vcmute — كتم الميك ───────────────────────────────────────
    {
        name: 'vcmute', aliases: ['mute', 'mutemic', 'كتم'],
        description: 'كتم الميكروفون في القناة الصوتية', category: 'صوت',
        async execute(message) {
            const conn = message.guild ? getConn(message.guild.id) : null;
            if (!conn) return message.reply('❌ البوت غير متصل بقناة صوتية.');
            try {
                await message.client.ws.broadcast({ op: 4, d: {
                    guild_id: conn.guildId, channel_id: conn.channel.id,
                    self_mute: true, self_deaf: false
                }});
                return message.reply('🔇 **تم كتم الميكروفون.**');
            } catch {
                return message.reply('❌ فشل كتم الميكروفون.');
            }
        }
    },

    // ── vcunmute — رفع الكتم ─────────────────────────────────────
    {
        name: 'vcunmute', aliases: ['unmute', 'unmutevc', 'رفع_الكتم'],
        description: 'رفع كتم الميكروفون', category: 'صوت',
        async execute(message) {
            const conn = message.guild ? getConn(message.guild.id) : null;
            if (!conn) return message.reply('❌ البوت غير متصل بقناة صوتية.');
            try {
                await message.client.ws.broadcast({ op: 4, d: {
                    guild_id: conn.guildId, channel_id: conn.channel.id,
                    self_mute: false, self_deaf: false
                }});
                return message.reply('🎙️ **تم رفع كتم الميكروفون.**');
            } catch {
                return message.reply('❌ فشل رفع الكتم.');
            }
        }
    },

    // ── vcdeafen — صمّ نفسك ──────────────────────────────────────
    {
        name: 'vcdeafen', aliases: ['deafen', 'dfn', 'صمم'],
        description: 'كتم الصوت الوارد في القناة الصوتية', category: 'صوت',
        async execute(message) {
            const conn = message.guild ? getConn(message.guild.id) : null;
            if (!conn) return message.reply('❌ البوت غير متصل بقناة صوتية.');
            try {
                await message.client.ws.broadcast({ op: 4, d: {
                    guild_id: conn.guildId, channel_id: conn.channel.id,
                    self_mute: false, self_deaf: true
                }});
                return message.reply('🔕 **تم تفعيل الإصمام (Deafen).**');
            } catch {
                return message.reply('❌ فشل تفعيل الإصمام.');
            }
        }
    },

    // ── vcundeafen — رفع الإصمام ─────────────────────────────────
    {
        name: 'vcundeafen', aliases: ['undeafen', 'udfn', 'رفع_الصمم'],
        description: 'رفع كتم الصوت الوارد', category: 'صوت',
        async execute(message) {
            const conn = message.guild ? getConn(message.guild.id) : null;
            if (!conn) return message.reply('❌ البوت غير متصل بقناة صوتية.');
            try {
                await message.client.ws.broadcast({ op: 4, d: {
                    guild_id: conn.guildId, channel_id: conn.channel.id,
                    self_mute: false, self_deaf: false
                }});
                return message.reply('🔊 **تم رفع الإصمام.**');
            } catch {
                return message.reply('❌ فشل رفع الإصمام.');
            }
        }
    },

    // ── vcmove — نقل بين قنوات صوتية ─────────────────────────────
    {
        name: 'vcmove', aliases: ['moveto', 'switchvc', 'نقل_vc'],
        description: 'الانتقال لقناة صوتية أخرى', category: 'صوت',
        async execute(message, args, cm) {
            const chId = args[1]?.replace(/\D/g, '');
            if (!chId) return message.reply(`❌ \`${cm.getMainPrefix()}vcmove <channel_id>\``);
            const guildId = message.guild?.id;
            if (!guildId) return message.reply('❌ هذا الأمر للسيرفرات فقط.');
            const msg = await message.reply('🔄 جاري الانتقال...');
            try {
                const ch = await doJoin(message, chId);
                await msg.edit(`✅ **انتقلت إلى:** \`${ch.name}\``);
            } catch (e) {
                await msg.edit(`❌ فشل الانتقال: \`${e.message}\``);
            }
        }
    },

    // ── vclist — قائمة القنوات الصوتية ───────────────────────────
    {
        name: 'vclist', aliases: ['voicelist', 'listvc', 'listvoice'],
        description: 'قائمة القنوات الصوتية في السيرفر مع الأعضاء', category: 'صوت',
        async execute(message) {
            if (!message.guild) return message.reply('❌ هذا الأمر للسيرفرات فقط.');
            const vcs = message.guild.channels.cache
                .filter(c => c.type === 'GUILD_VOICE' || c.type === 2)
                .sort((a, b) => a.position - b.position);
            if (!vcs.size) return message.reply('❌ لا توجد قنوات صوتية في هذا السيرفر.');
            const lines = vcs.map(ch => {
                const members = [...(ch.members?.values() || [])].map(m => m.user.username).slice(0, 5);
                const conn = getConn(message.guild.id);
                const here = conn?.channel?.id === ch.id ? ' 📍' : '';
                return `🔊 **${ch.name}**${here} (${ch.members?.size || 0})\n  ${members.join(', ') || '*فارغ*'}`;
            }).join('\n\n');
            return message.reply(`**🔊 القنوات الصوتية (${vcs.size}):**\n${lines}`.slice(0, 1990));
        }
    },

    // ── vcmembers — أعضاء القناة الصوتية ─────────────────────────
    {
        name: 'vcmembers', aliases: ['whoinvc', 'voicemembers', 'vcwho'],
        description: 'عرض أعضاء القناة الصوتية الحالية', category: 'صوت',
        async execute(message, args, cm) {
            if (!message.guild) return message.reply('❌ هذا الأمر للسيرفرات فقط.');
            let chId = args[1]?.replace(/\D/g, '');
            const conn = getConn(message.guild.id);
            if (!chId) chId = conn?.channel?.id;
            if (!chId) return message.reply(`❌ \`${cm.getMainPrefix()}vcmembers [channel_id]\``);
            const ch = message.guild.channels.cache.get(chId);
            if (!ch) return message.reply('❌ القناة غير موجودة.');
            const members = [...(ch.members?.values() || [])];
            if (!members.length) return message.reply(`✅ القناة **${ch.name}** فارغة.`);
            const lines = members.map((m, i) => {
                const muted  = m.voice?.selfMute  ? '🔇' : '';
                const deaf   = m.voice?.selfDeaf  ? '🔕' : '';
                const stream = m.voice?.streaming ? '🔴' : '';
                return `\`${i + 1}\` ${muted}${deaf}${stream} **${m.user.username}** (\`${m.user.id}\`)`;
            });
            return message.reply(`**👥 أعضاء \`${ch.name}\` (${members.length}):**\n${lines.join('\n')}`);
        }
    },

    // ── vcstats — إحصائيات الجلسات الصوتية ───────────────────────
    {
        name: 'vcstats', aliases: ['voicestats', 'vchistory'],
        description: 'إحصائيات جلساتك الصوتية', category: 'صوت',
        execute(message) {
            let sessions = [];
            try {
                const f = path.join(__dirname, '..', 'data', 'vcstats.json');
                if (fs.existsSync(f)) sessions = JSON.parse(fs.readFileSync(f, 'utf8'));
            } catch {}
            const total = sessions.reduce((a, s) => a + (s.durationMs || 0), 0);
            const recent = sessions.slice(-5).reverse();
            const recentLines = recent.map((s, i) =>
                `\`${i + 1}\` **${s.channelName || '?'}** — ${fmtDur(s.durationMs || 0)}`
            ).join('\n');
            return message.reply([
                '**📊 إحصائيات الجلسات الصوتية**',
                '```',
                `إجمالي الجلسات : ${sessions.length}`,
                `إجمالي الوقت   : ${fmtDur(total)}`,
                `أطول جلسة      : ${fmtDur(Math.max(...sessions.map(s => s.durationMs || 0), 0))}`,
                '```',
                sessions.length ? `**آخر 5 جلسات:**\n${recentLines}` : ''
            ].join('\n'));
        }
    },

    // ── vcautorejoin — إعادة الدخول التلقائي ─────────────────────
    {
        name: 'vcautorejoin', aliases: ['autorejoin', 'rejoinmode'],
        description: 'تفعيل/تعطيل إعادة الدخول التلقائي للفويس', category: 'صوت',
        execute(message, args) {
            const sub = args[1]?.toLowerCase();
            if (sub === 'on') { vcAutoRejoin = true; return message.reply('✅ **تم تفعيل Auto-Rejoin** — سيعود تلقائياً عند الطرد.'); }
            if (sub === 'off') { vcAutoRejoin = false; return message.reply('✅ **تم تعطيل Auto-Rejoin.**'); }
            return message.reply(`**🔄 Auto-Rejoin:** ${vcAutoRejoin ? '🟢 مفعّل' : '🔴 معطّل'}\nاستخدم \`vcautorejoin on/off\``);
        }
    },

    // ── vcloop — دوام في الفويس ───────────────────────────────────
    {
        name: 'vcloop', aliases: ['stayvc', 'vcstay', 'loopvc'],
        description: 'البقاء دائم في الفويس مع إعادة الدخول كل دقيقة', category: 'صوت',
        async execute(message, args, cm) {
            const sub = args[1]?.toLowerCase();
            if (sub === 'stop') {
                vcLoopActive = false;
                return message.reply('✅ **تم إيقاف وضع Loop.**');
            }
            const conn = message.guild ? getConn(message.guild.id) : null;
            if (!conn) return message.reply(`❌ ادخل الفويس أولاً بـ \`${cm.getMainPrefix()}vcjoin <id>\``);
            if (vcLoopActive) return message.reply('⚠️ وضع Loop مفعّل مسبقاً. استخدم `vcloop stop` لإيقافه.');
            vcLoopActive = true;
            message.reply('🔁 **وضع Loop مفعّل** — البوت سيبقى في الفويس. استخدم `vcloop stop` للإيقاف.');
            const chId = conn.channel.id;
            const guildId = conn.guildId;
            while (vcLoopActive) {
                await sleep(30000);
                if (!vcLoopActive) break;
                const c = getConn(guildId);
                if (!c) {
                    try { await doJoin(message, chId); } catch {}
                }
            }
        }
    },

    // ── vcping — اختبار زمن الاستجابة ────────────────────────────
    {
        name: 'vcping', aliases: ['voiceping', 'pingvc'],
        description: 'اختبار زمن الاستجابة للاتصال الصوتي', category: 'صوت',
        async execute(message) {
            const start = Date.now();
            const msg = await message.reply('📡 قياس...');
            const latency = Date.now() - start;
            const ws = message.client.ws?.ping || 0;
            const conn = message.guild ? getConn(message.guild.id) : null;
            const vcStatus = conn ? `🟢 متصل بـ ${conn.channel.name}` : '🔴 غير متصل';
            await msg.edit([
                '**📡 اختبار الصوت**',
                '```',
                `استجابة الرسائل : ${latency}ms`,
                `WebSocket Ping  : ${ws}ms`,
                `حالة الفويس    : ${vcStatus}`,
                '```'
            ].join('\n'));
        }
    },

    // ── vcall — اتصال بجميع الأعضاء ──────────────────────────────
    {
        name: 'vcall', aliases: ['callall', 'allvc', 'inviteall'],
        description: 'إرسال دعوة للانضمام للفويس لجميع أعضاء الشات', category: 'صوت',
        async execute(message, args, cm) {
            const conn = message.guild ? getConn(message.guild.id) : null;
            if (!conn) return message.reply(`❌ ادخل الفويس أولاً بـ \`${cm.getMainPrefix()}vcjoin <id>\``);
            const invite = `https://discord.com/channels/${conn.guildId}/${conn.channel.id}`;
            return message.reply(`📞 **انضم للقناة الصوتية!**\n> **القناة:** \`${conn.channel.name}\`\n> **الرابط:** ${invite}`);
        }
    },

    // ── vcrecord — معلومات التسجيل ────────────────────────────────
    {
        name: 'vcrecord', aliases: ['recordinfo', 'isrecording'],
        description: 'معلومات حالة التسجيل في القناة الصوتية', category: 'صوت',
        execute(message) {
            const conn = message.guild ? getConn(message.guild.id) : null;
            if (!conn) return message.reply('❌ البوت غير متصل بقناة صوتية.');
            const members = [...(conn.channel.members?.values() || [])];
            const recording = members.filter(m => m.voice?.requestToSpeak || false);
            return message.reply([
                `**🎙️ معلومات التسجيل — ${conn.channel.name}**`,
                `> الأعضاء: ${members.length}`,
                `> مدة الجلسة: ${fmtDur(Date.now() - conn.joinTime)}`,
                `> التسجيل متاح عبر Discord المضمّن فقط.`
            ].join('\n'));
        }
    },

    // ── vcleaveall — الخروج من كل القنوات ────────────────────────
    {
        name: 'vcleaveall', aliases: ['leaveallvc', 'disconnectall'],
        description: 'الخروج من جميع القنوات الصوتية في كل السيرفرات', category: 'صوت',
        async execute(message) {
            let count = 0;
            for (const [guildId] of connections) {
                await doLeave(guildId);
                count++;
            }
            return message.reply(count ? `✅ **خرجت من ${count} قناة صوتية.**` : '✅ البوت غير متصل بأي قناة صوتية.');
        }
    },

    // ── vcmovemember — نقل عضو لقناة صوتية ──────────────────────
    {
        name: 'vcmovemember', aliases: ['movemember', 'dragvc'],
        description: 'نقل عضو لقناة صوتية مختلفة', category: 'صوت',
        async execute(message, args, cm) {
            const memberId = args[1]?.replace(/\D/g, '');
            const chId     = args[2]?.replace(/\D/g, '');
            if (!memberId || !chId)
                return message.reply(`❌ \`${cm.getMainPrefix()}vcmovemember <user_id> <channel_id>\``);
            if (!message.guild) return message.reply('❌ هذا الأمر للسيرفرات فقط.');
            const msg = await message.reply('🔄 جاري النقل...');
            try {
                const member = await message.guild.members.fetch(memberId);
                await member.voice.setChannel(chId);
                const ch = message.guild.channels.cache.get(chId);
                await msg.edit(`✅ **تم نقل** \`${member.user.username}\` → \`${ch?.name || chId}\``);
            } catch (e) {
                await msg.edit(`❌ فشل النقل: \`${e.message}\``);
            }
        }
    },

    // ── vcmutemember — كتم عضو من لوحة التحكم ────────────────────
    {
        name: 'vcmutemember', aliases: ['servermute', 'muteinvc'],
        description: 'كتم عضو في القناة الصوتية (Server Mute)', category: 'صوت',
        async execute(message, args, cm) {
            const memberId = args[1]?.replace(/\D/g, '');
            if (!memberId) return message.reply(`❌ \`${cm.getMainPrefix()}vcmutemember <user_id>\``);
            if (!message.guild) return message.reply('❌ للسيرفرات فقط.');
            try {
                const member = await message.guild.members.fetch(memberId);
                await member.voice.setMute(true, 'Snodix mute');
                return message.reply(`✅ **تم كتم** \`${member.user.username}\` في الفويس.`);
            } catch (e) {
                return message.reply(`❌ فشل: \`${e.message}\``);
            }
        }
    },

    // ── vcunmutemember — رفع كتم عضو ─────────────────────────────
    {
        name: 'vcunmutemember', aliases: ['serverunmute', 'unmuteinvc'],
        description: 'رفع كتم عضو في القناة الصوتية', category: 'صوت',
        async execute(message, args, cm) {
            const memberId = args[1]?.replace(/\D/g, '');
            if (!memberId) return message.reply(`❌ \`${cm.getMainPrefix()}vcunmutemember <user_id>\``);
            if (!message.guild) return message.reply('❌ للسيرفرات فقط.');
            try {
                const member = await message.guild.members.fetch(memberId);
                await member.voice.setMute(false, 'Snodix unmute');
                return message.reply(`✅ **تم رفع كتم** \`${member.user.username}\` في الفويس.`);
            } catch (e) {
                return message.reply(`❌ فشل: \`${e.message}\``);
            }
        }
    },

    // ── vcdeafmember — إصمام عضو ─────────────────────────────────
    {
        name: 'vcdeafmember', aliases: ['serverdeafen', 'deafinvc'],
        description: 'إصمام عضو في القناة الصوتية (Server Deafen)', category: 'صوت',
        async execute(message, args, cm) {
            const memberId = args[1]?.replace(/\D/g, '');
            if (!memberId) return message.reply(`❌ \`${cm.getMainPrefix()}vcdeafmember <user_id>\``);
            if (!message.guild) return message.reply('❌ للسيرفرات فقط.');
            try {
                const member = await message.guild.members.fetch(memberId);
                await member.voice.setDeaf(true, 'Snodix deafen');
                return message.reply(`✅ **تم إصمام** \`${member.user.username}\` في الفويس.`);
            } catch (e) {
                return message.reply(`❌ فشل: \`${e.message}\``);
            }
        }
    },

    // ── vcbitrate — تغيير Bitrate ─────────────────────────────────
    {
        name: 'vcbitrate', aliases: ['setbitrate2', 'bitratevc'],
        description: 'تغيير جودة الصوت (Bitrate) للقناة الحالية', category: 'صوت',
        async execute(message, args, cm) {
            const val = parseInt(args[1]);
            if (!val || val < 8 || val > 384)
                return message.reply(`❌ \`${cm.getMainPrefix()}vcbitrate <8-384>\` (كيلوبت/ث)`);
            const conn = message.guild ? getConn(message.guild.id) : null;
            if (!conn) return message.reply('❌ البوت غير متصل بقناة صوتية.');
            try {
                await conn.channel.setBitrate(val * 1000);
                return message.reply(`✅ **تم ضبط Bitrate على** \`${val}kbps\` في \`${conn.channel.name}\``);
            } catch (e) {
                return message.reply(`❌ فشل: \`${e.message}\``);
            }
        }
    },

    // ── vcuserlimit — تحديد عدد الأعضاء ─────────────────────────
    {
        name: 'vcuserlimit', aliases: ['setlimitvc', 'vclimit'],
        description: 'تحديد الحد الأقصى لأعضاء القناة الصوتية', category: 'صوت',
        async execute(message, args, cm) {
            const limit = parseInt(args[1]);
            if (isNaN(limit) || limit < 0 || limit > 99)
                return message.reply(`❌ \`${cm.getMainPrefix()}vcuserlimit <0-99>\` (0 = بلا حد)`);
            const conn = message.guild ? getConn(message.guild.id) : null;
            if (!conn) return message.reply('❌ البوت غير متصل بقناة صوتية.');
            try {
                await conn.channel.setUserLimit(limit);
                return message.reply(`✅ **تم ضبط حد الأعضاء على** \`${limit || 'بلا حد'}\` في \`${conn.channel.name}\``);
            } catch (e) {
                return message.reply(`❌ فشل: \`${e.message}\``);
            }
        }
    },

    // ── vcrename — تسمية القناة الصوتية ──────────────────────────
    {
        name: 'vcrename', aliases: ['renamevc', 'vcname'],
        description: 'تغيير اسم القناة الصوتية الحالية', category: 'صوت',
        async execute(message, args, cm) {
            const name = args.slice(1).join(' ');
            if (!name) return message.reply(`❌ \`${cm.getMainPrefix()}vcrename <الاسم_الجديد>\``);
            const conn = message.guild ? getConn(message.guild.id) : null;
            if (!conn) return message.reply('❌ البوت غير متصل بقناة صوتية.');
            try {
                const oldName = conn.channel.name;
                await conn.channel.setName(name);
                return message.reply(`✅ **تم تغيير الاسم:** \`${oldName}\` → \`${name}\``);
            } catch (e) {
                return message.reply(`❌ فشل: \`${e.message}\``);
            }
        }
    },

    // ── vcconnections — الاتصالات الصوتية النشطة ─────────────────
    {
        name: 'vcconnections', aliases: ['activevc', 'vcactive'],
        description: 'عرض جميع الاتصالات الصوتية النشطة للبوت', category: 'صوت',
        execute(message) {
            if (!connections.size) return message.reply('📴 لا توجد اتصالات صوتية نشطة.');
            const lines = [...connections.values()].map((c, i) =>
                `\`${i + 1}\` **${c.channel.name}** — ${c.channel.guild?.name || c.guildId} — ${fmtDur(Date.now() - c.joinTime)}`
            ).join('\n');
            return message.reply(`**🔊 الاتصالات الصوتية النشطة (${connections.size}):**\n${lines}`);
        }
    },

    // ── vckick — طرد من القناة الصوتية ───────────────────────────
    {
        name: 'vckick', aliases: ['kickvc', 'disconnectmember'],
        description: 'طرد عضو من القناة الصوتية', category: 'صوت',
        async execute(message, args, cm) {
            const memberId = args[1]?.replace(/\D/g, '');
            if (!memberId) return message.reply(`❌ \`${cm.getMainPrefix()}vckick <user_id>\``);
            if (!message.guild) return message.reply('❌ للسيرفرات فقط.');
            try {
                const member = await message.guild.members.fetch(memberId);
                await member.voice.disconnect('Snodix kick');
                return message.reply(`✅ **تم طرد** \`${member.user.username}\` من القناة الصوتية.`);
            } catch (e) {
                return message.reply(`❌ فشل: \`${e.message}\``);
            }
        }
    },

    // ── vcmassdeafen — إصمام جماعي ───────────────────────────────
    {
        name: 'vcmassdeafen', aliases: ['massdeafen', 'deafenall'],
        description: 'إصمام جميع أعضاء القناة الصوتية', category: 'صوت',
        async execute(message) {
            const conn = message.guild ? getConn(message.guild.id) : null;
            if (!conn) return message.reply('❌ البوت غير متصل بقناة صوتية.');
            const members = [...(conn.channel.members?.values() || [])].filter(m => m.id !== message.client.user.id);
            let done = 0;
            for (const m of members) {
                try { await m.voice.setDeaf(true); done++; await sleep(800); } catch {}
            }
            return message.reply(`✅ **تم إصمام ${done}/${members.length} عضو.**`);
        }
    },

    // ── vcmassmute — كتم جماعي ────────────────────────────────────
    {
        name: 'vcmassmute', aliases: ['massmutevoice', 'muteall'],
        description: 'كتم جميع أعضاء القناة الصوتية', category: 'صوت',
        async execute(message) {
            const conn = message.guild ? getConn(message.guild.id) : null;
            if (!conn) return message.reply('❌ البوت غير متصل بقناة صوتية.');
            const members = [...(conn.channel.members?.values() || [])].filter(m => m.id !== message.client.user.id);
            let done = 0;
            for (const m of members) {
                try { await m.voice.setMute(true); done++; await sleep(800); } catch {}
            }
            return message.reply(`✅ **تم كتم ${done}/${members.length} عضو.**`);
        }
    },

    // ── vcunmutall — رفع الكتم عن الكل ──────────────────────────
    {
        name: 'vcunmuteall', aliases: ['unmuteallvc', 'unmutemass'],
        description: 'رفع الكتم عن جميع أعضاء القناة الصوتية', category: 'صوت',
        async execute(message) {
            const conn = message.guild ? getConn(message.guild.id) : null;
            if (!conn) return message.reply('❌ البوت غير متصل بقناة صوتية.');
            const members = [...(conn.channel.members?.values() || [])];
            let done = 0;
            for (const m of members) {
                try { await m.voice.setMute(false); done++; await sleep(700); } catch {}
            }
            return message.reply(`✅ **تم رفع الكتم عن ${done} عضو.**`);
        }
    },

    // ── vcnukeroom — حذف القناة الصوتية وإعادة إنشاؤها ───────────
    {
        name: 'vcnukeroom', aliases: ['nukevoice', 'resetvc'],
        description: 'حذف القناة الصوتية الحالية وإعادة إنشاؤها', category: 'صوت',
        async execute(message, args) {
            if (args[1] !== 'confirm')
                return message.reply('⚠️ للتأكيد: `!vcnukeroom confirm` — سيحذف القناة وينشئها من جديد.');
            const conn = message.guild ? getConn(message.guild.id) : null;
            if (!conn) return message.reply('❌ البوت غير متصل بقناة صوتية.');
            const ch = conn.channel;
            const msg = await message.reply('☢️ جاري إعادة ضبط القناة...');
            try {
                const newCh = await ch.guild.channels.create({
                    name: ch.name, type: 2,
                    parent: ch.parentId, bitrate: ch.bitrate,
                    userLimit: ch.userLimit, position: ch.position
                });
                await ch.delete();
                await doJoin(message, newCh.id);
                await msg.edit(`✅ **تم إعادة إنشاء القناة:** \`${newCh.name}\``);
            } catch (e) {
                await msg.edit(`❌ فشل: \`${e.message}\``);
            }
        }
    },
];
