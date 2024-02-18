const { Client, GatewayIntentBits, MessageEmbed } = require('discord.js');
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const prefix = '+';

client.on('messageCreate', (message) => {
  if (message.author.bot || !message.guild) return;

  if (message.content.startsWith(prefix + 'help')) {
    displayHelp(message);
  }

  if (message.content.startsWith(prefix + 'protect++')) {
    activateHighProtection(message);
  }

  if (message.content.startsWith(prefix + 'protect')) {
    activateProtection(message);
  }
});

function displayHelp(message) {
  const embed = new MessageEmbed()
    .setColor('#3498db')
    .setTitle('Commandes du Bot Protect')
    .setDescription('Utilisez ces commandes pour gérer la protection du serveur.')
    .addField('+help', 'Affiche cette aide.')
    .addField('+protect++', 'Active une protection renforcée.')
    .addField('+protect', 'Active la protection normale.')
    .setFooter('Votre texte de pied de page ici.');

  message.channel.send({ embeds: [embed] });
}

function activateHighProtection(message) {
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

client.login('process.env.TOKEN');
