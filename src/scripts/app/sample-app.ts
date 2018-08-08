import {RotatingSprite} from "app/rotating-sprite";
import {TweenLite} from "gsap";
// import {Stack} from "../vendor/basarat/typescript-collections"
import "howler";
import {
    Dom,
    PixiAppWrapper as Wrapper,
    pixiAppWrapperEvent as WrapperEvent,
    PixiAppWrapperOptions as WrapperOpts,
} from "pixi-app-wrapper";
import {Asset, AssetPriority, LoadAsset, PixiAssetsLoader, SoundAsset} from "pixi-assets-loader";
import {
    AsciiFilter,
    CRTFilter,
    GlowFilter,
    OldFilmFilter,
    OutlineFilter,
    ShockwaveFilter,
} from "pixi-filters";
import "pixi-particles";


const stackDisplacement = 0.05;    

enum Side {left,right };

/**
 * Showcase for PixiAppWrapper class.
 */
export class SampleApp {
    private app: Wrapper;

    private screenBorder: PIXI.Graphics;
    private fullScreenButton: PIXI.Container;
    private fullScreenText: PIXI.extras.BitmapText;
    private loadingText: PIXI.Text;
    private layeredBunnies: PIXI.Container;
    private particlesContainer: PIXI.particles.ParticleContainer;


    private particlesEmitter: PIXI.particles.Emitter;

    private loader: PixiAssetsLoader;

    private totalAssets: number;
    private loadingProgress: number;
    private assetsCount: { [key: number]: { total: number, progress: number } } = {};

    private cardStacks :  {left:PIXI.Sprite[], right:PIXI.Sprite[]};

    
    private getCardPos(side:Side) {
        const x = ((side === Side.left) ? 25 : 75) ;
        const y = 50;
        const numInStack = (side === Side.left ? this.cardStacks.left : this.cardStacks.right).length;
        const displacement = stackDisplacement * numInStack;
        return {x: x+ displacement, y:y+displacement}
    }

    private moveFirstToRightStackAndGetNewPosition() {
        const card= this.cardStacks.left.pop() ;
        if (!card)
            return undefined;
        // const card =  topBunny;
        const newLength = this.cardStacks.right.push(card);
        const displacement = stackDisplacement * newLength;
        card.zIndex = 144+newLength;
        console.log(displacement);
        const {x,y} = this.getCardPos(Side.right);
        return {card, x,y }
    }



    private textStyle = new PIXI.TextStyle({
        fontFamily: "Verdana",
        fontSize: 24,
        fill: "#FFFFFF",
        wordWrap: true,
        wordWrapWidth: 440,
    });

    private bitmapTextStyle: PIXI.extras.BitmapTextStyle = {font: "35px Desyrel", align: "center"};

