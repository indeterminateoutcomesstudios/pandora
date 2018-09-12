const { MessageEmbed } = require('discord.js');
const {
    fileDb: { championsFuzzy, champions, translate },
    functions: { getPrefix, imageUrl, parseGrade, parseQuery },
    categories,
    cmdResult,
    PaginationEmbed,
} = require('../util');

const instructions = (message) => {
    const prefix = getPrefix(message);
    const e = {
        title: `${prefix}champion [<name>] [<grade>]`,
        fields: [
            {
                name: '<name>',
                value: `Get champion data`
            }, {
                name: '<grade>',
                value: `Champion level. Defaults to highest possible`
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

    const candidates = championsFuzzy.search(name);

    if (!candidates.length) {
        return message.channel
            .send('Champion not found!')
            .then(m => ({
                status_code: cmdResult.ENTITY_NOT_FOUND,
            }));
    }

    const champ = champions[candidates.map(c => parseInt(c.path))[0]];

    let form = null;

    if (grade) {
        form = champ.forms.filter(f => f.grade === grade)[0];
    } else {
        form = champ.forms[champ.forms.length - 1];
    }

    if (!form) {
        return message.channel
            .send('Champ level not found!')
            .then(m => ({
                status_code: cmdResult.ENTITY_GRADE_NOT_FOUND,
            }));
    }

    const page = champ.forms.indexOf(form) + 1;

    const embeds = champ.forms.map((form, idx, arr) => {
        let base = new MessageEmbed()
            .setTitle(`${translate(champ.name)} (Lvl. ${form.grade})`)
            .setFooter(`Page ${idx + 1}/${arr.length}`);

        if (form.active) {
            base = base.addField(`${translate(form.active.name)} (Active)`, translate(form.active.description));
        }

        if (form.passive) {
            base = base.addField(`${translate(form.passive.name)} (Passive)`, translate(form.passive.description));
        }

        if (form.exclusive) {
            base = base.addField(`${translate(form.exclusive.name)} (Exclusive)`, translate(form.exclusive.description));
        }

        return base;
    });

    return new PaginationEmbed(message)
        .setDescription(translate(champ.lore))
        .setArray(embeds)
        .setAuthorizedUsers([message.author.id])
        .setChannel(message.channel)
        .setPage(page)
        .showPageIndicator(false)
        .setThumbnail(imageUrl('heroes/' + champ.image))
        .build()
        .then(m => ({
            status_code: cmdResult.SUCCESS,
            target: champ.id,
            arguments: JSON.stringify({ name: name, grade: grade }),
        }));
};

exports.run = (message, args) => {
    if (!args.length) { return instructions(message); }

    return command(message, args);
};

exports.category = categories.DB;
