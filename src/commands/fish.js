const { MessageEmbed } = require('discord.js');
const { emojis } = require('../config');
const {
    fileDb: { fishesFuzzy, followPath, translate },
    functions: { getPrefix, capitalizeFirstLetter, imageUrl, parseQuery },
    categories,
    cmdResult,
    PaginationEmbed,
} = require('../util');

const instructions = (message) => {
    const prefix = getPrefix(message);
    const e = {
        title: `${prefix}fish [<name>]`,
        fields: [
            {
                name: '<name>',
                value: `Get fish data`
            }
        ]
    };

    return message.channel.send({ embed: e })
        .then(m => ({
            status_code: cmdResult.NOT_ENOUGH_ARGS,
        }));
};

const command = (message, args) => {
    const name = parseQuery(args);

    const candidates = fishesFuzzy.search(name);

    if (!candidates.length) {
        return message.channel
            .send('Fish not found!')
            .then(m => ({
                status_code: cmdResult.ENTITY_NOT_FOUND,
            }));
    }

    const rewards = {
        ITEM_FISHCOIN: emojis.fishcoin,
        ITEM_GOLD: emojis.gold,
        RANDOMBOX_EVENT_GOOD_CATBOX: emojis.mossy_cat_chest,
        RANDOMBOX_EVENT_NORMAL_CATBOX: emojis.intact_cat_chest,
    };

    const fishes = candidates.map((c, idx, arr) => {
        const fish = followPath(c.path);
        return new MessageEmbed()
            .setTitle(`${translate(fish.name)} (${fish.grade}★)`)
            .setDescription(translate(fish.description))
            .addField('Exp', fish.exp, true)
            .addField('Area type', capitalizeFirstLetter(fish.habitat), true)
            .addField('Initial range', `${fish.starts_from}m`, true)
            .addField(`Reward${fish.rewards.length > 1 ? 's': ''}`,
                fish.rewards.map(r => `${r.amount > 1 ? r.amount : ''} ${rewards[r.type]}`).join('\n'),
                true
            )
            .setFooter(`Page ${idx + 1}/${arr.length}`)
            .setThumbnail(imageUrl('fish/' + fish.image))
    });

    return new PaginationEmbed(message)
        .setArray(fishes)
        .setAuthorizedUsers([message.author.id])
        .setChannel(message.channel)
        .showPageIndicator(false)
        .build()
        .then(m => ({
            status_code: cmdResult.SUCCESS,
            target: fishes.map(f => f.id).join(','),
            arguments: JSON.stringify({ name: name}),
        }));
};

exports.run = (message, args) => {
    if (!args.length) { return instructions(message); }

    return command(message, args);
};

exports.category = categories.DB;