    constructor() {
        const canvas = Dom.getElementOrCreateNew<HTMLCanvasElement>("app-canvas", "canvas", document.getElementById("app-root"));
        this.cardStacks = {left:[],right:[]}
        // if no view is specified, it appends canvas to body
        const appOptions: WrapperOpts = {
            width:  100,
            height: 100,
            scale: "keep-aspect-ratio",
            align: "middle",
            resolution: window.devicePixelRatio,
            roundPixels: true,
            transparent: false,
            backgroundColor: 0x000000,
            view: canvas,
            showFPS: true,
            showMediaInfo: true,
            changeOrientation: true,
        };

        this.app = new Wrapper(appOptions);
        this.app.on(WrapperEvent.RESIZE_START, this.onResizeStart.bind(this));
        this.app.on(WrapperEvent.RESIZE_END, this.onResizeEnd.bind(this));

        this.createViews(); // Draw views that can be already drawn

        const assets = [
            {id: "desyrel", url: "assets/fonts/desyrel.xml", priority: AssetPriority.HIGHEST, type: "font"},
            {id: "play", url: "assets/gfx/play.png", priority: AssetPriority.LOW, type: "texture"},
            {id: "stop", url: "assets/gfx/stop.png", priority: AssetPriority.LOW, type: "texture"},
            {id: "card", url: "assets/gfx/cardback.png", priority: AssetPriority.HIGH, type: "texture"},
            {id: "bubble", url: "assets/gfx/Bubbles99.png", priority: AssetPriority.NORMAL, type: "texture"},
            {id: "candies", url: "assets/gfx/candies.json", priority: AssetPriority.LOWEST, type: "atlas"},
            // 404 Assets to test loading errors
          ];

        assets.forEach(asset => {
           if (!this.assetsCount[asset.priority]) {
               this.assetsCount[asset.priority] = {total: 1, progress: 0};
           } else {
               this.assetsCount[asset.priority].total++;
           }
        });

        this.loadingProgress = 0;
        this.totalAssets = assets.length;

        this.loader = new PixiAssetsLoader();
        this.loader.on(PixiAssetsLoader.PRIORITY_GROUP_LOADED, this.onAssetsLoaded.bind(this));
        this.loader.on(PixiAssetsLoader.PRIORITY_GROUP_PROGRESS, this.onAssetsProgress.bind(this));
        this.loader.on(PixiAssetsLoader.ASSET_ERROR, this.onAssetsError.bind(this));
        this.loader.on(PixiAssetsLoader.ALL_ASSETS_LOADED, this.onAllAssetsLoaded.bind(this));

        this.loader.addAssets(assets).load();
    }


    private onAssetsLoaded(args: { priority: number, assets: LoadAsset[] }): void {
        window.console.log(`[SAMPLE APP] onAssetsLoaded ${args.assets.map(loadAsset => loadAsset.asset.id)}`);

        this.createViewsByPriority(args.priority);
    }

    private onAssetsProgress(args: { priority: number, progress: number }): void {
        window.console.log(`[SAMPLE APP] onAssetsProgress ${JSON.stringify(args)}`);
        const percentFactor = this.assetsCount[args.priority].total / this.totalAssets;

        this.loadingProgress += (args.progress - this.assetsCount[args.priority].progress) * percentFactor;
        this.assetsCount[args.priority].progress = args.progress;

        this.loadingText.text = `Loading... ${this.loadingProgress}%`;
        // console.log(this.loadingProgress)
        if (this.loadingProgress >= 95)
            this.app.stage.removeChild(this.loadingText)
    }

    private onAssetsError(args: LoadAsset): void {
        window.console.log(`[SAMPLE APP] onAssetsError ${args.asset.id}: ${args.error!.message}`);
    }

    private onAllAssetsLoaded(): void {
        window.console.log("[SAMPLE APP] onAllAssetsLoaded !!!!");
    }


    private onResizeStart(): void {
        window.console.log("RESIZE STARTED!");
    }

    private onResizeEnd(args: any): void {
        window.console.log("RESIZE ENDED!", args);

        if (args.stage.orientation.changed) {
            this.relocateViews();
        }
    }

    private stopEmittingParticles(): void {
        if (this.particlesEmitter) {
            this.particlesEmitter.emit = false;
            this.particlesEmitter.cleanup();
        }
    }

    private startEmittingParticles(): void {
        if (this.particlesEmitter) {
            this.particlesEmitter.emit = true;
        }
    }

    private addFullscreenText(x: number, y: number): void {
        this.fullScreenText = new PIXI.extras.BitmapText("Click on the square\n to toggle fullscreen!", this.bitmapTextStyle);
        this.fullScreenText.position.set(x - this.fullScreenText.width / 2, y);

        this.app.stage.addChild(this.fullScreenText);
    }

    private drawLoadingText(x: number, y: number): void {
        this.loadingText = new PIXI.Text("Loading... 0%", this.textStyle);
        this.loadingText.position.set(x, y);

        this.app.stage.addChild(this.loadingText);
    }

