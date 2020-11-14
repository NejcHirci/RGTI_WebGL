import Application from './Application.js';

import Renderer from './Renderer.js';
import Physics from './Physics.js';
import Camera from './Camera.js';
import SceneLoader from './SceneLoader.js';
import SceneBuilder from './SceneBuilder.js';
import TerrainGenerator from "./TerrainGenerator.js";
import Light from "./Light.js";

class App extends Application {

    start() {
        const gl = this.gl;

        this.renderer = new Renderer(gl);
        this.time = Date.now();
        this.startTime = this.time;
        this.aspect = 1;
        this.light = new Light();

        this.pointerlockchangeHandler = this.pointerlockchangeHandler.bind(this);
        document.addEventListener('pointerlockchange', this.pointerlockchangeHandler);

        this.load('./src/scene.json');
    }

    async load(uri) {
        const scene = await new SceneLoader().loadScene(uri);
        this.terrainGenerator = new TerrainGenerator(241, 60, 5, 0.2, 2, 20);
        const seed = 42;

        const heightMap = this.terrainGenerator.generateNoiseMap(seed);
        scene.meshes.push(this.terrainGenerator.generateMesh(heightMap));
        scene.textures.push(this.terrainGenerator.generateTexture(heightMap));

        const builder = new SceneBuilder(scene);
        this.scene = builder.build();
        this.physics = new Physics(this.scene);

        // Find first camera.
        this.camera = null;
        this.scene.traverse(node => {
            if (node instanceof Camera) {
                this.camera = node;
            }
        });

        this.camera.aspect = this.aspect;
        this.camera.updateProjection();
        this.renderer.prepare(this.scene);
    }

    enableCamera() {
        this.canvas.requestPointerLock();
    }

    pointerlockchangeHandler() {
        if (!this.camera) {
            return;
        }

        if (document.pointerLockElement === this.canvas) {
            this.camera.enable();
        } else {
            this.camera.disable();
        }
    }

    update() {
        const t = this.time = Date.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;

        if (this.camera) {
            this.camera.update(dt);
        }

        if (this.physics) {
            this.physics.update(dt);
        }
    }

    render() {
        if (this.scene) {
            this.renderer.render(this.scene, this.camera, this.light);
        }
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        this.aspect = w / h;
        if (this.camera) {
            this.camera.aspect = this.aspect;
            this.camera.updateProjection();
        }
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
    const gui = new dat.GUI();
    gui.addColor(app.light, 'ambientColor');
    gui.addColor(app.light, 'diffuseColor');
    gui.addColor(app.light, 'specularColor');
    gui.add(app.light, 'shininess', 0.0, 1000.0);
    for (let i = 0; i < 3; i++) {
        gui.add(app.light.position, i, -50.0, 50.0).name('position.' + String.fromCharCode('x'.charCodeAt(0) + i));
    }
    gui.add(app, 'enableCamera');
});
