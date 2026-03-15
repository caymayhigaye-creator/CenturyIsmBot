import { ActivityType, Client, Events, GatewayIntentBits, PresenceUpdateStatus, REST, Routes, SlashCommandBuilder, SlashCommandNumberOption, Partials, RoleManager, transformResolved} from 'discord.js';
import 'dotenv/config';
import axios from 'axios';

import commands from './commands.js';
import { ExpressStorage } from './storageExpress.js';
import { BotStorage } from './BotStorage.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ],
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
};

registerCommands();

client.on(Events.ClientReady, async readyClient => {
    const Activites = [
        {name: '@iaxtorez', type: ActivityType.Listening},
        {name: '@centuryism', type: ActivityType.Watching},
        {name: '@s4nan0 Herşey Sinan için.', type: ActivityType.Playing},
    ];

    try {
        await client.user.setUsername('centerofury');
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

client.on(Events.MessageReactionAdd, async (reaction, user) => {
    console.log(BotStorage)
    if (BotStorage.ReactionData) {
        if (!user.bot) {
            if (reaction.message.id === BotStorage.ReactionData.MessageId && reaction.emoji.name === BotStorage.ReactionData.ReactionEmoji) {
                const guild = reaction.message.guild;
                let role = guild.roles.cache.find(r => r.name === process.env.VERIFIED_ROLE_NAME);
                
                if (!role) {
                    try {
                        role = await guild.roles.create({
                            name: `${process.env.VERIFIED_ROLE_NAME}`,
                            color: 0x3498DB,
                            reason: 'Verified Role to access channels.',
                        });
                        console.log('Role has not founded creating a new role');
                        } catch(e) {
                        console.log('Role already exists.');
                    };
                };

                try {
                    const member = await guild.members.fetch(user.id);
                    await member.roles.add(role);
                } catch(e) {
                    console.log(e.message);
                };
            };
        };
    } else {
        console.log('ReactionData is not founded');
    };
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.find(c => c.name === interaction.commandName);
    const accesCommandRole = interaction.guild.roles.cache.get(process.env.PERMISSIONED_ROLE_ID);
    const userPermission = interaction.member.roles.highest;


    if (command) {
        if (userPermission.position > accesCommandRole.position) {
            return(await command.execute(interaction, client));
        } else {
            return(interaction.reply({
                content: 'You are not permissioned to use that command.',
                ephemeral: true,
            }));
        };
    };
});


client.login(process.env.DISCORD_TOKEN);