    private createViews(): void {
            this.drawLoadingText(this.app.initialWidth / 5, 10);
    }

    private createViewsByPriority(priority: number): void {
        switch (priority) {
            case AssetPriority.HIGHEST:
                this.addFullscreenText(this.app.initialWidth / 2, this.app.initialHeight / 2 - 125);
                break;

            case AssetPriority.HIGH:
                this.drawLayeredBunnies();
                break;

            case AssetPriority.NORMAL:
                this.drawParticles();
                break;

            case AssetPriority.LOWEST:
                this.drawTextWithImages()
                break;
            default:
                break;
        }
    }

    private removeViews(): void {
        this.app.stage.removeChildren();
    }

    // private drawRotatingExplorer(): void {
    //     // This creates a texture from a "explorer.png" within the atlas
    //     this.explorer = new RotatingSprite(PIXI.loader.resources.atlas1.textures!["explorer.png"]);
    //     this.explorer.scale.set(2, 2);

    //     // Setup the position of the explorer
    //     const maxEdge = Math.max(this.explorer.width, this.explorer.height);
    //     this.explorer.position.set(Math.ceil(maxEdge / 2) + 10, Math.ceil(maxEdge / 2) + 10);

    //     // Rotate around the center
    //     this.explorer.anchor.set(0.5, 0.5);

    //     this.explorer.interactive = true;
    //     this.explorer.buttonMode = true;
    //     this.explorer.rotationVelocity = 0.02;

    //     this.explorer.on("pointerdown", () => {
    //         this.explorer.rotationVelocity *= -1;
    //     });

    //     // Add the explorer to the scene we are building
    //     this.app.stage.addChild(this.explorer);

    //     // Listen for frame updates
    //     this.app.ticker.add(() => {
    //         // each frame we spin the explorer around a bit
    //         this.explorer.rot    ation += this.explorer.rotationVelocity;
    //     });

    //     TweenLite.to(this.explorer, 2, {y: this.app.initialHeight / 2});
    // }

    private drawTextWithImages(): void {
        let images = PIXI.loader.resources.candies.textures;
        if (images) {   
            const imageTextures = Object.keys(<{}>images).map((textureName) => images[textureName])
            const textSource = ["bla",1,"raara",3,"rappmblamla",27];
            const textWithImageContainer = getTextWithImage(textSource, imageTextures, {fill:"white"});
            this.app.stage.addChild(textWithImageContainer);
            // console.log(textElements);
        }
    }

    private drawLayeredBunnies(): void {
        // bunniesContainer.on("pointerdown", () => {
        //     const index = Math.round(Math.random() * (filters.length - 1));
        //     const randomFilter = filters[index];
        //     bunniesContainer.filters = [randomFilter];
        // });
        const layer = new PIXI.display.Layer();
        layer.group.enableSort = true;
        this.app.stage.addChild(layer);

        this.layeredBunnies = new PIXI.Container();
        this.app.stage.addChild(this.layeredBunnies);
        this.layeredBunnies.parentLayer = layer;

        // Create a 5x5 grid of bunnies
        for (let i = 0; i < 144; i++) {
            const card = new PIXI.Sprite(PIXI.loader.resources.card.texture);
            
            card.anchor.set(0.5);
            card.scale.set(20.0 / card.width); 
            // card.scale.y = 100.0 / card.width;
            const {x,y} = this.getCardPos(Side.left);
            card.x = x;
            card.y = y;
            this.layeredBunnies.addChild(card);

            card.parentLayer = layer;
            card.zIndex = i;
            this.cardStacks.left.push(card);
        }

        this.layeredBunnies.position.set(0);
   
        console.log(this.layeredBunnies);

        setInterval(() => {
            const hasCardToMove = this.moveFirstToRightStackAndGetNewPosition();
            if (hasCardToMove) {
                const {card,x,y} = hasCardToMove;
                TweenLite.to(card, 2, {x,y});
            }
        },1000)
    };
    

