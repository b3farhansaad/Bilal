import 'dotenv/config';
import ejs from 'ejs';
import {
  Client, GatewayIntentBits, Partials, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  PermissionsBitField, ChannelType, AuditLogEvent,
} from 'discord.js';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const cfg = {
  mongoUri      : process.env.MONGO_URI      || '',
  sessionSecret : process.env.SESSION_SECRET || 'bilal_secret_change_me_please',
  port          : parseInt(process.env.PORT)  || 3000,
  adminUser     : 'bilal',
  adminPass     : 'bilal123',
};

// ═══════════════════════════════════════════════════════════════
// MODELS
// ═══════════════════════════════════════════════════════════════
const botConfigSchema = new mongoose.Schema({
  key   : { type: String, default: 'main', unique: true },
  token : { type: String, default: '' },
}, { timestamps: true });
const BotConfig = mongoose.model('BotConfig', botConfigSchema);

function mkEvt(col) {
  return { enabled:{ type:Boolean, default:true }, channel:{ type:String, default:null }, embedColor:{ type:String, default:col||'#5865F2' } };
}

const guildSchema = new mongoose.Schema({
  guildId:{ type:String, required:true, unique:true, index:true },
  name:String, icon:String, memberCount:{ type:Number, default:0 }, ownerId:String,
  prefix:{ type:String, default:'!' }, language:{ type:String, default:'ar' },
  autoRole:{ enabled:{ type:Boolean, default:false }, roleId:{ type:String, default:null }, botRole:{ type:String, default:null } },
  welcome:{
    enabled:{ type:Boolean, default:false }, channel:{ type:String, default:null },
    message:{ type:String, default:'مرحباً {user}!' }, mentionUser:{ type:Boolean, default:true },
    embedEnabled:{ type:Boolean, default:true }, embedColor:{ type:String, default:'#5865F2' },
    embedTitle:{ type:String, default:'👋 مرحباً بك!' }, embedDescription:{ type:String, default:'أهلاً {user}!' },
    embedThumbnail:{ type:Boolean, default:true }, embedImage:{ type:String, default:'' },
    embedFooter:{ type:String, default:'انضم كـ عضو رقم {count}' },
    dmEnabled:{ type:Boolean, default:false }, dmMessage:{ type:String, default:'مرحباً بك في {server}!' },
    showJoinPosition:{ type:Boolean, default:true },
    backgroundImage:{ type:String, default:'' }, bannerEnabled:{ type:Boolean, default:false },
    usernameX:{ type:Number, default:50 }, usernameY:{ type:Number, default:75 },
    usernameFontSize:{ type:Number, default:36 }, usernameColor:{ type:String, default:'#ffffff' },
    avatarX:{ type:Number, default:50 }, avatarY:{ type:Number, default:40 }, avatarSize:{ type:Number, default:100 },
  },
  goodbye:{
    enabled:{ type:Boolean, default:false }, channel:{ type:String, default:null },
    message:{ type:String, default:'وداعاً {user}!' }, embedEnabled:{ type:Boolean, default:true },
    embedColor:{ type:String, default:'#ED4245' }, embedTitle:{ type:String, default:'👋 مع السلامة' },
    embedDescription:{ type:String, default:'وداعاً **{user}**!' }, embedFooter:{ type:String, default:'كان عضواً لـ {duration}' },
  },
  logs:{
    enabled:{ type:Boolean, default:false }, channel:{ type:String, default:null },
    memberJoin      :mkEvt('#57F287'), memberLeave:mkEvt('#ED4245'), memberBan:mkEvt('#FF0000'),
    memberUnban     :mkEvt('#57F287'), memberKick:mkEvt('#FEE75C'), memberMute:mkEvt('#FEE75C'),
    memberWarn      :mkEvt('#FEE75C'), memberRoleUpdate:mkEvt('#FEE75C'), memberNickChange:mkEvt('#FEE75C'),
    messageDelete   :mkEvt('#ED4245'), messageEdit:mkEvt('#FEE75C'), messageBulkDelete:mkEvt('#ED4245'),
    roleCreate      :mkEvt('#57F287'), roleDelete:mkEvt('#ED4245'), roleUpdate:mkEvt('#FEE75C'),
    channelCreate   :mkEvt('#57F287'), channelDelete:mkEvt('#ED4245'), channelUpdate:mkEvt('#FEE75C'),
    voiceJoin       :mkEvt('#57F287'), voiceLeave:mkEvt('#ED4245'), voiceMove:mkEvt('#FEE75C'),
    serverUpdate    :mkEvt('#FEE75C'), inviteCreate:mkEvt('#57F287'), inviteDelete:mkEvt('#ED4245'),
  },
  automod:{
    enabled:{ type:Boolean, default:false }, logChannel:{ type:String, default:null },
    muteRole:{ type:String, default:null }, ignoredRoles:[String], ignoredChannels:[String],
    antiLinks     :{ enabled:{ type:Boolean, default:false }, punishment:{ type:String, default:'delete' }, whitelist:[String] },
    antiInvites   :{ enabled:{ type:Boolean, default:false }, punishment:{ type:String, default:'delete' } },
    antiSpam      :{ enabled:{ type:Boolean, default:false }, maxMessages:{ type:Number, default:5 }, interval:{ type:Number, default:5 }, punishment:{ type:String, default:'mute' }, muteDuration:{ type:Number, default:10 } },
    antiBadWords  :{ enabled:{ type:Boolean, default:false }, punishment:{ type:String, default:'delete' }, words:[String] },
    antiCaps      :{ enabled:{ type:Boolean, default:false }, threshold:{ type:Number, default:70 }, minLength:{ type:Number, default:10 }, punishment:{ type:String, default:'delete' } },
    antiMentions  :{ enabled:{ type:Boolean, default:false }, maxMentions:{ type:Number, default:5 }, punishment:{ type:String, default:'warn' } },
    antiRaid      :{ enabled:{ type:Boolean, default:false }, joinThreshold:{ type:Number, default:10 }, joinInterval:{ type:Number, default:10 }, action:{ type:String, default:'kick' } },
    antiDuplicate :{ enabled:{ type:Boolean, default:false }, threshold:{ type:Number, default:3 }, punishment:{ type:String, default:'delete' } },
    antiEmoji     :{ enabled:{ type:Boolean, default:false }, maxEmojis:{ type:Number, default:5 }, punishment:{ type:String, default:'delete' } },
    antiZalgo     :{ enabled:{ type:Boolean, default:false }, punishment:{ type:String, default:'delete' } },
  },
  protection:{
    antiNuke:{ enabled:{ type:Boolean, default:false }, banThreshold:{ type:Number, default:5 }, kickThreshold:{ type:Number, default:5 }, channelDeleteThreshold:{ type:Number, default:3 }, roleDeleteThreshold:{ type:Number, default:3 }, webhookDeleteThreshold:{ type:Number, default:3 }, action:{ type:String, default:'derank' }, whitelist:[String], logChannel:{ type:String, default:null } },
    antiBot:{ enabled:{ type:Boolean, default:false }, action:{ type:String, default:'kick' }, whitelist:[String] },
    antiAlt:{ enabled:{ type:Boolean, default:false }, minAge:{ type:Number, default:7 }, action:{ type:String, default:'kick' }, kickMessage:String },
    verifySystem:{ enabled:{ type:Boolean, default:false }, channel:{ type:String, default:null }, role:{ type:String, default:null }, type:{ type:String, default:'button' }, message:String, embedColor:{ type:String, default:'#5865F2' }, embedTitle:String },
  },
  leveling:{
    enabled:{ type:Boolean, default:false }, xpMin:{ type:Number, default:10 }, xpMax:{ type:Number, default:25 },
    cooldown:{ type:Number, default:60 }, levelUpEnabled:{ type:Boolean, default:true },
    levelUpChannel:{ type:String, default:null }, levelUpMessage:String, announcement:{ type:String, default:'channel' },
    noXpRoles:[String], noXpChannels:[String], stackRoles:{ type:Boolean, default:false },
    resetOnLeave:{ type:Boolean, default:false }, voiceXp:{ type:Boolean, default:false },
    voiceXpPerMin:{ type:Number, default:5 }, showXpBar:{ type:Boolean, default:true },
    levelRoles:[{ level:Number, roleId:String }], multiplierRoles:[{ roleId:String, multiplier:Number }],
  },
  tickets:{
    enabled:{ type:Boolean, default:false }, category:{ type:String, default:null },
    logChannel:{ type:String, default:null }, staffRole:{ type:String, default:null },
    message:String, welcomeMessage:String, maxPerUser:{ type:Number, default:1 },
    closeOnLeave:{ type:Boolean, default:false }, pingStaff:{ type:Boolean, default:false },
    transcriptChannel:{ type:String, default:null }, embedColor:{ type:String, default:'#5865F2' },
    embedTitle:String, embedDescription:String, buttonLabel:String,
    namingFormat:{ type:String, default:'ticket-{id}' }, useTopics:{ type:Boolean, default:false },
    claimEnabled:{ type:Boolean, default:true }, reopenEnabled:{ type:Boolean, default:true },
    priorityEnabled:{ type:Boolean, default:true }, autoClose:{ type:Number, default:0 },
    topics:[{ id:String, label:String, emoji:{ type:String, default:'📝' }, description:String, staffRole:String, category:String, color:{ type:String, default:'Primary' }, enabled:{ type:Boolean, default:true } }],
  },
  commands:[{ name:String, category:String, description:String, enabled:{ type:Boolean, default:true }, aliases:[String], allowedRoles:[String], usageCount:{ type:Number, default:0 } }],
  customCommands:[{ trigger:String, response:String, embedEnabled:{ type:Boolean, default:false }, embedColor:{ type:String, default:'#5865F2' }, embedTitle:String, deleteAfter:{ type:Number, default:0 }, allowedChannels:[String], allowedRoles:[String], enabled:{ type:Boolean, default:true }, usageCount:{ type:Number, default:0 } }],
}, { timestamps:true });

const Guild   = mongoose.model('Guild', guildSchema);

const levelSchema = new mongoose.Schema({
  guildId:{ type:String, required:true, index:true }, userId:{ type:String, required:true },
  userTag:{ type:String, default:'Unknown' }, avatar:String,
  xp:{ type:Number, default:0 }, level:{ type:Number, default:0 },
}, { timestamps:true });
levelSchema.index({ guildId:1, userId:1 }, { unique:true });
const Level = mongoose.model('Level', levelSchema);

const logSchema = new mongoose.Schema({
  guildId:{ type:String, required:true, index:true }, type:{ type:String, required:true },
  action:{ type:String, required:true }, userId:String, userTag:String, userAvatar:String,
  moderatorId:String, moderatorTag:String, targetId:String, targetTag:String,
  channelId:String, channelName:String, reason:String,
  details:{ type:mongoose.Schema.Types.Mixed, default:{} },
  severity:{ type:String, enum:['info','warning','danger','success'], default:'info' },
}, { timestamps:true });
logSchema.index({ guildId:1, createdAt:-1 });
const Log = mongoose.model('Log', logSchema);

const warningSchema = new mongoose.Schema({
  guildId:{ type:String, required:true, index:true }, userId:{ type:String, required:true },
  userTag:{ type:String, default:'Unknown' }, moderatorId:{ type:String, default:null },
  moderatorTag:{ type:String, default:'System' }, reason:{ type:String, default:'لا يوجد سبب' },
  active:{ type:Boolean, default:true },
}, { timestamps:true });
const Warning = mongoose.model('Warning', warningSchema);

const ticketSchema = new mongoose.Schema({
  guildId:{ type:String, required:true, index:true }, channelId:{ type:String, required:true },
  ticketId:{ type:Number, required:true }, userId:{ type:String, required:true },
  userTag:{ type:String, default:'Unknown' }, topic:{ type:String, default:null },
  status:{ type:String, enum:['open','closed','deleted'], default:'open', index:true },
  priority:{ type:String, enum:['low','normal','high','urgent'], default:'normal' },
  claimedBy:{ type:String, default:null }, claimedByTag:{ type:String, default:null },
  closedBy:{ type:String, default:null }, closedByTag:{ type:String, default:null },
  closedAt:{ type:Date, default:null }, closeReason:{ type:String, default:null },
  messages:[{ authorId:String, authorTag:String, content:String, attachments:[String], createdAt:{ type:Date, default:Date.now } }],
  messageCount:{ type:Number, default:0 }, transcriptSaved:{ type:Boolean, default:false },
}, { timestamps:true });
ticketSchema.index({ guildId:1, ticketId:1 }, { unique:true });
const Ticket = mongoose.model('Ticket', ticketSchema);

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const xpForLevel = l => Math.floor(100 * Math.pow(l, 1.5));
const levelFromXp = x => Math.floor(Math.pow(x / 100, 1 / 1.5));

function xpBar(xp, level, len = 10) {
  const needed = xpForLevel(level + 1), prev = xpForLevel(level);
  const p = Math.max(0, Math.min(1, (xp - prev) / (needed - prev)));
  return `\`${'█'.repeat(Math.round(p*len))}${'░'.repeat(len-Math.round(p*len))}\` ${Math.round(p*100)}%`;
}

function rv(str, vars = {}) {
  return String(str||'')
    .replace(/{user}/g, vars.user||'?').replace(/{username}/g, vars.username||'?')
    .replace(/{server}/g, vars.server||'?').replace(/{count}/g, vars.count||'?')
    .replace(/{level}/g, vars.level||'?').replace(/{xp}/g, vars.xp||'?')
    .replace(/{duration}/g, vars.duration||'?').replace(/{days}/g, vars.days||'?');
}

const bool = v => v==='true'||v===true||v==='on'||v==='1'||v===1;
const num  = (v,d) => { const n=parseFloat(v); return isNaN(n)?d:n; };
const csv  = v => v ? String(v).split(',').map(s=>s.trim()).filter(Boolean) : [];
const arr  = v => v ? (Array.isArray(v)?v:[v]).filter(Boolean) : [];

