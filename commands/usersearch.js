'use strict';
// ═══════════════════════════════════════════════════════════════════
//   usersearch.js — Username Hunter | Snodix v9
//   Fixed: updated headers, correct API endpoint, robust retry logic
// ═══════════════════════════════════════════════════════════════════
const https = require('https');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Discord username rules (pomelo system):
//   2–32 chars, lowercase letters / digits / underscore / dot
//   cannot start or end with dot, no consecutive dots
const VALID_RE = /^[a-z0-9_][a-z0-9_.]{0,30}[a-z0-9_]$|^[a-z0-9_]{1,2}$/;
function isValid(u) {
    if (!u || u.length < 2 || u.length > 32) return false;
    if (!/^[a-z0-9_.]+$/.test(u)) return false;
    if (u.startsWith('.') || u.endsWith('.')) return false;
    if (u.includes('..')) return false;
    return true;
}

// ── word pools ───────────────────────────────────────────────────────
const POOL3 = [
    'ace','arc','ash','aim','air','art','bay','bit','bot','cap','car','cat',
    'cry','cut','cod','day','den','dig','dog','dot','dev','duo','eat','end',
    'era','eve','elf','fan','far','fat','fit','fix','fly','fox','fun','gap',
    'gas','god','gun','guy','gym','gel','geo','hex','hit','hot','hub','ice',
    'imp','ion','jam','jar','jet','job','joy','jug','key','kid','kit','ken',
    'lab','lap','law','leg','lid','lip','log','lot','mad','map','max','may',
    'mid','mix','mob','mod','net','new','nil','nod','not','now','neo','nav',
    'oil','old','one','opt','orb','ore','out','pad','pal','pan','pat','paw',
    'pay','pin','pit','rad','ram','rap','rat','raw','ray','red','rid','sad',
    'saw','say','set','sip','sit','sky','sol','tab','tag','tan','tap','tar',
    'tax','ten','top','use','url','van','vim','vow','via','war','wax','web',
    'win','wow','wiz','yak','yap','yes','zip','zoo','zen','ark','axe','bee',
    'bro','bud','cub','cue','dam','dew','dim','dip','dub','dye','egg','elk',
    'elm','fad','fig','fin','foe','fry','fur','gnu','ham','hew','hob','hog',
    'hop','hue','hum','inn','ire','ivy','jaw','jot','keg','kin','lag','lam',
    'lax','lay','lea','let','lob','lop','lug','mat','mob','mop','mud','mug',
    'nab','nag','nap','nip','nit','nun','oar','oat','odd','ode','off','oft',
    'ohm','owe','owl','own','peg','pep','pew','ply','pop','pot','pow','pro',
    'pub','pun','pup','put','rag','rec','ref','rep','rev','rig','rim','rob',
    'rod','rot','row','rub','rug','rum','run','rut','rye','sag','sap','sat',
    'shy','sin','sir','sob','sod','spa','spy','sty','sub','sue','sum','sun',
    'sup','tat','tee','thy','tic','tie','til','tin','tip','tod','ton','too',
    'tow','tub','tug','tun','two','ufo','vet','vex','vie','wad','wag','wan',
    'wee','wet','who','why','wig','wit','woe','wok','won','woo','yam','yew',
];