    private drawParticles(): void {
        this.particlesContainer = new PIXI.particles.ParticleContainer();
        this.particlesContainer.position.set(this.app.initialWidth * 0.75, this.app.initialHeight * 0.5);
        this.app.stage.addChild(this.particlesContainer);

        this.particlesEmitter = new PIXI.particles.Emitter(this.particlesContainer, PIXI.loader.resources.bubble.texture, {
            alpha: {
                start: 0.8,
                end: 0.1,
            },
            scale: {
                start: 1,
                end: 0.3,
            },
            color: {
                start: "ffffff",
                end: "0000ff",
            },
            speed: {
                start: 200,
                end: 100,
            },
            startRotation: {
                min: 0,
                max: 360,
            },
            rotationSpeed: {
                min: 0,
                max: 0,
            },
            lifetime: {
                min: 0.5,
                max: 2,
            },
            frequency: 0.1,
            emitterLifetime: -1,
            maxParticles: 1000,
            pos: {
                x: 0,
                y: 0,
            },
            addAtBack: false,
            spawnType: "circle",
            spawnCircle: {
                x: 0,
                y: 0,
                r: 10,
            },
            emit: false,
            autoUpdate: true,
        });

        // Calculate the current time
        let elapsed = Date.now();

        // Update function every frame
        const update = () => {

            // Update the next frame
            // requestAnimationFrame(update);

            const now = Date.now();

            // The emitter requires the elapsed
            // number of seconds since the last update
            this.particlesEmitter.update((now - elapsed) * 0.001);
            elapsed = now;
        };

        // Start emitting
        this.startEmittingParticles();

        // Start the update
        // update();
        this.app.ticker.add(update);
    }


    private relocateViews(): void {
        /*
        this.screenBorder.width = this.app.initialWidth - 2;
        this.screenBorder.height = this.app.initialHeight - 2;
        window.console.log(this.screenBorder.width, this.screenBorder.height);
        */
        this.app.stage.removeChild(this.screenBorder);

        if (this.fullScreenButton) {
            this.fullScreenButton.position.set(this.app.initialWidth / 2 - this.fullScreenButton.width / 2, this.app.initialHeight / 2 - this.fullScreenButton.height / 2);
        }

        if (this.fullScreenText) {
            this.fullScreenText.position.set(this.app.initialWidth / 2 - this.fullScreenText.width / 2, this.app.initialHeight / 2 - 125);
        }

        if (this.loadingText) {
            this.loadingText.position.set(this.app.initialWidth / 5, 10);
        }


        if (this.layeredBunnies) {
            this.layeredBunnies.position.set(0);
                   // this.layeredBunnies.scale.set(this.app.initialWidth,this.app.initialWidth);
        }

        if (this.particlesContainer) {
            this.particlesContainer.position.set(this.app.initialWidth * 0.75, this.app.initialHeight * 0.5);
        }

 
    }
}

function createImageSprite(texture:PIXI.Texture, height:number) {
   const sprite = new PIXI.Sprite(texture);
   sprite.scale.set(height/sprite.height);
   return sprite;
}
function getTextWithImage(textSource: (string | number)[], imageTextures: PIXI.Texture[], textStyle:{}) {
    const DUMMYTEXTELEMENTHEIGHT = (new PIXI.Text("DUMMY",textStyle)).height;
    const textElements = textSource.map(txtOrImage => typeof txtOrImage === "string" ? new PIXI.Text(txtOrImage,textStyle) : createImageSprite(imageTextures[txtOrImage], DUMMYTEXTELEMENTHEIGHT) );
    // let startPos = {x: 10, y:40};
    let lastX = 0;
    const textWithImageContainer = new PIXI.Container();
    for (let e of textElements) {
        e.position.x = lastX;
        lastX += e.width;
        textWithImageContainer.addChild(e);
    }
    textWithImageContainer.scale.set(0.2)
    return textWithImageContainer;
}

