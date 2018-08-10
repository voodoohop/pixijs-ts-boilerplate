

function createImageSprite(texture:PIXI.Texture, height:number) {
    const sprite = new PIXI.Sprite(texture);
    sprite.scale.set(height/sprite.height);
    return sprite;
 }

 function getTextWithImage(textSource: (string | number)[], imageTextures: PIXI.Texture[], textStyle:{}) {
    const DUMMYTEXTELEMENTHEIGHT = (new PIXI.Text("DUMMY",textStyle)).height;
    const textElements = textSource.map(txtOrImage => typeof txtOrImage === "string" ? new PIXI.Text(txtOrImage,textStyle) : createImageSprite(imageTextures[txtOrImage], DUMMYTEXTELEMENTHEIGHT) );
    let lastX = 0;
    const textWithImageContainer = new PIXI.Container();
    for (let e of textElements) {
        e.position.x = lastX;
        lastX += e.width;
        textWithImageContainer.addChild(e);
    }
    // textWithImageContainer.scale.set(0.2)
    return textWithImageContainer;
}

export default function initializeTextWithImages(multiTextureResource: string): {textRenderer: Function, numImages: number} {
    let images = PIXI.loader.resources[multiTextureResource].textures;
    let imageTextures:PIXI.Texture[] = null;
    if (images) {  
        imageTextures = Object.keys(<{}>images).map((textureName) => images[textureName])
        console.log(imageTextures);     
    }
    return {
        textRenderer: function renderTextWithImage(textSource: (string | number)[], textStyle:{}):PIXI.Container {
            return getTextWithImage(textSource, imageTextures, textStyle);
        },
        numImages: Object.keys(images).length
    }
}



const randomStrings = "Lorizzle ipsum bling bling sit amizzle, consectetuer adipiscing elit. Nizzle sapien velizzle, bling bling volutpat, suscipit, gravida vel, arcu. Check it out hizzle thats the shizzle. We gonna chung erizzle. Fo izzle dolor fo turpis tempizzle tempor. Gangsta boom shackalack mofo et turpizzle. Sizzle izzle tortor. Pellentesque uhuh ... yih!".split(" ")
   
function randomWord() {
        return randomStrings[Math.floor(Math.random()*randomStrings.length)]
    }
    
    function getRandomImageText(numImages:number): (string|number)[]{
        const length = Math.ceil(Math.random()*10);
        let text = Array.apply(null, Array<undefined>(length)).map(() => Math.random() < 0.7 ? randomWord()+" ": Math.floor(Math.random() * numImages))
        // console.log(text)
        return text;
    }

    export function drawRandomTextWithImages(stage:PIXI.Container):Function{
        const {textRenderer,numImages} = initializeTextWithImages("candies");
        console.log(stage)
        const interval = setInterval(() => {
            const t = textRenderer(getRandomImageText(numImages), {fill: "white", fontSize: Math.random()*20+6});
            t.position.set(Math.random()*(500-t.width),Math.random()*(500-t.height))
            stage.addChild(t);
            setTimeout(() => stage.removeChild(t), Math.random()*5000);
        }, 1000)

        return function removeTextWithImage() {
            clearInterval(interval);
        }
    }