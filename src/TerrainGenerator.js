import Mesh from "./Mesh.js";

const vec3 = glMatrix.vec3;
const vec2 = glMatrix.vec2;
/**
 * class TerrainGenerator
 * Creates a TerrainGenerator object which will be used for creating
 * the procedurally generated mesh for our game.
 */
export default class TerrainGenerator {
    /**
     * @param mapSize - size of the generated Mesh
     * @param scale - scale for noise (0,200]
     * @param octaves - number of noise signals used (0,10]
     * @param persistence - controls decrease in amplitude of octaves (0,1)
     * @param lacunarity - controls increase in frequency of octaves (1,200)
     * @param heightMult - height multiplier
     */
    constructor(mapSize, scale, octaves, persistence, lacunarity, heightMult) {
        this.mapSize = mapSize;
        this.scale = scale === 0 ? 0.0001 : scale;
        this.octaves = octaves;
        this.persistence = persistence;
        this.lacunarity = lacunarity;
        this.colorRegions = {
            edges: [],
            colors: []
        };
        this.heightMult = heightMult;
        this.falloffMap = this.generateFalloffMap();
    }

    /**
     * @param {number} seed - random seed for noise generation
     * @return {Array} noiseMap
     */
    generateNoiseMap(seed) {
        let noiseMap = [];
        noise.seed(seed);

        let minNoiseHeight = Number.MAX_SAFE_INTEGER;
        let maxNoiseHeight = Number.MIN_SAFE_INTEGER;

        let halfSize = this.mapSize / 2;

        for (let y=0; y < this.mapSize; y++) {
            noiseMap[y] = [];
            for (let x=0; x < this.mapSize; x++) {

                // We add noise values of all octaves
                // We initialize first octave with amplitude = 1 and frequency = 1
                let amplitude = 1;
                let frequency = 1;
                let noiseHeight = 0;

                for (let i=0; i < this.octaves; i++) {
                    let sampleX = (x - halfSize) / this.scale * frequency;
                    let sampleY = (y - halfSize) / this.scale * frequency;

                    // Creating more dynamic height changes by increasing range to negative numbers
                    let perlinValue = noise.simplex2(sampleX, sampleY) * 2 - 1;
                    noiseHeight += perlinValue * amplitude;

                    // Decrease amplitude and increase frequency
                    amplitude *= this.persistence;
                    frequency *= this.lacunarity;
                }

                maxNoiseHeight = noiseHeight > maxNoiseHeight ? noiseHeight : maxNoiseHeight;
                minNoiseHeight = noiseHeight < minNoiseHeight ? noiseHeight : minNoiseHeight;
                noiseMap[y][x] = noiseHeight;
            }
        }

        const Lerp = function(a, b, t) {
            return (1 - t) * a + b * t;
        }

        const invLerp = function(a, b, v) {
            return (v - a) / (b - a);
        }

        const remap = function (iMin, iMax, oMin, oMax, v) {
            let t = invLerp(iMin, iMax, v);
            return Lerp(oMin, oMax, t);
        }

        const clamp = function (val, min, max) {
            return Math.min(Math.max(val, min), max);
        }

        // Normalize noise map
        for (let y = 0; y < this.mapSize; y++) {
            for (let x = 0; x < this.mapSize; x++) {
                noiseMap[y][x] = remap(minNoiseHeight, maxNoiseHeight, 0, 1, noiseMap[y][x]);
            }
        }

        // Apply falloff
        for (let y = 0; y < this.mapSize; y++) {
            for (let x = 0; x < this.mapSize; x++) {
                noiseMap[y][x] = clamp(noiseMap[y][x] - this.falloffMap[y][x], 0, 1);
            }
        }


        return noiseMap;
    }

