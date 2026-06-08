const fs = require('fs');
const path = require('path');
const dataDir = require('../utils/dataDir');

class CommandManager {
    constructor() {
        this.commands = new Map();
        this.configPath = dataDir('config.json');
        this.statsPath  = dataDir('stats.json');

        // اقرأ الكونفيج من مجلد الحساب، وإلا ابدأ بنسخة جديدة
        if (fs.existsSync(this.configPath)) {
            try { this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8')); }
            catch { this.config = {}; }
        } else {
            // اقرأ الافتراضي من الجذر للمرة الأولى فقط
            const rootCfg = path.join(__dirname, '../config.json');
            try { this.config = fs.existsSync(rootCfg)
                ? JSON.parse(fs.readFileSync(rootCfg, 'utf8')) : {}; }
            catch { this.config = {}; }
        }
        this.startTime = Date.now();
        this.stealthMode = false;
        this.essentialCommands = ['start', 'stop', 'afk', 'clone', 'rpc'];

        if (!this.config.prefixes) {
            this.config.prefixes = { main: '!', aliases: [] };
            this.saveConfig();
        }

        this.initializeStats();
    }

    initializeStats() {
        if (!fs.existsSync(this.statsPath)) {
            this.saveStats({
                totalMessages: 0, dailyMessages: 0,
                lastResetDay: new Date().toDateString(),
                uniqueUsers: [], dailyUsers: [], allTimeUsers: [],
                voiceActivity: { totalTime: 0, sessions: [] }
            });
        }
    }

    getStats() {
        try {
            delete require.cache[require.resolve('../stats.json')];
            const stats = require('../stats.json');
            return {
                totalMessages: stats.totalMessages || 0,
                dailyMessages: stats.dailyMessages || 0,
                lastResetDay: stats.lastResetDay || new Date().toDateString(),
                uniqueUsers: Array.isArray(stats.uniqueUsers) ? stats.uniqueUsers : [],
                dailyUsers: Array.isArray(stats.dailyUsers) ? stats.dailyUsers : [],
                allTimeUsers: Array.isArray(stats.allTimeUsers) ? stats.allTimeUsers : [],
                voiceActivity: stats.voiceActivity || { totalTime: 0, sessions: [] }
            };
        } catch {
            return {
                totalMessages: 0, dailyMessages: 0,
                lastResetDay: new Date().toDateString(),
                uniqueUsers: [], dailyUsers: [], allTimeUsers: [],
                voiceActivity: { totalTime: 0, sessions: [] }
            };
        }
    }

    saveStats(stats) {
        try {
            const safe = {
                ...stats,
                uniqueUsers: Array.isArray(stats.uniqueUsers) ? stats.uniqueUsers : [],
                dailyUsers: Array.isArray(stats.dailyUsers) ? stats.dailyUsers : [],
                allTimeUsers: Array.isArray(stats.allTimeUsers) ? stats.allTimeUsers : [],
                voiceActivity: stats.voiceActivity || { totalTime: 0, sessions: [] }
            };
            fs.writeFileSync(this.statsPath, JSON.stringify(safe, null, 2));
        } catch (err) { console.error('❌ خطأ حفظ الإحصائيات:', err.message); }
    }

    saveConfig() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        } catch (err) { console.error('❌ خطأ حفظ الكونفيج:', err.message); }
    }

    updateStats(userId) {
        const stats = this.getStats();
        const today = new Date().toDateString();
        if (today !== stats.lastResetDay) {
            stats.dailyMessages = 0;
            stats.dailyUsers = [];
            stats.lastResetDay = today;
        }
        stats.totalMessages++;
        stats.dailyMessages++;
        if (!stats.dailyUsers.includes(userId)) stats.dailyUsers.push(userId);
        if (!stats.allTimeUsers.includes(userId)) stats.allTimeUsers.push(userId);
        this.saveStats(stats);
    }

    formatUptime() {
        const uptime = Date.now() - this.startTime;
        const days = Math.floor(uptime / 86400000);
        const hours = Math.floor((uptime % 86400000) / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        const seconds = Math.floor((uptime % 60000) / 1000);
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);
        return parts.join(' ');
    }

    isAllowedUser(userId) {
        // ENV override for multi-account support via panel bot
        const envOverride = process.env.OVERRIDE_ALLOWED_IDS;
        if (envOverride) {
            const ids = envOverride.split(',').map(s => s.trim()).filter(Boolean);
            return ids.length === 0 || ids.includes(userId);
        }
        if (!this.config.allowedUserIds || this.config.allowedUserIds.length === 0) return true;
        return this.config.allowedUserIds.includes(userId);
    }

    isUserBlocked(userId) {
        return (this.config.blockedUsers || []).includes(userId);
    }

    isAIEnabled(channelId, guildId) {
        if (this.config.ai?.perChannel?.[channelId] !== undefined) return this.config.ai.perChannel[channelId];
        if (guildId && this.config.ai?.perGuild?.[guildId] !== undefined) return this.config.ai.perGuild[guildId];
        return this.config.ai?.global || false;
    }

    isTagRequired(channelId) {
        return !this.config.tagOff?.includes(channelId);
    }

    getPrefixes() {
        return [this.config.prefixes.main, ...(this.config.prefixes.aliases || [])];
    }

    getMainPrefix() {
        return this.config.prefixes.main;
    }

    startsWithPrefix(content) {
        return this.getPrefixes().some(p => content.startsWith(p));
    }

    getCommandName(content) {
        for (const prefix of this.getPrefixes()) {
            if (content.startsWith(prefix)) {
                return content.substring(prefix.length).split(' ')[0].toLowerCase();
            }
        }
        return null;
    }

    loadCommands() {
        let loaded = 0, failed = 0;
        let commandFiles;
        try {
            commandFiles = fs.readdirSync(__dirname)
                .filter(file => file !== 'index.js' && file.endsWith('.js'));
        } catch (err) {
            console.error('❌ فشل قراءة مجلد الأوامر:', err.message);
            return;
        }

        for (const file of commandFiles) {
            try {
                const command = require(`./${file}`);
                this.registerCommand(command);
                loaded++;
            } catch (err) {
                console.error(`❌ فشل تحميل ${file}: ${err.message}`);
                failed++;
            }
        }

        console.log(`  ✅ ${loaded} ملف أوامر محمّل${failed > 0 ? ` (${failed} فشلوا)` : ''} — ${this.commands.size} أمر إجمالاً`);
    }

    // ✅ FIX: Register both name AND aliases so !xo / !ttt / etc. all work
    registerCommand(command) {
        if (Array.isArray(command)) {
            command.forEach(cmd => this._registerSingle(cmd));
            return;
        }
        this._registerSingle(command);
    }

    _registerSingle(cmd) {
        if (!cmd || !cmd.name) return;
        const name = cmd.name.toLowerCase();
        this.commands.set(name, cmd);
        // Register all aliases pointing to the same command object
        if (Array.isArray(cmd.aliases)) {
            for (const alias of cmd.aliases) {
                if (alias) this.commands.set(alias.toLowerCase(), cmd);
            }
        }
    }

    handleCommand(message) {
        if (!this.isAllowedUser(message.author.id)) return false;

        const rawContent = message.content;
        const lowerContent = rawContent.toLowerCase();

        if (this.stealthMode) {
            const commandName = this.getCommandName(lowerContent);
            if (!commandName) return false;
            const command = this.commands.get(commandName);
            if (!command || !this.essentialCommands.includes(command.name)) return false;
        }

        const prefix = this.getPrefixes().find(p => lowerContent.startsWith(p));
        if (!prefix) return false;

        // Build args from ORIGINAL content to preserve URLs/mixed-case text
        const withoutPrefix = rawContent.slice(prefix.length);
        const rawArgs = withoutPrefix.split(' ').filter(a => a.length > 0);
        if (rawArgs.length === 0) return false;

        const commandName = rawArgs[0].toLowerCase();
        const args = [commandName, ...rawArgs.slice(1)];

        const command = this.commands.get(commandName);
        if (!command) return false;

        try {
            command.execute(message, args, this);
            return true;
        } catch (err) {
            console.error(`❌ خطأ في تنفيذ ${commandName}:`, err);
            message.reply(`❌ حصل خطأ: \`${err.message}\``).catch(() => {});
            return true;
        }
    }

    setStealthMode(value) { this.stealthMode = value; }
    isStealthMode() { return this.stealthMode; }
}

module.exports = new CommandManager();
