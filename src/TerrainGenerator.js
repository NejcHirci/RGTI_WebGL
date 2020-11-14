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
     */
    constructor(mapSize, scale, octaves, persistence, lacunarity) {
        this.mapSize = mapSize;
        this.scale = scale === 0 ? 0.0001 : scale;
        this.octaves = octaves;
        this.persistence = persistence;
        this.lacunarity = lacunarity;
        this.colorRegions = {
            edges: [],
            colors: []
        };
    }

    /**
     * @param {number} seed - random seed for noise generation
     * @return {Array} noiseMap
     */
    generateNoiseMap(seed) {
        let noiseMap = [];
        noise.seed(seed);

        let maxNoiseHeight = Number.MIN_SAFE_INTEGER;
        let minNoiseHeight = Number.MAX_SAFE_INTEGER

        for (let y=0; y < this.mapSize; y++) {
            noiseMap[y] = [];
            for (let x=0; x < this.mapSize; x++) {

                // We add noise values of all octaves
                // We initialize first octave with amplitude = 1 and frequency = 1
                let amplitude = 1;
                let frequency = 1;
                let noiseHeight = 0;

                for (let i=0; i < this.octaves; i++) {
                    let sampleX = x / this.scale * frequency;
                    let sampleY = y / this.scale * frequency;

                    // Creating more dynamic height changes by increasing range to negative numbers
                    let perlinValue = noise.simplex2(sampleX, sampleY);
                    noiseHeight += perlinValue * amplitude;

                    // Decrease amplitude and increase frequency
                    amplitude *= this.persistence;
                    frequency *= this.lacunarity;
                }

                // We store maximum and minimum value of height for later normalization
                maxNoiseHeight = noiseHeight > maxNoiseHeight ? noiseHeight : maxNoiseHeight;
                minNoiseHeight = noiseHeight < minNoiseHeight ? noiseHeight : minNoiseHeight;

                noiseMap[y][x] = noiseHeight;
            }
        }

        /* Classical linear interpolation can be written as lerp(x, y, a) = x * (1-a) + y * a.
        *  Here we have the opposite case, where we want to find the smooth transition between
        *  two edge values given the interpolated value between them that is lerp(x,y,a).
        *  In the case of simple lerp it is in fact its inverse.
        *
        *  Below we define smoothstep function as implemented in GLSL with cubic Hermite interpolation after clamping
        */
        const clamp = (min, max, x) => {
            return Math.min( Math.max(x, min), max)
        };
        const smoothstep = (edge0, edge1, x) => {
            let t = clamp(0, 1, (x - edge0) / (edge1 - edge0));
            return t * t * (3 - 2 * t);
        };


        // Normalize noiseMap with smoothstep
        for (let y=0; y < this.mapSize; y++) {
            for (let x = 0; x < this.mapSize; x++) {
                noiseMap[y][x] = smoothstep(minNoiseHeight, maxNoiseHeight, noiseMap[x][y]);
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

        // Calculate coordinates
        let vertInd = 0;
        for (let y=0; y < this.mapSize; y++) {
            for (let x=0; x < this.mapSize; x++) {
                mesh.vertices.push(x / this.mapSize, noiseMap[y][x], y / this.mapSize);
                mesh.texcoords.push(x / this.mapSize, y / this.mapSize);
                mesh.normals.push(0, 0, 0);

                if (x < this.mapSize - 1 && y < this.mapSize -1) {
                    mesh.indices.push(vertInd, vertInd + this.mapSize + 1, vertInd + this.mapSize);
                    mesh.indices.push(vertInd + this.mapSize + 1, vertInd, vertInd + 1);
                }
                vertInd++
            }
        }

        /**
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

            mesh.normals[ind[i]] += n[0];
            mesh.normals[ind[i]+1] += n[1];
            mesh.normals[ind[i]+2] += n[2];

            mesh.normals[ind[i+1]] += n[0];
            mesh.normals[ind[i+1]+1] += n[1];
            mesh.normals[ind[i+1]+2] += n[2];

            mesh.normals[ind[i+2]] += n.x;
            mesh.normals[ind[i+2]+1] += n.y;
            mesh.normals[ind[i+2]+2] += n.z;
        }

        // We normalize normals for each vertex
        for (let i=0; i < mesh.vertices.length - 2; i+=3) {
            let n = vec3.fromValues(mesh.normals[i], mesh.normals[i+1], mesh.normals[i+2]);
            vec3.normalize(n, n);
            mesh.normals[i] = n[0];
            mesh.normals[i+1] = n[1];
            mesh.normals[i+2] = n[2];
        }*/

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

}
