const fs = require('fs');
const path = require('path');
const { RichPresence } = require('discord.js-selfbot-v13');

const dataDir = require('../utils/dataDir');
const rpcPath = dataDir('rpcConfig.json');
let rotateInterval = null;
let keepAliveInterval = null;
let activeClient = null;

// ============ الإعدادات الافتراضية ============
function getDefaultRPC() {
    return {
        enabled: false,
        type: 'PLAYING',
        name: 'Discord',
        details: '',
        state: '',
        imageUrl: '',
        imageText: '',
        smallImageUrl: '',
        smallImageText: '',
        buttons: [null, null],
        startTimestamp: null,
        rotate: [],
        rotateInterval: 30,
        // Spoofing Settings
        spoofing: {
            enabled: false,
            type: null, // 'minecraft', 'genshin', 'crunchyroll', 'playstation'
            platform: null
        },
        // Custom Spoofing Settings (لـ Crunchyroll و PlayStation و Roblox)
        customSpoof: {
            crunchyroll: {
                name: 'Crunchyroll',
                details: '',
                state: '',
                imageUrl: '',
                imageText: '',
                smallImageUrl: '',
                smallImageText: ''
            },
            playstation: {
                name: 'PlayStation',
                details: '',
                state: '',
                imageUrl: '',
                imageText: '',
                smallImageUrl: '',
                smallImageText: ''
            },
            roblox: {
                name: 'Roblox',
                details: '',
                state: '',
                imageUrl: '',
                imageText: '',
                smallImageUrl: '',
                smallImageText: ''
            }
        }
    };
}

function loadRPC() {
    try {
        if (fs.existsSync(rpcPath)) {
            const data = JSON.parse(fs.readFileSync(rpcPath, 'utf8'));
            return { ...getDefaultRPC(), ...data };
        }
    } catch {}
    return getDefaultRPC();
}

function saveRPC(data) {
    try {
        fs.mkdirSync(path.dirname(rpcPath), { recursive: true });
        fs.writeFileSync(rpcPath, JSON.stringify(data, null, 2));
    } catch (err) { console.error('❌ خطأ حفظ RPC:', err.message); }
}

// ============ تحويل الأنواع ============
const TYPE_MAP = {
    'PLAYING': 0,
    'STREAMING': 1,
    'LISTENING': 2,
    'WATCHING': 3,
    'COMPETING': 5
};

const TYPE_STR_MAP = {
    'playing': 'PLAYING',
    'streaming': 'STREAMING',
    'listening': 'LISTENING',
    'watching': 'WATCHING',
    'competing': 'COMPETING',
    'custom': 'CUSTOM'
};

const TYPE_EMOJI = {
    'PLAYING': '🎮',
    'STREAMING': '📺',
    'LISTENING': '🎵',
    'WATCHING': '👁️',
    'COMPETING': '🏆',
    'CUSTOM': '✨'
};

const TYPE_AR = {
    'PLAYING': 'يلعب',
    'STREAMING': 'يبث',
    'LISTENING': 'يسمع',
    'WATCHING': 'يشاهد',
    'COMPETING': 'ينافس',
    'CUSTOM': 'مخصص'
};

// ============ Spoofing Games & Apps Configuration ============
const SPOOF_APPS = {
    minecraft: {
        name: 'Minecraft',
        applicationId: '1402418491272986635',
        iconUrl: 'https://cdn.discordapp.com/app-icons/1402418491272986635/166fbad351ecdd02d11a3b464748f66b.png?size=240&keep_aspect_ratio=false',
        emoji: '⛏️',
        description: 'لعبة Minecraft الرسمية',
        isCustomizable: false // ثابت - مش بيتعدل
    },
    genshin: {
        name: 'Genshin Impact',
        applicationId: '762434991303950386',
        iconUrl: 'https://cdn.discordapp.com/app-icons/762434991303950386/eb0e25b739e4fa38c1671a3d1edcd1e0.png?size=240&keep_aspect_ratio=false',
        emoji: '🌸',
        description: 'لعبة Genshin Impact الرسمية',
        isCustomizable: false // ثابت - مش بيتعدل
    },
    crunchyroll: {
        name: 'Crunchyroll',
        applicationId: '981509069309354054',
        iconUrl: null, // يتعدل من المستخدم
        emoji: '📺',
        description: 'تطبيق Crunchyroll',
        isCustomizable: true // قابل للتخصيص
    },
    playstation: {
        name: 'PlayStation',
        applicationId: '1008890872156405890',
        iconUrl: null, // يتعدل من المستخدم
        emoji: '🎮',
        platform: 'ps5',
        description: 'حالة PlayStation',
        isCustomizable: true // قابل للتخصيص
    },
    roblox: {
        name: 'Roblox',
        applicationId: '622700036851339286',
        iconUrl: 'https://cdn.discordapp.com/app-icons/622700036851339286/a_2a4f2cf3f8c4f1b9c0e6e6c6d6e6e6e6.png?size=240&keep_aspect_ratio=false',
        emoji: '🧱',
        description: 'لعبة Roblox الرسمية',
        isCustomizable: false // قابل للتخصيص
    }
};

