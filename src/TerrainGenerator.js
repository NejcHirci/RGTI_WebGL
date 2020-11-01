const vec3 = glMatrix.vec3;
const vec2 = glMatrix.vec2;
/**
 * class TerrainGenerator
 * Creates a TerrainGenerator object which will be used for creating
 * the procedurally generated mesh for our game.
 */
export default class TerrainGenerator {
    /**
     * @param mapWidth - width of the generated Mesh
     * @param mapHeight - height of the generated Mesh
     * @param scale - scale for noise (0,200]
     * @param octaves - number of noise signals used (0,10]
     * @param persistance - controls decrease in amplitude of octaves (0,1)
     * @param lacunarity - controls increase in frequency of octaves (1,200)
     */
    constructor(mapWidth, mapHeight, scale, octaves, persistance, lacunarity) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.scale = scale === 0 ? 0.0001 : scale;
        this.octaves = octaves;
        this.persistance = persistance;
        this.lacunarity = lacunarity;
    }

    /**
     *
     * @param {number} seed - random seed for noise generation
     * @return {Array} noiseMap
     */
    generateNoiseMap(seed) {
        let noiseMap = [];
        let random = new Alea(seed)
        let simplex = new SimplexNoise(random);

        let maxNoiseHeight = Number.MIN_SAFE_INTEGER;
        let minNoiseHeight = Number.MAX_SAFE_INTEGER

        for (let y=0; y < this.mapHeight; y++) {
            for (let x=0; x < this.mapWidth; x++) {

                // We add noise values of all octaves
                // We initialize first octave with amplitude = 1 and frequency = 1
                let amplitude = 1;
                let frequency = 1;
                let noiseHeight = 0;

                for (let i=0; i < this.octaves; i++) {
                    let sampleX = x / this.scale * frequency;
                    let sampleY = y / this.scale * frequency;

                    // Creating more dynamic height changes by increasing range to negative numbers
                    let perlinValue = simplex.noise2D(sampleX, sampleY) * 2 - 1;
                    noiseHeight += perlinValue * this.persistance;

                    // Decrease amplitude and increase frequency
                    amplitude *= this.persistance;
                    frequency *= this.lacunarity;
                }

                // We store maximum and minimum value of height for later normalization
                maxNoiseHeight = noiseHeight > maxNoiseHeight ? noiseHeight : maxNoiseHeight;
                minNoiseHeight = noiseHeight < minNoiseHeight ? noiseHeight : minNoiseHeight;

                noiseMap[x][y] = noiseHeight;
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
        for (let y=0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                noiseMap[x][y] = smoothstep(minNoiseHeight, maxNoiseHeight, noiseMap[x][y]);
            }
        }

        return noiseMap;
    }

    generateTexture (noiseMap) {
        let width = noiseMap.length;
        let height = noiseMap[0].length;

        //2D array of colours
        let colorMap = [];

        // Here we create color for each vert based on height
        for (let y=0; y < height; y++) {
            for(let x=0; x < width; x++) {
                colorMap[x][y] = vec3.lerp(vec3.create(), vec3.fromValues(0,0,0), vec3.fromValues(255,255,255), noiseMap[x][y]);
            }
        }
        return colorMap;
    }

    // TODO: `function for generating mesh from noise map`
    generateMesh () {

    }

    // TODO: `setColorRegions() for coloring verts based on height (sea, beach, forest, mountains, snow)`
    setColorRegions() {

    }

}
