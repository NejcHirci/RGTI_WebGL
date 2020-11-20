import Utils from './Utils.js';
import Node from './Node.js';
import BallNode from "./GLTF/BallNode.js";

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
        this.offset = [0, 3, 5];

    }

    updateProjection() {
        mat4.perspective(this.projection, this.fov, this.aspect, this.near, this.far);
    }
    addBallTranslation(){

    }

    update(dt) {

    }

    poglejZogo() {
        // kamera spremlja zogo
        const ball = this.parent;


        let direction = [
            ball.translation[0] - this.translation[0],
            ball.translation[1] - this.translation[1],
            ball.translation[2] - this.translation[2]
        ];

        let right = [];
        vec3.cross(right, direction,[0,1,0]);

        let left = [];
        vec3.cross(left, [0,1,0], direction);

        let up = [];
        vec3.cross(up, right, direction);

        let transform = mat4.create();
        mat4.targetTo(transform, this.translation, ball.translation, up);

        let q = [];
        mat4.getRotation(q, transform);
        //q = this.toEulerAngles(q);

        this.rotation = q;

        this.right = mat3.normalize([],right);
        this.left = mat3.normalize([],left);
    }

    toEulerAngles(quat) {
        let angles = [];
        let q = {};
        q.x = quat[0];
        q.y = quat[1];
        q.z = quat[2];
        q.w = quat[3];


        // roll (x-axis rotation)
        let sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
        let cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
        angles[0] = Math.atan2(sinr_cosp, cosr_cosp);

        // pitch (y-axis rotation)
        let sinp = 2 * (q.w * q.y - q.z * q.x);
        if (Math.abs(sinp) >= 1){
            if(sinp > 0) {
                angles[1] = Math.PI / 2// use 90 degrees if out of range
            } else {
                angles[1] = - (Math.PI / 2) // use 90 degrees if out of range
            }

        } else {
            angles[1] = Math.asin(sinp);
        }

        // yaw (z-axis rotation)
        let siny_cosp = 2 * (q.w * q.z + q.x * q.y);
        let cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);

        angles[2] = Math.atan2(siny_cosp, cosy_cosp);
        //console.log([angles[0] * 180 / Math.PI, angles[1] * 180 / Math.PI, angles[2] * 180 / Math.PI]);
        return angles;
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

    mousemoveHandler(e) {

           // TODO: naredi nestacionarno rotiranje okoli zoge

        const dy = e.movementY;

        if (dy !== NaN) {

            let s = 0.07;
            let angle = 0.000001;
            let radius = 3;

            let rotation = quat.create();


            quat.rotateY(rotation, this.rotation, angle);

            let r = quat.getAxisAngle([0,1,0], rotation);

            const forward = vec3.set(vec3.create(),
                -Math.sin(r), 0, -Math.cos(r));

            console.log(r);

            mat3.scale(forward, forward, radius);


            vec3.sub(this.offset, [0,this.offset[1],0], forward);

            this.translation = [
                this.parent.translation[0] + this.offset[0],
                this.parent.translation[1] + this.offset[1],
                this.parent.translation[2] + this.offset[2]
            ];

            //this.move(dt);
            this.poglejZogo();



           //this.poglejZogo();

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
