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

function process(bemObject) {
    //Add Node
    var bem_id = bemNaming.stringify(bemObject.entity);

    graph.hasNode(bem_id) || graph.addNode(bem_id);

    if (bemObject.tech === 'deps.js') {
        var data = fs.readFileSync(bemObject.path, 'utf8'),
            deps = vm.runInThisContext(data);
         
        [].concat(deps).forEach(function(dep) {
            //Add Connections
            DEPS_TYPES.forEach(function(depType) {
                [].concat(dep[depType]).forEach(function(dep) {
                    if (dep) {
                        // fixes for `deps-normalize`
                        dep.block || (dep.block = bemObject.entity.block);
                        dep.elems && !Array.isArray(dep.elems) && (dep.elems = [dep.elems]);
                        typeof dep.mods === 'object' && Object.keys(dep.mods).forEach(function (mod) {
                            typeof dep.mods[mod] === 'boolean' && (dep.mods[mod] = [dep.mods[mod]]);
                        });

                        normalize(dep).forEach(function(normDep) {
                            var node = bemNaming.stringify(normDep);

                            graph.hasNode(node) || graph.addNode(node);
                            graph.addDependency(node, bem_id);
                        });
                    }
                });
            });
        });
    }

}

module.exports = function (levels, cb) {
    var walker = walk(levels);

    walker
        .on('error', function(error) {
            cb(error);
        })
        .on('data', process)
        .on('end', function() {
            var nodes = [],
                edges = [];

            Object.keys(graph.nodes).forEach(function(target) {
                nodes.push({id: target, label: target});
                graph.incomingEdges[target].forEach(function(dep) {
                    edges.push({ from: target, to: dep });
                });
            });

            cb(null, { nodes: nodes, edges: edges });
        });
};
