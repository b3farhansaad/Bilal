module.exports = {
    name: 'crypto',
    description: 'سعر العملات الرقمية',
    category: 'أدوات',
    async execute(message, args, commandManager) {
        const coin = args[1] ? args[1].toLowerCase() : 'bitcoin';

        const coinIds = {
            btc: 'bitcoin', eth: 'ethereum', bnb: 'binancecoin',
            sol: 'solana', xrp: 'ripple', ada: 'cardano',
            doge: 'dogecoin', shib: 'shiba-inu', dot: 'polkadot',
            avax: 'avalanche-2', matic: 'matic-network', ltc: 'litecoin',
            trx: 'tron', link: 'chainlink', uni: 'uniswap'
        };

        const coinId = coinIds[coin] || coin;

        try {
            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,eur&include_24hr_change=true&include_market_cap=true`);
            const data = await res.json();

            if (!data[coinId]) {
                message.reply(`❌ العملة \`${coin}\` مش موجودة.\n**أمثلة:** btc, eth, bnb, sol, doge, shib`);
                return;
            }

            const info = data[coinId];
            const price = info.usd;
            const change = info.usd_24h_change;
            const marketCap = info.usd_market_cap;
            const changeEmoji = change >= 0 ? '📈' : '📉';
            const changeStr = change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;

            const mcapFormatted = marketCap >= 1e9
                ? `$${(marketCap / 1e9).toFixed(2)}B`
                : `$${(marketCap / 1e6).toFixed(2)}M`;

            message.reply(`${changeEmoji} **${coinId.toUpperCase()}**

💰 السعر: \`$${price.toLocaleString()}\` / €${info.eur?.toLocaleString()}
📊 التغيير (24h): \`${changeStr}\`
🏦 القيمة السوقية: \`${mcapFormatted}\``);
        } catch (err) {
            message.reply('❌ فشل في جلب السعر. حاول تاني.');
        }
    }
};
