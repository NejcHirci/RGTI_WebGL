import Application from './Application.js';

import Renderer from './Renderer.js';
import Physics from './Physics.js';
import Camera from './Camera.js';
import SceneLoader from './SceneLoader.js';
import SceneBuilder from './SceneBuilder.js';
import TerrainGenerator from "./TerrainGenerator.js";
import Light from "./Light.js";
import GLTFLoader from "./GLTF/GLTFLoader.js";
import BallNode from "./GLTF/BallNode.js";
import Model from "./Model.js";

const quat= glMatrix.quat;

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

        this.gltfLoader = new GLTFLoader();

        // load the baller
        await this.gltfLoader.load('../../public/models/baller/chadBaller.gltf');
        const baller = await this.gltfLoader.loadBall(this.gltfLoader.defaultScene);

        const scene = await new SceneLoader().loadScene(uri);
        this.terrainGenerator = new TerrainGenerator(241, 50, 5, 0.2, 2, 20);
        const seed = 82;

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
                this.camera = new Camera();
                this.camera = node;
                quat.fromEuler(this.camera.rotation,this.camera.rotation[0],this.camera.rotation[1],this.camera.rotation[2] );
            }
        });

        // its not a baller anymore :(
        if (baller) {
            this.ball = new BallNode();
            this.ball = baller;
            this.ball.addChild(this.camera);
        }

        this.camera.aspect = this.aspect;
        this.camera.updateProjection();

        //this.camera.addChild(this.ball);

        this.renderer.prepare(this.scene, this.ball);

        this.initOimoPhysics();
    }

    initOimoPhysics(){

        this.world = new OIMO.World({
            timestep: 1/60,
            iterations: 8,
            broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
            worldscale: 1, // scale full world
            random: true,  // randomize sample
            info: false,   // calculate statistic or not
            gravity: [0,-9.8,0]
        });

        let vertices = {};
        this.scene.traverse(node => {
            if (node instanceof Model) {
                vertices = node.mesh.vertices;
            }
        })

        let x, y, z;
        let r = 1;

        // NOT SURE KAKO SE DODA TEREN V OIMO AMPAK V NJIHOVIH EXAMPLIH JE NEKI TAZGA
        for ( var i = 0; i < vertices.length;  i += 9 ) {

            x = vertices[ i ];
            y = vertices[ i+1 ] - r ;
            z = vertices[ i+2 ];

            this.world.add({type:'sphere', size: [r], pos:[x,y,z] })

        }

        if (this.ball) {
            // v worldProperties se belezijo vsi trenutni physicsi o zogi
            this.ball.worldProperties = this.world.add({
                type:'sphere', // type of shape : sphere, box, cylinder
                size:[1.2], // size of shape
                pos:this.ball.translation, // start position in degree
                rot:this.ball.rotation, // start rotation in degree
                move: true, // dynamic or statique
                density: 2,
                friction: 0.8,
                restitution: 0.2,
                belongsTo: 1, // The bits of the collision groups to which the shape belongs.
                collidesWith: 0xffffffff// The bits of the collision groups with which the shape collides.
            });

        }

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
            this.ball.enable();
        } else {
            this.camera.disable();
            this.ball.disable();
        }
    }

    update() {
        const t = this.time = Date.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;



        if(this.world) {
            // premikanje zoge
            this.ball.move(dt, this.world);

            let properties = this.ball.worldProperties;

            this.ball.translation = [(properties.position.x), (properties.position.y), (properties.position.z)];
            this.ball.rotation = [properties.orientation.x,properties.orientation.y,properties.orientation.z, properties.orientation.w];

            this.ball.updateMatrix();

            //TEST
            /*
            let q= this.ball.rotation
            quat.rotateY(q,q,0.07 );
            this.ball.rotation = q;
            this.ball.updateMatrix();
            */
        }

        if (this.camera) {
            this.camera.update(dt);
            this.camera.updateTransformQuat();
        }



    }

    render() {
        if (this.scene && this.ball) {
            this.renderer.render(this.scene, this.camera, this.light, this.ball);
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
    gui.add(app, 'enableCamera');
});
