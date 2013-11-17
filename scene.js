'use strict';
define(['babylon','underscore','Grid','utils'], function (BABYLON,_,Grid,Utils) {
    return function (engine) {
// Creation
        var scene = new BABYLON.Scene(engine);
// Lights

// Camera
        //var camera = new BABYLON.Camera("Camera", BABYLON.Vector3.FromArray([5,600,5]), scene);
        var camera = new BABYLON.ArcRotateCamera("Camera",0,Math.PI/4,150,new BABYLON.Vector3(0,0,0), scene);
        var light = new BABYLON.DirectionalLight('scene_light',new BABYLON.Vector3(0.0,-10,0.0),scene);
        return scene;
    };
});