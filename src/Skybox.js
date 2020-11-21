import Node from './Node.js';
import Utils from "./Utils.js";

export default class Skybox extends Node {

    constructor(options) {
        super(options);
        Utils.init(this, this.constructor.defaults, options);
    }
}


Skybox.defaults = {
    positions: [
        -1, -1,
        1, -1,
        -1,  1,
        -1,  1,
        1, -1,
        1,  1,
    ],
    cubemap: [
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            image: "",
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            image: ""
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            image: ""
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            image: ""
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            image: ""
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            image: ""
        }

    ]
};