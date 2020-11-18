import Utils from './Utils.js';
import Node from './Node.js';
import BallNode from "./GLTF/BallNode.js";

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const mat3 = glMatrix.vec3;

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
        this.ballTranslation = [5, 1, 5];
        this.stationaryRotate= false;
    }

    updateProjection() {
        mat4.perspective(this.projection, this.fov, this.aspect, this.near, this.far);
    }

    update(dt) {


        // tole premakne kamero k zogi
        this.translation = [
            this.parent.translation[0] + this.ballTranslation[0],
            this.parent.translation[1] +this.ballTranslation[1],
            this.parent.translation[2] + this.ballTranslation[2]
        ];

        // kamera spremlja zogo
        if (!this.stationaryRotate) {
            const ball = this.parent;

            let transform = mat4.create();

            mat4.targetTo(transform, this.translation, ball.translation, [0, 1, 0]);

            let q = [];
            mat4.getRotation(q, transform);

            this.rotation = q;
            // ce odkometiras pol zakometiri pri zogi !!!
            //this.move(dt);
        }
    }

    move(dt) {
        const c = this;

        const forward = vec3.set(vec3.create(),
            -Math.sin(c.rotation[1]), 0, -Math.cos(c.rotation[1]));


        const right = vec3.set(vec3.create(),
            Math.cos(c.rotation[1]), 0, -Math.sin(c.rotation[1]));

        const up = vec3.create();
        vec3.cross(up, forward, right);
        vec3.normalize(up, up);

        // 1: add movement acceleration
        let acc = vec3.create();
        if (this.keys['KeyW']) {
            vec3.add(acc, acc, forward);
        }
        if (this.keys['KeyS']) {
            vec3.sub(acc, acc, forward);
        }
        if (this.keys['KeyD']) {
            vec3.add(acc, acc, right);
        }
        if (this.keys['KeyA']) {
            vec3.sub(acc, acc, right);
        }
        if (this.keys['KeyQ']) {
            vec3.add(acc, acc, up);
        }
        if (this.keys['KeyE']) {
            vec3.sub(acc, acc, up);
        }

        // 2: update velocity
        vec3.scaleAndAdd(c.velocity, c.velocity, acc, dt * c.acceleration);

        // 3: if no movement, apply friction
        if (!this.keys['KeyW'] &&
            !this.keys['KeyS'] &&
            !this.keys['KeyD'] &&
            !this.keys['KeyA'] &&
            !this.keys['KeyQ'] &&
            !this.keys['KeyE'])
        {
            vec3.scale(c.velocity, c.velocity, 1 - c.friction);
        }

        // 4: limit speed
        const len = vec3.len(c.velocity);
        if (len > c.maxSpeed) {
            vec3.scale(c.velocity, c.velocity, c.maxSpeed / len);
        }


        vec3.scaleAndAdd(this.translation, this.translation, this.velocity, dt);
    }

    enable() {
        // ce vklopis kamera ne sledi vec zogi
        this.stationaryRotate = true;
        document.addEventListener('mousemove', this.mousemoveHandler);
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
    }

    disable() {
        this.stationaryRotate = false;
        document.removeEventListener('mousemove', this.mousemoveHandler);
        document.removeEventListener('keydown', this.keydownHandler);
        document.removeEventListener('keyup', this.keyupHandler);

        for (let key in this.keys) {
            this.keys[key] = false;
        }
    }

    mousemoveHandler(e) {

        // TODO: ko igralec drzi alt se stationary rotate nastavi na true
       if (this.stationaryRotate) {
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
       } else {

           // TODO: naredi nestacionarno rotiranje okoli zoge


       }

    }

    rotate(e){
        //const dx = e.movementX;
        const dy = e.movementY;

        this.rotation[0] -= dy * this.mouseSensitivity;
        //this.rotation[1] -= dx * this.mouseSensitivity;

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
    mouseSensitivity : 0.004,
    maxSpeed         : 10,
    friction         : 0.2,
    acceleration     : 20
};
