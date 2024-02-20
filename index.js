const keep_alive = require('./keep_alive.js');
const { Client, Intents, MessageEmbed } = require('discord.js');
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.MESSAGE_CONTENT,
  ],
});

const prefix = '+';
let deletedChannels = 0;
let lastDeletedTimestamp = 0;
let protectionActivated = false;
let highProtectionActivated = false;
let mentionsEveryoneCount = 0;
let lastMentionTimestamp = 0;

const MENTION_RESET_TIME = 2000; // 2 secondes
const CHANNEL_RESET_TIME = 1000; // 1 seconde
const MAX_DELETED_CHANNELS = 10;
const MAX_MENTIONS_EVERYONE = 10;

client.on('ready', () => {
  console.log(`Le bot est en ligne en tant que ${client.user.tag}!`);
});

client.on('messageCreate', (message) => {
  if (message.author.bot || !message.guild) return;

  if (!message.member.permissions.has('ADMINISTRATOR')) {
    return;
  }

  if (message.content.startsWith(prefix + 'purge')) {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const amount = parseInt(args[1]);

    purgeMessages(message, amount);
    return;
  }

  if (message.content.startsWith(prefix + 'help')) {
    displayHelp(message);
  }

  if (message.content.startsWith(prefix + 'ban')) {
    banUser(message);
    return;
  }

  if (message.content.startsWith(prefix + 'protect++')) {
    activateHighProtection(message);
  }

  if (message.content.startsWith(prefix + 'protect')) {
    activateProtection(message);
  }

  if (message.content.startsWith(prefix + 'unprotect++')) {
    deactivateHighProtection(message);
  }

  if (message.content.startsWith(prefix + 'unprotect')) {
    deactivateProtection(message);
  }

  if (message.content.startsWith(prefix + 'leave')) {
    leaveServer(message);
  }

  if (highProtectionActivated && message.mentions.everyone && protectionActivated) {
    const currentTimestamp = Date.now();
    const timeDifference = currentTimestamp - lastMentionTimestamp;

    if (timeDifference > MENTION_RESET_TIME) {
      mentionsEveryoneCount = 1;
      lastMentionTimestamp = currentTimestamp;
    } else {
      mentionsEveryoneCount += 1;

      if (mentionsEveryoneCount >= MAX_MENTIONS_EVERYONE) {
        kickAllBots(message.guild);
      }
    }
  }
});

client.on('channelDelete', (channel) => {
  if (protectionActivated) {
    deletedChannels += 1;

    const currentTimestamp = Date.now();
    const timeDifference = currentTimestamp - lastDeletedTimestamp;

    if (timeDifference > CHANNEL_RESET_TIME) {
      deletedChannels = 1;
      lastDeletedTimestamp = currentTimestamp;
    } else if (deletedChannels >= MAX_DELETED_CHANNELS) {
      kickAllBots(channel.guild);
    }
  }
});

client.on('guildCreate', (guild) => {
  if (protectionActivated) {
    deletedChannels = 0;
    lastDeletedTimestamp = 0;
  }
});

function displayHelp(message) {
  const embed = new MessageEmbed()
    .setColor('#2ECC71')
    .setTitle('Commandes du Bot Protect')
    .setDescription('Utilisez ces commandes pour gérer la protection du serveur.')
    .addField('+help', 'Affiche cette aide.')
    .addField('+protect++', 'Active une protection renforcée, aucun webbook peut être créé, et si tous les salons se suppriment, tous les bots sont expulsés!')
    .addField('+protect', 'Active la protection normale, aucun webbok peut être créé, et plus!')
    .addField('+unprotect++', 'Désactive la protection renforcée.')
    .addField('+unprotect', 'Désactive la protection normale.')
    .addField('+leave', 'Fait quitter le bot du serveur (administrateurs uniquement).')
    .addField('+purge nombre', 'suprime un nombre de message specifique')
    .addField('+ban user', 'ban la personne choisi pendant la commande @')
    .setFooter('Fait entièrement par _tiyoky! Me DM si il y a un problème avec le bot.');

  message.channel.send({ embeds: [embed] });
}

function banUser(message) {
  if (!message.member.permissions.has('BAN_MEMBERS')) {
    message.reply('Vous n\'avez pas la permission de bannir des membres.');
    return;
  }

  const userToBan = message.mentions.members.first();

  if (!userToBan) {
    message.reply('Veuillez mentionner l\'utilisateur que vous souhaitez bannir.');
    return;
  }

  userToBan.ban()
    .then(() => {
      message.reply(`L'utilisateur ${userToBan.user.tag} a été banni avec succès.`);
    })
    .catch(error => {
      console.error('Erreur lors du bannissement :', error);
      message.reply('Une erreur s\'est produite lors du bannissement de l\'utilisateur. Veuillez réessayer.');
    });
}

function activateHighProtection(message) {
  highProtectionActivated = true;
  protectionActivated = false;
  message.channel.send('Protection renforcée activée.\<a:emoji_5:1209532221967437945>');
}

function deactivateHighProtection(message) {
  highProtectionActivated = false;
  message.channel.send('Protection renforcée désactivée.');
}

async function activateProtection(message) {
  try {
    await message.guild.roles.everyone.permissions.remove(['CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS']);
    protectionActivated = true;
    message.channel.send('Protection activée.\<a:emoji_5:1209532221967437945>');
  } catch (error) {
    console.error('Erreur lors de l\'activation de la protection :', error);
    message.reply('Une erreur s\'est produite lors de l\'activation de la protection. Veuillez réessayer.');
  }
}

function deactivateProtection(message) {
  protectionActivated = false;
  message.channel.send('Protection désactivée.');
}

function kickAllBots(guild) {
  if (protectionActivated && guild.me.permissions.has('KICK_MEMBERS')) {
    guild.members.cache
      .filter(member => member.user.bot)
      .forEach(bot => bot.kick());

    console.log('Tous les bots ont été expulsés du serveur.');
  } else {
    console.error('Le bot n\'a pas la permission nécessaire pour expulser les membres.');
  }
}

function leaveServer(message) {
  if (message.member.permissions.has('ADMINISTRATOR')) {
    message.reply("Le bot va quitter le serveur. Au revoir ! -_tiyoky");
    message.guild.leave();
  } else {
    message.reply("Vous devez être administrateur pour utiliser cette commande.");
  }
}

setInterval(() => {
  client.user.setActivity('Fait par _tiyoky', { type: 'PLAYING' });
  setTimeout(() => {
    client.user.setActivity('**Le** bot protect fait par _tiyoky', { type: 'PLAYING' });
  }, 2000);
}, 4000);

client.login(process.env.TOKEN);
