import Model from "./Model.js";

const mat4 = glMatrix.mat4;

export default class Skybox extends Model {

    constructor(images, options) {
        super(null, images, options);

        this.positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1
        ]);
    }

    getInverse(viewMatrix, projectionMatrix) {
        viewMatrix[12] = 0; viewMatrix[13] = 0; viewMatrix[14] = 0;
        let viewDirectionProjectionMatrix = mat4.mul([], projectionMatrix, viewMatrix);

        return mat4.invert([], viewDirectionProjectionMatrix);
    }
}