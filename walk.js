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

//TODO: HardCore Levels
var DEPS_TYPES = ['mustDeps', 'shouldDeps'];

var fs = require('fs'),
    vm = require('vm'),
    walk = require('bem-walk'),
    bemNaming = require('bem-naming'),
    normalize = require('deps-normalize'),
    DepGraph = require('dependency-graph').DepGraph,
    graph = new DepGraph();


module.exports = function (levels, cb) {
    var walker = walk(levels);

    var nodes = {};

    function process(data) {
        //Add Node
        var target = bemNaming.stringify(data.entity);

        graph.hasNode(target) || graph.addNode(target);

        var t;
        if (!(t = nodes[target])) {
            //console.log('no ' + target);
            nodes[target] = {id: target, label: target, levels:[data.level], techs: [data.tech], scope: data.entity.block };
        } else {
            //console.log('yes ' = target);

            t.levels.push(data.level);
            t.techs.push(data.tech);
        } 

        if (data.tech === 'deps.js') {
            var depsData = fs.readFileSync(data.path, 'utf8'),
                deps = vm.runInThisContext(depsData);
             
            [].concat(deps).forEach(function(dep) {
                //Add Connections
                DEPS_TYPES.forEach(function(depType) {
                    [].concat(dep[depType]).forEach(function(dep) {
                        if (dep) {
                            // fixes for `deps-normalize`
                            dep.block || (dep.block = data.entity.block);
                            dep.elems && !Array.isArray(dep.elems) && (dep.elems = [dep.elems]);
                            typeof dep.mods === 'object' && Object.keys(dep.mods).forEach(function (mod) {
                                typeof dep.mods[mod] === 'boolean' && (dep.mods[mod] = [dep.mods[mod]]);
                            });

                            normalize(dep).forEach(function(normDep) {
                                var node = bemNaming.stringify(normDep);

                                graph.hasNode(node) || graph.addNode(node);
                                graph.addDependency(node, target);
                            });
                        }
                    });
                });
            });
        }

    }
    

    walker
        .on('error', function(error) {
            cb(error);
        })
        .on('data', process)
        .on('end', function() {
            var edges = [];

            Object.keys(graph.nodes).forEach(function(target) {
                //nodes.push({id: target, label: target});
                graph.incomingEdges[target].forEach(function(dep) {
                    edges.push({ from: target, to: dep });
                });
            });

            cb(null, { nodes: nodes, edges: edges });
        });
};
