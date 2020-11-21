import Application from './Application.js';

import Renderer from './Renderer.js';
import Camera from './Camera.js';
import SceneLoader from './SceneLoader.js';
import SceneBuilder from './SceneBuilder.js';
import Light from './Light.js';
import GLTFLoader from './GLTF/GLTFLoader.js';
import BallNode from './GLTF/BallNode.js';
import LevelGenerator from './LevelGenerator.js';



const vec3 = glMatrix.vec3;
const quat = glMatrix.quat;
const mat3= glMatrix.mat3;

const objectTypes = {
    WATER: 'water',
    LAND: 'land',
    BALL: 'ball',
    CAMERA: 'camera'
}

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
        const builder = new SceneBuilder(scene);
        this.scene = builder.build();

        this.levelGenerator = new LevelGenerator(82, this.scene);
        this.levelGenerator.next();

        // Find first camera.
        this.camera = null;
        this.scene.traverse(node => {
            if (node instanceof Camera) {
                this.camera = new Camera(node);
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

        this.renderer.prepare(this.scene, this.ball);

        this.initPhysics();
    }



    initPhysics(){

        // Create physics world
        this.world = new OIMO.World({
            timestep: 1/60,
            iterations: 8,
            broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
            worldscale: 1, // scale full world
            random: true,  // randomize sample
            info: false,   // calculate statistic or not
            gravity: [0,-9.8,0]
        });

        // Create sphere collison for terrain
        let x,y,z;
        let r = 0.05;
        let terrainMesh = this.levelGenerator.levelNode.mesh;
        console.log(this.levelGenerator);
        for ( let i = 0; i < terrainMesh.vertices.length;  i += 3 ) {

            if (terrainMesh.vertices[ i+1 ] > 0.75) {

                x = terrainMesh.vertices[ i ];
                y = terrainMesh.vertices[ i+1 ] - r;
                z = terrainMesh.vertices[ i+2 ];

                /*let n = vec3.fromValues(terrainMesh.normals[i], terrainMesh.normals[i+1], terrainMesh.normals[i+2])
                let l = vec3.create();
                vec3.cross(l, n,[0,1,0])

                let k = vec3.create();
                vec3.cross(k, l, n);

                let ex = Math.atan2(n[2],l[2]);
                let ey = Math.atan2(-k[2],Math.sqrt(Math.pow(k[2],2) + Math.pow(l[2],2)));
                let ez = Math.atan2(k[1],k[0]);
                let q = quat.create();
                quat.fromEuler(q,ex,ey,ez);
                */
                /*
                let ex = Math.atan2(n[2],l[2]);
                let ey = Math.atan2(-k[2],Math.sqrt(Math.pow(k[2],2) + Math.pow(l[2],2)));
                let ez = Math.atan2(k[1],k[0]);
                let q = quat.create();
                quat.fromEuler(q,ex,ey,ez); */

                let sphere =this.world.add({
                    type:'sphere',
                    size:[r],
                    pos:[x,y,z],
                    name: objectTypes.LAND
                })

            }
        }
        // add plane ust under water
        if (this.levelGenerator.terrainGen) {

            const size = this.levelGenerator.terrainGen.mapSize;

            let x = this.world.add({type:'box', size:[size, 1 , size], pos:[0,-1.4,0], move:false, name: objectTypes.WATER});
            console.log(x);
        } else {
            Error.log("Terrain generator missing!");
        }

        if (this.ball) {
            // v worldProperties se belezijo vsi trenutni physicsi o zogi
            this.ball.worldProperties = this.world.add({
                type:'sphere', // type of shape : sphere, box, cylinder
                size:[0.95], // size of shape
                pos:this.ball.translation, // start position in degree
                rot:this.ball.rotation, // start rotation in degree
                move: true, // dynamic or statique
                density: 1,
                friction: 0.8,
                restitution: 0.2,
                collidesWith: 0xffffffff,// The bits of the collision groups with which the shape collides.
                name: objectTypes.BALL
            });
        }

        if (this.camera) {
            // v worldProperties se belezijo vsi trenutni physicsi o zogi
            this.camera.worldProperties = this.world.add({
                type:'sphere', // type of shape : sphere, box, cylinder
                size:[1.2], // size of shape
                pos:this.ball.translation, // start position in degree
                rot:this.ball.rotation, // start rotation in degree
                move: false, // dynamic or statique
                density: 2,
                friction: 0.8,
                restitution: 0.2,
                collidesWith: 0xffffffff,// The bits of the collision groups with which the shape collides.
                name: objectTypes.CAMERA
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
            this.ball.move(dt, this.world);

            let properties = this.ball.worldProperties;
            console.log(properties);

            this.ball.translation = [(properties.position.x), (properties.position.y), (properties.position.z)];
            this.ball.rotation = [properties.orientation.x,properties.orientation.y,properties.orientation.z, properties.orientation.w];

            this.ball.updateMatrix();
        }

        if (this.camera) {
            this.camera.updateTransform();
            //console.log(this.camera.worldProperties);
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
