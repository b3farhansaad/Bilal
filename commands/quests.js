// ╔══════════════════════════════════════════════════════════════╗
// ║   Snodix Ultra Legend v5 — Discord Quests Auto-Completer    ║
// ║   يكمّل الكويستات تلقائياً بدون ما تفتح اللعبة             ║
// ╚══════════════════════════════════════════════════════════════╝
'use strict';

const https = require('https');

// ── مساعد HTTP مباشر لـ Discord API ─────────────────────────────
function discordRequest(token, method, path, body = null) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'discord.com',
            port: 443,
            path: `/api/v10${path}`,
            method: method.toUpperCase(),
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9228 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36',
                'X-Super-Properties': Buffer.from(JSON.stringify({
                    os: 'Windows', browser: 'Discord Client',
                    release_channel: 'stable', client_version: '1.0.9228',
                    os_version: '10.0.19045', system_locale: 'en-US',
                    has_client_mods: false, client_build_number: 512062,
                })).toString('base64'),
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
            },
            timeout: 15000,
        };
        const req = https.request(options, res => {
            let raw = '';
            res.on('data', d => raw += d);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
                catch { resolve({ status: res.statusCode, body: raw }); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
        if (data) req.write(data);
        req.end();
    });
}

// ── جلب الكويستات الحالية ─────────────────────────────────────────
async function fetchQuests(token) {
    const res = await discordRequest(token, 'GET', '/quests/@me');
    if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.body)}`);
    return res.body;
}

// ── قبول كويست ───────────────────────────────────────────────────
async function enrollQuest(token, questId, isAndroid = false) {
    return discordRequest(token, 'POST', `/quests/${questId}/enroll`, {
        location: isAndroid ? 12 : 11,
        is_targeted: false,
        metadata_raw: null,
        metadata_sealed: null,
    });
}

// ── إرسال video-progress ─────────────────────────────────────────
async function sendVideoProgress(token, questId, timestamp) {
    return discordRequest(token, 'POST', `/quests/${questId}/video-progress`, { timestamp });
}

// ── إرسال heartbeat للألعاب ──────────────────────────────────────
async function sendHeartbeat(token, questId, appId, terminal = false) {
    return discordRequest(token, 'POST', `/quests/${questId}/heartbeat`, {
        application_id: appId,
        terminal,
    });
}

// ── إرسال heartbeat للـ activity ────────────────────────────────
async function sendActivityHeartbeat(token, questId, terminal = false) {
    return discordRequest(token, 'POST', `/quests/${questId}/heartbeat`, {
        stream_key: 'call:1:1',
        terminal,
    });
}

// ── المساعدات ───────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function formatTime(seconds) {
    if (seconds < 60) return `${seconds} ثانية`;
    const m = Math.floor(seconds / 60), s = seconds % 60;
    return s > 0 ? `${m}د ${s}ث` : `${m} دقيقة`;
}

function getTaskName(taskConfig) {
    const order = [
        'WATCH_VIDEO', 'PLAY_ON_DESKTOP', 'PLAY_ON_XBOX',
        'PLAY_ON_PLAYSTATION', 'PLAY_ACTIVITY',
        'WATCH_VIDEO_ON_MOBILE', 'ACHIEVEMENT_IN_ACTIVITY',
    ];
    return order.find(t => taskConfig?.tasks?.[t] != null) || null;
}

// ── أيقونات أنواع المهام ────────────────────────────────────────
const TASK_ICONS = {
    WATCH_VIDEO:           '🎥 مشاهدة فيديو',
    WATCH_VIDEO_ON_MOBILE: '📱 مشاهدة فيديو (موبايل)',
    PLAY_ON_DESKTOP:       '🖥️ تشغيل لعبة (Desktop)',
    PLAY_ON_XBOX:          '🎮 تشغيل لعبة (Xbox)',
    PLAY_ON_PLAYSTATION:   '🎮 تشغيل لعبة (PlayStation)',
    PLAY_ACTIVITY:         '🎯 تشغيل نشاط',
    ACHIEVEMENT_IN_ACTIVITY:'🏆 إنجاز في نشاط',
    STREAM_ON_DESKTOP:     '📺 بث مباشر',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  منطق إتمام الكويستات
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── إتمام كويست مشاهدة فيديو ─────────────────────────────────────
async function completeVideoQuest(token, quest, onProgress) {
    const taskName = quest.config.task_config_v2
        ? (quest.config.task_config_v2.tasks.WATCH_VIDEO_ON_MOBILE ? 'WATCH_VIDEO_ON_MOBILE' : 'WATCH_VIDEO')
        : 'WATCH_VIDEO';

    const cfg = quest.config.task_config_v2 || quest.config.task_config;
    const secondsNeeded = cfg?.tasks?.[taskName]?.target || 60;
    let secondsDone = quest.user_status?.progress?.[taskName]?.value ?? 0;

    const maxFuture = 10, speed = 7, interval = 1;
    const enrolledAt = new Date(quest.user_status?.enrolled_at).getTime();
    let completed = false;

    onProgress?.(`🎥 جاري محاكاة مشاهدة الفيديو... (${secondsNeeded}ث مطلوبة)`);

    while (!completed) {
        const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;
        const diff = maxAllowed - secondsDone;
        const timestamp = secondsDone + speed;

        if (diff >= speed) {
            const res = await sendVideoProgress(token, quest.id, Math.min(secondsNeeded, timestamp + Math.random()));
            completed = res.body?.completed_at != null;
            secondsDone = Math.min(secondsNeeded, timestamp);
            const pct = Math.round((secondsDone / secondsNeeded) * 100);
            onProgress?.(`🎥 تقدم: ${secondsDone}/${secondsNeeded}ث (${pct}%)`);
        }

        if (timestamp >= secondsNeeded) break;
        await sleep(interval * 1000);
    }

    if (!completed) {
        await sendVideoProgress(token, quest.id, secondsNeeded);
    }
}

// ── إتمام كويست تشغيل لعبة على المنصات ──────────────────────────
async function completeGameQuest(token, quest, taskName, onProgress) {
    const cfg = quest.config.task_config_v2 || quest.config.task_config;
    const secondsNeeded = cfg?.tasks?.[taskName]?.target || 900;
    const appId = quest.config.application?.id;
    const appName = quest.config.application?.name || 'اللعبة';
    const interval = 20; // 20 ثانية بين كل heartbeat

    onProgress?.(`🖥️ جاري محاكاة تشغيل "${appName}"... المطلوب: ${formatTime(secondsNeeded)}`);

    let secondsDone = quest.user_status?.progress?.[taskName]?.value ?? 0;
    let isCompleted = Boolean(quest.user_status?.completed_at);

    while (!isCompleted) {
        const res = await sendHeartbeat(token, quest.id, appId, false);
        if (res.status !== 200) {
            onProgress?.(`⚠️ خطأ في الـ heartbeat: HTTP ${res.status}`);
            await sleep(5000);
            continue;
        }

        const newStatus = res.body;
        secondsDone = newStatus?.progress?.[taskName]?.value ?? secondsDone;
        isCompleted = Boolean(newStatus?.completed_at);
        const remaining = Math.max(0, secondsNeeded - secondsDone);
        onProgress?.(`🖥️ "${appName}" — ${Math.round(secondsDone)}/${secondsNeeded}ث | متبقي: ${formatTime(Math.ceil(remaining))}`);

        if (isCompleted) break;
        await sleep(interval * 1000);
    }

    // إرسال terminal heartbeat
    await sendHeartbeat(token, quest.id, appId, true).catch(() => {});
}

// ── إتمام كويست activity ─────────────────────────────────────────
async function completeActivityQuest(token, quest, onProgress) {
    const taskName = 'PLAY_ACTIVITY';
    const cfg = quest.config.task_config_v2 || quest.config.task_config;
    const secondsNeeded = cfg?.tasks?.[taskName]?.target || 900;
    const appName = quest.config.application?.name || 'النشاط';
    const interval = 20;

    onProgress?.(`🎯 جاري محاكاة نشاط "${appName}"...`);

    let secondsDone = quest.user_status?.progress?.[taskName]?.value ?? 0;
    let isCompleted = Boolean(quest.user_status?.completed_at);

    while (!isCompleted) {
        const res = await sendActivityHeartbeat(token, quest.id, false);
        if (res.status !== 200) {
            await sleep(5000);
            continue;
        }
        const newStatus = res.body;
        secondsDone = newStatus?.progress?.[taskName]?.value ?? secondsDone;
        isCompleted = Boolean(newStatus?.completed_at);
        const remaining = Math.max(0, secondsNeeded - secondsDone);
        onProgress?.(`🎯 "${appName}" — ${Math.round(secondsDone)}/${secondsNeeded}ث | متبقي: ${formatTime(Math.ceil(remaining))}`);

        if (isCompleted) break;
        await sleep(interval * 1000);
    }

    await sendActivityHeartbeat(token, quest.id, true).catch(() => {});
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  الأوامر
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = [

    // ─── !questlist — عرض الكويستات الحالية ──────────────────────
    {
        name: 'questlist',
        aliases: ['quests', 'كويستات', 'قائمة_كويست', 'questinfo'],
        description: 'عرض كويستات ديسكورد النشطة مع حالتها', category: 'كويست',
        async execute(message) {
            const token = message.client.token;
            const msg = await message.reply('🔍 **جاري جلب الكويستات...**');
            try {
                const data = await fetchQuests(token);
                const all = data.quests || [];

                if (all.length === 0) {
                    return msg.edit('📋 **لا يوجد كويستات نشطة حالياً.**');
                }

                const now = Date.now();
                const lines = all.map((q, i) => {
                    const name     = q.config?.messages?.quest_name || 'كويست غير معروف';
                    const expires  = new Date(q.config?.expires_at);
                    const daysLeft = Math.max(0, Math.ceil((expires - now) / 86400000));
                    const done     = Boolean(q.user_status?.completed_at);
                    const enrolled = Boolean(q.user_status?.enrolled_at);
                    const claimed  = Boolean(q.user_status?.claimed_at);
                    const cfg      = q.config?.task_config_v2 || q.config?.task_config;
                    const taskName = getTaskName(cfg) || '?';
                    const progress = q.user_status?.progress?.[taskName]?.value ?? 0;
                    const target   = cfg?.tasks?.[taskName]?.target ?? 0;

                    const statusIcon = done ? (claimed ? '✅✅' : '✅') : (enrolled ? '🔄' : '⬜');
                    const pct = target > 0 ? ` (${Math.round((progress / target) * 100)}%)` : '';

                    return [
                        `${statusIcon} **${i + 1}. ${name}**`,
                        `> 📋 ${TASK_ICONS[taskName] || taskName}${pct} | ⏳ ${daysLeft}د متبقية`,
                        done ? '> **مكتمل** ✅' : (enrolled ? `> ${Math.round(progress)}/${target}ث` : '> لم تنضم بعد'),
                    ].join('\n');
                });

                const DIVIDER = '━'.repeat(36);
                return msg.edit([
                    `**${DIVIDER}**`,
                    `**🎯 كويستات Discord — ${all.length} كويست**`,
                    `**${DIVIDER}**`,
                    '',
                    lines.join('\n\n'),
                    '',
                    `**${DIVIDER}**`,
                    `✅ مكتمل | 🔄 جاري | ⬜ لم تنضم | ✅✅ تم الاستلام`,
                    `> \`!questdo\` لإتمام كل الكويستات تلقائياً 🚀`,
                ].join('\n').slice(0, 1980));
            } catch (err) {
                return msg.edit(`❌ **فشل جلب الكويستات**\n> ${err.message}`);
            }
        }
    },

    // ─── !questdo — إتمام كل الكويستات تلقائياً ─────────────────
    {
        name: 'questdo',
        aliases: ['questrun', 'questauto', 'حل_كويست', 'اتمام_كويست', 'quest'],
        description: 'إتمام جميع كويستات Discord تلقائياً', category: 'كويست',
        async execute(message, args) {
            const token = message.client.token;
            const msg   = await message.reply('🚀 **جاري فحص الكويستات...**');

            try {
                const data = await fetchQuests(token);
                const all  = data.quests || [];

                if (data.quest_enrollment_blocked_until) {
                    return msg.edit(`⛔ **محظور من قبول الكويستات حتى:**\n> ${new Date(data.quest_enrollment_blocked_until).toLocaleString('ar-EG')}`);
                }

                // فلترة الكويستات اللي ممكن يتمها
                const valid = all.filter(q => {
                    if (q.user_status?.completed_at) return false;
                    if (new Date(q.config?.expires_at) <= new Date()) return false;
                    const cfg = q.config?.task_config_v2 || q.config?.task_config;
                    const task = getTaskName(cfg);
                    return task && task !== 'STREAM_ON_DESKTOP';
                });

                if (valid.length === 0) {
                    const done = all.filter(q => q.user_status?.completed_at).length;
                    return msg.edit([
                        '📋 **لا يوجد كويستات معلقة.**',
                        `> ✅ مكتمل: **${done}** | 📋 إجمالي: **${all.length}**`,
                        '> جرب `!questlist` لعرض الوضع الكامل.',
                    ].join('\n'));
                }

                await msg.edit([
                    `**🚀 تم العثور على ${valid.length} كويست قابل للإتمام!**`,
                    `> سيتم إتمامها واحدة تلو الأخرى...`,
                    `> ⚠️ لا تغلق البوت أثناء العملية.`,
                ].join('\n'));

                let completed = 0, failed = 0;

                for (const quest of valid) {
                    const qName = quest.config?.messages?.quest_name || `كويست ${quest.id}`;
                    const cfg   = quest.config?.task_config_v2 || quest.config?.task_config;
                    const taskName = getTaskName(cfg);

                    await msg.edit(`⏳ **[${completed + failed + 1}/${valid.length}] جاري: "${qName}"**\n> 📋 النوع: ${TASK_ICONS[taskName] || taskName}`);

                    try {
                        // قبول الكويست لو ما اشتركناش فيه
                        if (!quest.user_status?.enrolled_at) {
                            const isAndroid = taskName === 'WATCH_VIDEO_ON_MOBILE' && !cfg?.tasks?.WATCH_VIDEO;
                            await enrollQuest(token, quest.id, isAndroid);
                            await sleep(2000);
                            // تحديث بيانات الكويست
                            const updated = await fetchQuests(token);
                            const freshQuest = updated.quests?.find(q => q.id === quest.id);
                            if (freshQuest) Object.assign(quest, freshQuest);
                        }

                        const progressUpdater = async text => {
                            await msg.edit(`⏳ **[${completed + failed + 1}/${valid.length}] "${qName}"**\n> ${text}`).catch(() => {});
                        };

                        // تحديد طريقة الإتمام
                        if (taskName === 'WATCH_VIDEO' || taskName === 'WATCH_VIDEO_ON_MOBILE') {
                            await completeVideoQuest(token, quest, progressUpdater);
                        } else if (['PLAY_ON_DESKTOP', 'PLAY_ON_XBOX', 'PLAY_ON_PLAYSTATION'].includes(taskName)) {
                            await completeGameQuest(token, quest, taskName, progressUpdater);
                        } else if (taskName === 'PLAY_ACTIVITY') {
                            await completeActivityQuest(token, quest, progressUpdater);
                        } else if (taskName === 'ACHIEVEMENT_IN_ACTIVITY') {
                            await msg.edit(`⚠️ **[${completed + failed + 1}/${valid.length}] "${qName}"**\n> 🏆 نوع الإنجاز — يحتاج تحقيق داخل اللعبة يدوياً.`);
                            failed++;
                            continue;
                        }

                        completed++;
                        await msg.edit([
                            `✅ **[${completed + failed}/${valid.length}] اكتمل: "${qName}"**`,
                            `> 🎉 تم إتمام الكويست بنجاح!`,
                            completed + failed < valid.length ? `> ⏳ الكويست التالي...` : '',
                        ].filter(Boolean).join('\n'));

                        await sleep(3000);
                    } catch (err) {
                        failed++;
                        await msg.edit(`❌ **[${completed + failed}/${valid.length}] فشل: "${qName}"**\n> ${err.message}`);
                        await sleep(2000);
                    }
                }

                return msg.edit([
                    '**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**',
                    `**🏁 انتهت عملية إتمام الكويستات!**`,
                    '**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**',
                    '',
                    `✅ **اكتمل:** ${completed} كويست`,
                    failed > 0 ? `❌ **فشل:** ${failed} كويست` : '',
                    '',
                    `> استخدم \`!questlist\` لمراجعة الحالة النهائية.`,
                ].filter(Boolean).join('\n'));

            } catch (err) {
                return msg.edit(`❌ **خطأ في إتمام الكويستات**\n> ${err.message}`);
            }
        }
    },

    // ─── !questenroll — الانضمام لكويست معين ─────────────────────
    {
        name: 'questenroll',
        aliases: ['questjoin', 'انضم_كويست'],
        description: 'الانضمام لكويست معين بالـ ID أو الرقم', category: 'كويست',
        async execute(message, args) {
            const token  = message.client.token;
            const input  = args[1];
            if (!input) return message.reply('❌ **الاستخدام:** `!questenroll <رقم_من_questlist أو quest_id>`');

            const msg = await message.reply('🔍 **جاري الانضمام...**');
            try {
                const data = await fetchQuests(token);
                const all  = data.quests || [];

                let quest;
                if (/^\d+$/.test(input) && parseInt(input) <= all.length) {
                    quest = all[parseInt(input) - 1];
                } else {
                    quest = all.find(q => q.id === input);
                }

                if (!quest) return msg.edit(`❌ **لم يُعثر على الكويست.**\n> استخدم \`!questlist\` لمعرفة الأرقام.`);

                const name = quest.config?.messages?.quest_name || quest.id;

                if (quest.user_status?.enrolled_at)
                    return msg.edit(`⚠️ **أنت منضم بالفعل في كويست "${name}".**`);

                const cfg     = quest.config?.task_config_v2 || quest.config?.task_config;
                const task    = getTaskName(cfg);
                const isAndroid = task === 'WATCH_VIDEO_ON_MOBILE' && !cfg?.tasks?.WATCH_VIDEO;

                await enrollQuest(token, quest.id, isAndroid);
                return msg.edit([
                    `✅ **تم الانضمام لكويست "${name}"!**`,
                    `> 📋 النوع: ${TASK_ICONS[task] || task}`,
                    `> 🚀 استخدم \`!questdo\` لإتمامه تلقائياً.`,
                ].join('\n'));
            } catch (err) {
                return msg.edit(`❌ **فشل الانضمام**\n> ${err.message}`);
            }
        }
    },

    // ─── !queststatus — حالة كويست واحد بالتفصيل ─────────────────
    {
        name: 'queststatus',
        aliases: ['questprogress', 'حالة_كويست'],
        description: 'عرض تفاصيل وتقدم كويست معين', category: 'كويست',
        async execute(message, args) {
            const token = message.client.token;
            const input = args[1];
            if (!input) return message.reply('❌ **الاستخدام:** `!queststatus <رقم>`');

            const msg = await message.reply('🔍 **جاري الجلب...**');
            try {
                const data = await fetchQuests(token);
                const all  = data.quests || [];

                let quest;
                if (/^\d+$/.test(input) && parseInt(input) <= all.length) {
                    quest = all[parseInt(input) - 1];
                } else {
                    quest = all.find(q => q.id === input);
                }

                if (!quest) return msg.edit(`❌ **لم يُعثر على الكويست.**`);

                const name    = quest.config?.messages?.quest_name || quest.id;
                const expires = new Date(quest.config?.expires_at);
                const daysLeft = Math.max(0, Math.ceil((expires - Date.now()) / 86400000));
                const done     = Boolean(quest.user_status?.completed_at);
                const enrolled = Boolean(quest.user_status?.enrolled_at);
                const claimed  = Boolean(quest.user_status?.claimed_at);
                const cfg      = quest.config?.task_config_v2 || quest.config?.task_config;
                const taskName = getTaskName(cfg) || '?';
                const progress = quest.user_status?.progress?.[taskName]?.value ?? 0;
                const target   = cfg?.tasks?.[taskName]?.target ?? 0;
                const pct      = target > 0 ? Math.round((progress / target) * 100) : 0;
                const rewards  = quest.config?.rewards_config?.rewards?.map(r => r.type)?.join(', ') || 'غير معروف';

                const DIVIDER = '━'.repeat(34);
                return msg.edit([
                    `**${DIVIDER}**`,
                    `**🎯 ${name}**`,
                    `**${DIVIDER}**`,
                    '',
                    `📋 **النوع:** ${TASK_ICONS[taskName] || taskName}`,
                    `⏳ **ينتهي:** ${expires.toLocaleDateString('ar-EG')} (${daysLeft} يوم)`,
                    `🏆 **المكافأة:** \`${rewards}\``,
                    '',
                    `**📊 التقدم:**`,
                    `> ${done ? '✅ **مكتمل!**' : `${Math.round(progress)} / ${target}ث — **${pct}%**`}`,
                    enrolled ? `> 📅 انضممت: ${new Date(quest.user_status.enrolled_at).toLocaleDateString('ar-EG')}` : '> ⬜ لم تنضم بعد',
                    claimed ? '> ✅✅ تم استلام المكافأة' : (done ? '> 🎁 المكافأة بانتظار الاستلام' : ''),
                    '',
                    done ? '' : `> \`!questdo\` لإتمامه تلقائياً 🚀`,
                ].filter(s => s !== undefined).join('\n').slice(0, 1980));
            } catch (err) {
                return msg.edit(`❌ ${err.message}`);
            }
        }
    },

    // ─── !questhelp — شرح طريقة حل الكويستات ────────────────────
    {
        name: 'questhelp',
        aliases: ['كيف_كويست', 'شرح_كويست'],
        description: 'شرح مفصّل لطريقة حل كويستات Discord', category: 'كويست',
        execute(message, args, cm) {
            const prefix = cm.getMainPrefix();
            return message.reply([
                '**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**',
                '**🎯 دليل حل كويستات Discord — Snodix v5**',
                '**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**',
                '',
                '**📋 الأوامر المتاحة:**',
                `\`${prefix}questlist\` — عرض كل الكويستات النشطة`,
                `\`${prefix}questdo\` — إتمام كل الكويستات تلقائياً 🚀`,
                `\`${prefix}questenroll <رقم>\` — الانضمام لكويست معين`,
                `\`${prefix}queststatus <رقم>\` — حالة وتقدم كويست محدد`,
                '',
                '**🔧 أنواع الكويستات وطريقة حلها:**',
                '',
                '**🎥 WATCH_VIDEO / WATCH_VIDEO_ON_MOBILE:**',
                '> البوت يرسل timestamps متسارعة لـ Discord',
                '> يكمل بسرعة (ثوانٍ معدودة)',
                '> لا تحتاج فتح اللعبة أو الفيديو',
                '',
                '**🖥️ PLAY_ON_DESKTOP / XBOX / PlayStation:**',
                '> البوت يرسل heartbeat كل 20 ثانية',
                '> يمحاكي وجود اللعبة شغّالة',
                '> يكمل بعد ~15 دقيقة تلقائياً',
                '',
                '**🎯 PLAY_ACTIVITY:**',
                '> نفس آلية الـ heartbeat بـ stream_key',
                '> يكمل بعد ~15 دقيقة تلقائياً',
                '',
                '**🏆 ACHIEVEMENT_IN_ACTIVITY:**',
                '> يحتاج تحقيق إنجاز داخل اللعبة يدوياً',
                '> البوت لا يستطيع إتمامه تلقائياً',
                '',
                '**📺 STREAM_ON_DESKTOP:**',
                '> يحتاج بث حقيقي من تطبيق Discord',
                '> غير مدعوم تلقائياً',
                '',
                '**⚠️ تحذير مهم:**',
                '> استخدام هذه الأوامر قد ينتهك شروط Discord',
                '> يُستخدم على مسؤوليتك الخاصة',
                '**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**',
            ].join('\n').slice(0, 1980));
        }
    },
];
