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

        //(2) Set Start and Goal position and add Goal object
        //this.createStartAndGoal();

        //(3) Add static obstacles
        //this.createObstacles()
    }

    createIsland() {
        let heightMap = this.terrainGen.generateNoiseMap(this.seed++);
        this.levelNode = new Model(
            new Mesh(this.terrainGen.generateMesh(heightMap)),
            this.terrainGen.generateTexture(heightMap),
            { name: "terrain" }
        );

        console.log(this.levelNode);

        this.scene.addNode(this.levelNode);
    }

    createStartAndGoal() {
        //First get positions
        const map = this.mesh.vertices;
        let x, y, z
        for (let i = 0; i < map.length - 3; i += 3) {
            x = map[i];
            y = map[i + 1];
            z = map[i + 2];
            if (map[y] > 0.3 * this.terrainGen.heightMult) {
                //Found first high point
                this.startPos = [x, y, z];
                break;
            }
        }
        for (let i = map.length - 3; i > 2; i -= 3) {
            x = map[i - 2];
            y = map[i - 1];
            z = map[i];
            if (map[y] > 0.3 * this.terrainGen.heightMult) {
                //Found last high point
                this.endPos = [x, y, z];
                break;
            }
        }

        //TODO: Add goal object to level node
    }

    createObstacles(maxObstacles){
        let x,y,z
        let map = this.mesh;
        this.landMap = [];

        for (let i = map.length - 3; i > 2; i -= 3) {
            x = map[i - 2];
            y = map[i - 1];
            z = map[i];
            if (map[y] > 0.1) this.landMap.push(x, y, z);
        }

        let i;
        let obstaclePos = [];
        while(maxObstacles > 0) {
            maxObstacles--;
            i = Math.floor(Math.random() * this.landMap.length);
            obstaclePos.push(this.landMap[i], this.landMap[i+1], this.landMap[i+2]);
        }

    }
}