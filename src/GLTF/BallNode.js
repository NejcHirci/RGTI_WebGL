import Camera from "../Camera.js";

const vec3 = glMatrix.vec3;
const mat4 = glMatrix.mat4;
const quat = glMatrix.quat;
import Node from '../Node.js';
import Utils from "../Utils.js";

export default class BallNode {

    constructor(options = {}) {

        Utils.init(this, this.constructor.defaults, options);

        this.translation = options.translation
            ? vec3.clone(options.translation)
            : vec3.fromValues(0, 0, 0);
        this.rotation = options.rotation
            ? quat.clone(options.rotation)
            : quat.fromValues(0, 0, 0, 1);
        this.scale = options.scale
            ? vec3.clone(options.scale)
            : vec3.fromValues(1, 1, 1);
        this.matrix = options.matrix
            ? mat4.clone(options.matrix)
            : mat4.create();

        if (options.matrix) {
            this.updateTransform();
        } else if (options.translation || options.rotation || options.scale) {
            this.updateMatrix();
        }

        this.camera = options.camera || null;
        this.baller = true;
        this.mesh = options.mesh || null;

        this.children = [...(options.children || [])];
        for (const child of this.children) {
            child.parent = this;
        }
        this.parent = null;

        this.worldProperties = {};

        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);
        this.keys = {};
    }

    updateTransform() {
        mat4.getRotation(this.rotation, this.matrix);
        mat4.getTranslation(this.translation, this.matrix);
        mat4.getScaling(this.scale, this.matrix);
    }

    updateMatrix() {
        mat4.fromRotationTranslationScale(
            this.matrix,
            this.rotation,
            this.translation,
            this.scale);
    }

    addChild(node) {
        this.children.push(node);
        node.parent = this;
    }

    removeChild(node) {
        const index = this.children.indexOf(node);
        if (index >= 0) {
            this.children.splice(index, 1);
            node.parent = null;
        }
    }

    clone() {
        return new Node({
            ...this,
            children: this.children.map(child => child.clone()),
        });
    }

    traverse(before, after) {
        before && before(this);
        for (let child of this.children) {
            child.traverse(before, after);
        }
        after && after(this);
    }

    enable() {
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
    }

    disable() {
        document.removeEventListener('keydown', this.keydownHandler);
        document.removeEventListener('keyup', this.keyupHandler);
        for (let key in this.keys) {
            this.keys[key] = false;
        }
    }

    keydownHandler(e) {
        this.keys[e.code] = true;
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }

    move(dt, oimo_world) {

        const c = this;

        const forward = vec3.set(vec3.create(),
            -Math.sin(c.rotation[1]), 0, -Math.cos(c.rotation[1]));


        const right = vec3.set(vec3.create(),
            Math.cos(c.rotation[1]), 0, -Math.sin(c.rotation[1]));

        const up = vec3.create();
        vec3.cross(up, forward, right);
        vec3.normalize(up, up);

        const linearVelocity = [
            this.worldProperties.linearVelocity.x,
            this.worldProperties.linearVelocity.y,
            this.worldProperties.linearVelocity.z
        ];

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
        vec3.scaleAndAdd(linearVelocity , linearVelocity , acc, dt * this.acceleration * 0.5);

        // ce je igralec stisnil kaksen gumb spremeni hitrost zoge
        this.worldProperties.linearVelocity.x = linearVelocity[0];
        this.worldProperties.linearVelocity.y = linearVelocity[1];
        this.worldProperties.linearVelocity.z = linearVelocity[2];

        // preracuna pozicije zoge v naslednjem koraku
        oimo_world.step();
    }

}

BallNode.defaults = {
    velocity         : [0, 0, 0],
    acceleration     : 20
};
