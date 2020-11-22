const mat4 = glMatrix.mat4;

const objectTypes = {
    WATER: 'water',
    LAND: 'land',
    BALL: 'ball',
    CAMERA: 'camera',
    GOAL: 'goal',
    SPIKY_BALL: 'spikyBall',
}

export default class ObstacleHandler {

    constructor( options ) {
        this.mapSize = options.mapSize ? options.mapSize : null;
        this.maxSpikeys = 20;
        this.spikeys = 0;
    }

    updateSpikyBalls ( world, scene) {
        if (this.mapSize !== null && world !== null && scene != null) {
            this.generateSpikyBalls(world,scene);

        } else {
            Error.log("missing map size / world / scene!!");
        }
    }

    generateSpikyBalls(world, scene ) {

        let x,y, z, xPredznak, zPredznak;
        let offset;
        let dropZone = this.mapSize / 3;
        let ball;
        let i = 0;

        scene.nodes.forEach(node => {
            if (node.name === 'spikey') {

                xPredznak = Math.round(Math.random()) * 2 - 1;
                zPredznak = Math.round(Math.random()) * 2 - 1;

                offset = Math.floor(Math.random() * 30);

                x = (Math.floor(Math.random() * dropZone) + offset ) * xPredznak;
                z = (Math.floor(Math.random() * dropZone) + offset ) * zPredznak;
                y = 20;
                ball = this.generateSpikyBall(x,y,z);
                ball.id = i;
                i++;

                node.translation = ball.pos;
                //node.worldProperties = world.add(ball);
                node.updateMatrix();
            }
        });

    }

    updateSpikes(scene) {

        let properties;
        scene.nodes.forEach(node => {
            if(node.name === 'spikey' && node.worldProperties != null) {
                properties= node.worldProperties;
                console.log(properties);

                node.translation = [(properties.position.x), (properties.position.y), (properties.position.z)];
                node.rotation = [properties.orientation.x,properties.orientation.y,properties.orientation.z, properties.orientation.w];
                node.updateMatrix();

                if (properties.numContacts > 0) {
                    node.worldProperties = null;
                }
            }
        });

    }

    generateSpikyBall(x,y,z) {

        return {
            type:'sphere',
            size:[0.6],
            pos: [x, y, z],
            move: true, // dynamic or statique
            density: 1,
            friction: 0.8,
            restitution: 0.2,
            collidesWith: 0xffffffff,// The bits of the collision groups with which the shape collides.
            name: objectTypes.SPIKY_BALL
        }

    }



}
