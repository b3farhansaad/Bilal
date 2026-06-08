// أوامر تحويل النصوص المتقدمة ✨
module.exports = [
    {
        name: 'italic',
        aliases: ['italictext', 'slant'],
        description: 'تحويل نص لـ italic unicode',
        category: 'نصوص',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!italic`');
            const norm = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
            const ital = '𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻';
            const result = text.split('').map(c => { const i = norm.indexOf(c); return i >= 0 ? ital[i] : c; }).join('');
            message.reply(result.slice(0, 1800));
        }
    },
    {
        name: 'strikethrough',
        aliases: ['strike', 'crossed', 'strikeout'],
        description: 'نص ~~مشطوب~~ unicode',
        category: 'نصوص',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!strikethrough`');
            const result = text.split('').join('\u0336');
            message.reply(result.slice(0, 1800));
        }
    },
    {
        name: 'underline',
        aliases: ['undertext', 'ul'],
        description: 'نص تحته خط unicode',
        category: 'نصوص',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!underline`');
            const result = text.split('').join('\u0332');
            message.reply(result.slice(0, 1800));
        }
    },
    {
        name: 'bubble',
        aliases: ['circle', 'circletext', 'bubblet'],
        description: 'نص في دوائر ⓗⓔⓛⓛⓞ',
        category: 'نصوص',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!bubble`');
            const norm = 'abcdefghijklmnopqrstuvwxyz0123456789';
            const bub  = 'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ⓪①②③④⑤⑥⑦⑧⑨';
            const result = text.toLowerCase().split('').map(c => { const i = norm.indexOf(c); return i >= 0 ? bub[i] : c; }).join('');
            message.reply(result.slice(0, 1800));
        }
    },
    {
        name: 'fullwidth',
        aliases: ['fw', 'wide', 'widtext'],
        description: 'نص عريض ＦＵＬＬ ＷＩＤＴＨ',
        category: 'نصوص',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!fullwidth`');
            const result = text.split('').map(c => {
                const code = c.charCodeAt(0);
                if (code >= 33 && code <= 126) return String.fromCharCode(code + 65248);
                if (c === ' ') return '　';
                return c;
            }).join('');
            message.reply(result.slice(0, 1800));
        }
    },
    {
        name: 'superscript',
        aliases: ['sup', 'suptext', 'tiny2'],
        description: 'نص كـ superscript ˢᵘᵖᵉʳˢᶜʳⁱᵖᵗ',
        category: 'نصوص',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!superscript`');
            const map = {a:'ᵃ',b:'ᵇ',c:'ᶜ',d:'ᵈ',e:'ᵉ',f:'ᶠ',g:'ᵍ',h:'ʰ',i:'ⁱ',j:'ʲ',k:'ᵏ',l:'ˡ',m:'ᵐ',n:'ⁿ',o:'ᵒ',p:'ᵖ',r:'ʳ',s:'ˢ',t:'ᵗ',u:'ᵘ',v:'ᵛ',w:'ʷ',x:'ˣ',y:'ʸ',z:'ᶻ','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
            const result = text.toLowerCase().split('').map(c => map[c] || c).join('');
            message.reply(result.slice(0, 1800));
        }
    },
    {
        name: 'mirror',
        aliases: ['flip2', 'fliptxt2', 'mirrorflip'],
        description: 'اقلب النص رأساً على عقب',
        category: 'نصوص',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!mirror`');
            const map = {a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z',' ':' ','!':'¡','?':'¿',',':'\'','.':'˙'};
            const result = text.toLowerCase().split('').reverse().map(c => map[c] || c).join('');
            message.reply(result.slice(0, 1800));
        }
    },
    {
        name: 'shadow',
        aliases: ['shadowtxt2', 'shade'],
        description: 'نص ظل unicode',
        category: 'نصوص',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!shadow`');
            const norm = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
            const shad = '𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕥𝕨𝕩𝕪𝕫';
            const result = text.split('').map(c => { const i = norm.indexOf(c); return i >= 0 ? shad[i] : c; }).join('');
            message.reply(result.slice(0, 1800));
        }
    },
    {
        name: 'leet',
        aliases: ['1337', 'leetspeak', 'hacker'],
        description: 'حوّل نص لـ 1337 speak',
        category: 'نصوص',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!leet`');
            const map = {a:'4',e:'3',g:'6',i:'1',l:'1',o:'0',s:'5',t:'7',b:'8',z:'2'};
            const result = text.toLowerCase().split('').map(c => map[c] || c).join('');
            message.reply(`💻 \`${result.slice(0, 1800)}\``);
        }
    },
    {
        name: 'nato',
        aliases: ['natoalphabet', 'phonetic', 'alpha'],
        description: 'تحويل نص لأبجدية ناتو',
        category: 'نصوص',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!nato`');
            const nato = {a:'Alpha',b:'Bravo',c:'Charlie',d:'Delta',e:'Echo',f:'Foxtrot',g:'Golf',h:'Hotel',i:'India',j:'Juliet',k:'Kilo',l:'Lima',m:'Mike',n:'November',o:'Oscar',p:'Papa',q:'Quebec',r:'Romeo',s:'Sierra',t:'Tango',u:'Uniform',v:'Victor',w:'Whiskey',x:'X-ray',y:'Yankee',z:'Zulu',' ':' / '};
            const result = text.toLowerCase().split('').map(c => nato[c] || c.toUpperCase()).join(' ');
            if (result.length > 1800) return message.reply('❌ النص طويل أوي.');
            message.reply(`📻 **NATO:**\n${result}`);
        }
    },
    {
        name: 'sha512',
        aliases: ['sha5', 'hash2', 'hash512'],
        description: 'تشفير SHA-512 لنص',
        category: 'أدوات',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!sha512`');
            const { createHash } = require('crypto');
            const hash = createHash('sha512').update(text).digest('hex');
            message.reply(`🔒 **SHA-512:**\n\`\`\`\n${hash}\n\`\`\``);
        }
    },
    {
        name: 'wordcount',
        aliases: ['wc2', 'words', 'textstat'],
        description: 'إحصائيات تفصيلية لنص',
        category: 'أدوات',
        execute(message, args) {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('❌ اكتب النص بعد `!wordcount`');
            const words = text.trim().split(/\s+/).filter(Boolean);
            const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
            const paragraphs = text.split(/\n\n+/).filter(Boolean).length;
            const unique = new Set(words.map(w => w.toLowerCase())).size;
            const avgWordLen = words.length ? (words.reduce((s, w) => s + w.length, 0) / words.length).toFixed(1) : 0;
            message.reply(`**📊 إحصائيات النص:**\n\`\`\`\n📝 الحروف      : ${text.length}\n🔤 بدون مسافات : ${text.replace(/\s/g,'').length}\n💬 الكلمات     : ${words.length}\n🔑 كلمات فريدة : ${unique}\n📄 الجمل       : ${sentences}\n📑 الفقرات     : ${paragraphs}\n📏 متوسط طول الكلمة: ${avgWordLen}\n\`\`\``);
        }
    }
];
