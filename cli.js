
process.bin = process.title = 'TheHobbit';

module.exports = require('coa').Cmd()
    .name(process.argv[1])
    .helpful()
    .title('The Hobbit - There & Back')
    .opt()
        .name('version')
        .title('Come`on what can it be?')
        .short('v').long('version')
        .flag()
        .only()
        .act(function() {
            return require('./package.json').version;
        })
        .end()

    .opt()
        .name('there')
        .title('Show all deps of taget')
        .long('there')
        .flag()
        .end()

    .opt()
        .name('back')
        .title('Show all targets with such dep')
        .long('back')
        .flag()
        .end()

    .arg()
        .name('target')
        .title('target for deps walking')
        .end()

    .act(function(opts, args) {
        var hobbit = require('./walk');
        hobbit(args.target, opts);
        console.log('opts: ' + require('util').inspect(opts));
        console.log('args: ' + require('util').inspect(args));
    })
    .run(process.argv.slice(2));
