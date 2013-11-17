/**
 * User: Austen
 * Date: 10/19/13
 * Time: 9:53 PM
 */
'use strict';
define([], function () {
    var Utils = {
        /* Utility functions to lock and restore object properties */
        save: function(obj,props){
            obj._savedProperties = {};
            for(var i=1;i<arguments.length;i++){
                var currentPropertyValue = obj[arguments[i]];
                if(_.isObject(currentPropertyValue)){
                    obj._savedProperties[arguments[i]]=currentPropertyValue.clone(currentPropertyValue.name);
                }else{
                    obj._savedProperties[arguments[i]]=currentPropertyValue;
                }
            }
        },
        restore: function(obj){
            if(!_.has(obj,'_savedProperties'))
                return;
            var savedPropertyNames = _.keys(obj._savedProperties);
            var savedPropertyName,savedPropertyValue;
            for(var i=0;i<savedPropertyNames.length;i++){
                savedPropertyName = savedPropertyNames[i];
                savedPropertyValue = obj._savedProperties[savedPropertyName];
                obj[savedPropertyName] = savedPropertyValue;
            }
        },
        getPixelData: function(img){
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img,0,0);
            return ctx.getImageData(0,0,img.width,img.height);
        }
    }
    return Utils;
});