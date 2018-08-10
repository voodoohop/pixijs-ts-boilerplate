
import {
    Dom,
    PixiAppWrapper as Wrapper,
    pixiAppWrapperEvent as WrapperEvent,
    PixiAppWrapperOptions as WrapperOpts,
} from "pixi-app-wrapper";
import {Asset, AssetPriority, LoadAsset, PixiAssetsLoader, SoundAsset} from "pixi-assets-loader";
import "pixi-particles";

import initializeCardStacks from "./cardStacks";

import initializeTextWithImages, { drawRandomTextWithImages } from "./textWithImages";

import createParticleSystem from "./fireParticles";
/**
 * Showcase for PixiAppWrapper class.
 */




 export function SoftgamesApp() {
 
    let totalAssets: number;
    let loadingProgress: number;
    let assetsCount: { [key: number]: { total: number, progress: number } } = {};

    const width=500;
    const height=500;

    const canvas = Dom.getElementOrCreateNew<HTMLCanvasElement>("app-canvas", "canvas", document.getElementById("app-root"));

    let cardStackButton = <HTMLInputElement> document.getElementById("cardsToggle");
    let particleButton = <HTMLInputElement>document.getElementById("fireToggle");
    let imageTextButton = <HTMLInputElement>document.getElementById("imageTextToggle");
    let fullScreenButton  = <HTMLInputElement>document.getElementById("fullscreenToggle");
    let particleDestroy:Function=null;
    let cardStackDestroy:Function=null;
    let imageTextDestroy:Function   =null;

    cardStackButton.onclick = () => {
        if (cardStackButton.checked)
            cardStackDestroy = initializeCardStacks(app);
        else
            cardStackDestroy && cardStackDestroy();
    };

    particleButton.onclick = () => {
        if (particleButton.checked)
            particleDestroy = createParticleSystem(app);
        else
            particleDestroy && particleDestroy();
    }

    imageTextButton.onclick = () => {
        if (imageTextButton.checked)
            imageTextDestroy = drawRandomTextWithImages(app.stage);
        else
            imageTextDestroy && imageTextDestroy();
    }

    fullScreenButton.onclick = () => {
        if (fullScreenButton.checked)
            document.getElementById("app-root").requestFullscreen();
        else
            document.exitFullscreen();
    }
    // if no view is specified, it appends canvas to body
    const appOptions: WrapperOpts = {
        width,
        height,
        scale: "keep-aspect-ratio",
        align: "middle",
        resolution: window.devicePixelRatio,
        roundPixels: true,
        transparent: false,
        backgroundColor: 0x000000,
        view: canvas,
        showFPS: true,
        changeOrientation: true,
    };

    const app: Wrapper = new Wrapper(appOptions);
 
    // createViews(); 
    const assets = [
        {id: "card", url: "assets/gfx/cardbacksmall.png", priority: AssetPriority.HIGH, type: "texture"},
        {id: "candies", url: "assets/gfx/candies.json", priority: AssetPriority.LOWEST, type: "atlas"},
        {id: "flame", url: "assets/gfx/flame.json", priority: AssetPriority.LOWEST, type: "atlas"},

      ];

      

    const loader: PixiAssetsLoader = new PixiAssetsLoader();
    loader.on(PixiAssetsLoader.PRIORITY_GROUP_LOADED, onAssetsLoaded);





    loader.addAssets(assets).load();
    



    const textStyle = new PIXI.TextStyle({
        fontFamily: "Verdana",
        fontSize: 24,
        fill: "#FFFFFF",
        wordWrap: true,
        wordWrapWidth: 440,
    });

    function createViewsByPriority(priority: number): void {
        switch (priority) {

            case AssetPriority.HIGH:
                cardStackDestroy = initializeCardStacks(app);
                cardStackButton.disabled = false;
                break;

            case AssetPriority.LOWEST:

                particleButton.disabled = false;
                imageTextButton.disabled = false;
                break;
            default:
                break;
        }
    }

    function onAssetsLoaded(args: { priority: number, assets: LoadAsset[] }): void {
        createViewsByPriority(args.priority);

    }


    




    
    
    



    }