const POOL4 = [
    'code','dark','fire','gold','iron','king','lord','moon','nova','path',
    'raid','rain','safe','sage','ship','snow','soul','star','void','wave',
    'wind','wolf','zero','zeus','zone','zoom','apex','aqua','arch','atom',
    'base','bash','beam','bolt','bond','core','crew','dawn','dead','deep',
    'disk','dove','drag','dusk','dust','edge','epic','face','fail','fame',
    'fate','feat','fist','flag','flat','flow','foam','fold','font','fork',
    'gain','game','gate','gear','gene','gift','glad','glow','gone','good',
    'hack','halo','hand','hard','haze','head','heap','heat','helm','hero',
    'hide','high','hill','hold','hole','home','hood','hook','hope','horn',
    'host','hour','huge','hulk','hunt','idea','jade','jest','join','jump',
    'keen','kill','kind','knee','lack','lake','land','lane','last','late',
    'lean','leap','left','lens','less','lift','like','line','link','live',
    'lock','lone','long','look','loop','lore','lose','lure','lust','made',
    'mail','main','make','mane','mark','mars','mast','melt','mesh','mind',
    'mine','mint','mist','mode','more','move','mute','name','neon','nest',
    'next','nice','nick','node','none','norm','note','null','oath','once',
    'open','orca','over','pace','pack','page','pain','pale','palm','pass',
    'past','peak','peel','peer','pile','pine','pink','pipe','plan','play',
    'plug','plum','plus','poem','poet','poke','pole','pool','pose','race',
    'rack','rank','raze','read','real','reed','reef','rely','rest','rice',
    'rich','ride','ring','rise','risk','road','rock','roll','roof','room',
    'rope','rose','ruin','rule','rush','rust','scar','seed','seek','self',
    'sell','send','shed','shot','show','sick','side','silk','sing','sink',
    'sire','size','slim','slot','slow','snap','soar','sock','soft','sole',
    'song','soon','sort','span','spec','spin','spot','spur','stem','step',
    'stop','stub','suit','surf','swap','swim','tail','tale','talk','task',
    'team','tear','tech','tell','tend','tent','term','test','tide','tier',
    'tilt','time','toll','tomb','tone','tour','town','trap','trek','trim',
    'trio','trip','true','tune','turf','turn','twin','type','unit','upon',
    'used','user','vast','veil','vibe','vice','view','vine','vise','wade',
    'wand','ward','warm','warp','wars','wash','wasp','weak','weld','west',
    'wide','wiki','wild','will','wink','wire','wise','wish','wisp','word',
    'wore','work','worm','worn','wren','xray','yore','your','yule','zeal',
    'zest','zinc','zion','zips',
];

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
const ALNUM = 'abcdefghijklmnopqrstuvwxyz0123456789';

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function genCombos(length, count = 300) {
    const set = new Set();
    const pool = length === 3 ? POOL3 : length === 4 ? POOL4 : [];
    shuffle(pool).forEach(w => set.add(w));

    if (length <= 5) {
        for (let i = 0; i < 1000 && set.size < count * 2; i++) {
            let c = ALPHA[Math.floor(Math.random() * ALPHA.length)];
            for (let j = 1; j < length; j++) c += ALNUM[Math.floor(Math.random() * ALNUM.length)];
            if (isValid(c)) set.add(c);
        }
    }

    for (let i = 0; i < 5000 && set.size < count * 3; i++) {
        let c = '';
        for (let j = 0; j < length; j++) c += ALNUM[Math.floor(Math.random() * ALNUM.length)];
        if (isValid(c)) set.add(c);
    }

    return shuffle([...set]).slice(0, count);
}

// ── Discord API call ─────────────────────────────────────────────────
// Updated headers & correct endpoint for pomelo username check
function _apiCall(token, username) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ username });

        // Ensure token is properly formatted
        const authToken = token.startsWith('Bot ') || token.startsWith('Bearer ') ? token : token;

        const headers = {
            'Authorization': authToken,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://discord.com',
            'Referer': 'https://discord.com/',
            'X-Discord-Locale': 'en-US',
            'X-Debug-Options': 'bugReporterEnabled',
            'X-Super-Properties': Buffer.from(JSON.stringify({
                os: 'Windows',
                browser: 'Chrome',
                device: '',
                system_locale: 'en-US',
                has_client_mods: false,
                browser_user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                browser_version: '131.0.0.0',
                os_version: '10',
                referrer: '',
                referring_domain: '',
                referrer_current: '',
                referring_domain_current: '',
                release_channel: 'stable',
                client_build_number: 349832,
                client_event_source: null,
            })).toString('base64'),
        };

        const req = https.request({
            hostname: 'discord.com',
            path: '/api/v9/unique-username/check-username-taken-by-user-id',
            method: 'POST',
            headers,
            timeout: 10000,
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const j = JSON.parse(data);
                    if (res.statusCode === 429) {
                        const retryAfter = j.retry_after || j['retry-after'] || 2;
                        resolve({ status: 429, retryAfter, taken: null });
                    } else {
                        resolve({ status: res.statusCode, taken: j.taken, raw: j });
                    }
                } catch {
                    resolve({ status: res.statusCode, taken: null });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        req.write(body);
        req.end();
    });
}

async function checkUsername(token, username) {
    const MAX_RETRIES = 4;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const result = await _apiCall(token, username);

            if (result.status === 429) {
                const wait = (result.retryAfter || 2) * 1000 + 1000;
                await sleep(wait);
                continue;
            }
            if (result.status === 401) return { username, available: null, status: 401, fatal: true };
            if (result.status === 403) return { username, available: null, status: 403, fatal: true };
            if (result.status === 400) return { username, available: false, status: 400 };
            if (result.status === 200) {
                if (typeof result.taken === 'boolean')
                    return { username, available: !result.taken, status: 200 };
                return { username, available: null, status: 200 };
            }
            return { username, available: null, status: result.status };
        } catch (e) {
            if (attempt < MAX_RETRIES - 1) await sleep(1500);
        }
    }
    return { username, available: null, status: 0 };
}

