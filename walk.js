//TODO: Write unit tests
//TODO: Rewrite Architecture
    //TODO: Think about Levels
    //TODO: Add logger
    //TODO: Error propagination
    //TODO: Add walker
    //TODO: Add JSDocs
    //TODO: Add Linters 
//TODO: --graph
//TODO: Server


module.exports = function (target, options) {

var DepGraph = require('dependency-graph').DepGraph;
var normalize = require('deps-normalize');
var graph = new DepGraph();

var walk = require('bem-walk'),
    bemNaming = require('bem-naming'),
    Stream = require('stream'),
    vm = require('vm'),
    fs = require('fs');

//TODO: HardCore Levels
var LEVELS = ['common.blocks', 'desktop.blocks', 'touch.blocks', 'touch-phone.blocks', 'touch-pad.blocks'];
//LEVELS = ['common.blocks'];
var DEPS_TYPES = ['mustDeps', 'shouldDeps'];

//var walker = walk(LEVELS);


var blockName = target;

var i = 0, j = 0;

var n = 0, p = 0;

var blocks = {};


function isBlock(bemObject) {
    return bemObject.block && !bemObject.elem && !bemObject.modName;
}

function isBlockDep(bemDep) {
    return bemDep.block && !bemDep.elem;
}


//Look at deps-normalizer by @floatdrop
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


function back(bemObject) {
    var list = {},
        bemObjs = [bemObject];
    while((bemObject = bemObjs.pop())) {
        //bemObject = blocks[bemObject.block]
        list[bemObject.block] = bemObject;
        for (var blockName in blocks) {
            var block = blocks[blockName];
            /*jshint -W083 */
            DEPS_TYPES.forEach(function(depType) {
                [].concat(block[depType]).forEach(function(dep) {
                /*jshint +W083 */
                    dep = expandDeps(block.block, dep);
                    if (dep.block === bemObject.block) {
                        bemObjs.push(block);
                        list[block.block] = block;
                    }
                });
            });
        }
    }
    return list;
}

function there(tree) {

    traverse(tree, function(dep) {
        dep = expandDeps(dep.block, dep);
        if (isBlockDep(dep)) {
            if (!dep.bemObject) {
                dep.bemObject = blocks[dep.block];
            }
        }

        return dep;
    });
}

function traverse(tree, callback) {
    function proceedDeps(blockDeps) {
        return blockDeps.map(function(dep) {
            dep = callback(dep) || dep;
            if (dep.bemObject) {
                traverse(dep.bemObject, callback);
            }
            return dep;
        });
    }

    DEPS_TYPES.forEach(function(depType) {
        tree[depType] = proceedDeps(tree[depType]);
    });
}

function flat(tree) {
    var list = {};
    traverse(tree, function(dep) {
        //only blocks now
        dep.block && (list[dep.block] = dep);
    });

    return list;
}

function shouldResponse() {
    if (n === p) {
        ((blockName && [blockName]) || Object.keys(blocks)).forEach(function(blockName) {
            block = blocks[blockName];
            if (!block) {
                console.log('No such block\n');
            } else {
                there(block);
                var all = flat(block);
                var allb = back(block);

                console.log('\n==========\n');
                var gothere = options && options.there;
                var goback = options && options.back;
                !gothere && !goback && (gothere = goback = true);
                gothere && console.log('There: ' + Object.keys(all).join(', ') + '\n');
                goback && console.log('Back: ' + Object.keys(allb).join(', ') + '\n');
                console.log('\n==========\n');
            }
        });
        //res.end('\t^_^\n');
    }
}

function collectBemObject(bemObject) {
    //put in hash blockName --> blockObj
    blocks[bemObject.block] = blocks[bemObject.block] || bemObject;

    DEPS_TYPES.forEach(function(depType) {
        blocks[bemObject.block][depType] = [];
    });
}

function collectDeps(bemObject, deps) {
    //TODO: Only tech:bemhml now
    //TODO: Forgot about levels =(
    [].concat(deps).forEach(function(dep) {
        if (dep.tech) {
            //tech: js, tmpl-spec.js
            console.log('Unresolved tech: ' + dep.tech);
            return;
        }

        //TODO: noDeps: []
        DEPS_TYPES.forEach(function(depType) {
            [].concat(dep[depType]).forEach(function(dep) {
                dep && blocks[bemObject.block][depType].push(dep);
            });
        });
    });
}

var stream = new Stream.Writable({objectMode: true});
stream._write = function(chunk, encoding, next) {
    console.dir(chunk);
    next();
};

stream.on('finish', function() {
    shouldResponse();
});

var objectCollector = new Stream.Transform({objectMode: true});

var depsMapper = new Stream.Transform({objectMode: true});
depsMapper._transform = function(bemObject, encoding, next) {
    if (bemObject.tech === 'deps.js') {
        var data = fs.readFileSync(bemObject.path, 'utf8'),
            deps = vm.runInThisContext(data);
        //this.push(deps);

        //Add Node
        collectBemObject(bemObject);
        //bemObject.deps = deps;

        //Add Connections
        collectDeps(bemObject, deps);

        this.push(bemObject);
    }
    //this.push(bemObject);
    next();
};

var onlyBlocks = new Stream.Transform({objectMode: true});
onlyBlocks._transform = function(bemObject, encoding, next) {
    cre
    next();
};


function process(bemObject) {
    console.log('^_^');
    //Add Node
    var bem_id = bemNaming.stringify(bemObject.entity);

    graph.hasNode(bem_id) || graph.addNode(bem_id);

    if (bemObject.tech === 'deps.js') {
        var data = fs.readFileSync(bemObject.path, 'utf8'),
            deps = vm.runInThisContext(data);
         
        [].concat(deps).forEach(function(dep) {
            if (dep.tech) {
                //tech: js, tmpl-spec.js
                //console.log('Unresolved tech: ' + dep.tech);
                //return;
            } else {
                //Add Connections
                DEPS_TYPES.forEach(function(depType) {
                    [].concat(dep[depType]).forEach(function(dep) {
                        if (dep) {
                            dep.block || (dep.block = bemObject.entity.block);
                            dep.elems && !Array.isArray(dep.elems) && (dep.elems = [dep.elems]);

                            normalize(dep).forEach(function(normDep) {
                                var node = bemNaming.stringify(normDep);
                                graph.hasNode(node) || graph.addNode(node);
                                graph.addDependency(node, bem_id);
                            });
                        }
                    });
                });
            }
        });
    }

}

module.exports = function (levels, cb) {
cb(null, {hello:42});
/*
var walker = walk(LEVELS);

    walker
        .on('error', function(error) {
            cb(error);
            console.log('Error');
        })
        .on('data', process)
        //.on('data', function(){})
        .on('end', function() {
            console.log(graph.nodes);
            if (target) {
                console.log('There: ' +  graph.dependenciesOf(target));
                console.log('Back: ' + graph.dependantsOf(target));
                console.dir(graph.outgoingEdges[target]);
                //console.dir(graph.nodes);
                
            } else {
                var nodes = [];
                var edges = [];
                Object.keys(graph.nodes).forEach(function(target) {
                    nodes.push({id: target, label: target});
                    graph.incomingEdges[target].forEach(function(dep) {
                        edges.push({from: target, to: dep});
                    });
                }); 

                cb(null, {nodes: nodes, edges: edges});
            }
            //console.log('Finish');
        })

    */
};

/*
walker
    .on('error', function(error) {
        console.log('Error');
    })
    .on('data', process)
    //.on('data', function(){})
    .on('end', function() {
        //console.log(graph.nodes);
        if (target) {
            console.log('There: ' +  graph.dependenciesOf(target));
            console.log('Back: ' + graph.dependantsOf(target));
            console.dir(graph.outgoingEdges[target]);
            //console.dir(graph.nodes);

        } else {
            var nodes = [];
            var edges = [];
            Object.keys(graph.nodes).forEach(function(target) {
                nodes.push({id: target, label: target});
                graph.incomingEdges[target].forEach(function(dep) {
                    edges.push({from: target, to: dep});
                });
            });
        }
        //console.log('Finish');
    })
    //.pipe(onlyBlocks)
    //.pipe(depsMapper)
    //.pipe(stream);

 */

};
