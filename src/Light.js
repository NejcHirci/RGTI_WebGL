import Node from './Node.js';
import Utils from "./Utils.js";

export default class Light extends Node {

    constructor(options) {
        super(options);
        Utils.init(this, this.constructor.defaults, options);
    }
}


Light.defaults = {
    position         : [50, 50, 50],
    ambientColor     : [51, 51, 51],
    diffuseColor     : [204, 204, 204],
    specularColor    : [255, 255, 255],
    shininess        : 10,
    attenuatuion     : [1.0, 0, 0.02]
};