const { Client, GatewayIntentBits, MessageEmbed } = require('discord.js');
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const prefix = '+';

let deletedChannels = 0;
let lastDeletedTimestamp = 0;

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  if (!message.member.permissions.has('ADMINISTRATOR')) {
    return message.reply("Vous n'avez pas la permission d'utiliser ces commandes.");
  }

  if (message.content.startsWith(prefix + 'help')) {
    displayHelp(message);
  }

  if (message.content.startsWith(prefix + 'protect++')) {
    await activateHighProtection(message);
  }

  if (message.content.startsWith(prefix + 'protect')) {
    await activateProtection(message);
  }
});

client.on('channelDelete', (channel) => {
  deletedChannels += 1;

  const currentTimestamp = Date.now();
  const timeDifference = currentTimestamp - lastDeletedTimestamp;

  if (timeDifference > 1000) {
    // Reset if more than 1 second has passed
    deletedChannels = 1;
    lastDeletedTimestamp = currentTimestamp;
  } else if (deletedChannels >= 10) {
    // Kick all bots if more than 10 channels deleted in 1 second
    kickAllBots(channel.guild);
  }
});

client.on('guildCreate', (guild) => {
  deletedChannels = 0;
  lastDeletedTimestamp = 0;
});

function displayHelp(message) {
  const embed = new MessageEmbed()
    .setColor('#2ECC71')
    .setTitle('Commandes du Bot Protect')
    .setDescription('Utilisez ces commandes pour gérer la protection du serveur.')
    .addField('+help', 'Affiche cette aide.')
    .addField('+protect++', 'Active une protection renforcée, aucun webbook peut être créé, et si tous les salons se suppriment, tous les bots sont expulsés et plus!')
    .addField('+protect', 'Active la protection normale, aucun webbok peut être créé et plus!')
    .setFooter('Fait entièrement par _tiyoky! Me DM si il y a un problème avec le bot.');

  message.channel.send({ embeds: [embed] });
}

async function activateHighProtection(message) {
  // Logique pour activer la protection renforcée
  message.channel.send('Protection renforcée activée.');
}

async function activateProtection(message) {
  try {
    // Désactive la permission de créer des webhooks pour tout le monde
    await message.guild.roles.everyone.permissions.remove(['CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS']);
    
    // Logique supplémentaire si nécessaire
    message.channel.send('Protection activée. Les membres ne peuvent plus créer de webhooks.');
  } catch (error) {
    console.error('Erreur lors de l\'activation de la protection :', error);
    message.reply('Impossible d\'activer la protection.');
  }
}

function kickAllBots(guild) {
  // Expulse tous les bots du serveur
  guild.members.cache
    .filter(member => member.user.bot)
    .forEach(bot => bot.kick());

  console.log('Tous les bots ont été expulsés du serveur.');
}

setInterval(() => {
  client.user.setActivity('Fait par _tiyoky', { type: 'PLAYING' });
  setTimeout(() => {
    client.user.setActivity('**Le** bot protect fait par _tiyoky', { type: 'PLAYING' });
  }, 2000);
}, 4000);

client.login('process.env.TOKEN');
