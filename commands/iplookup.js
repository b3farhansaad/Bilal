module.exports = {
    name: 'iplookup',
    description: 'معلومات عن عنوان IP',
    category: 'أدوات',
    async execute(message, args, commandManager) {
        if (args.length < 2) {
            message.reply('❌ الاستخدام: `!iplookup <IP>`\nمثال: `!iplookup 8.8.8.8`');
            return;
        }
        const ip = args[1];
        try {
            const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,zip,lat,lon,isp,org,as,query`);
            const data = await res.json();
            if (data.status !== 'success') {
                message.reply(`❌ فشل في البحث عن \`${ip}\`. تأكد أنه IP صحيح.`);
                return;
            }
            message.reply(`🌐 **معلومات IP: \`${data.query}\`**

🗺️ الدولة: \`${data.country}\`
🏙️ المدينة: \`${data.city}, ${data.regionName}\`
📮 الكود البريدي: \`${data.zip || 'غير متاح'}\`
📍 الإحداثيات: \`${data.lat}, ${data.lon}\`
🌍 مزود الإنترنت: \`${data.isp}\`
🏢 المؤسسة: \`${data.org}\`
📡 AS: \`${data.as}\``);
        } catch {
            message.reply('❌ خطأ في الشبكة. حاول تاني.');
        }
    }
};
