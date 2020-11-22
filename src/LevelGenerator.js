import TerrainGenerator from "./TerrainGenerator.js";
import Mesh from "./Mesh.js";
import Model from "./Model.js";

export default class LevelGenerator {

    constructor(seed, scene) {
        this.terrainGen = new TerrainGenerator(241, 50, 5, 0.2, 2, 18);
        this.seed = seed;
        this.scene = scene;
        this.mesh = [];
    }

    next() {
        //(1) Generate terrain
        this.createIsland();

        this.createOcean();

        //(2) Set Start and Goal position and add Goal object
        this.createStartAndGoal();

        //(3) Add static obstacles
        //this.createObstacles()
    }

    createIsland() {
        let heightMap = this.terrainGen.generateNoiseMap(this.seed++);
        let tex = this.terrainGen.generateTexture(heightMap);
        let mesh = this.terrainGen.generateMesh(heightMap);

        this.levelNode = new Model(
            new Mesh(mesh),
            tex,
            { name: "terrain" }
        );

        console.log(this.levelNode);

        this.scene.addNode(this.levelNode);
    }

    createOcean() {
        let size = 2;

        let mesh = this.terrainGen.generateOceanMesh(size);
        let texture = this.terrainGen.generateOceanTexture(size);

        //Create 9 models
        let mapSize = this.terrainGen.mapSize;
        let offsetsX = [-240,-240,-240,   0,  0, 240, 240, 240];
        let offsetsZ = [-240,   0, 240,-240,240,-240, 0, 240];
        for (let i = 0; i < 8; i++) {
            let x = offsetsX[i];
            let z = offsetsZ[i];
            let mod = new Model(
                new Mesh(mesh),
                texture,
                {translation: [x, -0.0001, z]}
            );
            this.scene.addNode(mod);
        }
    }

    createStartAndGoal() {
        //First get positions
        const map = this.levelNode.mesh.vertices;
        let x, y, z
        for (let i = 0; i < map.length - 3; i += 3) {

            x = map[i];
            y = map[i + 1];
            z = map[i + 2];
            if (y > 0.35 * this.terrainGen.heightMult) {
                this.startPos = [x, y+5, z];
                break;
            }
        }
        for (let i = map.length - 3; i > 2; i -= 3) {
            x = map[i];
            y = map[i+1];
            z = map[i+2];
            if (y > 0.35 * this.terrainGen.heightMult) {
                this.endPos = [x, y - 2, z];
                break;
            }
        }
    }
}
