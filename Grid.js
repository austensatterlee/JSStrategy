/**
 * User: Austen
 * Date: 10/13/13
 * Time: 12:41 AM
 */
'use strict';
define(['underscore','babylon'], function (_,BABYLON) {
    function Grid(grid_rows,grid_cols,grid_width,grid_height,scene){
        this.total_vertices = grid_rows * grid_cols;
        this.num_rows = grid_rows;
        this.num_cols = grid_cols;

        this.width = grid_width;
        this.height = grid_height;
        this.col_spacing = this.width/this.num_cols;
        this.row_spacing = this.height/this.num_rows;

        this.vertices = [];
        this.edges = [];

        this.mesh = new BABYLON.Mesh('grid',scene);
        this.build_grid_structure(scene);
        this.mesh.material = new GridMaterial('grid_material',scene);
        scene.grid = this;
    }
    Grid.prototype = {
        constructor: Grid,
        registerLocation: function(obj,rc){
            var index = this.ensureIndex(rc);
            if(this.vertices[index]===undefined || this.vertices[index]===obj){
                // empty old cell
                if(obj.position)
                    this.unregisterLocation(obj.position);
                this.vertices[index] = obj;
                obj.update(rc);
            }else{
                throw new Error('cell '+rc+' not empty');
            }
        },
        unregisterLocation: function(rc){
            this.vertices[this.ensureIndex(rc)] = undefined;
        },
        /* Generates graph structure of grid
         * For all inner vertices, deg(v)=4 [Total: num_rows*num_cols-2(num_rows+num_cols)]
         * For all outer vertices (except 4 corners), deg(v)=3 [Total: 2(num_rows+num_cols) - 4
         * For 4 corner vertices, deg(v)=2 [Total: 4]
         */
        build_grid_structure: function(scene){
            var meshVertices = [],
                meshIndices = [],
                meshNormals=[],
                meshUVs=[],
                meshColors=[];
            var vertices = new Array(this.total_vertices);
            var edges = new Array(this.total_vertices*4/2);

            var pushEdges = function (){
                // create array at requested index if not already there
                var edge;
                var origin,
                    neighbor;
                for(var i=0;i<arguments.length;i++){
                    if(!_.isArray(arguments[i])){
                        throw new Error("Argument "+i+" must be an array");
                    }else{
                        edge = arguments[i];
                        origin = edge[0];
                        neighbor = edge[1];
                        if(!_.isArray(edges[origin])){
                            edges[origin] = [];
                        }
                        edges[origin].push(neighbor);
                    }
                }
            }
            for(var r=0;r<this.num_rows;r++){
                for(var c=0;c<this.num_cols;c++){
                    /* Add graph data */
                    var currIndex = this.ensureIndex([r,c]);
                    vertices[currIndex]=undefined;
                    
                    if(c>0){
                        var lastColIndex = this.ensureIndex([r,c-1]);
                        pushEdges([currIndex,lastColIndex],[lastColIndex,currIndex]);
                    }

                    if(r>0){
                        var lastRowIndex = this.ensureIndex([r-1,c]);
                        pushEdges([currIndex,lastRowIndex],[lastRowIndex,currIndex]);
                    }

                    /* Add BABYLON mesh data */
                    meshVertices.push((c+0.5)*this.col_spacing-this.width/2,0,(r+0.5)*this.row_spacing-this.height/2);
                    meshNormals.push(0, 1,0);
                    meshUVs.push(c / this.num_cols, 1.0 - r / this.num_rows);
                    meshColors.push(1,1,1);
                    
                    if(c>0 && r>0){
                        meshIndices.push(c + (r) * (this.num_cols));
                        meshIndices.push(c + (r - 1) * (this.num_cols));
                        meshIndices.push((c - 1) + (r - 1) * (this.num_cols));
                        meshIndices.push((c - 1) + (r) * (this.num_cols));
                        meshIndices.push(c + (r) * (this.num_cols));
                        meshIndices.push((c - 1) + (r - 1) * (this.num_cols));

                        meshIndices.push((c - 1) + (r - 1) * (this.num_cols));
                        meshIndices.push(c + (r) * (this.num_cols));
                        meshIndices.push((c - 1) + (r) * (this.num_cols));
                        meshIndices.push((c - 1) + (r - 1) * (this.num_cols));
                        meshIndices.push(c + (r - 1) * (this.num_cols));
                        meshIndices.push(c + (r) * (this.num_cols));
                    }
                }
            }
            this.vertices = vertices;
            this.edges = edges;

            this.mesh.setVerticesData(meshVertices, BABYLON.VertexBuffer.PositionKind, true);
            this.mesh.setVerticesData(meshNormals, BABYLON.VertexBuffer.NormalKind, true);
            this.mesh.setVerticesData(meshUVs, BABYLON.VertexBuffer.UVKind, true);
            this.mesh.setVerticesData(meshColors, BABYLON.VertexBuffer.ColorKind, true);
            this.mesh.setIndices(meshIndices);
        }
    }

    Grid.prototype.ensureIndex = function(v){
        if(_.isArray(v) && v.length==2){
            var r=v[0],
                c=v[1];
            return this.num_cols*r+c;
        }else if(!_.isArray(v))
            return v;
        else
            throw new TypeError("Variable is neither a number nor a pair of numbers");
    };
    Grid.prototype.ensurePair = function(v){
        if(_.isArray(v) && v.length==2)
            return v;
        else if(!_.isArray(v)){
            var index = v;
            var r = parseInt(index / this.num_cols,10), // i/cols
                c = parseInt(index - r*this.num_cols,10); // i-r/rows
            if(this.ensureIndex([r,c])!=v)
                throw new Error('Needs validation');
            return [r,c];
        }else
            throw new TypeError("Variable is neither a number nor a pair of numbers");
    };
    Grid.prototype.ensureCoords = function(v){
        if(!_.isArray(v)){
            v = this.ensurePair(v);
        }
        var r = v[0],
            c = v[1];
        var x = (c+0.5) * this.col_spacing - this.width/2,
            z = (r+0.5) * this.row_spacing - this.height/2;
        return {x:x,y:0,z:z};
    };

    function GridMaterial(name, scene) {
        this.name = name;
        this.id = name;
        //this.light = light;

        this.bumpTexture = new BABYLON.Texture("./textures/ground.png",scene);
        this._scene = scene;
        scene.materials.push(this);

        this._time = 0;
    };
    GridMaterial.prototype = Object.create(BABYLON.Material.prototype);
    GridMaterial.prototype.needAlphaBlending = function () {
        return false;
    };

    GridMaterial.prototype.needAlphaTesting = function () {
        return false;
    };
    GridMaterial.prototype.isReady = function (mesh) {
        var engine = this._scene.getEngine();

        if (this.bumpTexture && !this.bumpTexture.isReady) {
            return false;
        }

        this._effect = engine.createEffect("grid",
            ["position", "normal", "uv", "color"],
            ["worldViewProjection", "world", "view","time"],
            ["bumpSampler"],
            "");

        if (!this._effect.isReady()) {
            return false;
        }

        return true;
    };

    GridMaterial.prototype.bind = function (world, mesh) {
        this._time += 0.0001 * this._scene.getAnimationRatio();

        this._effect.setMatrix("world", world);
        this._effect.setMatrix("worldViewProjection", world.multiply(this._scene.getTransformMatrix()));
        this._effect.setFloat2("time",this._time,0);
        this._effect.setTexture("bumpSampler",this.bumpTexture);
    };

    GridMaterial.prototype.dispose = function () {
        if (this.bumpTexture) {
            this.bumpTexture.dispose();
        }

        if (this.groundTexture) {
            this.groundTexture.dispose();
        }
        this.baseDispose();
    };

    return Grid;
});