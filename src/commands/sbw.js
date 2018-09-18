const {
    fileDb: { heroesFuzzy, followPath },
    functions: { getPrefix, parseGrade, parseQuery },
    categories,
    cmdResult,
} = require('../util');
const HeroSBWEmbed = require('../embeds/HeroSBWEmbed');

const instructions = (message) => {
    const prefix = getPrefix(message);
    const e = {
        title: `${prefix}sbw [<name>] [<star>]`,
        fields: [{
            name: '<name>',
            value: `Get sbw data.\n*e.g. ${prefix}sbw lee*`
        },
        {
            name: '<star>',
            value: `Filter heroes by <star>. If omitted, defaults to highest form.\n*e.g. ${prefix}sbw lee 4*`
        }
        ]
    };

    return message.channel.send({ embed: e })
        .then(m => ({
            status_code: cmdResult.NOT_ENOUGH_ARGS,
        }));
};

const command = (message, args) => {
    const grade = parseGrade(args);
    const name = parseQuery(args, [`${grade}`]);

    const candidates = heroesFuzzy.search(name);

    if (!candidates.length) {
        return message.channel
            .send('Hero not found!')
            .then(m => ({
                status_code: cmdResult.ENTITY_NOT_FOUND,
                target: 'hero',
            }));
    }

    const hero = followPath(candidates[0].path);

    let sbw = null;

    if (grade) {
        sbw = hero.sbws.filter(f => f.star === grade)[0];
    } else {
        sbw = hero.sbws[hero.sbws.length - 1];
    }

    if (!sbw) {
        return message.channel
            .send('Soulbound weapon grade not found!')
            .then(m => ({
                status_code: cmdResult.ENTITY_GRADE_NOT_FOUND,
                target: 'sbw',
            }));
    }

    const page = hero.sbws.indexOf(sbw) + 1;

    return new HeroSBWEmbed(message, hero, page).send()
        .then(m => ({
            status_code: cmdResult.SUCCESS,
            target: hero.id,
            arguments: JSON.stringify({ name: name, grade: grade }),
        }));
};

exports.run = (message, args) => {
    if (!args.length) { return instructions(message); }

    return command(message, args);
};

exports.category = categories.DB;
