import Utils from './Utils.js';
import Node from './Node.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const mat3 = glMatrix.vec3;
const quat = glMatrix.quat;

export default class Camera extends Node {

    constructor(options) {
        super(options);
        Utils.init(this, this.constructor.defaults, options);

        this.projection = mat4.create();
        this.updateProjection();
        this.mousemoveHandler = this.mousemoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);
        this.keys = {};
    }

    updateProjection() {
        mat4.perspective(this.projection, this.fov, this.aspect, this.near, this.far);
    }

    enable() {
        document.addEventListener('mousemove', this.mousemoveHandler);
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
    }

    disable() {
        document.removeEventListener('mousemove', this.mousemoveHandler);
        document.removeEventListener('keydown', this.keydownHandler);
        document.removeEventListener('keyup', this.keyupHandler);

        for (let key in this.keys) {
            this.keys[key] = false;
        }
    }

     updateTransform() {
        const t = this.transform
        const degrees = this.rotation.map(x => x * 180 / Math.PI);
        const q1 = quat.fromEuler(quat.create(), ...degrees);
        const lookRot = mat4.fromQuat(mat4.create(), q1);

        const v = vec3.clone(this.translation);
        const tCam = mat4.fromTranslation(mat4.create(), v);

        mat4.mul(t, lookRot, tCam);
    }

    getGlobalTransform() {
        const v = vec3.clone(this.parent.translation);
        const tBall = mat4.fromTranslation(mat4.create(), v);
        const t = mat4.clone(this.transform);

        const out = mat4.mul(t, tBall, t);

        /*if (this.worldProperties != null) {
            let pos = mat3.create();
             mat4.getTranslation(pos, out);
            console.log(this.worldProperties.position);
            console.log("COLLIDES:",this.worldProperties.numContacts);

            this.worldProperties.position = {
               x: pos[0],
               y: pos[1],
               z: pos[2]
            }
        }*/
        return out;
    }

    mousemoveHandler(e) {
        this.rotate(e);
    }

    rotate(e){

        const dx = e.movementX;
        const dy = e.movementY;

        this.rotation[0] -= dy * this.mouseSensitivity;
        this.rotation[1] -= dx * this.mouseSensitivity;

        const pi = Math.PI;
        const twopi = pi * 2;
        const halfpi = pi / 2;

        if (this.rotation[0] > halfpi) {
            this.rotation[0] = halfpi;
        }
        if (this.rotation[0] < -halfpi) {
            this.rotation[0] = -halfpi;
        }

        this.rotation[1] = ((this.rotation[1] % twopi) + twopi) % twopi;

    }

    keydownHandler(e) {
        this.keys[e.code] = true;
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }

}

Camera.defaults = {
    aspect           : 1,
    fov              : 1.5,
    near             : 0.01,
    far              : 100,
    velocity         : [0, 0, 0],
    mouseSensitivity : 0.002,
    maxSpeed         : 10,
    friction         : 0.2,
    acceleration     : 20
};
