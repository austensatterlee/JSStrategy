/**
 * User: Austen
 * Date: 10/19/13
 * Time: 1:37 PM
 */
'use strict';
define(['underscore','babylon'], function (_,BABYLON) {
    function Player(name,scene){
        this.units = {};
        this.name = name;
        this.scene = scene;
    }
    Player.prototype = {
        constructor: Player,
        createUnit: function(initRC,options){
            var newUnit = new Unit('p'+this.name+ _.keys(this.units).length,this,this.scene)
            this.units[newUnit.name]=newUnit;
            this.scene.grid.registerLocation(newUnit,initRC);
            if(options){
                for(var optionName in options){
                    newUnit[optionName] = options[optionName];
                }
            }
        },
        moveUnit: function(unitName,destRC){
            var destRC = this.scene.grid.ensurePair(destRC);
            var unit = this.units[unitName];
            if(unit.hasMoved==false){
                var dist = Math.floor(Math.sqrt(Math.pow(destRC[0]-unit.position[0],2)+Math.pow(destRC[1]-unit.position[1],2)));
                if(dist<=unit.range){
                    this.scene.grid.registerLocation(unit,destRC);
                    unit.hasMoved=true;
                }else{
                }
            }else{
                console.error(unitName+' has already moved');
            }
            unit.update();
        },
        attackUnit: function(sUnitName,rUnit){
            var sUnit = this.units[sUnitName];
            var distance = Math.floor(Math.sqrt(Math.pow(rUnit.position[1]-sUnit.position[1],2.0)+Math.pow(rUnit.position[0]-sUnit.position[0],2.0)));
            if(sUnit.hasMoved==false){
                if(distance<=sUnit.attackRange){
                    rUnit.health-=sUnit.attack;
                    sUnit.hasMoved=true;
                }
            }
            sUnit.update();
            rUnit.update();
        },
        isTurnComplete: function(){
            var unitName;
            for(var i=0;i< _.keys(this.units).length;i++){
                unitName = _.keys(this.units)[i];
                if(this.units[unitName].hasMoved==false)
                    return false;
            }
            return true;
        },
        autoTurn: function(){
            var unitName,unit;
            for(var i=0;i< _.keys(this.units).length;i++){
                unitName = _.keys(this.units)[i];
                unit = this.units[unitName];

                if(this.units[unitName].hasMoved==false){
                    var move_space = unit.getMoveSpace();
                    var attack_space = unit.getAttackSpace();
                    if(attack_space.length==1){
                        var choice = Math.floor(attack_space.length*Math.random());
                        this.attackUnit(unitName,this.scene.grid.vertices[attack_space[choice]]);
                    }else{
                        this.moveUnit(unitName,move_space[Math.floor(move_space.length*Math.random())]);
                    }
                }
            }
        }
    }

    function Unit(name,owner,scene){
        this.name = name;
        this.scene = scene;
        this.owner = owner;

        this.position = undefined;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.range = 4;
        this.attackRange = 2;
        this.attack = 10;
        this.hasMoved = false;

        this.mesh = BABYLON.Mesh.CreateSphere(name,10,scene.grid.row_spacing,scene,false);
        this.mesh.material = new BABYLON.StandardMaterial(name+'mat',scene);
        //this.mesh.material.diffuseColor.fromHex(0xFFFFFF);
        this.mesh.unit=this;
        this.health_mesh = BABYLON.Mesh.CreateGround(name+'health',5,1,100,this.scene,true);
        this.health_mesh.rotation.x=Math.PI/2;
        this.health_mesh.parent = this.mesh;
        this.health_mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_X;
        this.health_mesh.material = new HealthMaterial(name+'healthmat',this.scene);
        this.health_mesh.material.health=this.health/this.maxHealth;
    }
    Unit.prototype = {
        constructor: Unit,
        update: function(index){
            if(index){
                this.position = index;
                var mesh = this.mesh;
                var coords = this.scene.grid.ensureCoords(index);
                var unitHeight = mesh._boundingInfo.boundingBox.maximum.y-mesh._boundingInfo.boundingBox.minimum.y;
                mesh.position = new BABYLON.Vector3(coords.x,coords.y+unitHeight/2,coords.z);
                this.health_mesh.position = new BABYLON.Vector3(0,unitHeight/2+2,0);//new BABYLON.Vector3(coords.x,coords.y+unitHeight,coords.z);
            }
            this.health_mesh.material.health = this.health/this.maxHealth;
        },
        showRange: function(){
            this.overlayMeshes = [];
            var attack_space = this.getAttackSpace();
            var move_space = _.difference(this.getMoveSpace(),attack_space);

            var vIndex;
            var coords;
            var spaceMesh;
            for(var i=0;i<move_space.length;i++){
                vIndex = move_space[i];
                coords = this.scene.grid.ensureCoords(vIndex);
                spaceMesh = BABYLON.Mesh.CreateGround('moveSpaceMesh'+vIndex,this.scene.grid.col_spacing,this.scene.grid.row_spacing,2,this.scene);
                spaceMesh.position = new BABYLON.Vector3(coords.x,1.0,coords.z);
                spaceMesh.material = new BABYLON.StandardMaterial('moveSpaceMeshMat'+vIndex,this.scene);
                spaceMesh.material.diffuseColor = new BABYLON.Color3(0.0,0.0,1.0);
                spaceMesh.material.alpha = 0.5;
                this.overlayMeshes.push(spaceMesh);
            }
            for(var i=0;i<attack_space.length;i++){
                vIndex = attack_space[i];
                coords = this.scene.grid.ensureCoords(vIndex);
                spaceMesh = BABYLON.Mesh.CreateGround('attackSpaceMesh'+vIndex,this.scene.grid.col_spacing,this.scene.grid.row_spacing,1,this.scene);
                spaceMesh.position = new BABYLON.Vector3(coords.x,1.0,coords.z);
                spaceMesh.material = new BABYLON.StandardMaterial('attackSpaceMeshMat'+vIndex,this.scene);
                spaceMesh.material.diffuseColor = new BABYLON.Color3(1.0,0.0,0.0);
                spaceMesh.material.alpha = 0.5;
                this.overlayMeshes.push(spaceMesh);
            }
        },
        hideRange: function(){
            var colors = this.scene.grid.mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind);
            var vIndex;
            for(var i=0;i<this.overlayMeshes.length;i++){
                this.overlayMeshes[i].material.dispose();
                this.overlayMeshes[i].dispose();
            }
            this.overlayMeshes = [];
        },
        getMoveSpace: function(){
            var move_space = [];
            var r = this.position[0],
                c = this.position[1];
            var vIndex,dist;
            for(var i=r-this.range;i<=r+this.range;i++){
                for(var j=c-this.range;j<=c+this.range;j++){
                    if(i<0 || i>=this.scene.grid.num_rows)
                        continue;
                    if(j<0 || j>=this.scene.grid.num_cols)
                        continue;
                    dist = Math.floor(Math.sqrt(Math.pow(j-c,2)+Math.pow(i-r,2)));
                    if(dist>this.range)
                        continue;
                    vIndex = this.scene.grid.ensureIndex([i,j]);
                    if(this.scene.grid.vertices[vIndex]===undefined)
                        move_space.push(vIndex);
                }
            }
            return move_space;
        },
        getAttackSpace: function(){
            var attack_space = [];
            var r = this.position[0],
                c = this.position[1];
            var vIndex,dist;
            for(var i=r-this.attackRange;i<=r+this.attackRange;i++){
                for(var j=c-this.attackRange;j<=c+this.attackRange;j++){
                    if(i<0 || i>=this.scene.grid.num_rows)
                        continue;
                    if(j<0 || j>=this.scene.grid.num_cols)
                        continue;
                    dist = Math.floor(Math.sqrt(Math.pow(j-c,2)+Math.pow(i-r,2)));
                    if(dist>this.attackRange)
                        continue;
                    vIndex = this.scene.grid.ensureIndex([i,j]);
                    if(this.scene.grid.vertices[vIndex]!==undefined && (_.has(this.scene.grid.vertices[vIndex],'owner') && this.scene.grid.vertices[vIndex].owner!==this.owner))
                        attack_space.push(vIndex);
                }
            }
            return attack_space;
        },
        dispose: function(){
            delete this.owner.units[this.name];
            this.mesh.material.dispose();
            this.health_mesh.material.dispose();
            this.mesh.dispose(true);
            this.health_mesh.dispose(true);
            this.scene.grid.unregisterLocation(this.position);
        }
    }
    function HealthMaterial(name, scene) {
        this.name = name;
        this.id = name;

        this._scene = scene;
        scene.materials.push(this);
        this.backFaceCulling=false;

        this._time = 0;
    };
    HealthMaterial.prototype = Object.create(BABYLON.Material.prototype);
    HealthMaterial.prototype.needAlphaBlending = function () {
        return false;
    };
    HealthMaterial.prototype.needAlphaTesting = function () {
        return false;
    };
    HealthMaterial.prototype.isReady = function (mesh) {
        var engine = this._scene.getEngine();

        this._effect = engine.createEffect("health",
            ["position", "normal", "uv"],
            ["worldViewProjection", "world", "view", "health"],
            "",
            "");

        if (!this._effect.isReady()) {
            return false;
        }

        return true;
    };

    HealthMaterial.prototype.bind = function (world, mesh) {
        this._time += 0.0001 * this._scene.getAnimationRatio();

        this._effect.setMatrix("world", world);
        this._effect.setMatrix("worldViewProjection", world.multiply(this._scene.getTransformMatrix()));
        this._effect.setFloat2("health",this.health,0);
    };

    return Player;
});