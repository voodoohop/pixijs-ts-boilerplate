import {
    Dom,
    PixiAppWrapper as Wrapper,
    pixiAppWrapperEvent as WrapperEvent,
    PixiAppWrapperOptions as WrapperOpts,
} from "pixi-app-wrapper";


export default function createParticleSystem(app: Wrapper):Function {
    let particlesContainer = new PIXI.particles.ParticleContainer();
    console.log(PIXI.loader.resources.flame.textures);
    const textures = Object.keys(PIXI.loader.resources.flame.textures)
        .map(textureName => PIXI.loader.resources.flame.textures[textureName])
        // .map(origTexture => new PIXI.Texture( origTexture.baseTexture, origTexture.frame, undefined,undefined,6 )) ;
  
    console.log(textures);
    let particlesEmitter = new PIXI.particles.Emitter(particlesContainer,[{textures, framerate: 10, loop:false}] , {
        alpha: {
            start: 0.5,
            end: 0.1,
        },
        scale: {
            start: 0.01,
            end: 3,
        },
        // minimumScaleMultiplier: -1,
        // color: {
        //     start: "ffffff",
        //     end: "0000ff",
        // },
        // speed: {
        //     start: 0,
        //     end: 0,
        // },
        // startRotation: {
        //     min: 270,
        //     max: 270,
        // },  

        lifetime: {
            min: 0.8,
            max: 0.96,
        },
        frequency: 0.1,
        emitterLifetime: -1,
        maxParticles: 10,
        pos: {
            x: 250,
            y: 500,
        },
        addAtBack: false,
        spawnType: "rect",
        spawnRect : {
            x: -250,
            y: 0,   
            w: 500,
            h:0
        },
        emit: false,
        autoUpdate: true,
        particleConstructor: PIXI.particles.AnimatedParticle
    });
    particlesEmitter.particleConstructor = PIXI.particles.AnimatedParticle
    particlesEmitter.emit=true;

    particlesContainer.position.set(0)
    // app.ticker.add(update);
    app.stage.addChild(particlesContainer);  
    return function removeParticles() {
        app.stage.removeChild(particlesContainer);
        particlesEmitter.emit=false;
        particlesContainer.destroy();
    }
}
