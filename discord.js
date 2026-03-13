import { ActivityType, Client, Events, GatewayIntentBits, PresenceUpdateStatus, REST, Routes, SlashCommandBuilder, SlashCommandNumberOption } from 'discord.js';
import 'dotenv/config';
import axios from 'axios';

import commands from './commands.js';
import {storage} from './banlistExpress.js';

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
    ];

    try {
        await client.user.setAvatar('https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyajUwamdyeWttbWZnenBpbmY2bzdzYm5zMDhnNHQ4Z2FweTl6aXNpZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3ohs4CacylzFaHjMM8/200.gif');
        await client.user.setBanner('https://25.media.tumblr.com/tumblr_m9a12ceLYl1r13jn1o1_500.gif');
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