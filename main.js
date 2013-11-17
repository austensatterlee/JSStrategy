'use strict';

requirejs.config({
    shim: {
        'd3': {
            exports: 'd3'
        },
        'babylon': {
            exports: 'BABYLON'
        },
        'underscore': {
            exports: '_'
        }
    },
    paths: {
        'jquery':'common/jquery',
        'babylon':'common/babylon',
        'underscore': 'common/underscore',
        'd3': 'common/d3'
    }
});

var CONSTANTS = {
    grid_rows: 10,
    grid_cols: 10,
    grid_width: 100,
    grid_height: 100
}
require(['jquery', 'babylon', './scene', 'controls', 'game_logic', 'player'], function ($, BABYLON, make_scene, make_controls, game_logic, Player) {
    function renderLoop(){
        scene.render();
        logic_module.update();
        controls.update();
    }

    function make_console_frame(){
        $('body').append("<div id='console_frame'></div>");
        var $console = $("#console_frame");
        $console.css({
            'width': $(document).width(),
            'height': 100,
            'position': 'absolute',
            'left': 0,
            'top': $(document).height()-105,
            'background': '#FFFFFF',
            'border': '#000000 solid 2px',
            'opacity': 0.8
        });
        $console.append("<div style='width:100px;height:100px;position:absolute;left:0px;border:#CCCCCC solid 1px' id='unit_info_frame'></div>");
        $console.append("<div style='width:100px;height:100px;position:absolute;left:100px;border:#CCCCCC solid 1px' id='turn_info_frame'></div>");
    }
    make_console_frame();

    var canvas = document.getElementById("canvas");

    // Check support
    if (!BABYLON.Engine.isSupported()) {
        window.alert('Browser not supported');
    } else {
        // Babylon
        BABYLON.Engine.ShadersRepository = "./shaders/";
        var engine = new BABYLON.Engine(canvas, true);

        //Creating scene (in "scene.js")
        var scene = make_scene(engine);
            // Setup game logic module
        var logic_module = new game_logic(scene);
        var controls;
        logic_module.createMap('textures/map.bmp',function(){
            //Setup controls
            controls = make_controls(scene,canvas);
            controls.addEventCallback('mousedown',logic_module.command,logic_module);
            // Once the scene is loaded, just register a render loop to render it
            engine.runRenderLoop(renderLoop);
        });
        //scene.activeCamera.attachControl(canvas);
        //canvas.removeEventListener(BABYLON.Tools.GetPointerPrefix()+"down", scene.activeCamera._onPointerDown);

        // Resize
        window.addEventListener("resize", function () {
            engine.resize();
        });
    } 
});