async function sendLog(guild, gd, eventKey, data = {}) {
  if (!gd?.logs?.enabled) return;
  const evtCfg = gd.logs[eventKey];
  if (!evtCfg?.enabled) return;
  const chId = evtCfg.channel || gd.logs.channel;
  if (!chId) return;
  const ch = guild.channels.cache.get(chId);
  if (!ch) return;
  const labels = {
    memberJoin:'👋 انضمام', memberLeave:'🚪 مغادرة', memberBan:'🔨 حظر', memberUnban:'✅ رفع حظر',
    memberKick:'👢 طرد', memberMute:'🔇 كتم', memberWarn:'⚠️ تحذير',
    memberRoleUpdate:'🎭 تغيير رول', memberNickChange:'✏️ تغيير نيك',
    messageDelete:'🗑️ حذف رسالة', messageEdit:'✏️ تعديل رسالة', messageBulkDelete:'💥 حذف جماعي',
    roleCreate:'✨ رول جديد', roleDelete:'❌ حذف رول', roleUpdate:'🎨 تعديل رول',
    channelCreate:'📁 قناة جديدة', channelDelete:'❌ حذف قناة', channelUpdate:'🔧 تعديل قناة',
    voiceJoin:'🔊 دخول صوتي', voiceLeave:'🔇 مغادرة صوتية', voiceMove:'🔀 انتقال صوتي',
    serverUpdate:'⚙️ تحديث سيرفر', inviteCreate:'📨 دعوة جديدة', inviteDelete:'❌ حذف دعوة',
  };
  const color = evtCfg.embedColor || '#5865F2';
  const embed = new EmbedBuilder().setColor(color).setTitle(labels[eventKey]||eventKey).setTimestamp();
  if (data.userId)    embed.setAuthor({ name:data.user||data.userId, iconURL:data.avatar||undefined });
  if (data.user)      embed.addFields({ name:'العضو',   value:`<@${data.userId||'?'}> (${data.user})`, inline:true });
  if (data.moderator) embed.addFields({ name:'المشرف',  value:data.moderator, inline:true });
  if (data.reason)    embed.addFields({ name:'السبب',   value:data.reason, inline:false });
  if (data.channel)   embed.addFields({ name:'القناة',  value:`<#${data.channelId||'?'}>`, inline:true });
  if (data.content)   embed.addFields({ name:'المحتوى', value:String(data.content).substring(0,1024), inline:false });
  if (data.before)    embed.addFields({ name:'قبل',     value:String(data.before).substring(0,512), inline:true });
  if (data.after)     embed.addFields({ name:'بعد',     value:String(data.after).substring(0,512), inline:true });
  if (data.extra)     embed.addFields({ name:'تفاصيل',  value:String(data.extra).substring(0,512), inline:false });
  await ch.send({ embeds:[embed] }).catch(()=>{});
  await Log.create({ guildId:guild.id, type:'moderation', action:eventKey, userId:data.userId, userTag:data.user, reason:data.reason||'', channelId:data.channelId, moderatorId:data.moderatorId, moderatorTag:data.moderator }).catch(()=>{});
}

async function assignLevelRoles(member, guild, gd, level) {
  if (!gd?.leveling?.levelRoles?.length) return;
  const earned = gd.leveling.levelRoles.filter(lr=>lr.level<=level).map(lr=>lr.roleId);
  for (const rid of earned) if (!member.roles.cache.has(rid)) await member.roles.add(rid).catch(()=>{});
  if (!gd.leveling.stackRoles) {
    for (const lr of gd.leveling.levelRoles) {
      if (lr.level > level && member.roles.cache.has(lr.roleId)) await member.roles.remove(lr.roleId).catch(()=>{});
    }
  }
}

const spamMap  = new Map(), nukeMap = new Map(), voiceMap = new Map();
const xpCool   = new Map(), raidMap = new Map();

function trackNuke(gId, uId, type) {
  const key = `${gId}:${uId}:${type}`, now = Date.now();
  if (!nukeMap.has(key)) nukeMap.set(key, []);
  const arr = nukeMap.get(key).filter(t=>now-t<60000); arr.push(now); nukeMap.set(key,arr); return arr.length;
}

const DEFAULT_COMMANDS = [
  {name:'ping',category:'general',description:'فحص سرعة البوت',enabled:true,aliases:[],allowedRoles:[]},
  {name:'help',category:'general',description:'قائمة الأوامر',enabled:true,aliases:['مساعدة'],allowedRoles:[]},
  {name:'botinfo',category:'general',description:'معلومات البوت',enabled:true,aliases:['bi'],allowedRoles:[]},
  {name:'userinfo',category:'general',description:'معلومات عضو',enabled:true,aliases:['ui'],allowedRoles:[]},
  {name:'serverinfo',category:'general',description:'معلومات السيرفر',enabled:true,aliases:['si'],allowedRoles:[]},
  {name:'avatar',category:'general',description:'صورة العضو',enabled:true,aliases:['av'],allowedRoles:[]},
  {name:'members',category:'general',description:'عدد الأعضاء',enabled:true,aliases:[],allowedRoles:[]},
  {name:'rank',category:'levels',description:'ترتيبك',enabled:true,aliases:[],allowedRoles:[]},
  {name:'leaderboard',category:'levels',description:'المتصدرون',enabled:true,aliases:['top','lb'],allowedRoles:[]},
  {name:'setlevel',category:'levels',description:'تعيين مستوى عضو',enabled:true,aliases:[],allowedRoles:[]},
  {name:'addxp',category:'levels',description:'إضافة XP',enabled:true,aliases:[],allowedRoles:[]},
  {name:'removexp',category:'levels',description:'إزالة XP',enabled:true,aliases:[],allowedRoles:[]},
  {name:'resetxp',category:'levels',description:'إعادة تعيين XP',enabled:true,aliases:[],allowedRoles:[]},
  {name:'kick',category:'admin',description:'طرد عضو',enabled:true,aliases:[],allowedRoles:[]},
  {name:'ban',category:'admin',description:'حظر عضو',enabled:true,aliases:[],allowedRoles:[]},
  {name:'unban',category:'admin',description:'رفع حظر',enabled:true,aliases:[],allowedRoles:[]},
  {name:'mute',category:'admin',description:'كتم عضو',enabled:true,aliases:[],allowedRoles:[]},
  {name:'unmute',category:'admin',description:'رفع الكتم',enabled:true,aliases:[],allowedRoles:[]},
  {name:'warn',category:'admin',description:'تحذير عضو',enabled:true,aliases:[],allowedRoles:[]},
  {name:'warnings',category:'admin',description:'عرض التحذيرات',enabled:true,aliases:[],allowedRoles:[]},
  {name:'clearwarns',category:'admin',description:'مسح التحذيرات',enabled:true,aliases:[],allowedRoles:[]},
  {name:'clear',category:'admin',description:'حذف رسائل',enabled:true,aliases:['purge'],allowedRoles:[]},
  {name:'slowmode',category:'admin',description:'وضع التهدئة',enabled:true,aliases:[],allowedRoles:[]},
  {name:'lock',category:'admin',description:'قفل القناة',enabled:true,aliases:[],allowedRoles:[]},
  {name:'unlock',category:'admin',description:'فتح القناة',enabled:true,aliases:[],allowedRoles:[]},
  {name:'lockdown',category:'admin',description:'قفل كل القنوات',enabled:true,aliases:[],allowedRoles:[]},
  {name:'unlockall',category:'admin',description:'فتح كل القنوات',enabled:true,aliases:[],allowedRoles:[]},
  {name:'nuke',category:'admin',description:'نيوك القناة',enabled:true,aliases:[],allowedRoles:[]},
  {name:'giverole',category:'admin',description:'إعطاء رول',enabled:true,aliases:['gr'],allowedRoles:[]},
  {name:'takerole',category:'admin',description:'سحب رول',enabled:true,aliases:['tr'],allowedRoles:[]},
  {name:'announce',category:'admin',description:'إعلان',enabled:true,aliases:['ann'],allowedRoles:[]},
  {name:'ticket',category:'ticket',description:'إدارة التذاكر',enabled:true,aliases:[],allowedRoles:[]},
  {name:'8ball',category:'fun',description:'كرة السحر',enabled:true,aliases:[],allowedRoles:[]},
  {name:'coinflip',category:'fun',description:'عملة معدنية',enabled:true,aliases:['flip'],allowedRoles:[]},
  {name:'roll',category:'fun',description:'رمي النرد',enabled:true,aliases:[],allowedRoles:[]},
  {name:'choose',category:'fun',description:'اختيار عشوائي',enabled:true,aliases:[],allowedRoles:[]},
  {name:'rps',category:'fun',description:'حجر ورقة مقص',enabled:true,aliases:[],allowedRoles:[]},
];

// ═══════════════════════════════════════════════════════════════
// BOT CLIENT (Selfbot / Bot mode)
// ═══════════════════════════════════════════════════════════════
let activeClient = null;

