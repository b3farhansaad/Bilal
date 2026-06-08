const https = require('https');

module.exports = {
    name: 'qrgenerate', aliases: ['qrgenerator', 'createqr', 'generateqr'],
    description: 'توليد QR Code لأي نص أو رابط', category: 'أدوات',
    async execute(message, args, cm) {
        const text = args.slice(1).join(' ');
        if (!text) return message.reply('❌ `' + cm.getMainPrefix() + 'qrgenerate <نص أو رابط>`');
        const encoded = encodeURIComponent(text);
        const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encoded;
        message.reply('**📱 QR Code:**\n> `' + text.slice(0, 80) + '`\n🔗 ' + qrUrl);
    }
};
