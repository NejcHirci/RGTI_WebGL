import * as WebGL from './WebGL.js';
import shaders from './shaders.js';
import BallNode from './GLTF/BallNode.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;

export default class Renderer {

    constructor(gl) {
        this.gl = gl;
        this.glObjects = new Map();
        this.programs = WebGL.buildPrograms(gl, shaders);

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.defaultTexture = WebGL.createTexture(gl, {
            width  : 1,
            height : 1,
            data   : new Uint8Array([255, 255, 255, 255])
        });
        this.defaultSampler = WebGL.createSampler(gl, {
            mag:gl.NEAREST,
            min:gl.NEAREST,
            wrapS:gl.CLAMP_TO_EDGE,
            wrapT:gl.CLAMP_TO_EDGE
        });
    }

    prepare(scene, gltfScene, skybox) {
        scene.nodes.forEach(node => {
            node.gl = {};
            if (node.mesh) {
                Object.assign(node.gl, this.createModel(node.mesh));
            }
            if (node.image) {
                node.gl.texture = this.createTexture(node.image);
            }
        });

        gltfScene.nodes.forEach( node => {
            if (node.mesh) {
                this.prepareMesh(node.mesh);
            }
        });

        if (skybox) {
            this.prepareSkybox(skybox);
        }

    }

    /***
     *
     * GLTF metode START
     *
    ***/
    prepareMesh(mesh) {
        for (const primitive of mesh.primitives) {
            this.preparePrimitive(primitive);
        }
    }

    preparePrimitive(primitive) {
        if (this.glObjects.has(primitive)) {
            return this.glObjects.get(primitive);
        }

        this.prepareMaterial(primitive.material);

        const gl = this.gl;
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        if (primitive.indices) {
            const bufferView = primitive.indices.bufferView;
            bufferView.target = gl.ELEMENT_ARRAY_BUFFER;
            const buffer = this.prepareBufferView(bufferView);
            gl.bindBuffer(bufferView.target, buffer);
        }

        // this is an application-scoped convention, matching the shader
        const attributeNameToIndexMap = {
            POSITION   : 0,
            TEXCOORD_0 : 1,
        };

        for (const name in primitive.attributes) {
            const accessor = primitive.attributes[name];
            const bufferView = accessor.bufferView;
            const attributeIndex = attributeNameToIndexMap[name];

            if (attributeIndex !== undefined) {
                bufferView.target = gl.ARRAY_BUFFER;
                const buffer = this.prepareBufferView(bufferView);
                gl.bindBuffer(bufferView.target, buffer);
                gl.enableVertexAttribArray(attributeIndex);
                gl.vertexAttribPointer(
                    attributeIndex,
                    accessor.numComponents,
                    accessor.componentType,
                    accessor.normalized,
                    bufferView.byteStride,
                    accessor.byteOffset);
            }
        }

        this.glObjects.set(primitive, vao);
        return vao;
    }

    prepareBufferView(bufferView) {
        if (this.glObjects.has(bufferView)) {
            return this.glObjects.get(bufferView);
        }
        const buffer = new DataView(
            bufferView.buffer,
            bufferView.byteOffset,
            bufferView.byteLength);
        const glBuffer = WebGL.createBuffer(this.gl, {
            target : bufferView.target,
            data   : buffer
        });
        this.glObjects.set(bufferView, glBuffer);
        return glBuffer;
    }

    prepareMaterial(material) {
        if (material.baseColorTexture) {
            this.prepareTexture(material.baseColorTexture);
        }
        if (material.metallicRoughnessTexture) {
            this.prepareTexture(material.metallicRoughnessTexture);
        }
        if (material.normalTexture) {
            this.prepareTexture(material.normalTexture);
        }
        if (material.occlusionTexture) {
            this.prepareTexture(material.occlusionTexture);
        }
        if (material.emissiveTexture) {
            this.prepareTexture(material.emissiveTexture);
        }
    }

    prepareTexture(texture) {
        const gl = this.gl;

        this.prepareSampler(texture.sampler);
        const glTexture = this.prepareImage(texture.image);

        const mipmapModes = [
            gl.NEAREST_MIPMAP_NEAREST,
            gl.NEAREST_MIPMAP_LINEAR,
            gl.LINEAR_MIPMAP_NEAREST,
            gl.LINEAR_MIPMAP_LINEAR,
        ];

        if (!texture.hasMipmaps && mipmapModes.includes(texture.sampler.min)) {
            gl.bindTexture(gl.TEXTURE_2D, glTexture);
            gl.generateMipmap(gl.TEXTURE_2D);
            texture.hasMipmaps = true;
        }
    }

    prepareSampler(sampler) {
        if (this.glObjects.has(sampler)) {
            return this.glObjects.get(sampler);
        }

        const glSampler = WebGL.createSampler(this.gl, sampler);
        this.glObjects.set(sampler, glSampler);
        return glSampler;
    }

    prepareImage(image) {
        if (this.glObjects.has(image)) {
            return this.glObjects.get(image);
        }

        const glTexture = WebGL.createTexture(this.gl, { image });
        this.glObjects.set(image, glTexture);
        return glTexture;
    }

    /***
     *
     * GLTF metode END
     *
     ***/

    /***
    SKYBOX
     ***/
    prepareSkybox(skybox) {
        const gl = this.gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, skybox.vertices, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        let texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        skybox.cubemap.forEach((face) => {
            const {target, img} = face;
            gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        });
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

        skybox.gl.vao = vao;
        skybox.gl.texture = texture;
    }