function createClient(token) {
  if (!token) return null;
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildBans,
      GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildInvites,
      GatewayIntentBits.GuildModeration,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User],
  });

  client.on('ready', async () => {
    console.log(`[Bot] ✅ Logged in as: ${client.user.tag}`);
    client.user.setPresence({ activities:[{ name:`Dashboard`, type:3 }], status:'online' }).catch(()=>{});
    for (const [,g] of client.guilds.cache) {
      await Guild.findOneAndUpdate({ guildId:g.id }, { $set:{ name:g.name, icon:g.iconURL(), memberCount:g.memberCount, ownerId:g.ownerId } }, { upsert:true }).catch(()=>{});
    }
  });

  client.on('guildCreate', async g => {
    await Guild.findOneAndUpdate({ guildId:g.id }, { $set:{ name:g.name, icon:g.iconURL(), memberCount:g.memberCount, ownerId:g.ownerId } }, { upsert:true }).catch(()=>{});
  });

  // Member events
  client.on('guildMemberAdd', async member => {
    if (member.user.bot) {
      const gd = await Guild.findOne({ guildId:member.guild.id }).lean().catch(()=>null);
      if (gd?.protection?.antiBot?.enabled) {
        const wl = gd.protection.antiBot.whitelist||[];
        if (!wl.includes(member.id)) {
          if (gd.protection.antiBot.action==='ban') await member.guild.members.ban(member.id,{reason:'Anti-Bot'}).catch(()=>{});
          else await member.kick('Anti-Bot').catch(()=>{});
          return;
        }
      }
      if (gd?.autoRole?.botRole) await member.roles.add(gd.autoRole.botRole).catch(()=>{});
      return;
    }
    const gd = await Guild.findOne({ guildId:member.guild.id }).lean().catch(()=>null);
    if (!gd) return;
    if (gd.protection?.antiAlt?.enabled) {
      const minAge = gd.protection.antiAlt.minAge*86400000;
      if (Date.now()-member.user.createdTimestamp < minAge) {
        await member.send({ content:rv(gd.protection.antiAlt.kickMessage||'حسابك جديد جداً!', { days:gd.protection.antiAlt.minAge }) }).catch(()=>{});
        if (gd.protection.antiAlt.action==='ban') await member.guild.members.ban(member.id,{reason:'Anti-Alt'}).catch(()=>{});
        else await member.kick('Anti-Alt').catch(()=>{});
        return;
      }
    }
    if (gd.automod?.antiRaid?.enabled) {
      const key=`${member.guild.id}:raid`, now=Date.now();
      if (!raidMap.has(key)) raidMap.set(key,[]);
      const joins=raidMap.get(key).filter(t=>now-t<(gd.automod.antiRaid.joinInterval||10)*1000);
      joins.push(now); raidMap.set(key,joins);
      if (joins.length>=(gd.automod.antiRaid.joinThreshold||10)) {
        if (gd.automod.antiRaid.action==='ban') await member.guild.members.ban(member.id,{reason:'Anti-Raid'}).catch(()=>{});
        else await member.kick('Anti-Raid').catch(()=>{});
        return;
      }
    }
    if (gd.autoRole?.enabled && gd.autoRole.roleId) await member.roles.add(gd.autoRole.roleId).catch(()=>{});
    await sendLog(member.guild, gd, 'memberJoin', { user:member.user.tag, userId:member.id, avatar:member.user.displayAvatarURL() });
    // Welcome
    if (!gd.welcome?.enabled || !gd.welcome.channel) return;
    const ch = member.guild.channels.cache.get(gd.welcome.channel);
    if (!ch) return;
    const vars = { user:`<@${member.id}>`, username:member.user.username, server:member.guild.name, count:member.guild.memberCount };
    if (gd.welcome.embedEnabled !== false) {
      const embed = new EmbedBuilder().setColor(gd.welcome.embedColor||'#5865F2')
        .setTitle(gd.welcome.embedTitle||'👋 Welcome!')
        .setDescription(rv(gd.welcome.embedDescription||'Hello {user}!', vars)).setTimestamp();
      if (gd.welcome.embedThumbnail!==false) embed.setThumbnail(member.user.displayAvatarURL({size:256}));
      if (gd.welcome.embedFooter) embed.setFooter({text:rv(gd.welcome.embedFooter,vars)});
      if (gd.welcome.embedImage) embed.setImage(gd.welcome.embedImage);
      if (gd.welcome.showJoinPosition) embed.addFields({name:'رقم العضو',value:`#${member.guild.memberCount}`,inline:true});
      await ch.send({ content:gd.welcome.mentionUser?`<@${member.id}>`:undefined, embeds:[embed] }).catch(()=>{});
    } else {
      await ch.send({ content:rv(gd.welcome.message||'Welcome {user}!', vars) }).catch(()=>{});
    }
    if (gd.welcome.dmEnabled && gd.welcome.dmMessage) await member.send({content:rv(gd.welcome.dmMessage,vars)}).catch(()=>{});
  });

  client.on('guildMemberRemove', async member => {
    const gd = await Guild.findOne({ guildId:member.guild.id }).lean().catch(()=>null);
    if (!gd) return;
    await sendLog(member.guild, gd, 'memberLeave', { user:member.user.tag, userId:member.id, avatar:member.user.displayAvatarURL() });
    if (gd.leveling?.resetOnLeave) await Level.deleteOne({ guildId:member.guild.id, userId:member.id }).catch(()=>{});
    if (!gd.goodbye?.enabled || !gd.goodbye.channel) return;
    const ch = member.guild.channels.cache.get(gd.goodbye.channel);
    if (!ch) return;
    const dur = member.joinedAt ? Math.floor((Date.now()-member.joinedAt)/86400000)+'d' : '?';
    const vars = { user:`<@${member.id}>`, username:member.user.username, server:member.guild.name, count:member.guild.memberCount, duration:dur };
    if (gd.goodbye.embedEnabled !== false) {
      const embed = new EmbedBuilder().setColor(gd.goodbye.embedColor||'#ED4245')
        .setTitle(gd.goodbye.embedTitle||'👋 Goodbye').setDescription(rv(gd.goodbye.embedDescription||'Goodbye!', vars))
        .setThumbnail(member.user.displayAvatarURL({size:256})).setTimestamp();
      if (gd.goodbye.embedFooter) embed.setFooter({text:rv(gd.goodbye.embedFooter,vars)});
      await ch.send({ embeds:[embed] }).catch(()=>{});
    } else {
      await ch.send({ content:rv(gd.goodbye.message||'Goodbye {user}!', vars) }).catch(()=>{});
    }
  });

  client.on('guildMemberUpdate', async (oldM, newM) => {
    const gd = await Guild.findOne({ guildId:newM.guild.id }).lean().catch(()=>null);
    if (!gd) return;
    if (oldM.nickname !== newM.nickname) await sendLog(newM.guild, gd, 'memberNickChange', { user:newM.user.tag, userId:newM.id, before:oldM.nickname||oldM.user.username, after:newM.nickname||newM.user.username });
    const addedR = newM.roles.cache.filter(r=>!oldM.roles.cache.has(r.id));
    const removedR = oldM.roles.cache.filter(r=>!newM.roles.cache.has(r.id));
    if (addedR.size||removedR.size) await sendLog(newM.guild, gd, 'memberRoleUpdate', { user:newM.user.tag, userId:newM.id, extra:`+${addedR.map(r=>r.name).join(',')||'—'} | -${removedR.map(r=>r.name).join(',')||'—'}` });
  });

  client.on('guildBanAdd',    async b => { const gd=await Guild.findOne({guildId:b.guild.id}).lean().catch(()=>null); await sendLog(b.guild,gd,'memberBan',{user:b.user.tag,userId:b.user.id,reason:b.reason}); });
  client.on('guildBanRemove', async b => { const gd=await Guild.findOne({guildId:b.guild.id}).lean().catch(()=>null); await sendLog(b.guild,gd,'memberUnban',{user:b.user.tag,userId:b.user.id}); });
  client.on('roleCreate',  async r => { const gd=await Guild.findOne({guildId:r.guild.id}).lean().catch(()=>null); await sendLog(r.guild,gd,'roleCreate',{extra:r.name}); });
  client.on('roleDelete',  async r => { const gd=await Guild.findOne({guildId:r.guild.id}).lean().catch(()=>null); await sendLog(r.guild,gd,'roleDelete',{extra:r.name}); });
  client.on('roleUpdate',  async (o,n) => { if(o.name===n.name&&o.hexColor===n.hexColor)return; const gd=await Guild.findOne({guildId:n.guild.id}).lean().catch(()=>null); await sendLog(n.guild,gd,'roleUpdate',{before:`${o.name}/${o.hexColor}`,after:`${n.name}/${n.hexColor}`}); });
  client.on('channelCreate', async c => { if(!c.guild)return; const gd=await Guild.findOne({guildId:c.guild.id}).lean().catch(()=>null); await sendLog(c.guild,gd,'channelCreate',{channel:c.name,channelId:c.id}); });
  client.on('channelDelete', async c => { if(!c.guild)return; const gd=await Guild.findOne({guildId:c.guild.id}).lean().catch(()=>null); await sendLog(c.guild,gd,'channelDelete',{channel:c.name,channelId:c.id}); });
  client.on('channelUpdate', async (o,n) => { if(!n.guild||o.name===n.name)return; const gd=await Guild.findOne({guildId:n.guild.id}).lean().catch(()=>null); await sendLog(n.guild,gd,'channelUpdate',{before:o.name,after:n.name}); });
  client.on('guildUpdate', async (o,n) => { const gd=await Guild.findOne({guildId:n.id}).lean().catch(()=>null); await sendLog(n,gd,'serverUpdate',{before:o.name,after:n.name}); });
  client.on('messageDelete', async m => { if(!m.guild||m.author?.bot)return; const gd=await Guild.findOne({guildId:m.guild.id}).lean().catch(()=>null); await sendLog(m.guild,gd,'messageDelete',{user:m.author?.tag,userId:m.author?.id,channel:m.channel?.name,channelId:m.channel?.id,content:m.content?.substring(0,1000)||'[attachment]'}); });
  client.on('messageUpdate', async (o,n) => { if(!o.guild||o.author?.bot||o.content===n.content)return; const gd=await Guild.findOne({guildId:o.guild.id}).lean().catch(()=>null); await sendLog(o.guild,gd,'messageEdit',{user:o.author?.tag,userId:o.author?.id,channel:o.channel?.name,channelId:o.channel?.id,before:o.content?.substring(0,500),after:n.content?.substring(0,500)}); });

  client.on('voiceStateUpdate', async (os, ns) => {
    const guild = ns.guild;
    const gd = await Guild.findOne({ guildId:guild.id }).lean().catch(()=>null);
    if (!gd) return;
    if (!os.channelId && ns.channelId) {
      await sendLog(guild, gd, 'voiceJoin', { user:ns.member?.user.tag, userId:ns.member?.id, channel:ns.channel?.name, channelId:ns.channelId });
      if (gd.leveling?.voiceXp) voiceMap.set(`${guild.id}:${ns.id}`, Date.now());
    } else if (os.channelId && !ns.channelId) {
      await sendLog(guild, gd, 'voiceLeave', { user:ns.member?.user.tag, userId:ns.member?.id, channel:os.channel?.name, channelId:os.channelId });
      if (gd.leveling?.voiceXp) {
        const k = `${guild.id}:${ns.id}`, st = voiceMap.get(k);
        if (st) { voiceMap.delete(k); const mins=Math.floor((Date.now()-st)/60000); if (mins>0) { let ld=await Level.findOne({guildId:guild.id,userId:ns.id}).catch(()=>null); if (!ld) ld=new Level({guildId:guild.id,userId:ns.id,xp:0,level:0}); const ol=ld.level; ld.xp+=mins*(gd.leveling.voiceXpPerMin||5); ld.level=levelFromXp(ld.xp); await ld.save().catch(()=>{}); if (ld.level>ol&&ns.member) await assignLevelRoles(ns.member,guild,gd,ld.level).catch(()=>{}); } }
      }
    } else if (os.channelId && ns.channelId && os.channelId!==ns.channelId) {
      await sendLog(guild, gd, 'voiceMove', { user:ns.member?.user.tag, userId:ns.member?.id, before:os.channel?.name, after:ns.channel?.name });
    }
  });

  // ── Messages ─────────────────────────────────────────────────
  client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;
    const gd = await Guild.findOne({ guildId:message.guild.id }).lean().catch(()=>null);
    if (!gd) return;
    const prefix = gd.prefix || '!';
    const mentionRe = new RegExp(`^<@!?${client.user.id}>\\s*`);
    const isMention = mentionRe.test(message.content);
    const isPrefix  = message.content.startsWith(prefix);

    // AutoMod
    if (gd.automod?.enabled && !message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
      const am = gd.automod;
      const isIgnR = (am.ignoredRoles||[]).some(r=>message.member?.roles.cache.has(r));
      const isIgnC = (am.ignoredChannels||[]).includes(message.channel.id);
      if (!isIgnR && !isIgnC) {
        const content = message.content; let violated = null;
        if (!violated && am.antiLinks?.enabled) { const ur=/https?:\/\/\S+|www\.\S+/i; const wl=am.antiLinks.whitelist||[]; if (ur.test(content)&&!wl.some(d=>content.includes(d))) violated={rule:'antiLinks',cfg:am.antiLinks}; }
        if (!violated && am.antiInvites?.enabled && /discord\.(gg|io|me|li)\//i.test(content)) violated={rule:'antiInvites',cfg:am.antiInvites};
        if (!violated && am.antiBadWords?.enabled && am.antiBadWords.words?.length) { const lo=content.toLowerCase(); if (am.antiBadWords.words.some(w=>lo.includes(w.toLowerCase()))) violated={rule:'antiBadWords',cfg:am.antiBadWords}; }
        if (!violated && am.antiCaps?.enabled) { const letters=content.replace(/[^a-zA-Z]/g,''); if (letters.length>=(am.antiCaps.minLength||10)) { const ratio=(content.replace(/[^A-Z]/g,'').length/letters.length)*100; if (ratio>=(am.antiCaps.threshold||70)) violated={rule:'antiCaps',cfg:am.antiCaps}; } }
        if (!violated && am.antiMentions?.enabled && message.mentions.users.size>=(am.antiMentions.maxMentions||5)) violated={rule:'antiMentions',cfg:am.antiMentions};
        if (!violated && am.antiEmoji?.enabled && (content.match(/\p{Emoji}/gu)||[]).length>=(am.antiEmoji.maxEmojis||5)) violated={rule:'antiEmoji',cfg:am.antiEmoji};
        if (!violated && am.antiZalgo?.enabled && /[\u0300-\u036f\u0489]{3,}/.test(content)) violated={rule:'antiZalgo',cfg:am.antiZalgo};
        if (!violated && am.antiSpam?.enabled) {
          const k=`${message.guild.id}:${message.author.id}:spam`, now=Date.now();
          if (!spamMap.has(k)) spamMap.set(k,[]);
          const msgs=spamMap.get(k).filter(t=>now-t<(am.antiSpam.interval||5)*1000); msgs.push(now); spamMap.set(k,msgs);
          if (msgs.length>=(am.antiSpam.maxMessages||5)) { violated={rule:'antiSpam',cfg:am.antiSpam}; spamMap.delete(k); }
        }
        if (!violated && am.antiDuplicate?.enabled) {
          const k=`${message.guild.id}:${message.author.id}:dup`, now=Date.now();
          if (!spamMap.has(k)) spamMap.set(k,[]);
          const msgs=spamMap.get(k).filter(m=>now-m.time<30000&&m.content===content); msgs.push({time:now,content}); spamMap.set(k,msgs);
          if (msgs.length>=(am.antiDuplicate.threshold||3)) violated={rule:'antiDuplicate',cfg:am.antiDuplicate};
        }
        if (violated) {
          await message.delete().catch(()=>{});
          const ruleNames={antiLinks:'روابط',antiInvites:'دعوات',antiBadWords:'كلمات سيئة',antiCaps:'كابس',antiMentions:'منشن كثير',antiSpam:'سبام',antiDuplicate:'مكرر',antiEmoji:'إيموجي كثير',antiZalgo:'زالجو'};
          if (am.logChannel) { const lc=message.guild.channels.cache.get(am.logChannel); if (lc) await lc.send({ embeds:[new EmbedBuilder().setColor('#ED4245').setTitle('🚨 AutoMod').addFields({name:'العضو',value:`<@${message.author.id}>`,inline:true},{name:'القاعدة',value:ruleNames[violated.rule]||violated.rule,inline:true}).setTimestamp()] }).catch(()=>{}); }
          const rm = await message.channel.send({content:`<@${message.author.id}> ❌ **AutoMod:** ${ruleNames[violated.rule]||violated.rule}`}).catch(()=>null);
          if (rm) setTimeout(()=>rm.delete().catch(()=>{}), 5000);
          const p=violated.cfg.punishment||'delete';
          if (p==='warn') await Warning.create({guildId:message.guild.id,userId:message.author.id,userTag:message.author.tag,reason:`AutoMod: ${violated.rule}`,moderatorId:client.user.id,moderatorTag:client.user.tag}).catch(()=>{});
          else if (p==='mute') await message.member.timeout((violated.cfg.muteDuration||10)*60000,`AutoMod`).catch(()=>{});
          else if (p==='kick') await message.member.kick('AutoMod').catch(()=>{});
          else if (p==='ban') await message.guild.members.ban(message.author.id,{reason:'AutoMod'}).catch(()=>{});
          return;
        }
      }
    }

    // XP
    if (!isPrefix && !isMention && gd.leveling?.enabled) {
      const noR=(gd.leveling.noXpRoles||[]).some(r=>message.member?.roles.cache.has(r));
      const noC=(gd.leveling.noXpChannels||[]).includes(message.channel.id);
      if (!noR && !noC) {
        const ck=`${message.guild.id}:${message.author.id}:xp`, now=Date.now();
        if (now-(xpCool.get(ck)||0)>=(gd.leveling.cooldown||60)*1000) {
          xpCool.set(ck,now);
          let mult=1;
          for (const mr of (gd.leveling.multiplierRoles||[])) if (message.member?.roles.cache.has(mr.roleId)) mult=Math.max(mult,mr.multiplier);
          const xpGain=Math.floor((Math.random()*((gd.leveling.xpMax||25)-(gd.leveling.xpMin||10)+1)+(gd.leveling.xpMin||10))*mult);
          let ld=await Level.findOne({guildId:message.guild.id,userId:message.author.id}).catch(()=>null);
          if (!ld) ld=new Level({guildId:message.guild.id,userId:message.author.id,userTag:message.author.tag,xp:0,level:0});
          const ol=ld.level; ld.xp+=xpGain; ld.userTag=message.author.tag; ld.avatar=message.author.displayAvatarURL({size:128}); ld.level=levelFromXp(ld.xp);
          await ld.save().catch(()=>{});
          if (ld.level>ol) {
            await assignLevelRoles(message.member,message.guild,gd,ld.level).catch(()=>{});
            if (gd.leveling.levelUpEnabled!==false && gd.leveling.announcement!=='disabled') {
              const vars={user:`<@${message.author.id}>`,username:message.author.username,level:ld.level,xp:ld.xp,server:message.guild.name};
              const lvlCh=gd.leveling.announcement==='channel'&&gd.leveling.levelUpChannel?message.guild.channels.cache.get(gd.leveling.levelUpChannel):null;
              const target=lvlCh||(gd.leveling.announcement!=='dm'?message.channel:null);
              const embed=new EmbedBuilder().setColor('#FFD700').setTitle('🎉 Level Up!')
                .setDescription(`<@${message.author.id}> وصل للمستوى **${ld.level}**! ${rv(gd.leveling.levelUpMessage||'',vars)}`)
                .setThumbnail(message.author.displayAvatarURL({size:128}))
                .addFields({name:'المستوى',value:`${ld.level}`,inline:true},{name:'XP',value:`${ld.xp}`,inline:true},{name:'التقدم',value:xpBar(ld.xp,ld.level),inline:false}).setTimestamp();
              if (target) await target.send({embeds:[embed]}).catch(()=>{});
              else if (gd.leveling.announcement==='dm') await message.author.send({embeds:[embed]}).catch(()=>{});
            }
          }
        }
      }
    }

    // Custom command (no prefix)
    if (!isPrefix && !isMention) {
      const lo=message.content.toLowerCase().trim();
      const cc=gd.customCommands?.find(c=>c.enabled&&lo===c.trigger.toLowerCase());
      if (cc) {
        if (cc.allowedChannels?.length&&!cc.allowedChannels.includes(message.channel.id)) return;
        if (cc.allowedRoles?.length&&!cc.allowedRoles.some(r=>message.member?.roles.cache.has(r))) return;
        const vars={user:`<@${message.author.id}>`,username:message.author.username,server:message.guild.name,count:message.guild.memberCount};
        if (cc.embedEnabled) { const e=new EmbedBuilder().setColor(cc.embedColor||'#5865F2').setDescription(rv(cc.response,vars)); if (cc.embedTitle) e.setTitle(cc.embedTitle); await message.channel.send({embeds:[e]}).catch(()=>{}); }
        else { const s=await message.channel.send({content:rv(cc.response,vars)}).catch(()=>null); if (cc.deleteAfter>0&&s) setTimeout(()=>s.delete().catch(()=>{}),cc.deleteAfter*1000); }
        await Guild.updateOne({guildId:message.guild.id,'customCommands.trigger':cc.trigger},{$inc:{'customCommands.$.usageCount':1}}).catch(()=>{});
      }
      return;
    }

    // Parse command
    const rawArgs = isMention ? message.content.replace(mentionRe,'').trim() : message.content.slice(prefix.length).trim();
    if (!rawArgs && isMention) return message.reply({content:`👋 أهلاً! استخدم \`${prefix}help\` للمساعدة.`}).catch(()=>{});
    const args = rawArgs.split(/\s+/), cmdName = args.shift().toLowerCase();

    const cmds = gd.commands?.length ? gd.commands : DEFAULT_COMMANDS.map(c=>({...c}));
    const cmdCfg = cmds.find(c=>c.name===cmdName||(c.aliases||[]).map(a=>a.toLowerCase()).includes(cmdName));

    if (!cmdCfg?.enabled) {
      const cc=gd.customCommands?.find(c=>c.enabled&&c.trigger.toLowerCase()===cmdName);
      if (cc) {
        const vars={user:`<@${message.author.id}>`,username:message.author.username,server:message.guild.name,count:message.guild.memberCount};
        if (cc.embedEnabled) { const e=new EmbedBuilder().setColor(cc.embedColor||'#5865F2').setDescription(rv(cc.response,vars)); if (cc.embedTitle) e.setTitle(cc.embedTitle); await message.channel.send({embeds:[e]}).catch(()=>{}); }
        else await message.channel.send({content:rv(cc.response,vars)}).catch(()=>{});
      }
      return;
    }

    if (cmdCfg.allowedRoles?.length&&!message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
      if (!cmdCfg.allowedRoles.some(r=>message.member?.roles.cache.has(r))) return message.reply({content:'❌ ليس لديك صلاحية.'}).catch(()=>{});
    }
    await Guild.updateOne({guildId:message.guild.id,'commands.name':cmdCfg.name},{$inc:{'commands.$.usageCount':1}}).catch(()=>{});

    try {
      const noP=(p='Admin')=>message.reply({content:`❌ تحتاج صلاحية: **${p}**`}).catch(()=>{});
      const n=cmdCfg.name;

      if (n==='ping') return message.reply({content:`🏓 Pong! \`${client.ws.ping}ms\``});
      if (n==='help') {
        const e=new EmbedBuilder().setColor('#5865F2').setTitle('📋 قائمة الأوامر').setDescription(`البادئة: \`${prefix}\` أو منشن البوت`).setThumbnail(client.user.displayAvatarURL());
        const cats={general:'عام 🌐',admin:'إدارة 🔨',levels:'مستويات ⭐',ticket:'تذاكر 🎫',fun:'ترفيه 🎮'};
        for (const [cat,label] of Object.entries(cats)) { const c=cmds.filter(c=>c.category===cat&&c.enabled).map(c=>`\`${c.name}\``).join(' '); if (c) e.addFields({name:label,value:c,inline:false}); }
        return message.reply({embeds:[e]});
      }
      if (n==='botinfo') {
        const up=Math.floor(client.uptime/1000),h=Math.floor(up/3600),m=Math.floor((up%3600)/60),s=up%60;
        const e=new EmbedBuilder().setColor('#5865F2').setTitle(`🤖 ${client.user.username}`).setThumbnail(client.user.displayAvatarURL({size:256}))
          .addFields({name:'السيرفرات',value:`${client.guilds.cache.size}`,inline:true},{name:'البينج',value:`${client.ws.ping}ms`,inline:true},{name:'التشغيل',value:`${h}h ${m}m ${s}s`,inline:true},{name:'Node.js',value:process.version,inline:true});
        return message.reply({embeds:[e]});
      }
      if (n==='userinfo') {
        const t=message.mentions.members?.first()||message.member;
        const age=Math.floor((Date.now()-t.user.createdTimestamp)/86400000);
        const e=new EmbedBuilder().setColor('#5865F2').setTitle(`👤 ${t.user.tag}`).setThumbnail(t.user.displayAvatarURL({size:256}))
          .addFields({name:'ID',value:t.id,inline:true},{name:'عمر الحساب',value:`${age} يوم`,inline:true},{name:'انضم',value:`<t:${Math.floor(t.joinedTimestamp/1000)}:R>`,inline:true},{name:'الرولات',value:t.roles.cache.filter(r=>r.id!==r.guild.id).map(r=>`<@&${r.id}>`).join(' ').substring(0,1024)||'لا يوجد',inline:false});
        return message.reply({embeds:[e]});
      }
      if (n==='serverinfo') {
        const g=message.guild;
        return message.reply({embeds:[new EmbedBuilder().setColor('#5865F2').setTitle(g.name).setThumbnail(g.iconURL({size:256})).addFields({name:'أعضاء',value:`${g.memberCount}`,inline:true},{name:'قنوات',value:`${g.channels.cache.size}`,inline:true},{name:'رولات',value:`${g.roles.cache.size}`,inline:true},{name:'المالك',value:`<@${g.ownerId}>`,inline:true},{name:'إنشاء',value:`<t:${Math.floor(g.createdTimestamp/1000)}:R>`,inline:true})]});
      }
      if (n==='avatar') { const t=message.mentions.users.first()||message.author; return message.reply({embeds:[new EmbedBuilder().setColor('#5865F2').setTitle(`🖼️ ${t.username}`).setImage(t.displayAvatarURL({size:512,forceStatic:false}))]}); }
      if (n==='members') return message.reply({content:`👥 **${message.guild.memberCount}** عضو`});

      if (n==='rank') {
        const t=message.mentions.members?.first()||message.member;
        const ld=await Level.findOne({guildId:message.guild.id,userId:t.id}).lean().catch(()=>null);
        if (!ld) return message.reply({content:`❌ لا يوجد بيانات XP لـ **${t.user.username}**!`});
        const rank=await Level.countDocuments({guildId:message.guild.id,xp:{$gt:ld.xp}}).catch(()=>0);
        return message.reply({embeds:[new EmbedBuilder().setColor('#5865F2').setTitle(`🏅 ${t.user.username}`).setThumbnail(t.user.displayAvatarURL({size:128})).addFields({name:'الترتيب',value:`#${rank+1}`,inline:true},{name:'المستوى',value:`${ld.level}`,inline:true},{name:'XP',value:`${ld.xp}/${xpForLevel(ld.level+1)}`,inline:true},{name:'التقدم',value:xpBar(ld.xp,ld.level),inline:false})]});
      }
      if (n==='leaderboard') {
        const levels=await Level.find({guildId:message.guild.id}).sort({xp:-1}).limit(10).lean().catch(()=>[]);
        const medals=['🥇','🥈','🥉'];
        return message.reply({embeds:[new EmbedBuilder().setColor('#5865F2').setTitle('🏆 المتصدرون').setDescription(levels.map((l,i)=>`${medals[i]||`**${i+1}.**`} <@${l.userId}> — لفل ${l.level} (\`${l.xp}\` XP)`).join('\n')||'لا توجد بيانات')]});
      }
      if (n==='setlevel') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return noP('Admin');
        const t=message.mentions.members?.first(), lvl=parseInt(args[1]||args[0]);
        if (!t||isNaN(lvl)) return message.reply({content:'❌ setlevel @عضو <مستوى>'});
        let ld=await Level.findOne({guildId:message.guild.id,userId:t.id}).catch(()=>null);
        if (!ld) ld=new Level({guildId:message.guild.id,userId:t.id,userTag:t.user.tag});
        ld.level=lvl; ld.xp=xpForLevel(lvl); await ld.save();
        await assignLevelRoles(t,message.guild,gd,lvl).catch(()=>{});
        return message.reply({content:`✅ مستوى **${t.user.tag}** → **${lvl}**`});
      }
      if (n==='addxp') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return noP('Admin');
        const t=message.mentions.members?.first(), amt=parseInt(args[1]||args[0]);
        if (!t||isNaN(amt)) return message.reply({content:'❌ addxp @عضو <كمية>'});
        let ld=await Level.findOne({guildId:message.guild.id,userId:t.id}).catch(()=>null);
        if (!ld) ld=new Level({guildId:message.guild.id,userId:t.id,userTag:t.user.tag,xp:0,level:0});
        ld.xp=Math.max(0,ld.xp+amt); ld.level=levelFromXp(ld.xp); await ld.save();
        return message.reply({content:`✅ أضيف \`${amt}\` XP لـ **${t.user.tag}** — الإجمالي: \`${ld.xp}\``});
      }
      if (n==='removexp') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return noP('Admin');
        const t=message.mentions.members?.first(), amt=parseInt(args[1]||args[0]);
        if (!t||isNaN(amt)) return message.reply({content:'❌ removexp @عضو <كمية>'});
        let ld=await Level.findOne({guildId:message.guild.id,userId:t.id}).catch(()=>null);
        if (!ld) return message.reply({content:'❌ لا يوجد بيانات'});
        ld.xp=Math.max(0,ld.xp-amt); ld.level=levelFromXp(ld.xp); await ld.save();
        return message.reply({content:`✅ أُزيل \`${amt}\` XP من **${t.user.tag}**`});
      }
      if (n==='resetxp') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return noP('Admin');
        const t=message.mentions.members?.first();
        if (!t) return message.reply({content:'❌ resetxp @عضو'});
        await Level.deleteOne({guildId:message.guild.id,userId:t.id});
        return message.reply({content:`✅ تم إعادة تعيين XP لـ **${t.user.tag}**`});
      }
      if (n==='kick') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return noP('طرد الأعضاء');
        const t=message.mentions.members?.first(); if (!t) return message.reply({content:'❌ اذكر العضو!'});
        const reason=args.slice(1).join(' ')||'لا يوجد سبب'; await t.kick(reason);
        await sendLog(message.guild,gd,'memberKick',{user:t.user.tag,userId:t.id,moderator:message.author.tag,moderatorId:message.author.id,reason});
        return message.reply({content:`✅ طُرد **${t.user.tag}** — ${reason}`});
      }
      if (n==='ban') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return noP('حظر الأعضاء');
        const t=message.mentions.members?.first(); if (!t) return message.reply({content:'❌ اذكر العضو!'});
        const reason=args.slice(1).join(' ')||'لا يوجد سبب'; await message.guild.members.ban(t.id,{reason});
        await sendLog(message.guild,gd,'memberBan',{user:t.user.tag,userId:t.id,moderator:message.author.tag,moderatorId:message.author.id,reason});
        return message.reply({content:`✅ حُظر **${t.user.tag}** — ${reason}`});
      }
      if (n==='unban') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return noP('حظر الأعضاء');
        const uid=args[0]; if (!uid) return message.reply({content:'❌ أدخل ID!'});
        await message.guild.members.unban(uid).catch(()=>{});
        await sendLog(message.guild,gd,'memberUnban',{userId:uid,moderator:message.author.tag});
        return message.reply({content:`✅ رُفع الحظر عن <@${uid}>`});
      }
      if (n==='mute') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return noP('Moderate Members');
        const t=message.mentions.members?.first(); if (!t) return message.reply({content:'❌ اذكر العضو!'});
        const mins=parseInt(args[1])||10, reason=args.slice(2).join(' ')||'لا يوجد سبب';
        await t.timeout(mins*60000,reason);
        await sendLog(message.guild,gd,'memberMute',{user:t.user.tag,userId:t.id,moderator:message.author.tag,moderatorId:message.author.id,reason});
        return message.reply({content:`✅ كُتم **${t.user.tag}** لـ ${mins} دقيقة`});
      }
      if (n==='unmute'||n==='untimeout') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return noP('Moderate Members');
        const t=message.mentions.members?.first(); if (!t) return message.reply({content:'❌ اذكر العضو!'});
        await t.timeout(null); return message.reply({content:`✅ رُفع الكتم عن **${t.user.tag}**`});
      }
      if (n==='warn') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return noP('Moderate Members');
        const t=message.mentions.members?.first(); if (!t) return message.reply({content:'❌ اذكر العضو!'});
        const reason=args.slice(1).join(' ')||'لا يوجد سبب';
        await Warning.create({guildId:message.guild.id,userId:t.id,userTag:t.user.tag,moderatorId:message.author.id,moderatorTag:message.author.tag,reason});
        await sendLog(message.guild,gd,'memberWarn',{user:t.user.tag,userId:t.id,moderator:message.author.tag,moderatorId:message.author.id,reason});
        return message.reply({content:`⚠️ حُذر **${t.user.tag}** — ${reason}`});
      }
      if (n==='warnings') {
        const t=message.mentions.members?.first()||message.member;
        const warns=await Warning.find({guildId:message.guild.id,userId:t.id}).lean().catch(()=>[]);
        const e=new EmbedBuilder().setColor('#FEE75C').setTitle(`⚠️ تحذيرات: ${t.user.tag}`).setDescription(warns.map((w,i)=>`**${i+1}.** ${w.reason} — ${w.moderatorTag||'System'}`).join('\n')||'لا توجد تحذيرات');
        return message.reply({embeds:[e]});
      }
      if (n==='clearwarns') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return noP('Moderate Members');
        const t=message.mentions.members?.first(); if (!t) return message.reply({content:'❌ اذكر العضو!'});
        await Warning.deleteMany({guildId:message.guild.id,userId:t.id});
        return message.reply({content:`✅ تم مسح تحذيرات **${t.user.tag}**`});
      }
      if (n==='clear') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return noP('إدارة الرسائل');
        const amt=Math.min(parseInt(args[0])||10,100); await message.channel.bulkDelete(amt,true).catch(()=>{});
        const m=await message.channel.send({content:`✅ حُذف ${amt} رسالة`}); setTimeout(()=>m.delete().catch(()=>{}),3000); return;
      }
      if (n==='slowmode') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return noP('إدارة القنوات');
        const s=parseInt(args[0])||0; await message.channel.setRateLimitPerUser(s);
        return message.reply({content:`✅ سلو موود: ${s} ثانية`});
      }
      if (n==='lock') { if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return noP('إدارة القنوات'); await message.channel.permissionOverwrites.edit(message.guild.roles.everyone,{SendMessages:false}); return message.reply({content:'🔒 قناة مقفلة'}); }
      if (n==='unlock') { if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return noP('إدارة القنوات'); await message.channel.permissionOverwrites.edit(message.guild.roles.everyone,{SendMessages:null}); return message.reply({content:'🔓 قناة مفتوحة'}); }
      if (n==='lockdown') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return noP('إدارة القنوات');
        let count=0; for (const [,c] of message.guild.channels.cache) { if (c.type===ChannelType.GuildText) { await c.permissionOverwrites.edit(message.guild.roles.everyone,{SendMessages:false}).catch(()=>{}); count++; } }
        return message.reply({content:`🔒 تم قفل **${count}** قناة`});
      }
      if (n==='unlockall') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return noP('إدارة القنوات');
        let count=0; for (const [,c] of message.guild.channels.cache) { if (c.type===ChannelType.GuildText) { await c.permissionOverwrites.edit(message.guild.roles.everyone,{SendMessages:null}).catch(()=>{}); count++; } }
        return message.reply({content:`🔓 تم فتح **${count}** قناة`});
      }
      if (n==='nuke') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return noP('إدارة القنوات');
        const ch=message.channel, pos=ch.rawPosition, par=ch.parentId, ow=ch.permissionOverwrites.cache;
        await ch.delete('Nuke');
        const newCh=await message.guild.channels.create({name:ch.name,type:ChannelType.GuildText,parent:par||undefined,permissionOverwrites:[...ow.values()],position:pos,reason:'Nuke'}).catch(()=>null);
        if (newCh) await newCh.send({content:'💥 تم نيوك القناة!'}).catch(()=>{});
        return;
      }
      if (n==='giverole') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return noP('إدارة الرولات');
        const t=message.mentions.members?.first(), rid=args[1]||args[0];
        if (!t||!rid) return message.reply({content:'❌ giverole @عضو <ID>'});
        const role=message.guild.roles.cache.get(rid.replace(/[<@&>]/g,''));
        if (!role) return message.reply({content:'❌ رول غير موجود!'});
        await t.roles.add(role); return message.reply({content:`✅ أُعطي رول **${role.name}** لـ **${t.user.tag}**`});
      }
      if (n==='takerole') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return noP('إدارة الرولات');
        const t=message.mentions.members?.first(), rid=args[1]||args[0];
        if (!t||!rid) return message.reply({content:'❌ takerole @عضو <ID>'});
        const role=message.guild.roles.cache.get(rid.replace(/[<@&>]/g,''));
        if (!role) return message.reply({content:'❌ رول غير موجود!'});
        await t.roles.remove(role); return message.reply({content:`✅ سُحب رول **${role.name}** من **${t.user.tag}**`});
      }
      if (n==='announce') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return noP('إدارة الرسائل');
        const text=args.join(' '); if (!text) return message.reply({content:'❌ announce <النص>'});
        await message.delete().catch(()=>{});
        return message.channel.send({embeds:[new EmbedBuilder().setColor('#5865F2').setTitle('📢 إعلان').setDescription(text).setFooter({text:`بواسطة: ${message.author.tag}`}).setTimestamp()]});
      }
      if (n==='ticket') {
        const sub=args[0]?.toLowerCase();
        const ticket=await Ticket.findOne({guildId:message.guild.id,channelId:message.channel.id,status:'open'});
        const staffRole=gd.tickets?.staffRole;
        if (sub==='close') {
          if (!ticket) return message.reply({content:'❌ ليست تذكرة مفتوحة'});
          const ok=staffRole&&message.member.roles.cache.has(staffRole)||ticket.userId===message.author.id||message.member.permissions.has(PermissionsBitField.Flags.ManageChannels);
          if (!ok) return message.reply({content:'❌ ليس لديك صلاحية'});
          ticket.status='closed'; ticket.closedAt=new Date(); ticket.closedBy=message.author.id; ticket.closedByTag=message.author.tag; await ticket.save();
          const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_reopen').setLabel('🔓 إعادة فتح').setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId('ticket_delete').setLabel('🗑️ حذف').setStyle(ButtonStyle.Danger));
          await message.channel.send({embeds:[new EmbedBuilder().setColor('#ED4245').setTitle('🔒 أُغلقت التذكرة').setDescription(`بواسطة <@${message.author.id}>`).setTimestamp()],components:[row]});
          await message.channel.permissionOverwrites.edit(ticket.userId,{SendMessages:false}).catch(()=>{});
        } else if (sub==='add') {
          const t=message.mentions.members?.first(); if (!t) return message.reply({content:'❌ اذكر عضواً!'});
          await message.channel.permissionOverwrites.edit(t,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true});
          return message.reply({content:`✅ أُضيف **${t.user.tag}**`});
        } else if (sub==='remove') {
          const t=message.mentions.members?.first(); if (!t) return message.reply({content:'❌ اذكر عضواً!'});
          await message.channel.permissionOverwrites.delete(t);
          return message.reply({content:`✅ أُزيل **${t.user.tag}**`});
        }
        return;
      }
      if (n==='8ball') {
        const q=args.join(' '); if (!q) return message.reply({content:'❓ اسأل سؤالاً!'});
        const a=['نعم ✅','لا ❌','ربما 🤔','اسأل لاحقاً ⏰','الإشارات تقول نعم 🔮','غير متأكد 🤷','محتمل جداً 🟢','شك كبير 😕','الآفاق تبدو جيدة 🌟'];
        return message.reply({content:`🔮 **${a[Math.floor(Math.random()*a.length)]}**\n> ${q}`});
      }
      if (n==='coinflip') return message.reply({content:Math.random()<0.5?'🪙 صورة!':'🪙 كتابة!'});
      if (n==='roll') { const max=parseInt(args[0])||6; return message.reply({content:`🎲 **${Math.floor(Math.random()*max)+1}** (1-${max})`}); }
      if (n==='choose') { const opts=args.join(' ').split('|').map(s=>s.trim()).filter(Boolean); if (!opts.length) return message.reply({content:'❓ choose خيار1 | خيار2'}); return message.reply({content:`🎯 **${opts[Math.floor(Math.random()*opts.length)]}**`}); }
      if (n==='rps') {
        const choices=['🪨 حجر','📄 ورقة','✂️ مقص'], map={حجر:0,ورقة:1,مقص:2,rock:0,paper:1,scissors:2,r:0,p:1,s:2};
        const bot=choices[Math.floor(Math.random()*3)], ui=map[args[0]?.toLowerCase()];
        if (ui===undefined) return message.reply({content:'🎮 اختر: حجر، ورقة، أو مقص'});
        const bi=choices.indexOf(bot), res=ui===bi?'تعادل!':(ui-bi+3)%3===1?'فزت! 🎉':'خسرت! 😢';
        return message.reply({content:`أنت: **${choices[ui]}** | أنا: **${bot}**\n**${res}**`});
      }
    } catch(e) { console.error(`[Cmd]`,e.message); message.reply({content:`❌ خطأ: ${e.message}`}).catch(()=>{}); }
  });

  // Interactions
  client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    const { customId, guild, member } = interaction;
    if (customId==='verify_button') {
      const gd=await Guild.findOne({guildId:guild.id}).lean().catch(()=>null);
      if (!gd?.protection?.verifySystem?.role) return interaction.reply({content:'❌ نظام التحقق غير مهيأ!',ephemeral:true});
      if (member.roles.cache.has(gd.protection.verifySystem.role)) return interaction.reply({content:'✅ أنت محقق بالفعل!',ephemeral:true});
      await member.roles.add(gd.protection.verifySystem.role).catch(()=>{});
      return interaction.reply({content:'✅ تم التحقق! أهلاً بك 🎉',ephemeral:true});
    }
    if (customId==='ticket_open'||customId.startsWith('ticket_topic_')) {
      const gd=await Guild.findOne({guildId:guild.id}).lean().catch(()=>null);
      if (!gd?.tickets?.enabled) return interaction.reply({content:'❌ نظام التذاكر معطل',ephemeral:true});
      const tk=gd.tickets;
      const existing=await Ticket.findOne({guildId:guild.id,userId:member.id,status:'open'}).lean().catch(()=>null);
      if (existing) return interaction.reply({content:`❌ لديك تذكرة مفتوحة: <#${existing.channelId}>`,ephemeral:true});
      let topic=null;
      if (customId.startsWith('ticket_topic_')) topic=tk.topics?.find(t=>t.id===customId.replace('ticket_topic_',''));
      const count=await Ticket.countDocuments({guildId:guild.id}).catch(()=>0);
      const chName=(tk.namingFormat||'ticket-{id}').replace('{id}',String(count+1).padStart(4,'0')).replace('{username}',member.user.username.toLowerCase().replace(/[^a-z0-9]/g,'').substring(0,20));
      const staffRole=topic?.staffRole||tk.staffRole;
      const ch=await guild.channels.create({name:chName,type:ChannelType.GuildText,parent:topic?.category||tk.category||undefined,permissionOverwrites:[{id:guild.roles.everyone.id,deny:[PermissionsBitField.Flags.ViewChannel]},{id:member.id,allow:[PermissionsBitField.Flags.ViewChannel,PermissionsBitField.Flags.SendMessages,PermissionsBitField.Flags.ReadMessageHistory]},...(staffRole?[{id:staffRole,allow:[PermissionsBitField.Flags.ViewChannel,PermissionsBitField.Flags.SendMessages]}]:[])],reason:`Ticket by ${member.user.tag}`}).catch(()=>null);
      if (!ch) return interaction.reply({content:'❌ فشل إنشاء قناة التذكرة',ephemeral:true});
      await Ticket.create({guildId:guild.id,userId:member.id,userTag:member.user.tag,channelId:ch.id,ticketId:count+1,topic:topic?.label||null}).catch(()=>{});
      const embed=new EmbedBuilder().setColor(tk.embedColor||'#5865F2').setTitle(topic?`${topic.emoji||'🎫'} ${topic.label}`:'🎫 تذكرة جديدة').setDescription(tk.welcomeMessage||'مرحباً! كيف يمكننا مساعدتك؟').addFields({name:'العضو',value:`<@${member.id}>`,inline:true},{name:'رقم',value:`#${count+1}`,inline:true}).setTimestamp();
      const btns=[new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒 إغلاق').setStyle(ButtonStyle.Danger)];
      if (tk.claimEnabled!==false) btns.push(new ButtonBuilder().setCustomId('ticket_claim').setLabel('👋 حجز').setStyle(ButtonStyle.Secondary));
      if (tk.priorityEnabled!==false) btns.push(new ButtonBuilder().setCustomId('ticket_priority').setLabel('🚨 أولوية').setStyle(ButtonStyle.Primary));
      await ch.send({content:tk.pingStaff&&staffRole?`<@&${staffRole}>`:undefined,embeds:[embed],components:[new ActionRowBuilder().addComponents(...btns)]});
      if (tk.logChannel) { const lc=guild.channels.cache.get(tk.logChannel); if (lc) await lc.send({embeds:[new EmbedBuilder().setColor('#57F287').setTitle('🎫 تذكرة جديدة').addFields({name:'العضو',value:`<@${member.id}>`,inline:true},{name:'القناة',value:`<#${ch.id}>`,inline:true}).setTimestamp()]}).catch(()=>{}); }
      return interaction.reply({content:`✅ تذكرتك: <#${ch.id}>`,ephemeral:true});
    }
    if (customId==='ticket_close') {
      const ticket=await Ticket.findOne({guildId:guild.id,channelId:interaction.channel.id,status:'open'});
      if (!ticket) return interaction.reply({content:'❌ ليست تذكرة مفتوحة',ephemeral:true});
      const gd=await Guild.findOne({guildId:guild.id}).lean().catch(()=>null);
      const ok=(gd?.tickets?.staffRole&&member.roles.cache.has(gd.tickets.staffRole))||ticket.userId===member.id||member.permissions.has(PermissionsBitField.Flags.ManageChannels);
      if (!ok) return interaction.reply({content:'❌ ليس لديك صلاحية',ephemeral:true});
      ticket.status='closed'; ticket.closedAt=new Date(); ticket.closedBy=member.id; ticket.closedByTag=member.user.tag; await ticket.save();
      await interaction.channel.permissionOverwrites.edit(ticket.userId,{SendMessages:false}).catch(()=>{});
      const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_reopen').setLabel('🔓 إعادة فتح').setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId('ticket_delete').setLabel('🗑️ حذف').setStyle(ButtonStyle.Danger));
      return interaction.reply({embeds:[new EmbedBuilder().setColor('#ED4245').setTitle('🔒 أُغلقت التذكرة').setDescription(`بواسطة <@${member.id}>`).setTimestamp()],components:[row]});
    }
    if (customId==='ticket_reopen') {
      const ticket=await Ticket.findOne({guildId:guild.id,channelId:interaction.channel.id});
      if (!ticket||ticket.status!=='closed') return interaction.reply({content:'❌ التذكرة ليست مغلقة',ephemeral:true});
      const gd=await Guild.findOne({guildId:guild.id}).lean().catch(()=>null);
      if (!member.roles.cache.has(gd?.tickets?.staffRole)&&!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return interaction.reply({content:'❌ فقط الستاف',ephemeral:true});
      ticket.status='open'; ticket.closedAt=null; ticket.closedBy=null; await ticket.save();
      await interaction.channel.permissionOverwrites.edit(ticket.userId,{SendMessages:true}).catch(()=>{});
      return interaction.reply({embeds:[new EmbedBuilder().setColor('#57F287').setTitle('🔓 تم إعادة الفتح').setDescription(`بواسطة <@${member.id}>`).setTimestamp()]});
    }
    if (customId==='ticket_delete') {
      const ticket=await Ticket.findOne({guildId:guild.id,channelId:interaction.channel.id});
      if (!ticket) return interaction.reply({content:'❌ تذكرة غير موجودة',ephemeral:true});
      const gd=await Guild.findOne({guildId:guild.id}).lean().catch(()=>null);
      if (!member.roles.cache.has(gd?.tickets?.staffRole)&&!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return interaction.reply({content:'❌ فقط الستاف',ephemeral:true});
      const msgs=ticket.messages||[];
      if (msgs.length&&gd?.tickets?.transcriptChannel) {
        const tr=guild.channels.cache.get(gd.tickets.transcriptChannel);
        if (tr) { const txt=msgs.map(m=>`[${new Date(m.createdAt).toISOString()}] ${m.authorTag}: ${m.content}`).join('\n'); await tr.send({embeds:[new EmbedBuilder().setColor('#5865F2').setTitle(`📄 Transcript #${ticket.ticketId}`).addFields({name:'العضو',value:`<@${ticket.userId}>`,inline:true},{name:'رسائل',value:`${msgs.length}`,inline:true}).setTimestamp()],files:txt?[{attachment:Buffer.from(txt,'utf8'),name:`ticket-${ticket.ticketId}.txt`}]:[]}).catch(()=>{}); }
      }
      ticket.status='deleted'; await ticket.save();
      await interaction.reply({content:'🗑️ سيتم حذف القناة خلال 5 ثوانٍ...'});
      setTimeout(()=>interaction.channel.delete().catch(()=>{}),5000);
    }
    if (customId==='ticket_claim') {
      const ticket=await Ticket.findOne({guildId:guild.id,channelId:interaction.channel.id,status:'open'});
      if (!ticket) return interaction.reply({content:'❌ ليست تذكرة مفتوحة',ephemeral:true});
      if (ticket.claimedBy) return interaction.reply({content:`❌ محجوزة بالفعل بواسطة <@${ticket.claimedBy}>`,ephemeral:true});
      ticket.claimedBy=member.id; ticket.claimedByTag=member.user.tag; await ticket.save();
      try { await interaction.channel.setName(interaction.channel.name+'-claimed'); } catch {}
      return interaction.reply({content:`✅ **${member.user.tag}** حجز هذه التذكرة`});
    }
    if (customId==='ticket_priority') {
      const ticket=await Ticket.findOne({guildId:guild.id,channelId:interaction.channel.id,status:'open'});
      if (!ticket) return interaction.reply({content:'❌',ephemeral:true});
      const gd=await Guild.findOne({guildId:guild.id}).lean().catch(()=>null);
      if (!member.roles.cache.has(gd?.tickets?.staffRole)&&!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return interaction.reply({content:'❌ فقط الستاف',ephemeral:true});
      ticket.priority=ticket.priority==='urgent'?'normal':'urgent'; await ticket.save();
      return interaction.reply({content:ticket.priority==='urgent'?'🚨 أولوية **عاجل**':'✅ أولوية **عادي**'});
    }
  });

  // Anti-Nuke
  client.on('guildAuditLogEntryCreate', async (entry, guild) => {
    const gd=await Guild.findOne({guildId:guild.id}).lean().catch(()=>null);
    if (!gd?.protection?.antiNuke?.enabled) return;
    const {antiNuke}=gd.protection; const execId=entry.executorId;
    if (!execId||execId===client.user.id||(antiNuke.whitelist||[]).includes(execId)) return;
    const tm={[AuditLogEvent.MemberBan]:{k:'ban',t:antiNuke.banThreshold},[AuditLogEvent.MemberKick]:{k:'kick',t:antiNuke.kickThreshold},[AuditLogEvent.ChannelDelete]:{k:'channelDel',t:antiNuke.channelDeleteThreshold},[AuditLogEvent.RoleDelete]:{k:'roleDel',t:antiNuke.roleDeleteThreshold}};
    const info=tm[entry.action]; if (!info) return;
    const count=trackNuke(guild.id,execId,info.k);
    if (count>=(info.t||5)) {
      const m=guild.members.cache.get(execId)||await guild.members.fetch(execId).catch(()=>null); if (!m) return;
      const act=antiNuke.action||'derank';
      if (act==='ban') await guild.members.ban(execId,{reason:'Anti-Nuke'}).catch(()=>{});
      else if (act==='kick') await m.kick('Anti-Nuke').catch(()=>{});
      else { const dp=[PermissionsBitField.Flags.Administrator,PermissionsBitField.Flags.BanMembers,PermissionsBitField.Flags.KickMembers,PermissionsBitField.Flags.ManageGuild,PermissionsBitField.Flags.ManageChannels,PermissionsBitField.Flags.ManageRoles]; for (const r of m.roles.cache.values()) { if (r.managed) continue; if (dp.some(p=>r.permissions.has(p))) await m.roles.remove(r).catch(()=>{}); } }
      nukeMap.delete(`${guild.id}:${execId}:${info.k}`);
    }
  });

  client.login(token).catch(err => console.error('[Bot] Login failed:', err.message));
  return client;
}

// ═══════════════════════════════════════════════════════════════
// WEB SERVER
// ═══════════════════════════════════════════════════════════════
function buildApp() {
  const app    = express();
  const VIEWS  = path.join(__dirname, 'views');

  app.engine('ejs', (fp, opts, cb) => ejs.renderFile(fp, opts, { views:[VIEWS], root:VIEWS, filename:fp }, cb));
  app.set('view engine', 'ejs');
  app.set('views', VIEWS);
  app.use(express.json());
  app.use(express.urlencoded({ extended:true }));
  app.use(express.static(path.join(__dirname, 'public')));

  const uploadDir = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive:true });
  const upload = multer({ storage:multer.diskStorage({ destination:uploadDir, filename:(req,file,cb)=>cb(null,`${Date.now()}_${file.originalname.replace(/[^a-z0-9.]/gi,'_')}`) }), limits:{ fileSize:5*1024*1024 }, fileFilter:(req,file,cb)=>(/image\/(jpeg|png|gif|webp)/.test(file.mimetype)?cb(null,true):cb(new Error('Images only'))) });

  app.use(session({ secret:cfg.sessionSecret, resave:false, saveUninitialized:false, cookie:{ maxAge:7*24*60*60*1000 } }));
  app.use((req,res,next) => { res.locals.isAdmin=req.session?.isAdmin||false; res.locals.currentPath=req.path; next(); });

  // ── Helpers ───────────────────────────────────────────────────
  const getChannels = (g, types=[0]) => g ? g.channels.cache.filter(c=>types.includes(c.type)).map(c=>({id:c.id,name:c.name,type:c.type})).sort((a,b)=>a.name.localeCompare(b.name)) : [];
  const getRoles    = g => g ? g.roles.cache.filter(r=>r.id!==g.id&&!r.managed).map(r=>({id:r.id,name:r.name,color:r.hexColor,position:r.position})).sort((a,b)=>b.position-a.position) : [];
  const getCats     = g => g ? g.channels.cache.filter(c=>c.type===4).map(c=>({id:c.id,name:c.name})).sort((a,b)=>a.name.localeCompare(b.name)) : [];

  // ── Setup check middleware ────────────────────────────────────
  async function checkSetup(req, res, next) {
    if (req.path === '/setup' || req.path === '/api/setup' || req.path.startsWith('/public')) return next();
    const botCfg = await BotConfig.findOne({ key:'main' }).lean().catch(()=>null);
    if (!botCfg?.token) return res.redirect('/setup');
    next();
  }

  function requireAuth(req, res, next) {
    if (!req.session?.isAdmin) return res.redirect('/login?redirect='+encodeURIComponent(req.originalUrl));
    next();
  }

  app.use(checkSetup);

  // ── Setup ─────────────────────────────────────────────────────
  app.get('/setup', (req,res) => res.render('setup', { title:'الإعداد الأولي', error:null }));
  app.post('/setup', async (req,res) => {
    const { token } = req.body;
    if (!token?.trim()) return res.render('setup', { title:'الإعداد الأولي', error:'يرجى إدخال التوكن' });
    try {
      await BotConfig.findOneAndUpdate({ key:'main' }, { $set:{ token:token.trim() } }, { upsert:true });
      // Start or restart bot
      if (activeClient) { try { activeClient.destroy(); } catch(e){} }
      activeClient = createClient(token.trim());
      req.session.isAdmin = true;
      req.session.save(() => res.redirect('/dashboard'));
    } catch(e) { res.render('setup', { title:'الإعداد الأولي', error:'فشل حفظ التوكن: ' + e.message }); }
  });

  // ── Auth ──────────────────────────────────────────────────────
  app.get('/login',  (req,res) => { if (req.session?.isAdmin) return res.redirect('/dashboard'); res.render('login', { title:'تسجيل الدخول', error:null, redirect:req.query.redirect||'/dashboard' }); });
  app.post('/login', (req,res) => {
    const { username, password, redirect } = req.body;
    if (username === cfg.adminUser && password === cfg.adminPass) {
      req.session.isAdmin = true;
      return req.session.save(() => res.redirect(redirect || '/dashboard'));
    }
    res.render('login', { title:'تسجيل الدخول', error:'اليوزر أو كلمة المرور غلط!', redirect:redirect||'/dashboard' });
  });
  app.get('/logout', (req,res) => req.session.destroy(() => res.redirect('/login')));

  // Root redirect
  app.get('/', (req,res) => req.session?.isAdmin ? res.redirect('/dashboard') : res.redirect('/login'));

  // ── Dashboard ─────────────────────────────────────────────────
  app.get('/dashboard', requireAuth, async (req,res) => {
    const guilds = activeClient?.guilds?.cache?.map(g=>({ id:g.id, name:g.name, memberCount:g.memberCount, icon:g.iconURL({size:128}) })) || [];
    res.render('dashboard', { title:'لوحة التحكم', guilds, client:activeClient, activePage:'home', guildId:null });
  });

  // ── Guild Middleware ──────────────────────────────────────────
  async function loadGuild(req, res, next) {
    const { id:guildId } = req.params;
    try {
      const dg = activeClient?.guilds?.cache?.get(guildId) || null;
      let guild = await Guild.findOne({ guildId }).lean().catch(()=>null);
      if (!guild) guild = { guildId, prefix:'!', language:'ar', commands:DEFAULT_COMMANDS.map(c=>({...c})) };
      if (!guild.commands?.length) guild.commands = DEFAULT_COMMANDS.map(c=>({...c}));
      req.guildData = guild; req.discordGuild = dg;
      req.channels   = getChannels(dg, [0]);
      req.allChannels = getChannels(dg, [0,2]);
      req.roles       = getRoles(dg);
      req.categories  = getCats(dg);
      req.guildMeta   = dg ? { name:dg.name, memberCount:dg.memberCount, icon:dg.iconURL({size:128}), id:guildId } : { name:guild.name||guildId, memberCount:guild.memberCount||0, icon:guild.icon||null, id:guildId };
      next();
    } catch(e) { res.render('error', { title:'Error', message:e.message, currentPath:req.path }); }
  }

  function gRender(view, extras={}) {
    return (req,res) => res.render(view, { guild:req.guildData, guildMeta:req.guildMeta, guildId:req.params.id, channels:req.channels, allChannels:req.allChannels, roles:req.roles, categories:req.categories, activePage:extras.activePage||'', ...extras });
  }

  app.get('/dashboard/guild/:id',               requireAuth, loadGuild, async (req,res) => {
    const guildId=req.params.id;
    const [recentLogs, totalWarnings, openTickets, totalXpUsers] = await Promise.all([
      Log.find({guildId}).sort({createdAt:-1}).limit(8).lean().catch(()=>[]),
      Warning.countDocuments({guildId}).catch(()=>0),
      Ticket.countDocuments({guildId,status:'open'}).catch(()=>0),
      Level.countDocuments({guildId}).catch(()=>0),
    ]);
    res.render('guild/overview', { title:`${req.guildMeta.name} — نظرة عامة`, guild:req.guildData, guildMeta:req.guildMeta, guildId, channels:req.channels, roles:req.roles, categories:req.categories, recentLogs, totalWarnings, openTickets, totalXpUsers, activePage:'overview' });
  });

  app.get('/dashboard/guild/:id/general',       requireAuth, loadGuild, gRender('guild/general',     { activePage:'general' }));
  app.get('/dashboard/guild/:id/welcome',        requireAuth, loadGuild, gRender('guild/welcome',     { activePage:'welcome' }));
  app.get('/dashboard/guild/:id/automod',        requireAuth, loadGuild, gRender('guild/automod',     { activePage:'automod' }));
  app.get('/dashboard/guild/:id/protection',     requireAuth, loadGuild, gRender('guild/protection',  { activePage:'protection' }));
  app.get('/dashboard/guild/:id/leveling',       requireAuth, loadGuild, gRender('guild/leveling',    { activePage:'leveling' }));
  app.get('/dashboard/guild/:id/tickets-config', requireAuth, loadGuild, gRender('guild/tickets',     { activePage:'tickets-config' }));
  app.get('/dashboard/guild/:id/commands',       requireAuth, loadGuild, gRender('guild/commands',    { activePage:'commands' }));
  app.get('/dashboard/guild/:id/logs-config',    requireAuth, loadGuild, gRender('guild/logs-config', { activePage:'logs-config' }));

  // Merged data page: ?tab=logs|warnings|leaderboard|tickets
  app.get('/dashboard/guild/:id/data', requireAuth, loadGuild, async (req,res) => {
    const guildId=req.params.id, tab=req.query.tab||'logs';
    const page=Math.max(1,parseInt(req.query.page)||1), limit=30;
    let pageData = {}, totalPages=1, total=0;
    if (tab==='logs') {
      const filter={guildId}; if (req.query.type) filter.type=req.query.type; if (req.query.severity) filter.severity=req.query.severity;
      [pageData.logs, total] = await Promise.all([Log.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean().catch(()=>[]), Log.countDocuments(filter).catch(()=>0)]);
    } else if (tab==='warnings') {
      const warnings=await Warning.find({guildId}).sort({createdAt:-1}).lean().catch(()=>[]);
      const grouped={};
      warnings.forEach(w=>{ if (!grouped[w.userId]) grouped[w.userId]={userId:w.userId,userTag:w.userTag,items:[]}; grouped[w.userId].items.push(w); });
      pageData.warnings=warnings; pageData.grouped=Object.values(grouped); total=warnings.length;
    } else if (tab==='leaderboard') {
      [pageData.levels, total] = await Promise.all([Level.find({guildId}).sort({xp:-1}).skip((page-1)*limit).limit(limit).lean().catch(()=>[]), Level.countDocuments({guildId}).catch(()=>0)]);
      pageData.startRank=(page-1)*limit;
    } else if (tab==='tickets') {
      const filter={guildId}; if (req.query.status) filter.status=req.query.status;
      [pageData.tickets, total] = await Promise.all([Ticket.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean().catch(()=>[]), Ticket.countDocuments(filter).catch(()=>0)]);
      pageData.statusFilter=req.query.status||'';
    }
    totalPages=Math.ceil(total/limit)||1;
    res.render('data', { title:'البيانات', guild:req.guildData, guildMeta:req.guildMeta, guildId, channels:req.channels, roles:req.roles, categories:req.categories, tab, page, total, totalPages, typeFilter:req.query.type||'', severityFilter:req.query.severity||'', activePage:'data', ...pageData });
  });

  // ── Settings API ──────────────────────────────────────────────
  app.post('/api/guild/:id/settings', requireAuth, async (req,res) => {
    try {
      const { id:guildId } = req.params, body = req.body, section = body._section;
      const setKeys = (prefix, map) => { const r={}; for (const [k,v] of Object.entries(map)) r[`${prefix}.${k}`]=v; return r; };

      if (section==='general') {
        await Guild.findOneAndUpdate({guildId},{$set:{ prefix:body.prefix||'!', language:body.language||'ar', 'autoRole.enabled':bool(body.autoRoleEnabled), 'autoRole.roleId':body.autoRole||null, 'autoRole.botRole':body.botRole||null }},{upsert:true});
        return res.json({success:true,message:'الإعدادات العامة محفوظة ✓'});
      }
      if (section==='welcome') {
        await Guild.findOneAndUpdate({guildId},{$set:{
          'welcome.enabled':bool(body.welcomeEnabled),'welcome.channel':body.welcomeChannel||null,'welcome.message':body.welcomeMessage||'',
          'welcome.mentionUser':bool(body.mentionUser),'welcome.embedEnabled':bool(body.embedEnabled),'welcome.embedColor':body.embedColor||'#5865F2',
          'welcome.embedTitle':body.embedTitle||'','welcome.embedDescription':body.embedDescription||'','welcome.embedThumbnail':bool(body.embedThumbnail),
          'welcome.embedImage':body.embedImage||'','welcome.embedFooter':body.embedFooter||'','welcome.dmEnabled':bool(body.dmEnabled),'welcome.dmMessage':body.dmMessage||'',
          'welcome.showJoinPosition':bool(body.showJoinPosition),
          'goodbye.enabled':bool(body.goodbyeEnabled),'goodbye.channel':body.goodbyeChannel||null,'goodbye.embedEnabled':bool(body.goodbyeEmbedEnabled),
          'goodbye.embedColor':body.goodbyeEmbedColor||'#ED4245','goodbye.embedTitle':body.goodbyeEmbedTitle||'','goodbye.embedDescription':body.goodbyeEmbedDescription||'',
          'goodbye.embedFooter':body.goodbyeEmbedFooter||'','goodbye.message':body.goodbyeMessage||'',
        }},{upsert:true});
        return res.json({success:true,message:'إعدادات الترحيب محفوظة ✓'});
      }
      if (section==='logs') {
        const evKeys=['memberJoin','memberLeave','memberBan','memberUnban','memberKick','memberMute','memberWarn','memberRoleUpdate','memberNickChange','messageDelete','messageEdit','messageBulkDelete','roleCreate','roleDelete','roleUpdate','channelCreate','channelDelete','channelUpdate','voiceJoin','voiceLeave','voiceMove','serverUpdate','inviteCreate','inviteDelete'];
        const update={'logs.enabled':bool(body.logsEnabled),'logs.channel':body.logsChannel||null};
        for (const ev of evKeys) { update[`logs.${ev}.enabled`]=bool(body[`${ev}_enabled`]); update[`logs.${ev}.channel`]=body[`${ev}_channel`]||null; update[`logs.${ev}.embedColor`]=body[`${ev}_color`]||null; }
        await Guild.findOneAndUpdate({guildId},{$set:update},{upsert:true});
        return res.json({success:true,message:'إعدادات اللوج محفوظة ✓'});
      }
      if (section==='automod') {
        await Guild.findOneAndUpdate({guildId},{$set:{
          'automod.enabled':bool(body.automodEnabled),'automod.logChannel':body.automodLogChannel||null,'automod.muteRole':body.muteRole||null,
          'automod.ignoredRoles':csv(body.ignoredRoles),'automod.ignoredChannels':csv(body.ignoredChannels),
          'automod.antiLinks.enabled':bool(body.antiLinksEnabled),'automod.antiLinks.punishment':body.antiLinksPunishment||'delete','automod.antiLinks.whitelist':csv(body.antiLinksWhitelist),
          'automod.antiInvites.enabled':bool(body.antiInvitesEnabled),'automod.antiInvites.punishment':body.antiInvitesPunishment||'delete',
          'automod.antiSpam.enabled':bool(body.antiSpamEnabled),'automod.antiSpam.maxMessages':num(body.antiSpamMax,5),'automod.antiSpam.interval':num(body.antiSpamInterval,5),'automod.antiSpam.punishment':body.antiSpamPunishment||'mute','automod.antiSpam.muteDuration':num(body.antiSpamMuteDuration,10),
          'automod.antiBadWords.enabled':bool(body.antiBadWordsEnabled),'automod.antiBadWords.punishment':body.antiBadWordsPunishment||'delete','automod.antiBadWords.words':csv(body.badWords),
          'automod.antiCaps.enabled':bool(body.antiCapsEnabled),'automod.antiCaps.threshold':num(body.capsThreshold,70),'automod.antiCaps.minLength':num(body.capsMinLength,10),'automod.antiCaps.punishment':body.antiCapsPunishment||'delete',
          'automod.antiMentions.enabled':bool(body.antiMentionsEnabled),'automod.antiMentions.maxMentions':num(body.maxMentions,5),'automod.antiMentions.punishment':body.antiMentionsPunishment||'warn',
          'automod.antiRaid.enabled':bool(body.antiRaidEnabled),'automod.antiRaid.joinThreshold':num(body.raidJoinThreshold,10),'automod.antiRaid.joinInterval':num(body.raidJoinInterval,10),'automod.antiRaid.action':body.raidAction||'kick',
          'automod.antiDuplicate.enabled':bool(body.antiDuplicateEnabled),'automod.antiDuplicate.threshold':num(body.duplicateThreshold,3),'automod.antiDuplicate.punishment':body.antiDuplicatePunishment||'delete',
          'automod.antiEmoji.enabled':bool(body.antiEmojiEnabled),'automod.antiEmoji.maxEmojis':num(body.maxEmojis,5),'automod.antiEmoji.punishment':body.antiEmojiPunishment||'delete',
          'automod.antiZalgo.enabled':bool(body.antiZalgoEnabled),'automod.antiZalgo.punishment':body.antiZalgoPunishment||'delete',
        }},{upsert:true});
        return res.json({success:true,message:'إعدادات AutoMod محفوظة ✓'});
      }
      if (section==='protection') {
        await Guild.findOneAndUpdate({guildId},{$set:{
          'protection.antiNuke.enabled':bool(body.antiNukeEnabled),'protection.antiNuke.banThreshold':num(body.nukeBanThreshold,5),'protection.antiNuke.kickThreshold':num(body.nukeKickThreshold,5),'protection.antiNuke.channelDeleteThreshold':num(body.nukeChannelThreshold,3),'protection.antiNuke.roleDeleteThreshold':num(body.nukeRoleThreshold,3),'protection.antiNuke.webhookDeleteThreshold':num(body.nukeWebhookThreshold,3),'protection.antiNuke.action':body.nukeAction||'derank','protection.antiNuke.whitelist':csv(body.antiNukeWhitelist),'protection.antiNuke.logChannel':body.nukeLogChannel||null,
          'protection.antiBot.enabled':bool(body.antiBotEnabled),'protection.antiBot.action':body.antiBotAction||'kick','protection.antiBot.whitelist':csv(body.antiBotWhitelist),
          'protection.antiAlt.enabled':bool(body.antiAltEnabled),'protection.antiAlt.minAge':num(body.antiAltMinAge,7),'protection.antiAlt.action':body.antiAltAction||'kick','protection.antiAlt.kickMessage':body.antiAltMessage||'',
          'protection.verifySystem.enabled':bool(body.verifyEnabled),'protection.verifySystem.channel':body.verifyChannel||null,'protection.verifySystem.role':body.verifyRole||null,'protection.verifySystem.type':body.verifyType||'button','protection.verifySystem.message':body.verifyMessage||'','protection.verifySystem.embedColor':body.verifyEmbedColor||'#5865F2','protection.verifySystem.embedTitle':body.verifyEmbedTitle||'',
        }},{upsert:true});
        return res.json({success:true,message:'إعدادات الحماية محفوظة ✓'});
      }
      if (section==='leveling') {
        await Guild.findOneAndUpdate({guildId},{$set:{
          'leveling.enabled':bool(body.levelingEnabled),'leveling.xpMin':num(body.xpMin,10),'leveling.xpMax':num(body.xpMax,25),'leveling.cooldown':num(body.cooldown,60),
          'leveling.levelUpEnabled':bool(body.levelUpEnabled),'leveling.levelUpChannel':body.levelUpChannel||null,'leveling.levelUpMessage':body.levelUpMessage||'','leveling.announcement':body.announcement||'channel',
          'leveling.noXpRoles':csv(body.noXpRoles),'leveling.noXpChannels':csv(body.noXpChannels),'leveling.stackRoles':bool(body.stackRoles),'leveling.resetOnLeave':bool(body.resetOnLeave),'leveling.voiceXp':bool(body.voiceXp),'leveling.voiceXpPerMin':num(body.voiceXpPerMin,5),'leveling.showXpBar':bool(body.showXpBar),
        }},{upsert:true});
        return res.json({success:true,message:'إعدادات المستويات محفوظة ✓'});
      }
      if (section==='tickets') {
        await Guild.findOneAndUpdate({guildId},{$set:{
          'tickets.enabled':bool(body.ticketsEnabled),'tickets.category':body.ticketCategory||null,'tickets.logChannel':body.ticketLogChannel||null,'tickets.staffRole':body.ticketStaffRole||null,
          'tickets.message':body.ticketMessage||'','tickets.welcomeMessage':body.ticketWelcomeMessage||'','tickets.maxPerUser':num(body.maxPerUser,1),'tickets.closeOnLeave':bool(body.closeOnLeave),'tickets.pingStaff':bool(body.pingStaff),'tickets.transcriptChannel':body.transcriptChannel||null,
          'tickets.embedColor':body.ticketEmbedColor||'#5865F2','tickets.embedTitle':body.ticketEmbedTitle||'','tickets.embedDescription':body.ticketEmbedDescription||'','tickets.buttonLabel':body.buttonLabel||'','tickets.namingFormat':body.namingFormat||'ticket-{id}',
          'tickets.useTopics':bool(body.useTopics),'tickets.claimEnabled':bool(body.claimEnabled),'tickets.reopenEnabled':bool(body.reopenEnabled),'tickets.priorityEnabled':bool(body.priorityEnabled),'tickets.autoClose':num(body.autoClose,0),
        }},{upsert:true});
        return res.json({success:true,message:'إعدادات التذاكر محفوظة ✓'});
      }
      if (section==='command') {
        const cmdName=body.commandName; if (!cmdName) return res.json({success:false,message:'اسم الأمر مفقود'});
        let g=await Guild.findOne({guildId}); if (!g) return res.json({success:false,message:'Guild not found'});
        if (!g.commands?.length) g.commands=DEFAULT_COMMANDS.map(c=>({...c}));
        const enabled=bool(body.enabled!==undefined?body.enabled:true), allowedRoles=arr(body.allowedRoles), aliases=body.aliases?csv(body.aliases):[];
        const idx=g.commands.findIndex(c=>c.name===cmdName);
        if (idx!==-1) { g.commands[idx].enabled=enabled; g.commands[idx].allowedRoles=allowedRoles; g.commands[idx].aliases=aliases; }
        else { const def=DEFAULT_COMMANDS.find(c=>c.name===cmdName); if (def) g.commands.push({...def,enabled,allowedRoles,aliases}); }
        g.markModified('commands'); await g.save();
        return res.json({success:true,message:`الأمر "${cmdName}" محفوظ ✓`});
      }
      return res.json({success:false,message:'قسم غير معروف: '+section});
    } catch(e) { console.error('[API Settings]',e); res.json({success:false,message:'خطأ: '+e.message}); }
  });

  // Banner upload
  app.post('/api/guild/:id/upload/banner', requireAuth, upload.single('image'), async (req,res) => {
    try {
      if (!req.file) return res.json({success:false,message:'لم يتم رفع أي صورة'});
      const url=`/uploads/${req.file.filename}`;
      await Guild.findOneAndUpdate({guildId:req.params.id},{$set:{'welcome.backgroundImage':url}},{upsert:true});
      res.json({success:true,url,message:'تم رفع الصورة ✓'});
    } catch(e) { res.json({success:false,message:e.message}); }
  });
  app.post('/api/guild/:id/welcome/banner', requireAuth, async (req,res) => {
    try {
      const {usernameX,usernameY,usernameFontSize,usernameColor,avatarX,avatarY,avatarSize,bannerEnabled}=req.body;
      await Guild.findOneAndUpdate({guildId:req.params.id},{$set:{'welcome.bannerEnabled':bool(bannerEnabled),'welcome.usernameX':num(usernameX,50),'welcome.usernameY':num(usernameY,75),'welcome.usernameFontSize':num(usernameFontSize,36),'welcome.usernameColor':usernameColor||'#ffffff','welcome.avatarX':num(avatarX,50),'welcome.avatarY':num(avatarY,40),'welcome.avatarSize':num(avatarSize,100)}},{upsert:true});
      res.json({success:true,message:'تم حفظ إعدادات البانر ✓'});
    } catch(e) { res.json({success:false,message:e.message}); }
  });

  // Custom Commands
  app.post('/api/guild/:id/custom-commands', requireAuth, async (req,res) => {
    try {
      const {trigger,response,embedEnabled,embedColor,embedTitle,deleteAfter,allowedChannels,allowedRoles}=req.body;
      if (!trigger||!response) return res.json({success:false,message:'Trigger and response required'});
      const exists=await Guild.findOne({guildId:req.params.id,'customCommands.trigger':trigger});
      if (exists) return res.json({success:false,message:'Trigger already exists'});
      await Guild.findOneAndUpdate({guildId:req.params.id},{$push:{customCommands:{trigger,response,embedEnabled:bool(embedEnabled),embedColor:embedColor||'#5865F2',embedTitle:embedTitle||'',deleteAfter:num(deleteAfter,0),allowedChannels:csv(allowedChannels),allowedRoles:csv(allowedRoles),enabled:true}}},{upsert:true});
      res.json({success:true,message:'أمر مخصص أُضيف ✓'});
    } catch(e) { res.json({success:false,message:e.message}); }
  });
  app.delete('/api/guild/:id/custom-commands/:trigger', requireAuth, async (req,res) => {
    try { await Guild.findOneAndUpdate({guildId:req.params.id},{$pull:{customCommands:{trigger:req.params.trigger}}}); res.json({success:true,message:'أمر مخصص حُذف ✓'}); }
    catch(e) { res.json({success:false,message:e.message}); }
  });

  // Level Roles
  app.post('/api/guild/:id/leveling/roles', requireAuth, async (req,res) => {
    try { const {level,roleId}=req.body; if (!level||!roleId) return res.json({success:false,message:'Missing data'}); await Guild.findOneAndUpdate({guildId:req.params.id},{$push:{'leveling.levelRoles':{level:num(level,1),roleId}}},{upsert:true}); res.json({success:true,message:'Level role added ✓'}); }
    catch(e) { res.json({success:false,message:e.message}); }
  });
  app.delete('/api/guild/:id/leveling/roles', requireAuth, async (req,res) => {
    try { await Guild.findOneAndUpdate({guildId:req.params.id},{$pull:{'leveling.levelRoles':{level:num(req.body.level,0),roleId:req.body.roleId}}}); res.json({success:true,message:'Level role removed ✓'}); }
    catch(e) { res.json({success:false,message:e.message}); }
  });
  app.post('/api/guild/:id/leveling/multipliers', requireAuth, async (req,res) => {
    try { const {roleId,multiplier}=req.body; if (!roleId) return res.json({success:false,message:'Missing'}); await Guild.findOneAndUpdate({guildId:req.params.id},{$pull:{'leveling.multiplierRoles':{roleId}}}); await Guild.findOneAndUpdate({guildId:req.params.id},{$push:{'leveling.multiplierRoles':{roleId,multiplier:parseFloat(multiplier)||2}}}); res.json({success:true,message:'Multiplier saved ✓'}); }
    catch(e) { res.json({success:false,message:e.message}); }
  });
  app.delete('/api/guild/:id/leveling/multipliers', requireAuth, async (req,res) => {
    try { await Guild.findOneAndUpdate({guildId:req.params.id},{$pull:{'leveling.multiplierRoles':{roleId:req.body.roleId}}}); res.json({success:true,message:'Multiplier removed ✓'}); }
    catch(e) { res.json({success:false,message:e.message}); }
  });

  // Ticket Topics
  app.post('/api/guild/:id/tickets/topics', requireAuth, async (req,res) => {
    try { const {label,emoji,description,staffRole,category,color}=req.body; if (!label) return res.json({success:false,message:'Topic label missing'}); const id=Date.now().toString(36); await Guild.findOneAndUpdate({guildId:req.params.id},{$push:{'tickets.topics':{id,label,emoji:emoji||'📝',description,staffRole,category,color:color||'Primary',enabled:true}}},{upsert:true}); res.json({success:true,message:'Topic added ✓',id}); }
    catch(e) { res.json({success:false,message:e.message}); }
  });
  app.delete('/api/guild/:id/tickets/topics/:topicId', requireAuth, async (req,res) => {
    try { await Guild.findOneAndUpdate({guildId:req.params.id},{$pull:{'tickets.topics':{id:req.params.topicId}}}); res.json({success:true,message:'Topic removed ✓'}); }
    catch(e) { res.json({success:false,message:e.message}); }
  });

  // Send Verify
  app.post('/api/guild/:id/verify/send', requireAuth, async (req,res) => {
    try {
      const gd=await Guild.findOne({guildId:req.params.id}).lean(); if (!gd?.protection?.verifySystem?.enabled) return res.json({success:false,message:'نظام التحقق معطل'});
      const guild=activeClient?.guilds?.cache?.get(req.params.id); if (!guild) return res.json({success:false,message:'البوت غير متصل'});
      const vs=gd.protection.verifySystem, ch=guild.channels.cache.get(vs.channel); if (!ch) return res.json({success:false,message:'القناة غير موجودة'});
      const embed=new EmbedBuilder().setColor(vs.embedColor||'#5865F2').setTitle(vs.embedTitle||'✅ التحقق').setDescription(vs.message||'اضغط الزر للتحقق').setTimestamp();
      await ch.send({embeds:[embed],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('verify_button').setLabel('✅ تحقق').setStyle(ButtonStyle.Success))]});
      res.json({success:true,message:'تم إرسال رسالة التحقق ✓'});
    } catch(e) { res.json({success:false,message:e.message}); }
  });

  // Send Ticket Panel
  app.post('/api/guild/:id/tickets/panel', requireAuth, async (req,res) => {
    try {
      const {channelId}=req.body; const gd=await Guild.findOne({guildId:req.params.id}).lean(); if (!gd?.tickets?.enabled) return res.json({success:false,message:'نظام التذاكر معطل'});
      const guild=activeClient?.guilds?.cache?.get(req.params.id); if (!guild) return res.json({success:false,message:'البوت غير متصل'});
      const ch=guild.channels.cache.get(channelId); if (!ch) return res.json({success:false,message:'القناة غير موجودة'});
      const tk=gd.tickets;
      const embed=new EmbedBuilder().setColor(tk.embedColor||'#5865F2').setTitle(tk.embedTitle||'🎫 نظام التذاكر').setDescription(tk.embedDescription||'اضغط الزر لفتح تذكرة').setTimestamp();
      let components=[];
      if (tk.useTopics&&tk.topics?.length) {
        const et=tk.topics.filter(t=>t.enabled), sm={Primary:ButtonStyle.Primary,Secondary:ButtonStyle.Secondary,Success:ButtonStyle.Success,Danger:ButtonStyle.Danger};
        for (let i=0;i<et.length;i+=5) { const row=new ActionRowBuilder(); et.slice(i,i+5).forEach(t=>row.addComponents(new ButtonBuilder().setCustomId(`ticket_topic_${t.id}`).setLabel(`${t.emoji||'📝'} ${t.label}`).setStyle(sm[t.color]||ButtonStyle.Primary))); components.push(row); }
      } else { components=[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_open').setLabel(tk.buttonLabel||'🎫 فتح تذكرة').setStyle(ButtonStyle.Primary))]; }
      await ch.send({embeds:[embed],components});
      res.json({success:true,message:'تم إرسال بانر التذاكر ✓'});
    } catch(e) { res.json({success:false,message:e.message}); }
  });

  // Welcome Test
  app.post('/api/guild/:id/welcome/test', requireAuth, async (req,res) => {
    try {
      const {type}=req.body; const gd=await Guild.findOne({guildId:req.params.id}).lean();
      const guild=activeClient?.guilds?.cache?.get(req.params.id); if (!guild) return res.json({success:false,message:'البوت غير متصل'});
      const chId=type==='goodbye'?gd?.goodbye?.channel:gd?.welcome?.channel; const ch=chId?guild.channels.cache.get(chId):null; if (!ch) return res.json({success:false,message:'قناة غير موجودة'});
      const vars={user:`<@${activeClient.user.id}>`,username:activeClient.user.username,server:guild.name,count:guild.memberCount,duration:'7 أيام'};
      if (type==='goodbye') {
        const e=new EmbedBuilder().setColor(gd?.goodbye?.embedColor||'#ED4245').setTitle(gd?.goodbye?.embedTitle||'👋 مع السلامة').setDescription(rv(gd?.goodbye?.embedDescription||'وداعاً!',vars)).setThumbnail(activeClient.user.displayAvatarURL()).setTimestamp();
        await ch.send({embeds:[e]});
      } else {
        const e=new EmbedBuilder().setColor(gd?.welcome?.embedColor||'#5865F2').setTitle(gd?.welcome?.embedTitle||'👋 مرحباً!').setDescription(rv(gd?.welcome?.embedDescription||'أهلاً!',vars)).setThumbnail(activeClient.user.displayAvatarURL()).setTimestamp();
        if (gd?.welcome?.embedFooter) e.setFooter({text:rv(gd.welcome.embedFooter,vars)});
        await ch.send({embeds:[e]});
      }
      res.json({success:true,message:`تم إرسال ${type==='goodbye'?'رسالة الوداع':'رسالة الترحيب'} ✓`});
    } catch(e) { res.json({success:false,message:e.message}); }
  });

  // Bot Stats API
  app.get('/api/bot/stats', requireAuth, async (req,res) => {
    try {
      const [tl,tw,tt,ot]=await Promise.all([Log.countDocuments().catch(()=>0),Warning.countDocuments().catch(()=>0),Ticket.countDocuments().catch(()=>0),Ticket.countDocuments({status:'open'}).catch(()=>0)]);
      res.json({success:true,guilds:activeClient?.guilds.cache.size??0,users:activeClient?.guilds.cache.reduce((a,g)=>a+g.memberCount,0)??0,ping:activeClient?.ws.ping??0,uptime:activeClient?.uptime??0,ready:activeClient?.isReady()??false,tag:activeClient?.user?.tag??'Not connected',avatar:activeClient?.user?.displayAvatarURL({size:128})??null,totalLogs:tl,totalWarnings:tw,totalTickets:tt,openTickets:ot});
    } catch(e) { res.json({success:false,message:e.message}); }
  });

  // Token management (reset)
  app.post('/api/reset-token', requireAuth, async (req,res) => {
    try {
      await BotConfig.findOneAndUpdate({key:'main'},{$set:{token:''}},{upsert:true});
      if (activeClient) { try { activeClient.destroy(); } catch(e){} activeClient=null; }
      res.json({success:true,message:'تم إعادة تعيين التوكن. ستُوجَّه لصفحة الإعداد.'});
    } catch(e) { res.json({success:false,message:e.message}); }
  });

  app.use((req,res) => res.status(404).render('error', { title:'404', message:'الصفحة غير موجودة', currentPath:req.path }));
  app.use((err,req,res,_next) => { console.error('[Server]',err.message); res.status(500).render('error', { title:'خطأ', message:err.message||'خطأ غير متوقع', currentPath:req.path }); });

  return app;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
async function main() {
  if (cfg.mongoUri) {
    try { await mongoose.connect(cfg.mongoUri, { serverSelectionTimeoutMS:5000 }); console.log('[DB] ✅ Connected'); }
    catch(e) { console.warn('[DB] ⚠️ Failed:', e.message); }
  } else { console.warn('[DB] ⚠️ MONGO_URI not set'); }

  // Load saved token and start bot
  const botCfg = await BotConfig.findOne({ key:'main' }).lean().catch(()=>null);
  if (botCfg?.token) {
    console.log('[Bot] Loading saved token...');
    activeClient = createClient(botCfg.token);
  } else {
    console.log('[Bot] No token set. Visit /setup to configure.');
  }

  const app = buildApp();
  app.listen(cfg.port, '0.0.0.0', () => {
    console.log('\n══════════════════════════════════════════');
    console.log('  🤖 Discord Bot Dashboard — Bilal Edition');
    console.log('══════════════════════════════════════════');
    console.log(`  📍 Port    : ${cfg.port}`);
    console.log(`  🌐 URL     : http://localhost:${cfg.port}`);
    console.log(`  👤 Login   : ${cfg.adminUser} / ${cfg.adminPass}`);
    console.log('══════════════════════════════════════════\n');
  });
}

main().catch(err => { console.error('[Fatal]', err); process.exit(1); });
