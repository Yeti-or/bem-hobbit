
var walk = require('bem-walk');
var walker = walk(['common.blocks', 'desktop.blocks']);

var bemo = [];
walker.on('data', function (data) {
    bemo.push(data);
    if(data.tech === 'deps.js') {
        console.log(data.id);
    }
}).on('end', function() {
    console.log(bemo.length);
});

