#!/usr/bin/env node
'use strict';

process.bin = process.title = 'deps-analyzer';


var walk = require('bem-walk'),
    fs = require('fs');
var walker = walk(['common.blocks', 'desktop.blocks', 'touch.blocks', 'touch-phone.blocks', 'touch-pad.blocks']);

var i = 0,j = 0;
var blocks = {};
function isBlock(bemObject) {
    return bemObject.block && !bemObject.elem && !bemObject.modName;
}
walker.on('data', function (bemObject) {
    i++;
    if (!isBlock(bemObject)) return;
    j++;

    blocks[bemObject.block] = blocks[bemObject.block] || bemObject;
    bemObject.must = [];
    bemObject.should = [];
    if (bemObject.tech === 'deps.js') {
        fs.readFile(bemObject.path, 'utf8', function(err, data) {
            if (err) throw err;

            function analDep(deps, should) {
                //!Array.isArray(deps) && console.log('No Array !!: ' + bemObject.id);
                !Array.isArray(deps) && (deps = [deps]);
                deps.forEach(function(dep) {
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
            //TODO: Only blocks now
            //!Array.isArray(deps) && console.log('FUCK No Array !!: ' + bemObject.id);
            !Array.isArray(deps) && (deps = [deps]);
            deps.forEach(function(dep) {
                if (dep.tech) return;
                dep.mustDeps && analDep(dep.mustDeps);
                dep.shouldDeps && analDep(dep.shouldDeps, true);
            });
            var block = blocks[bemObject.block];
            console.log('Block : ' + block.bem + ' deps : ' +       block.must.length);
            console.log('Block : ' + block.bem + ' shouldDeps : ' + block.should.length);
        });
    }
    console.log(bemObject.path);
}).on('end', function() {
    console.log(i);
    console.log(j);
});