    /**
     *     {
      "type": "model",
      "mesh": 0,
      "texture": 0,
      "aabb": {
        "min": [-1, -0.1, -1],
        "max": [1, 0.1, 1]
      },
      "translation": [3, 0.1, -1],
      "rotation": [0, 1, 0],
      "scale": [1, 0.1, 1]
    }
     */
    generateMesh (noiseMap) {

        let mesh = new Mesh(Mesh.defaults);
        console.log(noiseMap);

        let topLeftX = (this.mapSize -1) / -2;
        let topLeftZ = (this.mapSize - 1) / 2;

        // Calculate coordinates
        let vertInd = 0;
        for (let y=0; y < this.mapSize; y++) {
            for (let x=0; x < this.mapSize; x++) {
                mesh.vertices.push(topLeftX + x, noiseMap[y][x] * this.heightMult, topLeftZ -y);
                mesh.texcoords.push(x / this.mapSize, y / this.mapSize);
                mesh.normals.push(0, 0, 0);

                if (x < this.mapSize - 1 && y < this.mapSize -1) {
                    mesh.indices.push(vertInd, vertInd + this.mapSize + 1, vertInd + this.mapSize);
                    mesh.indices.push(vertInd + this.mapSize + 1, vertInd, vertInd + 1);
                }
                vertInd++
            }
        }

        // Calculate surface normals
        let v = mesh.vertices;
        let ind = mesh.indices;
        let temp = vec3.create();

        // We sum normals from all triangles
        for (let i=0; i < mesh.indices.length - 2; i+=3) {
            let a = vec3.fromValues(v[ind[i]], v[ind[i]+1], v[ind[i]+2]);
            let b = vec3.fromValues(v[ind[i+1]], v[ind[i+1]+1], v[ind[i+1]+2]);
            let c = vec3.fromValues(v[ind[i+2]], v[ind[i+2]+1], v[ind[i+2]+2]);

            let n = vec3.create();
            let sub1 = vec3.create();
            let sub2 = vec3.create();

            vec3.cross(n, vec3.sub(sub1, b, a), vec3.sub(sub2, c, a));

            vec3.normalize(n, n);

            // Normal in A
            mesh.normals[ind[i]] = n[0];
            mesh.normals[ind[i]+1] = n[1];
            mesh.normals[ind[i]+2] = n[2];

            // Normal in B
            mesh.normals[ind[i+1]] = n[0];
            mesh.normals[ind[i+1]+1] = n[1];
            mesh.normals[ind[i+1]+2] = n[2];

            // Normal in C
            mesh.normals[ind[i+2]] = n[0];
            mesh.normals[ind[i+2]+1] = n[1];
            mesh.normals[ind[i+2]+2] = n[2];
        }

        // We normalize normals for each vertex
        for (let i=0; i < mesh.vertices.length - 2; i+=3) {
            let n = vec3.fromValues(mesh.normals[i], mesh.normals[i+1], mesh.normals[i+2]);
            vec3.normalize(n, n);
            mesh.normals[i] = -n[0];
            mesh.normals[i+1] = -n[1];
            mesh.normals[i+2] = -n[2];
        }

        return mesh;
    }
    /**
     * Regions:{
     *     Deep Water,
     *     Shallow Water,
     *     Beach,
     *     Grass,
     *     Low hill,
     *     High hill,
     *     Rocks,
     *     Snow
     * }
     * @param {Array<number>} edges - edges for each of the regions
     * @param {Array<vec3>} colors - rgba colors for each region
     */
    setColorRegions(edges, colors) {

    }

    generateFalloffMap() {
        let falloffMap = [];

        const funEval = function (val) {
            let a = 3;
            let b = 2.2;

            return Math.pow(val, a) / (Math.pow(val, a) + Math.pow(b - b * val, a));
        }

        for (let i = 0; i < this.mapSize; i++) {
            falloffMap[i] = [];
            for (let j = 0; j < this.mapSize; j++) {
                let x = i / this.mapSize * 2 - 1;
                let y = j / this.mapSize * 2 - 1;

                let val = Math.max(Math.abs(x), Math.abs(y));
                falloffMap[i][j] = funEval(val);
            }
        }

        return falloffMap;
    }

}