// ── progress bar ─────────────────────────────────────────────────────
function scanBar(checked, total, found, target) {
    const pct = total > 0 ? Math.round(checked / total * 20) : 0;
    const bar  = '█'.repeat(pct) + '░'.repeat(20 - pct);
    return [
        '```',
        '🔍 Snodix Username Hunter',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        `📊 التقدم  : [${bar}] ${checked}/${total}`,
        `✅ وجدنا   : ${found}/${target}`,
        `⏳ جاري الفحص...`,
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '```'
    ].join('\n');
}

// ── core scanner ──────────────────────────────────────────────────────
async function scanAvail(token, length, msg, target = 5) {
    const combos   = genCombos(length, 350);
    const available = [];
    let checked = 0;
    let rateHits = 0;
    const DELAY = 500; // ms between requests

    for (const u of combos) {
        if (available.length >= target) break;
        if (!isValid(u)) { checked++; continue; }

        const r = await checkUsername(token, u);
        checked++;

        if (r.fatal) {
            try { await msg.edit('❌ **التوكن غير صالح أو انتهت صلاحيته!**\nتأكد من صحة التوكن في `.env`'); } catch {}
            break;
        }

        if (r.available === true) available.push(u);
        if (r.status === 429) { rateHits++; if (rateHits > 8) break; }

        if (checked % 15 === 0) {
            try { await msg.edit(scanBar(checked, combos.length, available.length, target)); } catch {}
        }

        await sleep(DELAY);
    }

    return { available, checked, rateHits };
}

// ── format result ──────────────────────────────────────────────────────
function fmtResult(u, i) {
    const rarity = u.length <= 3 ? '🔥 نادر جداً' : u.length === 4 ? '⚡ نادر' : '✨ مميز';
    return `✅ \`${i}.\` **@${u}** — ${rarity} (${u.length} حروف)\n`;
}

