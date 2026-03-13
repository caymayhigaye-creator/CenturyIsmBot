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
        await client.user.setBanner('https://static.wikia.nocookie.net/disney/images/7/76/Universal_logo_2013.jpg/revision/latest?cb=20201106121113.png');
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