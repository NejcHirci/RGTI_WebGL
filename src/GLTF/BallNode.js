import Camera from "../Camera.js";

const vec3 = glMatrix.vec3;

import Node from '../Node.js';
import Utils from "../Utils.js";
import GLTFNode from "./GLTFNode.js";


const objectTypes = {
    WATER: 'water',
    LAND: 'land',
    BALL: 'ball',
    CAMERA: 'camera'
}

export default class BallNode extends GLTFNode {

    constructor(options = {}) {
        super(options);
        Utils.init(this, this.constructor.defaults, options);
        this.baller = true;
        this.worldProperties = {};
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);
        this.keys = {};
        this.jumping = false;
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

    move(dt) {

        const camera = this.children[0];
        let r = camera.rotation[1];

        const forward = vec3.set(vec3.create(),
            -Math.sin(r), 0, -Math.cos(r));


        const right = vec3.set(vec3.create(),
            Math.cos(r), 0, -Math.sin(r));


        const up = vec3.create();
        vec3.cross(up, right, forward);
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
        if (this.keys['Space']) {
            if (!this.jumping) {
                vec3.add(acc, acc, up);
                this.jumping = true;

                setTimeout(() => {
                    this.jumping = false;
                }, 1000)
                vec3.scale(acc, acc, this.jumpAcceleration);
            }
        }

        if(this.isInContactWith([objectTypes.WATER])) {
            if (!this.jumping) {
                vec3.add(acc, acc, up);
                this.jumping = true;

                setTimeout(() => {
                    this.jumping = false;
                }, 400)
                vec3.scale(acc, acc, this.jumpAcceleration);
            }
        }

        // 2: update velocity
        vec3.scaleAndAdd(linearVelocity , linearVelocity , acc, dt * this.acceleration * 0.5);

        if (this.worldProperties.numContacts > 0 && this.isInContactWith([objectTypes.WATER, objectTypes.LAND])) {
            // ce je igralec stisnil kaksen gumb spremeni hitrost zoge
            this.worldProperties.linearVelocity.x = linearVelocity[0];
            this.worldProperties.linearVelocity.y = linearVelocity[1];
            this.worldProperties.linearVelocity.z = linearVelocity[2];
        }

    }

    // prejme string array imen objektov za katere zelimo preveriti collision
    // collidesWithAll nastaviš na true če hočeš da zoga collida z vsemi podanimi objekti
    isInContactWith(names, collidesWithAll = false) {
      let collisionChecked = [];
      let numChecked = 0;
      let numToCheck = names.length;

      if (this.worldProperties !== null) {
          let current = this.worldProperties.contactLink;

          while( current !== null) {
              for(let n in names) {
                  if (current.body.name === names[n]) {
                      if (!collidesWithAll) {
                          return true;
                      } else if(collisionChecked[names[n]] !== true) {
                          collisionChecked[names[n]] = true;
                          numChecked++;
                          if (numChecked === numToCheck) {
                             return true;
                          }
                      }
                  }
              }
              current = current.next;
          }
      }

      return false;
    }

}

BallNode.defaults = {
    velocity         : [0, 0, 0],
    acceleration     : 30,
    jumpAcceleration : 25
};
