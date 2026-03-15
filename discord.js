import { ActivityType, Client, Events, GatewayIntentBits, PresenceUpdateStatus, REST, Routes, SlashCommandBuilder, SlashCommandNumberOption } from 'discord.js';
import 'dotenv/config';
import axios from 'axios';

import commands from './commands.js';
import {storage} from './storageExpress.js';

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const rest = new REST({ 
    version: '10'       
}).setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
    try {
        console.log('Loading commands...');
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commands.map(cmd => cmd.data) },
        );
        console.log('Commands loaded async.');
    } catch(e) {
        console.error('Commands did not loaded.:', e.message);
    }
}

registerCommands();

client.on(Events.ClientReady, async readyClient => {
    const Activites = [
        {name: '@iaxtorez', type: ActivityType.Listening},
        {name: '@centuryism', type: ActivityType.Watching},
        {name: '@s4nan0 Herşey Sinan için.', type: ActivityType.Playing},
    ];

    try {
        await client.user.setUsername('centerofury');
        await client.user.setPresence()
        await client.user.setAvatar('https://gifdb.com/images/high/blue-aesthetic-498-x-368-gif-yi9jb2a2s7va0pe6.gif');
        await client.user.setBanner('https://i.imgur.com/U2J9ZM0.gif');
        await client.user.edit({ accentColor: 0x000000 });
        await client.user.setStatus(PresenceUpdateStatus.Idle);
        setInterval(() => {
            const PickenActivity = Activites[Math.floor(Math.random() * Activites.length)];
            client.user.setActivity(PickenActivity.name, {
                type: PickenActivity.type,
            });
        }, 10000);
    } catch (err) {
        console.log(err.message);
    };
    console.log(`Bot Client Has Logged In: ${readyClient.user.username}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.find(c => c.name === interaction.commandName);
    
    if (command) {
        await command.execute(interaction, client);
    };
});


client.login(process.env.DISCORD_TOKEN);
