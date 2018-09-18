const {
    fileDb: { fishingGearFuzzy, followPath },
    functions: { getPrefix, parseQuery },
    categories,
    cmdResult,
} = require('../util');
const FishingGearListEmbed = require('../embeds/FishingGearsEmbed');

const instructions = (message) => {
    const prefix = getPrefix(message);
    const e = {
        title: `${prefix}rod <name>`,
        fields: [
            {
                name: '<name>',
                value: `Get rod data`
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

    const candidates = fishingGearFuzzy.search(name);
    const rods = candidates
        .map(c => followPath(c.path))
        .filter(b => b.type === 'rod');

    if (!rods.length) {
        return message.channel
            .send('Rod not found!')
            .then(m => ({
                status_code: cmdResult.ENTITY_NOT_FOUND,
                target: 'rod',
            }));
    }

    return new FishingGearListEmbed(message, rods).send()
        .then(m => ({
            status_code: cmdResult.SUCCESS,
            target: rods.map(f => f.id).join(','),
            arguments: JSON.stringify({ name: name }),
        }));
};

exports.run = (message, args) => {
    if (!args.length) { return instructions(message); }

    return command(message, args);
};

exports.category = categories.DB;
