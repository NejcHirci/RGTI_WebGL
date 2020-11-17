import Mesh from "./Mesh.js";
import {Bezier} from "../lib/bezier.js"

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
            edges: [0.35, 0.40, 0.50, 0.75, 0.95, 1],
            colors: [
                vec3.fromValues(66,121,229),
                vec3.fromValues(210, 208, 125),
                vec3.fromValues(86, 152, 23),
                vec3.fromValues(62, 107, 18),
                vec3.fromValues(85, 71, 69),
                vec3.fromValues(255, 255,255)
            ]
        };
        this.heightMult = heightMult;
        this.falloffMap = this.generateFalloffMap();
        this.bezier = new Bezier(
            {x: 0, y:0}, {x:0.35, y:0}, {x:0.50, y: 0},{x: 1, y:1}
        );
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

        let topLeftX = (this.mapSize -1) / -2;
        let topLeftZ = (this.mapSize - 1) / 2;
        let height, normal;
        let nw,n,ne,e,w,sw,s,se;
        let dydx,dydz;

        // Calculate coordinates
        let vertInd = 0;
        for (let y=0; y < this.mapSize; y++) {
            for (let x=0; x < this.mapSize; x++) {
                mesh.vertices.push(topLeftX + x, this.bezier.get(noiseMap[y][x]).y * this.heightMult, topLeftZ - y);
                mesh.texcoords.push(x / this.mapSize, y / this.mapSize);

                if (x < this.mapSize - 1 && y < this.mapSize -1) {
                    mesh.indices.push(vertInd, vertInd + this.mapSize + 1, vertInd + this.mapSize);
                    mesh.indices.push(vertInd + this.mapSize + 1, vertInd, vertInd + 1);
                }

                normal = vec3.fromValues(0, 1, 0);

                if(x > 0 && y > 0 && x < this.mapSize-1 && y < this.mapSize-1) {

                    nw = this.bezier.get(noiseMap[y-1][x-1]).y * this.heightMult;
                    n = this.bezier.get(noiseMap[y-1][x]).y * this.heightMult;
                    ne = this.bezier.get(noiseMap[y-1][x+1]).y * this.heightMult;

                    e = this.bezier.get(noiseMap[y][x+1]).y * this.heightMult;
                    w = this.bezier.get(noiseMap[y][x-1]).y * this.heightMult;

                    sw = this.bezier.get(noiseMap[y+1][x-1]).y * this.heightMult;
                    s = this.bezier.get(noiseMap[y+1][x]).y * this.heightMult;
                    se = this.bezier.get(noiseMap[y+1][x+1]).y * this.heightMult;

                    dydx = ((ne + 2 * e + se) - (nw + 2 * w + sw));
                    dydz = ((sw + 2 * s + se) - (nw + 2 * n + ne));

                    normal = vec3.normalize(vec3.create(), vec3.fromValues(-dydx, 1.0, -dydz));
                }

                if (noiseMap[y][x] <= 0.36) {
                    normal = vec3.fromValues(0,1,0);
                }
                mesh.normals.push(normal[0], normal[1], normal[2]);

                vertInd++
            }
        }

        // Calculate surface normals
        let v = mesh.vertices;
        let ind = mesh.indices;

        for (let y=0; y < this.mapSize; y++) {
            for (let x = 0; x < this.mapSize; x++) {

            }
        }

        // We sum normals from all triangles
        /*for (let i=0; i < mesh.indices.length - 2; i+=3) {
            let a = vec3.fromValues(v[ind[i]], v[ind[i]+2], v[ind[i]+1]);
            let b = vec3.fromValues(v[ind[i+1]], v[ind[i+1]+2], v[ind[i+1]+1]);
            let c = vec3.fromValues(v[ind[i+2]], v[ind[i+2]+2], v[ind[i+2]+1]);

            let n = vec3.create();
            let sub1 = vec3.create();
            let sub2 = vec3.create();

            vec3.cross(n, vec3.sub(sub1, b, a), vec3.sub(sub2, c, a));

            // Normal in A
            mesh.normals[ind[i]] += n[0];
            mesh.normals[ind[i]+1] += n[2];
            mesh.normals[ind[i]+2] += n[1];

            // Normal in B
            mesh.normals[ind[i+1]] += n[0];
            mesh.normals[ind[i+1]+1] += n[2];
            mesh.normals[ind[i+1]+2] += n[1];

            // Normal in C
            mesh.normals[ind[i+2]] += n[0];
            mesh.normals[ind[i+2]+1] += n[2];
            mesh.normals[ind[i+2]+2] += n[1];
        }

        // We normalize normals for each vertex
        console.log(mesh.normals.length);
        for (let i=0; i < mesh.normals.length - 2; i+=3) {
            let norm = vec3.fromValues(mesh.normals[i], mesh.normals[i+1], mesh.normals[i+2]);
            norm = vec3.normalize(vec3.create(), norm);
            mesh.normals[i] = norm[0];
            mesh.normals[i+1] = norm[2];
            mesh.normals[i+2] = norm[1];
        }
        console.log(mesh);
         */

        return mesh;
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

    getColor(val) {
        for(let i = 0; i < this.colorRegions.edges.length; i++) {
            if (val <= this.colorRegions.edges[i]) {
                return this.colorRegions.colors[i];
            }
        }

    }

    generateTexture(heightMap) {
        let buffer = new Uint8ClampedArray(this.mapSize * this.mapSize * 4);

        for(let y = 0; y < this.mapSize; y++) {
            for (let x = 0; x < this.mapSize; x++) {
                let pos = (y * this.mapSize + x) * 4;
                let color = this.getColor(heightMap[y][x]);

                buffer[pos] = color[0];
                buffer[pos+1] = color[1];
                buffer[pos+2] = color[2];
                buffer[pos+3] = 255;
            }
        }

        // create off-screen canvas element
        let canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');

        canvas.width = this.mapSize;
        canvas.height = this.mapSize;

        // create imageData object
        let idata = ctx.createImageData(this.mapSize, this.mapSize);

        // set our buffer as source
        idata.data.set(buffer);

        // update canvas with new data
        ctx.putImageData(idata, 0, 0);
        let image = new Image();
        image.src = canvas.toDataURL();
        console.log(image.src);
        return new ImageData(buffer, this.mapSize, this.mapSize);
    }

}
