import { SlashCommandBuilder, EmbedBuilder, Embed, CategoryChannel} from "discord.js";
import axios from 'axios';
import './banlistExpress.js';

const commands = [
    {
        name: 'profileviewer',

        data : new SlashCommandBuilder()
        .setName('profileviewer')
        .setDescription('View Roblox User Profile.')
        .addStringOption(option => 
            option.setName('userinfo')
            .setDescription('Put who you want to view user profile.')
            .setRequired(true)
        )
        .toJSON(),

        async execute() {
            const args = arguments;
            const interaction = args[0];
            const client = args[1];

            try {
                const userInfo = interaction.options.getString('userinfo') || interaction.options.getNumber('userinfo');
                let userId;

                if (!userInfo) return interaction.reply('Invalid User Info');
                if (isNaN(userInfo)) {
                    const newuserData = await axios.post('https://users.roblox.com/v1/usernames/users', {
                        usernames: [userInfo]
                    });
                    console.log(newuserData.data.data)
                    console.log(newuserData.data.data.length)
                    // if (!newuserData.data.data || newuserData.data.length === 0); return interaction.reply('User Has not Found!');
                    userId = newuserData.data.data[0].id;
                } else {
                    userId = userInfo;
                };

                const [Profile, Thumbnail] = await Promise.all([
                    axios.get(`https://users.roblox.com/v1/users/${userId}`),
                    axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`)
                ]);  

                const data = Profile.data;
                const avatarUrl = Thumbnail.data.data[0].imageUrl;

                console.log(data)
                console.log(avatarUrl)


                const embed = new EmbedBuilder()
                .setTitle(`${data.displayName} (@${data.name})`)
                .setThumbnail(avatarUrl)
                .setURL(`https://www.roblox.com/users/${userId}/profile`)
                .setColor('Aqua')
                .setDescription('User Profile Details')
                .setFields(
                    {name: 'User Bio: ', value: data.description, inline: true},
                    {name: 'Is Verified?: ', value: data.hasVerifiedBadge ? 'Yes' : 'No', inline: true},
                    {name: 'Banned?: ', value: data.isBanned ? 'Yes' : 'No'},
                    {name: 'Creation Time: ', value: data.created, inline: true},
                )
                .setTimestamp()
                .setFooter({
                    text: 'Roblox Profile Info Data.',
                });

                interaction.reply({
                    embeds: [embed],
                });
                
            } catch(e) {
                console.log(e.message)
                interaction.reply('An error occured!');
            };
        },

    },
    {
        name: 'executecommand',

        data : new SlashCommandBuilder()
        .setName('executecommand')
        .setDescription('Execute command in game')
        .addStringOption(option => 
            option.setName('placeid')
            .description('text placeid where you want to execute the code')
            .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('script')
            .setDescription('put here the script what you want to execute')
            .setRequired(true)
        ).toJSON(),

        async Execute() {
            const args = arguments;
            const interaction = arguments[0];
            const client = arguments[1];
            const placeId = interaction.settings.getNumer('placeid');
            const scriptCode = interaction.settings.getString('script');

            if (!scriptCode || placeId) return(interaction.reply('make you sure you inputed the correct script & placeid'));

            try {
                storage.executedCommands.push({
                    placeid: placeid,
                    script: scriptCode,
                });
            } catch(e) {
                interaction.reply('something went wrong sorry brotha');
            };
        },
    },
];

export default commands;