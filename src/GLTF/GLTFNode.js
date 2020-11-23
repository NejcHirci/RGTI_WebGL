
const vec3 = glMatrix.vec3;
const mat4 = glMatrix.mat4;
const quat = glMatrix.quat;

export default class GLTFNode {

    constructor(options = {}) {

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
        this.name = options.name;

        if (options.matrix) {
            this.updateTransform();
        } else if (options.translation || options.rotation || options.scale) {
            this.updateMatrix();
        }

        this.camera = options.camera || null;
        this.mesh = options.mesh || null;

        this.children = [...(options.children || [])];
        for (const child of this.children) {
            child.parent = this;
        }
        this.parent = null;
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

    relocate(obstacleHandler = null) {
        if (this.name === 'spikey' && obstacleHandler != null) {
            let newPos = obstacleHandler.getNewSpikyBallPosition();
            let properties = this.worldProperties;
            properties.position.x = newPos[0];
            properties.position.y = newPos[1];
            properties.position.z = newPos[2];
            this.translation = [(properties.position.x), (properties.position.y), (properties.position.z)];
            this.rotation = [properties.orientation.x,properties.orientation.y,properties.orientation.z, properties.orientation.w];
            this.updateMatrix();
            this.respawning = false
        }
    }

    clone() {
        return new GLTFNode({
            ...this,
            children: this.children.map(child => child.clone()),
        });
    }
}