    render(scene, camera, light, gltfScene, skybox) {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let program = this.programs.simple;
        gl.useProgram(program.program);

        let matrix = mat4.create();
        let matrixStack = [];

        let viewMatrix = mat4.invert(mat4.create(), camera.getGlobalTransform());
        mat4.copy(matrix, viewMatrix);
        gl.uniformMatrix4fv(program.uniforms.uProjection, false, camera.projection);


        let color = vec3.clone(light.ambientColor);
        vec3.scale(color, color, 1.0 / 255.0);
        gl.uniform3fv(program.uniforms.uAmbientColor, color);
        color = vec3.clone(light.diffuseColor);
        vec3.scale(color, color, 1.0 / 255.0);
        gl.uniform3fv(program.uniforms.uDiffuseColor, color);
        color = vec3.clone(light.specularColor);
        vec3.scale(color, color, 1.0 / 255.0);
        gl.uniform3fv(program.uniforms.uSpecularColor, color);
        gl.uniform1f(program.uniforms.uShininess, light.shininess);
        gl.uniform3fv(program.uniforms.uLightPosition, light.position);
        gl.uniform3fv(program.uniforms.uLightAttenuation, light.attenuatuion);

        scene.traverse(
            node => {

                matrixStack.push(mat4.clone(matrix));
                mat4.mul(matrix, matrix, node.transform);
                if (node.gl.vao) {
                    gl.bindVertexArray(node.gl.vao);
                    gl.uniformMatrix4fv(program.uniforms.uViewModel, false, matrix);
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, node.gl.texture);
                    gl.bindSampler(0, this.defaultSampler);
                    gl.uniform1i(program.uniforms.uTexture, 0);
                    gl.drawElements(gl.TRIANGLES, node.gl.indices, gl.UNSIGNED_SHORT, 0);
                }


            },
            node => {
                    matrix = matrixStack.pop();
            }
        );

        program = this.programs.gltf;
        gl.useProgram(program.program);

        gltfScene.nodes.forEach( node => {
            if (node instanceof BallNode){
                gl.uniformMatrix4fv(program.uniforms.uProjection, false, camera.projection);
                gl.uniform1i(program.uniforms.uTexture, 0);
                this.renderBallNode(node, matrix, program );
            } else {
                this.renderNode(node, matrix, program);
            }
        });

        //RENDER SKYBOX
        program = this.programs.skybox;
        gl.useProgram(program.program);
        let viewSky = mat4.copy([], viewMatrix);
        viewSky[12] = 0; viewSky[13] = 0; viewSky[14] = 0;
        let viewDirProjMat = mat4.mul([], camera.projection, viewSky);
        let viewDirProjInv = mat4.invert([], viewDirProjMat);

        gl.bindVertexArray(skybox.gl.vao);
        gl.uniformMatrix4fv(program.uniforms.uViewMat, false, viewDirProjInv);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, skybox.gl.texture);
        gl.bindSampler(0, this.defaultSampler);
        gl.uniform1i(program.uniforms.uSkybox, 0);
        gl.depthFunc(gl.LEQUAL);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    renderBallNode(node, mvpMatrix, program) {
        const gl = this.gl;

        mvpMatrix = mat4.clone(mvpMatrix);
        mat4.mul(mvpMatrix, mvpMatrix, node.matrix);

        if (node.mesh) {
            gl.uniformMatrix4fv(program.uniforms.uViewModel, false, mvpMatrix);
            for (const primitive of node.mesh.primitives) {
                this.renderPrimitive(primitive);
            }
        }


    }

    renderNode(node, mvpMatrix, program) {
        const gl = this.gl;

        mvpMatrix = mat4.clone(mvpMatrix);
        mat4.mul(mvpMatrix, mvpMatrix, node.matrix);

        if (node.mesh) {
            gl.uniformMatrix4fv(program.uniforms.uViewModel, false, mvpMatrix);
            for (const primitive of node.mesh.primitives) {
                this.renderPrimitive(primitive);
            }
        }

        for (const child of node.children) {
            this.renderNode(child, mvpMatrix);
        }
    }

    renderPrimitive(primitive) {
        const gl = this.gl;

        const vao = this.glObjects.get(primitive);
        const material = primitive.material ? primitive.material : null;
        const texture = material ? material.baseColorTexture : null;
        if(texture) {
            const glTexture = this.glObjects.get(texture.image);
            const glSampler = this.glObjects.get(texture.sampler);
            gl.bindVertexArray(vao);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, glTexture);
            gl.bindSampler(0, glSampler);
        }

        if (primitive.indices) {
            gl.drawElements(primitive.mode, primitive.indices.count, primitive.indices.componentType, 0);
        } else {
            const mode = primitive.mode;
            const count = primitive.attributes.POSITION.count;
            gl.drawArrays(mode, 0, count);
        }
    }

    createModel(model) {
        const gl = this.gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.texcoords), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.normals), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

        const indices = model.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);

        return { vao, indices };
    }

    createTexture(texture) {
        const gl = this.gl;
        if (texture instanceof Image) {
            return WebGL.createTexture(gl, {
                image: texture,
                min: gl.NEAREST,
                mag: gl.NEAREST
            });
        } else {
            return WebGL.createTexture(gl, {
                data: texture.data,
                width: texture.width,
                height: texture.height,
                min: gl.NEAREST,
                mag: gl.NEAREST
            });
        }
    }

}
