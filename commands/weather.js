module.exports = {
    name: 'weather',
    description: 'الطقس في أي مدينة',
    category: 'أدوات',
    async execute(message, args, commandManager) {
        if (args.length < 2) {
            message.reply('❌ الاستخدام: `!weather <اسم المدينة>`\nمثال: `!weather cairo`');
            return;
        }

        const city = args.slice(1).join(' ');

        try {
            const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
            if (!res.ok) throw new Error('مدينة غير موجودة');
            const data = await res.json();
            const current = data.current_condition[0];
            const nearest = data.nearest_area[0];
            const areaName = nearest.areaName[0].value;
            const country = nearest.country[0].value;

            const tempC = current.temp_C;
            const feels = current.FeelsLikeC;
            const humidity = current.humidity;
            const wind = current.windspeedKmph;
            const desc = current.weatherDesc[0].value;
            const visibility = current.visibility;
            const uvIndex = current.uvIndex;

            const weatherEmoji = getWeatherEmoji(desc);
            const windEmoji = wind > 50 ? '🌪️' : wind > 20 ? '💨' : '🍃';

            const reply = `${weatherEmoji} **طقس ${areaName}, ${country}**

🌡️ الحرارة: \`${tempC}°C\` (تبدو كـ ${feels}°C)
🌥️ الحالة: \`${desc}\`
💧 الرطوبة: \`${humidity}%\`
${windEmoji} الرياح: \`${wind} كم/س\`
👁️ الرؤية: \`${visibility} كم\`
☀️ مؤشر UV: \`${uvIndex}\``;

            message.reply(reply);
        } catch (err) {
            message.reply(`❌ مقدرتش ألاقي طقس "${city}". تأكد من اسم المدينة.`);
        }
    }
};

function getWeatherEmoji(desc) {
    const d = desc.toLowerCase();
    if (d.includes('sunny') || d.includes('clear')) return '☀️';
    if (d.includes('cloud')) return '☁️';
    if (d.includes('rain') || d.includes('drizzle')) return '🌧️';
    if (d.includes('snow')) return '❄️';
    if (d.includes('thunder') || d.includes('storm')) return '⛈️';
    if (d.includes('fog') || d.includes('mist')) return '🌫️';
    if (d.includes('wind')) return '💨';
    return '🌤️';
}