// ============ نظام RPC المتكامل ✅ ============
async function applyRPC(client, config) {
    try {
        if (!client?.user) {
            console.error('❌ RPC: العميل غير متصل');
            return { success: false, error: 'العميل غير متصل' };
        }

        if (!config.enabled) {
            await client.user.setPresence({ activities: [], status: 'online' });
            if (keepAliveInterval) { clearInterval(keepAliveInterval); keepAliveInterval = null; }
            return { success: true };
        }

        // Spoofing Mode - تطبيق حالة اللعبة/التطبيق الرسمي
        if (config.spoofing?.enabled && config.spoofing?.type) {
            const spoofConfig = SPOOF_APPS[config.spoofing.type];
            if (spoofConfig) {
                return await applySpoofRPC(client, config, spoofConfig);
            }
        }

        // الوضع العادي - تطبيق الحالة المخصصة
        const rich = new RichPresence(client)
            .setApplicationId('1045800378228281345')
            .setType(TYPE_MAP[config.type] ?? 0)
            .setName((config.name || 'Discord').substring(0, 128));

        if (config.details) rich.setDetails(config.details.substring(0, 128));
        if (config.state) rich.setState(config.state.substring(0, 128));

        // التايمر
        if (config.startTimestamp) {
            rich.setStartTimestamp(new Date(Number(config.startTimestamp)));
        }

        // الصور ✅ - دعم كامل لروابط Discord CDN وImgur وكل الروابط
        const hasLargeImage = config.imageUrl && config.imageUrl.trim();
        const hasSmallImage = config.smallImageUrl && config.smallImageUrl.trim();

        if (hasLargeImage) {
            rich.setAssetsLargeImage(config.imageUrl.trim());
            if (config.imageText) rich.setAssetsLargeText(config.imageText.substring(0, 128));
        }

        if (hasSmallImage) {
            rich.setAssetsSmallImage(config.smallImageUrl.trim());
            if (config.smallImageText) rich.setAssetsSmallText(config.smallImageText.substring(0, 128));
        }

        // الأزرار ✅ - تعمل مع جميع الأنواع
        const formattedButtons = [];
        if (config.buttons && Array.isArray(config.buttons)) {
            config.buttons.forEach((btn) => {
                if (btn && btn.label && btn.url) {
                    const label = btn.label.trim().substring(0, 32);
                    const url = btn.url.trim();

                    if (url.startsWith('http://') || url.startsWith('https://')) {
                        formattedButtons.push({ label, url });
                    }
                }
            });
        }

        // إضافة الأزرار
        if (formattedButtons.length > 0) {
            if (formattedButtons[0]) rich.addButton(formattedButtons[0].label, formattedButtons[0].url);
            if (formattedButtons[1]) rich.addButton(formattedButtons[1].label, formattedButtons[1].url);
        }

        // إرسال الحالة
        await client.user.setPresence({
            activities: [rich.toJSON()],
            status: 'online'
        });

        // نظام Keep-Alive
        if (keepAliveInterval) clearInterval(keepAliveInterval);
        keepAliveInterval = setInterval(async () => {
            try {
                if (client?.user) {
                    await client.user.setPresence({
                        activities: [rich.toJSON()],
                        status: 'online'
                    });
                }
            } catch (e) {
                console.error("RPC Keep-Alive Error:", e.message);
            }
        }, 30000);

        return { success: true };

    } catch (err) {
        console.error('❌ خطأ RPC:', err.message);
        return { success: false, error: err.message };
    }
}

