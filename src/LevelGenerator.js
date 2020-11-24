import TerrainGenerator from "./TerrainGenerator.js";
import Mesh from "./Mesh.js";
import Model from "./Model.js";

const vec3 = glMatrix.vec3;

export default class LevelGenerator {

    constructor(seed, scene) {
        this.level = 0;
        this.terrainGen = new TerrainGenerator(241, 50, 5, 0.2, 2, 18);
        this.seed = seed;
        this.scene = scene;
        this.mesh = [];
        this.possibleHotDogLocations = [];

        this.colorSchemes = [
            {
                colors: [
                    vec3.fromValues(66,121,229),
                    vec3.fromValues(210, 208, 125),
                    vec3.fromValues(86, 152, 23),
                    vec3.fromValues(62, 107, 18),
                    vec3.fromValues(85, 71, 69),
                    vec3.fromValues(255, 255,255)
                ]
            },
            {
                colors: [
                    vec3.fromValues(66,121,229),
                    vec3.fromValues(242, 196, 56),
                    vec3.fromValues(217, 155, 41),
                    vec3.fromValues(217, 73, 41),
                    vec3.fromValues(115, 41, 47),
                    vec3.fromValues(255, 255,255)
                ]

            }
        ]
    }

    next() {
        //(1) Generate terrain
        this.createIsland();

        this.createOcean();

        //(2) Set Start and Goal position and add Goal object
        this.createStartAndGoal();

        this.generateHotDogLocations();

        //(3) Add static obstacles
        //this.createObstacles()
    }

    createIsland() {
        this.setColorScheme();
        let heightMap = this.terrainGen.generateNoiseMap(this.seed = Math.floor(Math.random() * 3000));
        let tex = this.terrainGen.generateTexture(heightMap);
        let mesh = this.terrainGen.generateMesh(heightMap);

        this.levelNode = new Model(
            new Mesh(mesh),
            tex,
            { name: "terrain" }
        );

        console.log(this.levelNode);

        this.scene.addNode(this.levelNode);
        this.level++;
    }

    setColorScheme() {
        let i = this.level % this.colorSchemes.length;
        this.terrainGen.colorRegions.colors = this.colorSchemes[i].colors;
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
                this.endPos = [x, y - 1, z];
                break;
            }
        }
    }

    generateHotDogLocations() {

        this.possibleHotDogLocations = [];
        //First get positions
        const map = this.levelNode.mesh.vertices;
        let x, y, z

        for (let i = 0; i < map.length - 3; i += 15) {
            x = map[i];
            y = map[i + 1];
            z = map[i + 2];
            if (y > 2) {
                this.possibleHotDogLocations.push([x, y + 1.2, z]);
            }
        }
        console.log("HOTDOGS:");
        console.log(this.possibleHotDogLocations);

    }

    getHotDogLocation() {
        let length = this.possibleHotDogLocations.length;
        return this.possibleHotDogLocations[Math.floor(Math.random() * length)];
    }
}
