const keep_alive = require('./keep_alive.js')
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

// ... (autres parties du code restent inchangées)

client.on('messageCreate', (message) => {
  if (message.author.bot || !message.guild) return;

  // Permet aux utilisateurs ordinaires de parler sans recevoir de message d'erreur
  if (!message.member.permissions.has('ADMINISTRATOR')) {
    // L'utilisateur ordinaire peut parler ici sans déclencher d'erreur
    return;
  }

  if (message.content.startsWith(prefix + 'help')) {
    displayHelp(message);
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
      // Reset si plus de 2 secondes se sont écoulées
      mentionsEveryoneCount = 1;
      lastMentionTimestamp = currentTimestamp;
    } else {
      mentionsEveryoneCount += 1;

      if (mentionsEveryoneCount >= MAX_MENTIONS_EVERYONE) {
        // Kick all bots si 10 mentions "everyone" en 2 secondes
        kickAllBots(message.guild);
      }
    }
  }
});

// ... (autres parties du code restent inchangées)


client.on('channelDelete', (channel) => {
  if (protectionActivated) {
    deletedChannels += 1;

    const currentTimestamp = Date.now();
    const timeDifference = currentTimestamp - lastDeletedTimestamp;

    if (timeDifference > CHANNEL_RESET_TIME) {
      // Reset si plus de 1 seconde s'est écoulée
      deletedChannels = 1;
      lastDeletedTimestamp = currentTimestamp;
    } else if (deletedChannels >= MAX_DELETED_CHANNELS) {
      // Kick all bots si plus de 10 salons supprimés en 1 seconde
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
    .setFooter('Fait entièrement par _tiyoky! Me DM si il y a un problème avec le bot.');

  message.channel.send({ embeds: [embed] });
}

function activateHighProtection(message) {
  // Logique pour activer la protection renforcée
  highProtectionActivated = true;
  protectionActivated = false; // Vous pouvez également activer la protection normale ici si nécessaire
  message.channel.send('Protection renforcée activée.\<a:emoji_5:1209532221967437945>');
}

function deactivateHighProtection(message) {
  // Logique pour désactiver la protection renforcée
  highProtectionActivated = false;
  message.channel.send('Protection renforcée désactivée.');
}

async function activateProtection(message) {
  try {
    // Désactive la permission de créer des webhooks pour tout le monde
    await message.guild.roles.everyone.permissions.remove(['CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS']);
    
    // Logique supplémentaire si nécessaire
    protectionActivated = true;
    message.channel.send('Protection activée.\<a:emoji_5:1209532221967437945>');
  } catch (error) {
    console.error('Erreur lors de l\'activation de la protection :', error);
    message.reply('Une erreur s\'est produite lors de l\'activation de la protection. Veuillez réessayer.');
  }
}

function deactivateProtection(message) {
  // Logique pour désactiver la protection
  protectionActivated = false;
  message.channel.send('Protection désactivée.');
}

function kickAllBots(guild) {
  if (protectionActivated && guild.me.permissions.has('KICK_MEMBERS')) {
    // Expulse tous les bots du serveur
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
