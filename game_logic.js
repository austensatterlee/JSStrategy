/**
 * User: Austen
 * Date: 10/16/13
 * Time: 8:21 PM
 */
'use strict';
define(['underscore','babylon','utils','player','Grid'],function (_,BABYLON,Utils,Player,Grid) {
    var Logic_module = function(scene){
        this.user_buildings = [];
        this.scene = scene;
        this.grid = scene.grid;
        this.selected_unit = undefined;
        // player
        this.player = new Player('human',scene);
        this.enemy = new Player('enemy',scene);

        this.isPlayerTurn = true;
    }
    Logic_module.prototype = {
        constructor: Logic_module,
        update: function(){
            var vertexBuffer = this.scene.grid.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            for(var i= 0,j=0;i<vertexBuffer.length;i+=3,j++){
                var distances = 0;
                for(var k=0;k<this.user_buildings.length;k++){
                    var building_pos = this.user_buildings[k].position;
                    var distance = BABYLON.Vector3.Distance(building_pos,new BABYLON.Vector3(vertexBuffer[i],vertexBuffer[i+1],vertexBuffer[i+2]));
                }
            }
            this.scene.grid.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind,vertexBuffer);

            for(var i=0;i< _.keys(this.player.units).length;i++){
                var unitName = _.keys(this.player.units)[i];
                var unit = this.player.units[unitName];
                if(unit.health<=0){
                    unit.dispose();
                }
            }
            for(var i=0;i< _.keys(this.enemy.units).length;i++){
                var unitName = _.keys(this.enemy.units)[i];
                var unit = this.enemy.units[unitName];
                if(unit.health<=0){
                    unit.dispose();
                }
            }
        },
        command: function(rc,pickedMesh){
            var coords = this.scene.grid.ensureCoords(rc);
            if(this.selected_unit){ // A unit is already selected
                var vIndex = this.scene.grid.ensureIndex(rc);
                if(this.scene.grid.vertices[vIndex]!==undefined && _.has(this.scene.grid.vertices[vIndex],'owner')){
                    var rUnit = this.scene.grid.vertices[vIndex];
                    if(rUnit.owner!==this.player){
                        this.player.attackUnit(this.selected_unit.name,rUnit);
                    }
                }else{
                    /* Perform action with selected unit on selected cell */
                    this.player.moveUnit(this.selected_unit.name,rc);
                }
                /* Unselect unit */
                Utils.restore(this.selected_unit);
                this.player.units[this.selected_unit.name].hideRange();
                this.selected_unit = undefined;
            }else{ // Nothing is selected
                if(pickedMesh && this.isPlayerTurn){
                    /* Select the unit located in the selected cell */
                    if(pickedMesh.name in this.player.units){
                        this.selected_unit = pickedMesh;
                        Utils.save(this.selected_unit,'material');
                        this.selected_unit.material.diffuseColor.fromHex(this.selected_unit.material.diffuseColor.toHex() & 0xFF0000);
                        this.player.units[this.selected_unit.name].showRange();
                    }
                }else{
                }
            }
            if(this.player.isTurnComplete()===true){
                this.endTurn(this.player);
            }
        },
        endTurn: function(player){
            for(var i=0;i< _.keys(player.units).length;i++){
                player.units[_.keys(player.units)[i]].hasMoved = false;
            }
            this.isPlayerTurn = !this.isPlayerTurn;
            if(this.isPlayerTurn)
                $("#turn_info_frame").html("Your turn!");
            else
                $("#turn_info_frame").html("...");
            if(this.isPlayerTurn===false){
                _.delay(_.bind(function(){
                    this.enemy.autoTurn();
                    this.endTurn(this.enemy);
                },this),500);
            }
        },
        createMap: function(url,onload){
            var grid;
            BABYLON.Tools.LoadImage(url, _.bind(function(img){
                grid = new Grid(img.width,img.height,100,100,this.scene);
                grid.mesh.isPickable = true;
                this.scene.grid = grid;
                var imgData = Utils.getPixelData(img);
                for(var i=0;i<img.width*img.height;i++){
                    var rc = grid.ensurePair(i);
                    var r = imgData.data[i*4],
                        g = imgData.data[i*4+1],
                        b = imgData.data[i*4+2];
                    var hex = b | (g<<8) | (r<<16);
                    switch(hex){
                        case 0x000000:
                            var wall = new Wall(this.scene,rc[0],rc[1]);
                            break;
                        case 0xFF0000:
                            this.enemy.createUnit(rc,{'attack':3});
                            break;
                        case 0x0000FF:
                            this.player.createUnit(rc);
                    }
                }
                onload();
            },this));
        }
    }

    function Wall(scene,r,c){
        var grid = scene.grid;
        this.scene = scene;
        var vIndex = grid.ensureIndex([r,c]);
        this.position = vIndex;
        this.size = grid.row_spacing;
        this.mesh = BABYLON.Mesh.CreateBox('wall'+vIndex,this.size,scene);
        this.mesh.isPickable = false;
        grid.registerLocation(this,vIndex);
    }
    Wall.prototype = {
        constructor: Wall,
        update: function(rc){
            var coords = this.scene.grid.ensureCoords(rc);
            this.mesh.position = new BABYLON.Vector3(coords.x,coords.y+this.size/2,coords.z);
        }
    }
    return Logic_module;
});