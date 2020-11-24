import Node from './Node.js';
import Utils from "./Utils.js";

export default class Light extends Node {

    constructor(options) {
        super(options);
        Utils.init(this, this.constructor.defaults, options);
    }
}


Light.defaults = {
    position         : [-2000, 2000, -2000],
    ambientColor     : [100, 100, 100],
    diffuseColor     : [204, 204, 204],
    specularColor    : [255, 255, 255],
    shininess        : 10,
    attenuatuion     : [1.0, 0, 0.02]
};
