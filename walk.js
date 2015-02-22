
process.bin = process.title = 'TheHobbit';




require('http').createServer(function (req, res) {




var walk = require('bem-walk'),
    fs = require('fs');
var walker = walk(['common.blocks', 'desktop.blocks', 'touch.blocks', 'touch-phone.blocks', 'touch-pad.blocks']);

var blockName = process.argv[2];

//console.log('Block ' + block);

var i = 0,j = 0;

var n = 0, p = 0;

var blocks = {};
function isBlock(bemObject) {
    return bemObject.block && !bemObject.elem && !bemObject.modName;
}

function isBlockDep(bemDep) {
    return bemDep.block && !bemDep.elem;
}


function expandDeps(blockName, dep) {
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

        block.must = proceedDeps(block.must);
        block.should = proceedDeps(block.should);
    }

    proceedBemObj(block);
}

function shouldResponse() {
    if (n === p) {
        var block = blocks[blockName];
        if (block) {
            there(block);
            var all = Object.keys(flat(block));
            var must = ('Block : ' + block.bem + ' deps : ' +       block.must);
            var should = ('Block : ' + block.bem + ' shouldDeps : ' + block.should);
            res.end('Hello World : ' + all + '\n');
        } else {
            res.end('No block');
        }
    }
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

    proceedDeps(tree.must);
    proceedDeps(tree.should);
}

function flat(tree) {
    var list = {}
    traverse(tree, function(dep) {
        dep.block && (list[dep.block] = dep);
    });

    return list;
}

walker.on('data', function (bemObject) {
    i++;
    //TODO: Only blocks now
    if (!isBlock(bemObject)) return;
    j++;

    if (bemObject.tech === 'deps.js') {
        //put in hash blockName --> blockObj
        blocks[bemObject.block] = blocks[bemObject.block] || bemObject;
        blocks[bemObject.block].must = [];
        blocks[bemObject.block].should = [];
        n++;
        fs.readFile(bemObject.path, 'utf8', function(err, data) {
            if (err) throw err;

            //TODO: Forgot about levels =(
            function analDep(deps, should) {
                [].concat(deps).forEach(function(dep) {
                    //if (!isBlock(dep)) return;

                    //console.log('Block : ' + bemObject.path + (should ? ' should ' : '') + ' deps : ' + dep.block);
                    if (should) {
                        blocks[bemObject.block].should.push(dep);
                    } else {
                        blocks[bemObject.block].must.push(dep);
                    }
                });

            }



            var deps = eval(data);
            //TODO: Only tech:bemhml now
            //TODO: No deps
            [].concat(deps).forEach(function(dep) {
                if (dep.tech) {
                    //tech: js, tmpl-spec.js
                    console.log('Unresolved tech: ' + dep.tech);
                    return;
                }
                dep.mustDeps && analDep(dep.mustDeps);
                dep.shouldDeps && analDep(dep.shouldDeps, true);
            });

            p++;
            shouldResponse();
            //var block = blocks[bemObject.block];
            //console.log('Block : ' + block.bem + ' deps : ' +       block.must.length);
            //console.log('Block : ' + block.bem + ' shouldDeps : ' + block.should.length);
        });
    };
    //console.log(bemObject.path);
}).on('end', function() {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    //console.log(i);
    //console.log(j);
}).on('error', function() {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Error ! >_<');
});

}).listen(8042);
console.log('Server running at http://127.0.0.1:8042/');
