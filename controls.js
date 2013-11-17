/**
 * User: Austen
 * Date: 10/5/13
 * Time: 3:36 PM
 */
'use strict';
define(['babylon','underscore','jquery','utils'],function(BABYLON,_,$,Utils){
    return function(scene,canvas){

        /* Controls object */
        function Controls(){
            this.activeMesh=undefined;
            /*
             * Create cursor mesh
             */
            this.gridCursor = this._createCursor();
            /*
             * Properties
             */
            this.selected_rc = new Array(2); // an array containing the row and column of the selected grid tile (in that order)
            this._keyMap = {};
            this._keys=[];
            /*
             * Custom behaviors (implemented externally)
             */
            this.clickFunction = function(selected_rc){};
            /*
             * Interface
             */
            this.interface = new Interface();

            canvas.addEventListener("mousedown", _.bind(function (evt) {
                // Select clicked object
                var pickResult = scene.pick(evt.clientX, evt.clientY);
                // Disable gravity for clicked object
                if(pickResult.hit && pickResult.pickedMesh!==scene.grid.mesh){
                    this.activeMesh = pickResult.pickedMesh;
                }else{
                    if(this.activeMesh!==undefined){
                        // Utils.restore cursor properties
                        this.activeMesh = undefined;
                    }
                }

                // Call externally supplied function
                if(this.selected_rc)
                    this.clickFunction(this.selected_rc,this.activeMesh);
            },this));

            canvas.addEventListener("mouseup", _.bind(function(evt){
                if(this.activeMesh && _.has(this.activeMesh,'unit')){
                    $("#unit_info_frame").html("Unit: "+this.activeMesh.name+"<br>"+"Health: "+this.activeMesh.unit.health);
                }else{
                    $("#unit_info_frame").html("");
                }
            },this));

            canvas.addEventListener("mousemove", _.bind(function (evt) {
                var currentMousePos = new BABYLON.Vector2(evt.clientX,evt.clientY);
                this.interface.move(currentMousePos.x,currentMousePos.y);
                // Select clicked object
                var pickResult = scene.pick(evt.clientX, evt.clientY);
                // Disable gravity for clicked object
                if(pickResult.hit){
                        var hitPosition = pickResult.pickedPoint.add(new BABYLON.Vector3(scene.grid.width/2,0,scene.grid.height/2));
                        var r = Math.floor((hitPosition.z)/scene.grid.row_spacing);
                        var c = Math.floor((hitPosition.x)/scene.grid.col_spacing);
                        Utils.save(this.gridCursor,'isVisible');
                        this.gridCursor.isVisible = true;
                        this.gridCursor.position.x = (c+0.5)*scene.grid.col_spacing-scene.grid.width/2;
                        this.gridCursor.position.y = 0.5;
                        this.gridCursor.position.z = (r+0.5)*scene.grid.row_spacing-scene.grid.height/2;
                        this.selected_rc = [r,c];
                }else{
                    Utils.restore(this.gridCursor);
                    this.selected_rc = undefined;
                }
            },this));

            window.addEventListener("keydown", _.bind(this._onKeyDown,this));
            window.addEventListener("keyup", _.bind(this._onKeyUp,this));
        }
        Controls.prototype={
            constructor: Controls,
            update: function(){
                for(var i=0;i<this._keys.length;i++){
                    if(_.contains(this._keyMap,this._keys[i]))
                        this._keyMap[this._keys[i]]();
                }
            },
            addEventCallback: function(evt,callback,context){
                this.clickFunction = _.bind(callback,context);
            },
            _createCursor: function(){
                var gridCursor = BABYLON.Mesh.CreateGround('grid_cursor',scene.grid.col_spacing,scene.grid.row_spacing,1,scene,true);
                gridCursor.isPickable = false;
                gridCursor.isVisible = false;
                gridCursor.material = new BABYLON.StandardMaterial('grid_cursor_material',scene);
                gridCursor.material.emissiveColor = new BABYLON.Color3(.5,.5,.5);
                gridCursor.material.diffuseColor = new BABYLON.Color3(1,1,1);
                gridCursor.material.alpha = 0.5;
                return gridCursor;
            },
            _onKeyDown: function(evt){
                if(!_.contains(this._keys,evt.keyCode)){
                    this._keys.push(evt.keyCode);
                }
            },
            _onKeyUp: function(evt){
                if(_.contains(this._keys,evt.keyCode)){
                    this._keys = _.without(this._keys,evt.keyCode);
                }
            }
        };

        function Interface(){
            $('body').prepend("<div id='interface'></div>");
            this.container = $('#interface');
            this.container.css({
                'position': 'absolute',
                'width': '100px',
                'height': '200px',
                'background': '#FFFFFF',
                'border': '#000000 solid 1px'
            });
            this.hide();
        }
        Interface.prototype = {
            constructor: Interface,
            move: function(x,y){
                this.container.css({
                    'left':x+'px',
                    'top':y+'px'
                });
            },
            show: function(){
                this.container.css({
                    'visibility': 'visible'
                })
            },
            hide: function(){
                this.container.css({
                    'visibility': 'hidden'
                });
            }
        }
        return new Controls();
    }
});