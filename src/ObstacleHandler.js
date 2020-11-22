const mat4 = glMatrix.mat4;

const objectTypes = {
    WATER: 'water',
    LAND: 'land',
    BALL: 'ball',
    CAMERA: 'camera',
    GOAL: 'goal',
    SPIKY_BALL: 'spikyBall',
    BALL_CATCHER: 'ballCatcher'
}

export default class ObstacleHandler {

    constructor( options ) {
        this.mapSize = options.mapSize ? options.mapSize : null;
        this.maxSpikeys = 20;
        this.spikeys = 0;
        this.dropHeigthMin = 40;
        this.dropHeigthMax = 60;
    }

    defineSpikyBalls ( world, scene) {
        if (this.mapSize !== null && world !== null && scene != null) {
            this.generateSpikyBalls(world,scene);

        } else {
            Error.log("missing map size / world / scene!!");
        }
    }

    generateSpikyBalls(world, scene ) {

        let offset;
        let ball;
        let i = 0;
        let x, y, z;

        scene.nodes.forEach(node => {
            if (node.name === 'spikey') {
                x = 0;
                z = 0;
                y = -20;
                ball = this.generateSpikyBall(x,y,z);
                ball.id = i;
                i++;
                node.translation = ball.pos;
                node.worldProperties = world.add(ball);
                node.updateMatrix();

                let to= Math.floor(Math.random() * 6000);

                setTimeout(() =>{node.relocate(this)},to);
            }
        });

    }

    getNewSpikyBallPosition() {
        let x,y, z, xPredznak, zPredznak;
        let offset;
        let dropZone = this.mapSize / 3;

        xPredznak = Math.round(Math.random()) * 2 - 1;
        zPredznak = Math.round(Math.random()) * 2 - 1;

        offset = Math.floor(Math.random() * 30);

        x = (Math.floor(Math.random() * dropZone) + offset ) * xPredznak;
        z = (Math.floor(Math.random() * dropZone) + offset ) * zPredznak;


        y = Math.floor(Math.random() * (this.dropHeigthMax -this.dropHeigthMin)) + this.dropHeigthMin;


        return [x,y,z];
    }

    updateSpikes(scene) {

        let properties;
        scene.nodes.forEach(node => {
            if(node.name === 'spikey' && node.worldProperties != null) {
                properties= node.worldProperties;
                if(node.isInContactWith([objectTypes.BALL_CATCHER ])) {
                    if(node.respawning === undefined || node.respawning === false){
                        setTimeout(() =>{node.relocate(this)},100);
                        node.respawning = true;
                    }
                } else if(node.isInContactWith([objectTypes.LAND ])) {
                    if(node.respawning === undefined || node.respawning === false){
                        setTimeout(() =>{node.relocate(this)},5000);
                        node.respawning = true;
                    }
                }
                node.translation = [(properties.position.x), (properties.position.y), (properties.position.z)];
                node.rotation = [properties.orientation.x,properties.orientation.y,properties.orientation.z, properties.orientation.w];
                node.updateMatrix();

            }
        });

    }

    generateSpikyBall(x,y,z) {

        return {
            type:'sphere',
            size:[2],
            pos: [x, y, z],
            move: true, // dynamic or statique
            density: 1,
            friction: 1,
            restitution: 1,
            collidesWith: 2,
            belongsTo: 2,// The bits of the collision groups with which the shape collides.
            name: objectTypes.SPIKY_BALL
        }

    }



}
