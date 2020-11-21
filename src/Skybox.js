import Node from './Node.js';
import Utils from "./Utils.js";

export default class Skybox extends Node {

    constructor(gl, options) {
        super(options);
        Utils.init(this, this.constructor.defaults, options);
        this.gl = gl;
        this.loadImages();
        console.log(this);
    }

    async loadImages() {
        const gl = this.gl;
        let textures = this.cubemap.map(img => this.loadImage(img));
        let images = await Promise.all(textures);

        this.cubemap = [
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                img: images[0]
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                img: images[1]
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                img: images[2]
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                img: images[3]
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                img: images[4]
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
                img: images[5]
            }
        ]
        console.log(this.cubemap);
    }

    loadImage(uri) {
        return new Promise((resolve, reject) => {
            let image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', reject);
            image.src = uri;
        });
    }
}


Skybox.defaults = {
    vertices: [],
    cubemap: ["../public/images/sky.jpg", "../public/images/sky.jpg", "../public/images/sky.jpg",
        "../public/images/sky.jpg", "../public/images/sky.jpg", "../public/images/sky.jpg"]
};