// ═══════════════════════════════════════════════════════════════════
module.exports = [

    // ── !us3 ────────────────────────────────────────────────────────
    {
        name: 'us3', aliases: ['user3', 'u3', '3char'],
        description: 'بحث عن 5 يوزرات ثلاثية متاحة', category: 'يوزرات',
        async execute(message) {
            const msg = await message.reply(scanBar(0, 350, 0, 5));
            try {
                const { available, checked, rateHits } = await scanAvail(message.client.token, 3, msg, 5);
                if (!available.length) {
                    return msg.edit([
                        '```',
                        '😔 لم نجد ثلاثيات متاحة من ' + checked + ' محاولة.',
                        rateHits > 0 ? '⚠️ Discord أوقفنا ' + rateHits + ' مرة بسبب الضغط.' : '',
                        '💡 الثلاثيات نادرة جداً — جرب مرة ثانية أو استخدم !us4',
                        '```',
                    ].filter(Boolean).join('\n'));
                }
                let r = '**🔓 يوزرات ثلاثية متاحة — Snodix Hunter**\n';
                r += '```\nفُحص: ' + checked + ' يوزر | وُجد: ' + available.length + '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n```\n';
                available.forEach((u, i) => r += fmtResult(u, i + 1));
                r += '\n> ⚡ **اسرع قبل ما حد يسبقك!**';
                await msg.edit(r);
            } catch (err) { await msg.edit('❌ خطأ: `' + err.message + '`'); }
        }
    },

    // ── !us4 ────────────────────────────────────────────────────────
    {
        name: 'us4', aliases: ['user4', 'u4', '4char'],
        description: 'بحث عن 5 يوزرات رباعية متاحة', category: 'يوزرات',
        async execute(message) {
            const msg = await message.reply(scanBar(0, 350, 0, 5));
            try {
                const { available, checked, rateHits } = await scanAvail(message.client.token, 4, msg, 5);
                if (!available.length) {
                    return msg.edit([
                        '```',
                        '😔 لم نجد رباعيات متاحة من ' + checked + ' محاولة.',
                        rateHits > 0 ? '⚠️ Discord أوقفنا ' + rateHits + ' مرة.' : '',
                        '💡 جرب مرة ثانية أو !usearch 5',
                        '```',
                    ].filter(Boolean).join('\n'));
                }
                let r = '**🔓 يوزرات رباعية متاحة — Snodix Hunter**\n';
                r += '```\nفُحص: ' + checked + ' يوزر | وُجد: ' + available.length + '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n```\n';
                available.forEach((u, i) => r += fmtResult(u, i + 1));
                r += '\n> ⚡ **اسرع على التسجيل!**';
                await msg.edit(r);
            } catch (err) { await msg.edit('❌ خطأ: `' + err.message + '`'); }
        }
    },

    // ── !ucheck ─────────────────────────────────────────────────────
    {
        name: 'ucheck', aliases: ['checkuser', 'uc', 'checkusername'],
        description: 'تحقق إذا يوزرنيم معين متاح', category: 'يوزرات',
        async execute(message, args, cm) {
            const u = args[1]?.toLowerCase();
            if (!u) return message.reply('❌ **الاستخدام:** `' + cm.getMainPrefix() + 'ucheck <username>`');
            if (!isValid(u)) return message.reply('❌ اليوزر غير صالح.\n> يجب أن يكون 2-32 حرف: أحرف صغيرة، أرقام، _ أو .');
            const msg = await message.reply('🔍 جاري فحص `@' + u + '`...');
            try {
                const r = await checkUsername(message.client.token, u);
                if (r.fatal) return msg.edit('❌ **التوكن غير صالح!** تحقق من ملف `.env`');
                if (r.available === true) {
                    await msg.edit([
                        '**✅ `@' + u + '` — متاح للتسجيل!**',
                        '```',
                        '🟢 الحالة : متاح',
                        '📏 الطول  : ' + u.length + ' حروف',
                        '⭐ الندرة : ' + (u.length <= 3 ? '🔥 نادر جداً' : u.length <= 4 ? '⚡ نادر' : '✨ مميز'),
                        '```',
                        '> ⚡ **اسرع قبل ما حد يسبقك!**',
                    ].join('\n'));
                } else if (r.available === false) {
                    await msg.edit([
                        '**❌ `@' + u + '` — مأخوذ**',
                        '```',
                        '🔴 الحالة : مسجّل بالفعل',
                        '📏 الطول  : ' + u.length + ' حروف',
                        '```',
                        '> 💡 جرب `' + cm.getMainPrefix() + 'us3` أو `' + cm.getMainPrefix() + 'us4` لإيجاد بدائل',
                    ].join('\n'));
                } else {
                    await msg.edit('⚠️ مش قادر أتحقق الآن (Status: ' + r.status + '). جرب بعد ثواني.');
                }
            } catch (err) { await msg.edit('❌ خطأ: `' + err.message + '`'); }
        }
    },

    // ── !usearch ────────────────────────────────────────────────────
    {
        name: 'usearch', aliases: ['uscan', 'ufind'],
        description: 'بحث بعدد حروف مخصص (2-8)', category: 'يوزرات',
        async execute(message, args, cm) {
            const len = parseInt(args[1]);
            if (isNaN(len) || len < 2 || len > 8)
                return message.reply('❌ **الاستخدام:** `' + cm.getMainPrefix() + 'usearch <2-8>`\nمثال: `' + cm.getMainPrefix() + 'usearch 5`');
            const msg = await message.reply(scanBar(0, 350, 0, 5));
            try {
                const { available, checked, rateHits } = await scanAvail(message.client.token, len, msg, 5);
                if (!available.length)
                    return msg.edit('❌ لم نجد يوزرات من **' + len + '** حروف.\nفُحص: **' + checked + '**' + (rateHits ? ' | ضغط: ' + rateHits + ' مرة' : '') + '\n> جرب مرة ثانية أو غيّر العدد');
                let r = '**🔓 يوزرات ' + len + ' حروف متاحة — Snodix Hunter**\n';
                r += '```\nفُحص: ' + checked + ' | وُجد: ' + available.length + '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n```\n';
                available.forEach((u, i) => r += fmtResult(u, i + 1));
                await msg.edit(r);
            } catch (err) { await msg.edit('❌ خطأ: `' + err.message + '`'); }
        }
    },

    // ── !umass ──────────────────────────────────────────────────────
    {
        name: 'umass', aliases: ['bulkcheck', 'checkbulk'],
        description: 'فحص جماعي لقائمة يوزرات (حتى 15)', category: 'يوزرات',
        async execute(message, args, cm) {
            const usernames = args.slice(1)
                .map(u => u.toLowerCase().trim())
                .filter(u => isValid(u))
                .slice(0, 15);
            if (!usernames.length)
                return message.reply('❌ **الاستخدام:** `' + cm.getMainPrefix() + 'umass user1 user2 user3`\n> أحرف صغيرة وأرقام فقط');
            const msg = await message.reply('🔍 جاري فحص **' + usernames.length + '** يوزرنيم...');
            const res = { available: [], taken: [], unknown: [] };
            for (const u of usernames) {
                const r = await checkUsername(message.client.token, u);
                if (r.fatal) { await msg.edit('❌ **التوكن غير صالح!**'); return; }
                if (r.available === true) res.available.push(u);
                else if (r.available === false) res.taken.push(u);
                else res.unknown.push(u);
                await sleep(600);
            }
            let reply = '**🔍 Snodix — نتائج الفحص الجماعي**\n\n';
            if (res.available.length) { reply += '**✅ متاح (' + res.available.length + '):**\n'; res.available.forEach(u => reply += '  🟢 `@' + u + '`\n'); reply += '\n'; }
            if (res.taken.length) { reply += '**❌ مأخوذ (' + res.taken.length + '):**\n'; res.taken.forEach(u => reply += '  🔴 `@' + u + '`\n'); reply += '\n'; }
            if (res.unknown.length) { reply += '**⚠️ غير معروف (' + res.unknown.length + '):**\n'; res.unknown.forEach(u => reply += '  🟡 `@' + u + '`\n'); }
            await msg.edit(reply.slice(0, 1900));
        }
    },

    // ── !umonitor ───────────────────────────────────────────────────
    {
        name: 'umonitor', aliases: ['watchuser', 'uwatch'],
        description: 'مراقبة يوزرنيم حتى يتاح (فحص كل 5 دقائق)', category: 'يوزرات',
        _monitored: new Map(),
        execute(message, args, cm) {
            const sub    = args[1]?.toLowerCase();
            const prefix = cm.getMainPrefix();
            if (!sub || sub === 'help') {
                return message.reply([
                    '**👁️ Username Monitor**',
                    '',
                    '`' + prefix + 'umonitor add <name>` — إضافة يوزر للمراقبة',
                    '`' + prefix + 'umonitor list`       — عرض القائمة',
                    '`' + prefix + 'umonitor remove <name>` — إزالة',
                    '`' + prefix + 'umonitor clear`      — مسح الكل',
                    '',
                    '💡 فحص كل 5 دقائق — إشعار فوري لما يتاح!',
                ].join('\n'));
            }
            if (sub === 'add') {
                const username = args[2]?.toLowerCase();
                if (!username || !isValid(username)) return message.reply('❌ يوزرنيم غير صالح.');
                if (this._monitored.size >= 10) return message.reply('❌ الحد الأقصى 10. أزل بعضها أول.');
                if (this._monitored.has(username)) return message.reply('⚠️ `@' + username + '` بالفعل في المراقبة.');
                const token     = message.client.token;
                const channelId = message.channel.id;
                const interval  = setInterval(async () => {
                    try {
                        const ch = message.client.channels.cache.get(channelId);
                        if (!ch) { clearInterval(interval); this._monitored.delete(username); return; }
                        const r = await checkUsername(token, username);
                        if (r.available === true) {
                            await ch.send('🚨 **`@' + username + '` أصبح متاحاً الآن!**\n> ⚡ اسرع قبل ما حد يسبقك!');
                            clearInterval(interval);
                            this._monitored.delete(username);
                        }
                    } catch {}
                }, 5 * 60 * 1000);
                this._monitored.set(username, interval);
                return message.reply('✅ **تمت إضافة `@' + username + '` للمراقبة.**\nسيُرسل إشعار فور توافره.');
            }
            if (sub === 'list') {
                const list = [...this._monitored.keys()];
                if (!list.length) return message.reply('📋 **لا يوجد يوزرات تحت المراقبة حالياً.**');
                return message.reply('**👁️ قائمة المراقبة (' + list.length + '):**\n' + list.map(u => '  • `@' + u + '`').join('\n'));
            }
            if (sub === 'remove') {
                const username = args[2]?.toLowerCase();
                if (!username) return message.reply('❌ `' + prefix + 'umonitor remove <name>`');
                if (this._monitored.has(username)) {
                    clearInterval(this._monitored.get(username));
                    this._monitored.delete(username);
                    return message.reply('🗑️ **تمت إزالة `@' + username + '` من المراقبة.**');
                }
                return message.reply('⚠️ `@' + username + '` مش موجود في القائمة.');
            }
            if (sub === 'clear') {
                for (const i of this._monitored.values()) clearInterval(i);
                this._monitored.clear();
                return message.reply('🗑️ **تم مسح جميع المراقبات.**');
            }
            return message.reply('❌ أمر غير معروف. استخدم `' + prefix + 'umonitor help`');
        }
    },
];