// ============ Spoofing RPC Application ============
async function applySpoofRPC(client, config, spoofConfig) {
    try {
        const spoofType = config.spoofing?.type;
        const isCustomizable = spoofConfig.isCustomizable;

        // الحصول على الإعدادات المخصصة إذا كانت متاحة
        const customSettings = isCustomizable && config.customSpoof?.[spoofType]
            ? config.customSpoof[spoofType]
            : null;

        // إنشاء RichPresence للـ Spoofing
        const rich = new RichPresence(client)
            .setApplicationId(spoofConfig.applicationId)
            .setType(TYPE_MAP['PLAYING']) // دائماً PLAYING للألعاب
            .setName(customSettings?.name || spoofConfig.name);

        // إضافة Details و State
        if (customSettings?.details) {
            rich.setDetails(customSettings.details.substring(0, 128));
        }
        if (customSettings?.state) {
            rich.setState(customSettings.state.substring(0, 128));
        }

        // إضافة الصورة - مخصصة أو رسمية
        const imageUrl = customSettings?.imageUrl || spoofConfig.iconUrl;
        if (imageUrl) {
            rich.setAssetsLargeImage(imageUrl);
            if (customSettings?.imageText) {
                rich.setAssetsLargeText(customSettings.imageText.substring(0, 128));
            }
        }

        // إضافة الصورة الصغيرة
        if (customSettings?.smallImageUrl) {
            rich.setAssetsSmallImage(customSettings.smallImageUrl);
            if (customSettings?.smallImageText) {
                rich.setAssetsSmallText(customSettings.smallImageText.substring(0, 128));
            }
        }

        // إضافة التايمر
        if (config.startTimestamp) {
            rich.setStartTimestamp(new Date(Number(config.startTimestamp)));
        } else {
            rich.setStartTimestamp(new Date());
        }

        // إرسال الحالة
        const activityJson = rich.toJSON();

        // إضافة Platform للـ PlayStation
        if (spoofConfig.platform) {
            activityJson.platform = spoofConfig.platform;
        }

        await client.user.setPresence({
            activities: [activityJson],
            status: 'online'
        });

        // نظام Keep-Alive
        if (keepAliveInterval) clearInterval(keepAliveInterval);
        keepAliveInterval = setInterval(async () => {
            try {
                if (client?.user) {
                    await client.user.setPresence({
                        activities: [activityJson],
                        status: 'online'
                    });
                }
            } catch (e) {
                console.error("Spoof RPC Keep-Alive Error:", e.message);
            }
        }, 30000);

        return { success: true };

    } catch (err) {
        console.error('❌ خطأ Spoof RPC:', err.message);
        return { success: false, error: err.message };
    }
}

// ============ التدوير ============
function startRotation(client, config) {
    if (rotateInterval) clearInterval(rotateInterval);
    if (!config.rotate || config.rotate.length < 2) return;

    let i = 0;
    const interval = Math.max(10, config.rotateInterval || 30) * 1000;

    rotateInterval = setInterval(async () => {
        const entry = config.rotate[i % config.rotate.length];
        i++;
        await applyRPC(client, { ...config, ...entry });
    }, interval);
}

function stopRotation() {
    if (rotateInterval) { clearInterval(rotateInterval); rotateInterval = null; }
    if (keepAliveInterval) { clearInterval(keepAliveInterval); keepAliveInterval = null; }
}

// ============ زيادة/إعادة تعيين التايمر ============
function resetTimestamp() {
    const config = loadRPC();
    config.startTimestamp = Date.now();
    saveRPC(config);
    return config.startTimestamp;
}

function boostTimestamp(addDays) {
    const config = loadRPC();
    if (!config.startTimestamp) config.startTimestamp = Date.now();
    // نطرح الوقت لإظهار مدة أطول
    config.startTimestamp = config.startTimestamp - (addDays * 24 * 60 * 60 * 1000);
    saveRPC(config);
    return config.startTimestamp;
}

// ============ مساعدة الحصول على إعداد سبوف مخصص ============
function getCustomSpoofSetting(config, type, field) {
    return config.customSpoof?.[type]?.[field] || '';
}

function setCustomSpoofSetting(config, type, field, value) {
    if (!config.customSpoof) config.customSpoof = {};
    if (!config.customSpoof[type]) config.customSpoof[type] = {};
    config.customSpoof[type][field] = value;
}

