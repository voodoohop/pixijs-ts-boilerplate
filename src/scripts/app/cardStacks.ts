import { Stage } from "pixi-layers";

// import {TweenLite} from "gsap";
import {
    Dom,
    PixiAppWrapper as Wrapper,
    pixiAppWrapperEvent as WrapperEvent,
    PixiAppWrapperOptions as WrapperOpts,
} from "pixi-app-wrapper";

export enum Side {left,right };

const stackDisplacement = 0.05;    

function easeInOutQuad (t:number) { return t<.5 ? 2*t*t : -1+(4-2*t)*t }

export default function initializeCardStacks(app: Wrapper):Function {
    let cardStacks :  {left:PIXI.Sprite[], right:PIXI.Sprite[]}= {left:[],right:[]};
 
    
    function getCardPos(side:Side) {
        const x = ((side === Side.left) ? 100 : 300) ;
        const y = 250;
        const numInStack = (side === Side.left ? cardStacks.left : cardStacks.right).length;
        const displacement = stackDisplacement * numInStack;
        return {x: x+ displacement, y:y+displacement}
    }

    function moveFirstToRightStackAndGetNewPosition() {
        const card= cardStacks.left.pop() ;
        if (!card)
            return undefined;
        // const card =  topBunny;
        const newLength = cardStacks.right.push(card);
        const displacement = stackDisplacement * newLength;
        card.zIndex = 144+newLength;

        const {x,y} = getCardPos(Side.right);
        return {card, x,y }
    }

    const container = new PIXI.Container();

    // for performance separate moving from nonMoving objects
    const movingContainer = new PIXI.Container();

    // const layer = new PIXI.display.Layer();
    // layer.group.enableSort = true;
    // app.stage.addChild(layer);
    // container.parentLayer = layer;

    for (let i = 0; i < 144; i++) {
        const card = new PIXI.Sprite(PIXI.loader.resources.card.texture);
        
        card.anchor.set(0.5);
        card.scale.set(100.0 / card.width); 
        const {x,y} = getCardPos(Side.left);
        card.x = x;
        card.y = y;
        card.zIndex = i;
      
        cardStacks.left.push(card);
        container.addChild(card);
    }
    app.stage.addChild(container);
    app.stage.addChild(movingContainer);

    const interval = setInterval(() => {
        const hasCardToMove = moveFirstToRightStackAndGetNewPosition();
        if (hasCardToMove) {
            const {card,x,y} = hasCardToMove;
            container.cacheAsBitmap=false;
            container.removeChild(card);
            container.cacheAsBitmap=true;
            movingContainer.addChild(card);
            const startTime = Date.now();
            const startX = card.position.x;
            const startY = card.position.y;
            const tweener = ():void => {
                const time = Date.now();
                const progress =  Math.min(1,(time-startTime)/2000);
                if (progress >=1 ) {
                    app.ticker.remove(tweener);
                    movingContainer.removeChild(card);
                    container.cacheAsBitmap=false;
                    container.addChild(card);
                    container.cacheAsBitmap=true;
                }
                const easedProgress = easeInOutQuad(progress);
                card.position.set(startX+(x-startX)*easedProgress,startY+(y-startY)*easedProgress )

            }           
            app.ticker.add(tweener);
            // TweenLite.to(card, 2, {x,y});
        }
    },1000)
    return function removeCardStacks():void {
        clearInterval(interval);
        app.stage.removeChild(container);
        container.destroy();
    }
}