
//TODO: Back
//TODO: Normal cli tool
//TODO: Server

process.bin = process.title = 'TheHobbit';

require('http').createServer(function (req, res) {


var walk = require('bem-walk'),
    fs = require('fs');
var walker = walk(['common.blocks', 'desktop.blocks', 'touch.blocks', 'touch-phone.blocks', 'touch-pad.blocks']);

var blockName = process.argv[2];

var i = 0, j = 0;

var n = 0, p = 0;

var blocks = {};


function isBlock(bemObject) {
    return bemObject.block && !bemObject.elem && !bemObject.modName;
}

function isBlockDep(bemDep) {
    return bemDep.block && !bemDep.elem;
}


function expandDeps(blockName, dep) {
    //TODO: elem
    //TODO: mod
    //TODO: elems -> []
    //TODO: mods -> []
    if (typeof dep == typeof '') return {block: dep};
    //if (dep.block) {
    //} else {
    //    dep.block = blockName;
    //}
    return dep;
}

function there(block) {
    function proceedBemObj(block) {
        function proceedDeps(blockDeps) {
            return blockDeps.map(function (dep) {
                dep = expandDeps(block.block, dep);
                if(isBlockDep(dep)) {
                    if (!dep.bemObject) {
                        dep.bemObject = blocks[dep.block];
                        if (dep.bemObject) {
                            proceedBemObj(dep.bemObject);
                        }
                    }
                }
                return dep;
            });
        }

        block.mustDeps = proceedDeps(block.mustDeps);
        block.shouldDeps = proceedDeps(block.shouldDeps);
    }

    proceedBemObj(block);
}

function traverse(tree, callback) {
    function proceedDeps(blockDeps) {
        blockDeps.forEach(function(dep) {
            callback(dep);
            if (dep.bemObject) {
                traverse(dep.bemObject, callback);
            }
        });
    }

    proceedDeps(tree.mustDeps);
    proceedDeps(tree.shouldDeps);
}

function flat(tree) {
    var list = {}
    traverse(tree, function(dep) {
        //only blocks now
        dep.block && (list[dep.block] = dep);
    });

    return list;
}

function shouldResponse() {
    if (n === p) {
        var block = blocks[blockName];
        if (block) {
            there(block);
            var all = flat(block);
            res.end(blockName + ' : ' + Object.keys(all).join(', ') + '\n');
        } else {
            res.end('No such block\n');
        }
    }
}

walker.on('data', function (bemObject) {
    //TODO: Only blocks now
    if (!isBlock(bemObject)) return;

    if (bemObject.tech === 'deps.js') {
        //put in hash blockName --> blockObj
        blocks[bemObject.block] = blocks[bemObject.block] || bemObject;
        blocks[bemObject.block].mustDeps = [];
        blocks[bemObject.block].shouldDeps = [];

        n++;
        fs.readFile(bemObject.path, 'utf8', function(err, data) {
            if (err) throw err;

            var deps = eval(data);

            //TODO: Only tech:bemhml now
            //TODO: Forgot about levels =(
            [].concat(deps).forEach(function(dep) {
                if (dep.tech) {
                    //tech: js, tmpl-spec.js
                    console.log('Unresolved tech: ' + dep.tech);
                    return;
                }

                //TODO: noDeps: []

                [].concat(dep.mustDeps).forEach(function(dep) {
                    dep && blocks[bemObject.block].mustDeps.push(dep);
                });

                [].concat(dep.shouldDeps).forEach(function(dep) {
                    dep && blocks[bemObject.block].shouldDeps.push(dep);
                });
            });

            p++;
            shouldResponse();
        });
    };
}).on('end', function() {
    res.writeHead(200, {'Content-Type': 'text/plain'});
}).on('error', function() {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Error ! >_<');
});

}).listen(8042);
console.log('Server running at http://127.0.0.1:8042/');