// ============ الأوامر ============
module.exports = {
    name: 'rpc',
    description: 'إدارة Rich Presence الاحترافية',
    category: 'حالة',

    async execute(message, args, commandManager) {
        const client = message.client;
        const sub = args[1]?.toLowerCase();
        const prefix = commandManager.getMainPrefix();
        const config = loadRPC();
        const isSpoofing = config.spoofing?.enabled && config.spoofing?.type;
        const spoofConfig = isSpoofing ? SPOOF_APPS[config.spoofing.type] : null;
        const isCustomizableSpoof = spoofConfig?.isCustomizable;

        // عرض الحالة
        if (!sub || ['show', 'status', 'معلومات', 'show'].includes(sub)) {
            const btns = (config.buttons || []).filter(b => b && b.label);
            const elapsed = config.startTimestamp ?
                `⏱️ ${Math.floor((Date.now() - config.startTimestamp) / 1000 / 60)} دقيقة` : '❌ متوقف';

            // تحديد حالة Spoofing
            const spoofStatus = isSpoofing
                ? spoofConfig.emoji + ' **' + SPOOF_APPS[config.spoofing.type]?.name + '**' +
                  (isCustomizableSpoof ? ' ✏️' : '') + ' (Spoofing)'
                : '❌ غير مُفعّل';

            // الحصول على النصوص المعروضة حسب الوضع
            let displayName = config.name || 'بدون';
            let displayDetails = config.details || 'بدون';
            let displayState = config.state || 'بدون';
            let displayImageUrl = config.imageUrl;
            let displaySmallImageUrl = config.smallImageUrl;

            // إذا كان Spoofing قابل للتخصيص، عرض الإعدادات المخصصة
            if (isCustomizableSpoof) {
                const customSettings = config.customSpoof?.[config.spoofing.type] || {};
                displayName = customSettings.name || spoofConfig.name;
                displayDetails = customSettings.details || 'بدون';
                displayState = customSettings.state || 'بدون';
                displayImageUrl = customSettings.imageUrl;
                displaySmallImageUrl = customSettings.smallImageUrl;
            }

            const statusMsg = [
                '**🎮 لوحة تحكم RPC المطور**',
                '',
                '⚡ **الحالة:** ' + (config.enabled ? '🟢 شغالة' : '🔴 واقفة'),
                '',
                '📝 **النص:** `' + displayName + '`',
                '🎯 **النوع:** ' + (isSpoofing ? spoofConfig.emoji + ' Spoofing' : TYPE_EMOJI[config.type] + ' ' + TYPE_AR[config.type]),
                '',
                '🎭 **Spoofing:** ' + spoofStatus,
                '',
                '📌 **Details:** `' + displayDetails + '`',
                '📌 **State:** `' + displayState + '`',
                '',
                '🔘 **الأزرار:** ' + (btns.length > 0 ? btns.map(b => '[' + b.label + ']').join(' ') : '❌ لا يوجد'),
                '',
                '🖼️ **الصورة الكبيرة:** ' + (displayImageUrl ? '✅ `' + displayImageUrl + '`' : '❌ لا يوجد'),
                '🖼️ **الصورة الصغيرة:** ' + (displaySmallImageUrl ? '✅ `' + displaySmallImageUrl + '`' : '❌ لا يوجد'),
                '',
                '🔄 **التدوير:** ' + (config.rotate?.length || 0) + ' حالة',
                elapsed,
                '',
                '📌 **ملاحظة:** ' + (isCustomizableSpoof
                    ? 'هذا التطبيق قابل للتخصيص! ✏️'
                    : 'جميع الروابط مدعومة: Discord CDN, Imgur, روابط مباشرة (.png/.jpg/.gif)')
            ].join('\n');

            return message.reply(statusMsg);
        }

        // ============ أوامر التفعيل ============
        if (sub === 'on' || sub === 'تفعيل') {
            config.enabled = true;
            if (!config.startTimestamp) config.startTimestamp = Date.now();
            saveRPC(config);
            const result = await applyRPC(client, config);

            if (config.rotate?.length >= 2) {
                startRotation(client, config);
            }

            let replyMsg = result.success
                ? '✅ **تم التفعيل!** RPC يعمل الآن.'
                : '⚠️ خطأ: ' + (result.error || 'غير معروف');

            return message.reply(replyMsg);
        }

        if (sub === 'off' || sub === 'إيقاف') {
            config.enabled = false;
            saveRPC(config);
            stopRotation();
            await applyRPC(client, config);
            return message.reply('⛔ **تم الإيقاف.**');
        }

        // ============ أوامر Spoofing 🎭 ============
        if (sub === 'spoof') {
            const spoofTarget = args[2]?.toLowerCase();

            // عرض قائمة Spoofing المتاحة
            if (!spoofTarget || spoofTarget === 'list' || spoofTarget === 'قائمة') {
                const spoofList = Object.entries(SPOOF_APPS).map(([key, app]) => {
                    const isActive = isSpoofing && config.spoofing.type === key;
                    const customizeNote = app.isCustomizable ? ' ✏️' : '';
                    return `${app.emoji} \`${key}\` - ${app.name}${customizeNote}${isActive ? ' ✅' : ''}`;
                }).join('\n');

                return message.reply(
                    '🎭 **قائمة تطبيقات/ألعاب Spoofing:**\n\n' +
                    spoofList +
                    '\n\n' +
                    '📌 **الأوامر:**\n' +
                    '`' + prefix + 'rpc spoof minecraft` - حالة Minecraft الرسمية ⛏️\n' +
                    '`' + prefix + 'rpc spoof genshin` - حالة Genshin الرسمية 🌸\n' +
                    '`' + prefix + 'rpc spoof crunchy` - حالة Crunchyroll ✏️\n' +
                    '`' + prefix + 'rpc spoof playstation` - حالة PlayStation ✏️\n' +
                    '`' + prefix + 'rpc spoof roblox` - حالة Roblox الرسمية 🧱\n' +
                    '`' + prefix + 'rpc spoof off` - إيقاف Spoofing\n\n' +
                    '✏️ = قابل للتخصيص (صور ونصوص)'
                );
            }

            // إيقاف Spoofing
            if (spoofTarget === 'off' || spoofTarget === 'إيقاف') {
                config.spoofing = { enabled: false, type: null, platform: null };
                saveRPC(config);
                if (config.enabled) {
                    await applyRPC(client, config);
                }
                return message.reply('⛔ **تم إيقاف Spoofing.**');
            }

            // تفعيل Spoofing للعبة/تطبيق معين
            const targetConfig = SPOOF_APPS[spoofTarget];
            if (targetConfig) {
                config.spoofing = {
                    enabled: true,
                    type: spoofTarget,
                    platform: targetConfig.platform || null
                };
                config.enabled = true;
                if (!config.startTimestamp) config.startTimestamp = Date.now();

                // تهيئة الإعدادات المخصصة إذا كان التطبيق قابل للتخصيص
                if (targetConfig.isCustomizable) {
                    if (!config.customSpoof) config.customSpoof = {};
                    if (!config.customSpoof[spoofTarget]) {
                        config.customSpoof[spoofTarget] = {
                            name: targetConfig.name,
                            details: '',
                            state: '',
                            imageUrl: '',
                            imageText: '',
                            smallImageUrl: '',
                            smallImageText: ''
                        };
                    }
                }

                saveRPC(config);
                const result = await applyRPC(client, config);

                let customizeNote = targetConfig.isCustomizable
                    ? '\n\n✏️ **ملاحظة:** هذا التطبيق قابل للتخصيص!\nيمكنك استخدام `text`, `texty`, `textr`, `img`, `simg` لتعديله.'
                    : '';

                let replyMsg = result.success
                    ? `${targetConfig.emoji} **تم تفعيل Spoofing!**\n${targetConfig.name} - ${targetConfig.description}${customizeNote}`
                    : `⚠️ خطأ: ${result.error || 'غير معروف'}`;

                return message.reply(replyMsg);
            }

            // رسالة خطأ
            return message.reply(
                '❌ **خيار Spoofing غير معروف.**\n\n' +
                '✅ **الخيارات المتاحة:**\n' +
                '`minecraft` - Minecraft (ثابت)\n' +
                '`genshin` - Genshin Impact (ثابت)\n' +
                '`crunchy` - Crunchyroll (✏️ قابل للتخصيص)\n' +
                '`playstation` - PlayStation (✏️ قابل للتخصيص)\n' +
                '`off` - إيقاف\n' +
                '`list` - عرض القائمة\n\n' +
                `📌 مثال: \`${prefix}rpc spoof playstation\``
            );
        }

        // ============ الأزرار ✅ ============
        if (sub === 'btn1' || sub === 'btn2') {
            const btnIndex = sub === 'btn1' ? 0 : 1;
            const full = args.slice(2).join(' ').trim();

            // حذف الزر
            if (full === 'clear' || full === 'حذف') {
                if (!config.buttons) config.buttons = [null, null];
                config.buttons[btnIndex] = null;
                saveRPC(config);
                if (config.enabled) await applyRPC(client, config);
                return message.reply(`🗑️ تم حذف **الزر ${btnIndex + 1}**`);
            }

            // التحقق من الصيغة
            if (!full.includes('|')) {
                return message.reply(
                    `❌ الصيغة: \`${prefix}rpc ${sub} الاسم|الرابط\`\n` +
                    `مثال: \`${prefix}rpc btn1 موقعي|https://discord.com\`\n` +
                    `أو: \`${prefix}rpc ${sub} clear\` لحذف الزر`
                );
            }

            const pipeIdx = full.indexOf('|');
            const label = full.slice(0, pipeIdx).trim();
            const url = full.slice(pipeIdx + 1).trim();

            // التحقق من الاسم
            if (!label) {
                return message.reply('❌ اسم الزر لا يمكن أن يكون فارغاً');
            }
            if (label.length > 32) {
                return message.reply(`❌ اسم الزر طويل جداً (${label.length}/32 حرف)`);
            }

            // التحقق من الرابط
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return message.reply('❌ الرابط يجب أن يبدأ بـ `http://` أو `https://`');
            }

            // حفظ الزر ✅
            if (!config.buttons || !Array.isArray(config.buttons)) {
                config.buttons = [null, null];
            }
            while (config.buttons.length < 2) config.buttons.push(null);
            config.buttons[btnIndex] = { label: label.substring(0, 32), url: url };

            saveRPC(config);
            await applyRPC(client, config);

            // تنبيه إذا كان النوع لا يدعم الأزرار
            let extraMsg = '';
            if (config.type === 'CUSTOM') {
                extraMsg = '\n\n⚠️ **تنبيه:** الأزرار لا تظهر مع نوع CUSTOM.\nاستخدم `' + prefix + 'rpc playing <اسم>` لتفعيلها.';
            }

            return message.reply(`🔘 **تم ضبط الزر ${btnIndex + 1}:** \`${label}\`${extraMsg}`);
        }

        // حذف جميع الأزرار
        if (sub === 'clearbtn' || sub === 'btnclear') {
            config.buttons = [null, null];
            saveRPC(config);
            if (config.enabled) await applyRPC(client, config);
            return message.reply('🗑️ تم حذف جميع الأزرار');
        }

        // ============ أنواع الحالة ============
        if (TYPE_STR_MAP[sub]) {
            const newType = TYPE_STR_MAP[sub];
            config.type = newType;
            config.name = args.slice(2).join(' ') || config.name;
            saveRPC(config);

            if (config.enabled) {
                await applyRPC(client, config);
                return message.reply(TYPE_EMOJI[newType] + ' تم التحديث إلى **' + TYPE_AR[newType] + '**.');
            }

            return message.reply(TYPE_EMOJI[newType] + ' تم التحديث إلى **' + TYPE_AR[newType] + '** (غير مُفعّل).');
        }

        // ============ الصور ✅ ============
        if (sub === 'img') {
            const imgUrl = args.slice(2).join(' ').trim();

            if (!imgUrl) {
                return message.reply(
                    '❌ **الصورة مطلوبة.**\n\n' +
                    '📌 **الروابط المدعومة:**\n' +
                    '• Discord CDN: `https://cdn.discordapp.com/attachments/...`\n' +
                    '• Imgur: `https://i.imgur.com/xxx.png`\n' +
                    '• أي رابط مباشر (.png/.jpg/.gif)\n\n' +
                    '📋 مثال: `' + prefix + 'rpc img https://i.imgur.com/abc.png`'
                );
            }

            // حفظ الصورة
            if (isCustomizableSpoof) {
                setCustomSpoofSetting(config, config.spoofing.type, 'imageUrl', imgUrl);
            }
            config.imageUrl = imgUrl;

            saveRPC(config);
            if (config.enabled) {
                const result = await applyRPC(client, config);
                let msg = '🖼️ تم تحديث الصورة الكبيرة: `' + imgUrl + '`';
                if (!result.success) {
                    msg += '\n⚠️ ' + (result.error || 'خطأ في التطبيق');
                }
                return message.reply(msg);
            }
            return message.reply('🖼️ تم تحديث الصورة الكبيرة (غير مُفعّل): `' + imgUrl + '`');
        }

        if (sub === 'simg') {
            const imgUrl = args.slice(2).join(' ').trim();

            if (!imgUrl) {
                return message.reply(
                    '❌ **الصورة مطلوبة.**\n\n' +
                    '📌 مثال: `' + prefix + 'rpc simg https://i.imgur.com/abc.png`'
                );
            }

            // حفظ الصورة
            if (isCustomizableSpoof) {
                setCustomSpoofSetting(config, config.spoofing.type, 'smallImageUrl', imgUrl);
            }
            config.smallImageUrl = imgUrl;

            saveRPC(config);
            if (config.enabled) {
                const result = await applyRPC(client, config);
                let msg = '🖼️ تم تحديث الصورة الصغيرة: `' + imgUrl + '`';
                if (!result.success) {
                    msg += '\n⚠️ ' + (result.error || 'خطأ في التطبيق');
                }
                return message.reply(msg);
            }
            return message.reply('🖼️ تم تحديث الصورة الصغيرة (غير مُفعّل): `' + imgUrl + '`');
        }

        // نص الصورة الكبيرة
        if (sub === 'itext') {
            const text = args.slice(2).join(' ').trim();

            if (isCustomizableSpoof) {
                setCustomSpoofSetting(config, config.spoofing.type, 'imageText', text);
            }
            config.imageText = text;

            saveRPC(config);
            if (config.enabled) await applyRPC(client, config);
            return message.reply('✍️ تم تحديث نص الصورة الكبيرة.');
        }

        // نص الصورة الصغيرة
        if (sub === 'stext') {
            const text = args.slice(2).join(' ').trim();

            if (isCustomizableSpoof) {
                setCustomSpoofSetting(config, config.spoofing.type, 'smallImageText', text);
            }
            config.smallImageText = text;

            saveRPC(config);
            if (config.enabled) await applyRPC(client, config);
            return message.reply('✍️ تم تحديث نص الصورة الصغيرة.');
        }

        // ============ النصوص ============
        if (sub === 'text') {
            const text = args.slice(2).join(' ').trim();

            if (isCustomizableSpoof) {
                setCustomSpoofSetting(config, config.spoofing.type, 'name', text);
                config.name = text; // للمزامنة
            } else {
                config.name = text;
            }

            saveRPC(config);
            if (config.enabled) await applyRPC(client, config);
            return message.reply('📝 تم تحديث النص الرئيسي.');
        }

        if (sub === 'texty') {
            const text = args.slice(2).join(' ').trim();

            if (isCustomizableSpoof) {
                setCustomSpoofSetting(config, config.spoofing.type, 'details', text);
            }
            config.details = text;

            saveRPC(config);
            if (config.enabled) await applyRPC(client, config);
            return message.reply('✍️ تم تحديث Details.');
        }

        if (sub === 'textr') {
            const text = args.slice(2).join(' ').trim();

            if (isCustomizableSpoof) {
                setCustomSpoofSetting(config, config.spoofing.type, 'state', text);
            }
            config.state = text;

            saveRPC(config);
            if (config.enabled) await applyRPC(client, config);
            return message.reply('📝 تم تحديث State.');
        }

        // ============ التايمر ============
        if (sub === 'timer') {
            const timerAction = args[2]?.toLowerCase();
            if (timerAction === 'on' || timerAction === 'تشغيل' || timerAction === 'reset') {
                config.startTimestamp = Date.now();
                saveRPC(config);
                if (config.enabled) await applyRPC(client, config);
                return message.reply('⏱️ **تم إعادة تعيين التايمر!**');
            } else if (timerAction === 'off' || timerAction === 'إيقاف') {
                config.startTimestamp = null;
                saveRPC(config);
                if (config.enabled) await applyRPC(client, config);
                return message.reply('⏱️ التايمر توقف.');
            }

            return message.reply(
                '❓ **أمر التايمر:**\n' +
                '`' + prefix + 'rpc timer on` - تشغيل/إعادة تعيين\n' +
                '`' + prefix + 'rpc timer off` - إيقاف'
            );
        }

        // ============ زيادة الوقت ============
        if (sub === 'boost') {
            const boostAction = args[2]?.toLowerCase();
            const boosts = {
                'd': 1, 'day': 1, 'يوم': 1,
                'w': 7, 'week': 7, 'أسبوع': 7,
                'mo': 30, 'month': 30, 'شهر': 30,
                'y': 365, 'year': 365, 'سنة': 365,
                'x': 3650, '10y': 3650, '١٠سنين': 3650
            };

            if (boosts[boostAction]) {
                config.startTimestamp = boostTimestamp(boosts[boostAction]);
                saveRPC(config);
                if (config.enabled) await applyRPC(client, config);
                const labels = { 1: 'يوم', 7: 'أسبوع', 30: 'شهر', 365: 'سنة', 3650: '١٠ سنين' };
                return message.reply('⏱️ **تم زيادة الوقت بـ `' + labels[boosts[boostAction]] + '`!**\n🔥 بهر اللي يشوف بروفايلك!');
            }

            return message.reply(
                '❓ **أمر زيادة الوقت:**\n' +
                '`' + prefix + 'rpc boost d` - +يوم\n' +
                '`' + prefix + 'rpc boost w` - +أسبوع\n' +
                '`' + prefix + 'rpc boost mo` - +شهر\n' +
                '`' + prefix + 'rpc boost y` - +سنة\n' +
                '`' + prefix + 'rpc boost x` - +١٠ سنين'
            );
        }

        // ============ التدوير ============
        if (sub === 'rotate') {
            const rotSub = args[2]?.toLowerCase();

            if (rotSub === 'add') {
                const type = (args[3] || 'PLAYING').toUpperCase();
                const name = args.slice(4).join(' ').trim();

                if (!name) {
                    return message.reply('❌ اسم الحالة مطلوب.\nمثال: `' + prefix + 'rpc rotate add playing My Cool Game`');
                }

                if (!config.rotate) config.rotate = [];
                config.rotate.push({ type, name, details: '', state: '' });
                saveRPC(config);
                return message.reply('➕ تمت إضافة `' + name + '` لقائمة التدوير. (`' + config.rotate.length + '` حالة)');
            }

            if (rotSub === 'list') {
                if (!config.rotate || config.rotate.length === 0) {
                    return message.reply('📋 لا توجد حالات في قائمة التدوير.');
                }
                const list = config.rotate.map((r, i) =>
                    `${i + 1}. **${r.name || 'بدون اسم'}** (${r.type})`
                ).join('\n');
                return message.reply('📋 **قائمة التدوير:**\n' + list);
            }

            if (rotSub === 'clear') {
                config.rotate = [];
                saveRPC(config);
                stopRotation();
                return message.reply('🗑️ تم حذف جميع حالات التدوير.');
            }

            if (rotSub === 'start') {
                if (!config.rotate || config.rotate.length < 2) {
                    return message.reply('❌ تحتاج حالتين على الأقل للتدوير.\nاستخدم `' + prefix + 'rpc rotate add` للإضافة.');
                }
                config.enabled = true;
                saveRPC(config);
                startRotation(client, config);
                return message.reply('🔄 **بدأ التدوير!** (' + config.rotate.length + ' حالة)');
            }

            if (rotSub === 'stop') {
                stopRotation();
                return message.reply('⏹️ توقف التدوير.');
            }

            if (rotSub === 'interval') {
                const interval = parseInt(args[3]);
                if (isNaN(interval) || interval < 5) {
                    return message.reply('❌ الفاصل الزمني يجب أن يكون 5 ثوانٍ على الأقل.\nمثال: `' + prefix + 'rpc rotate interval 30`');
                }
                config.rotateInterval = interval;
                saveRPC(config);
                return message.reply('⏱️ تم تحديث الفاصل الزمني إلى ' + interval + ' ثانية.');
            }

            // مساعدة التدوير
            return message.reply(
                '🔄 **أوامر التدوير:**\n' +
                '`' + prefix + 'rpc rotate add <type> <name>` - إضافة حالة\n' +
                '`' + prefix + 'rpc rotate list` - عرض القائمة\n' +
                '`' + prefix + 'rpc rotate clear` - حذف الكل\n' +
                '`' + prefix + 'rpc rotate start` - بدء\n' +
                '`' + prefix + 'rpc rotate stop` - إيقاف\n' +
                '`' + prefix + 'rpc rotate interval <sec>` - الفاصل'
            );
        }

        // ============ المسح وإعادة الضبط ============
        if (sub === 'delbtn') {
            const idx = args[2] === '2' ? 1 : 0;
            if (!config.buttons) config.buttons = [null, null];
            config.buttons[idx] = null;
            saveRPC(config);
            if (config.enabled) await applyRPC(client, config);
            return message.reply('🗑️ تم حذف الزر.');
        }

        if (sub === 'reset') {
            const fresh = getDefaultRPC();
            saveRPC(fresh);
            stopRotation();
            await applyRPC(client, fresh);
            return message.reply('🔄 **تم إعادة ضبط المصنع.**');
        }

        // ============ المساعدة ============
        const spoofHelpNote = isCustomizableSpoof
            ? '\n\n✏️ **تلميح:** أنت تستخدم Spoofing قابل للتخصيص! الأوامر التالية ستعدل هذا التطبيق:\n`text`, `texty`, `textr`, `img`, `simg`, `itext`, `stext`'
            : '';

        return message.reply(
            '📋 **أوامر RPC:**\n\n' +
            '🔘 **التنشيط:**\n' +
            '`' + prefix + 'rpc on/off` - تفعيل/إيقاف\n' +
            '`' + prefix + 'rpc show` - عرض الحالة\n\n' +
            '🎭 **Spoofing (حالات رسمية):**\n' +
            '`' + prefix + 'rpc spoof minecraft` - Minecraft (ثابت) ⛏️\n' +
            '`' + prefix + 'rpc spoof genshin` - Genshin (ثابت) 🌸\n' +
            '`' + prefix + 'rpc spoof crunchy` - Crunchyroll (✏️) 📺\n' +
            '`' + prefix + 'rpc spoof playstation` - PlayStation (✏️) 🎮\n' +
            '`' + prefix + 'rpc spoof roblox` - Roblox (✏️) 🧱\n' +
            '`' + prefix + 'rpc spoof off` - إيقاف Spoofing\n' +
            '`' + prefix + 'rpc spoof list` - عرض القائمة\n\n' +
            '📝 **النصوص:**\n' +
            '`' + prefix + 'rpc text <نص>` - النص الرئيسي\n' +
            '`' + prefix + 'rpc texty <نص>` - Details\n' +
            '`' + prefix + 'rpc textr <نص>` - State\n\n' +
            '🎮 **الأنواع:**\n' +
            '`' + prefix + 'rpc playing <name>`\n' +
            '`' + prefix + 'rpc watching/listening/streaming/competing <name>`\n\n' +
            '🔘 **الأزرار:**\n' +
            '`' + prefix + 'rpc btn1 <اسم>|<رابط>`\n' +
            '`' + prefix + 'rpc btn2 <اسم>|<رابط>`\n' +
            '`' + prefix + 'rpc delbtn 1/2` - حذف زر\n\n' +
            '🖼️ **الصور (تدعم جميع الروابط):**\n' +
            '`' + prefix + 'rpc img <رابط>` - صورة كبيرة\n' +
            '`' + prefix + 'rpc simg <رابط>` - صورة صغيرة\n' +
            '`' + prefix + 'rpc itext <نص>` - نص hover الكبيرة\n' +
            '`' + prefix + 'rpc stext <نص>` - نص hover الصغيرة\n\n' +
            '⏱️ **تايمر:**\n' +
            '`' + prefix + 'rpc timer on/off`\n\n' +
            '⏰ **زيادة الوقت:**\n' +
            '`' + prefix + 'rpc boost d/w/mo/y/x`\n\n' +
            '🔄 **التدوير:**\n' +
            '`' + prefix + 'rpc rotate add/start/stop/list/clear`\n\n' +
            '📌 **ملاحظة:** ✏️ = قابل للتخصيص | 🔒 = ثابت' + spoofHelpNote
        );
    }
};

// ============ Export الوظائف ============
module.exports.applyRPC = applyRPC;
module.exports.loadRPC = loadRPC;
module.exports.saveRPC = saveRPC;
module.exports.startRotation = startRotation;
module.exports.stopRotation = stopRotation;
module.exports.resetTimestamp = resetTimestamp;
module.exports.boostTimestamp = boostTimestamp;
module.exports.SPOOF_APPS = SPOOF_APPS;