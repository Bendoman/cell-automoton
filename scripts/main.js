// #region ( Canvas Setup )
let display_canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('canvas'));
let display_ctx = display_canvas.getContext("2d");

var canvas = document.createElement('canvas');
let ctx = canvas.getContext("2d", { willReadFrequently: true });

let width = window.innerWidth;
let height = window.innerHeight;




display_canvas.width = width;
display_canvas.height = height;

width = 1920;
height = 1080;
canvas.width = width;
canvas.height = height;

window.addEventListener("resize", (e) => {
    // width = window.innerWidth;
    // height = window.innerHeight;
    // canvas.width = width;
    // canvas.height = height;
    display_canvas.width = window.innerWidth;
    display_canvas.height = window.innerHeight;
});
// #endregion


// Much faster removal of elements from an array
Array.prototype.swapAndPop = function swapAndPop (index) {
    this[index] = this[this.length - 1];
    this.pop();
}

function validCoordinates(x, y) { return !(x <= 0 || x >= width || y <= 0 || y >= height) }

// Initial state setup
// ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);
const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
const initialStateData = initialState.data;

// initialStateData[(0 + 2 * canvas.width) * 4] = 255;// red
// initialStateData[(1 + 2 * canvas.width) * 4] = 255;// red
// initialStateData[(2 + 2 * canvas.width) * 4] = 255;// red
// initialStateData[(2 + 1 * canvas.width) * 4] = 255;// red
// initialStateData[(1 + 0 * canvas.width) * 4] = 255;// red
// initialStateData[(151 + 151 * canvas.width) * 4] = 255;// red
// initialStateData[(152 + 151 * canvas.width) * 4] = 255;// red


// initialStateData[(0 + 0 * canvas.width) * 4] = 255;// red
// initialStateData[(1 + 0 * canvas.width) * 4] = 255;// red
// initialStateData[(0 + 1 * canvas.width) * 4] = 255;// red
// initialStateData[(0 + 2 * canvas.width) * 4] = 255;// red


// Setting initial state cells to non zero array
let nonZeroArray = [];
// nonZeroArray.push([0, 0]);
// nonZeroArray.push([1, 0]);
// nonZeroArray.push([0, 1]);
// nonZeroArray.push([0, 2]);

// nonZeroArray.push([0, 2]);
// nonZeroArray.push([1, 2]);
// nonZeroArray.push([2, 2]);
// nonZeroArray.push([2, 1]);
// nonZeroArray.push([1, 0]);
// nonZeroArray.push([151, 151]);
// nonZeroArray.push([152, 151]);
// nonZeroArray.push([155, 150]);
// nonZeroArray.push([156, 150]);
// nonZeroArray.push([157, 150]);


for(let x = 1; x < width - 1; x++)
{
    initialStateData[(x + (height - 50) * width) * 4] = 255;
    nonZeroArray.push([x, (height - 50)]);
}

for(let y = 1; y < height; y++)
{
    initialStateData[(width/2 + y * width) * 4] = 255;
    nonZeroArray.push([width/2, y]);
}

for(let x = 1; x < width; x++)
{
    initialStateData[(x + height/2 * width) * 4] = 255;
    nonZeroArray.push([x, height/2]);
}

// for(let x = 1; x < width; x++)
// {
//     initialStateData[(x + ((height/2)+100) * width) * 4] = 255;
//     nonZeroArray.push([x, height/2+100]);
// }



// for(let y = 1; y < height; y++)
// {
//     initialStateData[(400 + y * width) * 4] = 255;
//     nonZeroArray.push([400, y]);
// }

// for(let x = 1; x < width; x++)
// {
//     initialStateData[(x + 700 * width) * 4] = 255;
//     nonZeroArray.push([x, 700]);
// }

// for(let x = 1; x < width - 1; x+=2)
// {
//     for(let y = 1; y < height - 1; y++)
//     {
//         initialStateData[(x + y * width) * 4] = 255;
//         nonZeroArray.push([x, y]);
//     }
// }
ctx.putImageData(initialState, 0, 0);


// Potentially uncomment
// function updateNeighbors(x, y, currentState, nextState) 
// {

//     return [currentState, nextState];
// }
let filterStrength = 20;
let frameTime = 0, lastLoop = new Date, thisLoop;
let currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
let currentStateData = currentState.data;

function updateLoop()
{
    var thisFrameTime = (thisLoop=new Date) - lastLoop;
    frameTime+= (thisFrameTime - frameTime) / filterStrength;
    lastLoop = thisLoop;

    let nextStateData = currentStateData.slice(0, currentStateData.length);

    // Tail decay for future
    for(let i = 0; i < nextStateData.length; i+=4) { nextStateData[i + 1] -= 1; }

    // (x + y * width) * 4
    // Address any pixel on the screen with x y coordinates
    for(let i = nonZeroArray.length - 1; i >= 0; i--)
    {
        let x = nonZeroArray[i][0];
        let y = nonZeroArray[i][1];

        if(currentStateData[(x + y * width) * 4] == 0) {
            nonZeroArray.swapAndPop(i);
            // nonZeroArray.splice(i, 1);
            continue;
        }
        
        let topLeft = validCoordinates(x-1, y-1) ? currentStateData[((x-1) + (y-1) * width) * 4] : -1;
        let middleLeft = validCoordinates(x-1, y) ? currentStateData[((x-1) + (y) * width) * 4] : -1;
        let bottomLeft = validCoordinates(x-1, y+1) ? currentStateData[((x-1) + (y+1) * width) * 4] : -1;

        let topRight = validCoordinates(x+1, y-1) ? currentStateData[((x+1) + (y-1) * width) * 4] : -1;
        let middleRight = validCoordinates(x+1, y) ? currentStateData[((x+1) + (y) * width) * 4] : -1;
        let bottomRight = validCoordinates(x+1, y+1) ? currentStateData[((x+1) + (y+1) * width) * 4] : -1;

        let top = validCoordinates(x, y-1) ? currentStateData[((x) + (y-1) * width) * 4] : -1;
        let bottom = validCoordinates(x, y+1) ? currentStateData[((x) + (y+1) * width) * 4] : -1;

        let sum = topLeft  + middleLeft  + bottomLeft  + 
                  topRight + middleRight + bottomRight + 
                  top + bottom;

        if(sum/250 < 2 || sum > (255 * 3)) {
            nextStateData[(x + y * width) * 4] = 0;
            nextStateData[(x + y * width) * 4 + 1] = 200;
        }
        
        //console.log(`Cell ${[x, y]} neighbor count at ${sum}`);
        // #region ( Left side )
        x--;
        y++;
        if(bottomLeft != -1 && bottomLeft < 255 && currentStateData[((x + y * width) * 4) + 2] < 4)
        {
            currentStateData[((x + y * width) * 4) + 2]++;
            //console.log(`Cell ${[x, y]} adding neighbor, count at: ${currentStateData[((x + y * width) * 4) + 2]}`);
            if(currentStateData[((x + y * width) * 4) + 2] == 3) 
            {
                nonZeroArray[nonZeroArray.length] = [x, y];
                nextStateData[(x + y * width) * 4] = 255;
            }
            else if(currentStateData[((x + y * width) * 4) + 2] > 3) 
                nextStateData[(x + y * width) * 4] = 0;
        }  
        y--;
        if(middleLeft != -1 && middleLeft < 255 && currentStateData[((x + y * width) * 4) + 2] < 4)
        {
            currentStateData[((x + y * width) * 4) + 2]++;
            //console.log(`Cell ${[x, y]} adding neighbor, count at: ${currentStateData[((x + y * width) * 4) + 2]}`);
            if(currentStateData[((x + y * width) * 4) + 2] == 3) 
            {
                nonZeroArray[nonZeroArray.length] = [x, y];
                nextStateData[(x + y * width) * 4] = 255;
            }
            else if(currentStateData[((x + y * width) * 4) + 2] > 3) 
                nextStateData[(x + y * width) * 4] = 0;
        }
        y--;
        if(topLeft != -1 && topLeft < 255 && currentStateData[((x + y * width) * 4) + 2] < 4)
        {
            currentStateData[((x + y * width) * 4) + 2]++;
            //console.log(`Cell ${[x, y]} adding neighbor, count at: ${currentStateData[((x + y * width) * 4) + 2]}`);
            if(currentStateData[((x + y * width) * 4) + 2] == 3) 
            {
                nonZeroArray[nonZeroArray.length] = [x, y];
                nextStateData[(x + y * width) * 4] = 255;
            }
            else if(currentStateData[((x + y * width) * 4) + 2] > 3) 
                nextStateData[(x + y * width) * 4] = 0;
        }
        // #endregion

        
        // #region ( Top )
        x++
        if(top != -1 && top < 255 && currentStateData[((x + y * width) * 4) + 2] < 4)
        {
            currentStateData[((x + y * width) * 4) + 2]++;
            //console.log(`Cell ${[x, y]} adding neighbor, count at: ${currentStateData[((x + y * width) * 4) + 2]}`);
            if(currentStateData[((x + y * width) * 4) + 2] == 3) 
            {
                nonZeroArray[nonZeroArray.length] = [x, y];
                nextStateData[(x + y * width) * 4] = 255;
            }
            else if(currentStateData[((x + y * width) * 4) + 2] > 3) 
                nextStateData[(x + y * width) * 4] = 0;
        }    
        // #endregion

        // #region ( Right side )
        x++;
        if(topRight != -1 && topRight < 255 && currentStateData[((x + y * width) * 4) + 2] < 4)
        {
            currentStateData[((x + y * width) * 4) + 2]++;
            //console.log(`Cell ${[x, y]} adding neighbor, count at: ${currentStateData[((x + y * width) * 4) + 2]}`);
            if(currentStateData[((x + y * width) * 4) + 2] == 3) 
            {
                nonZeroArray[nonZeroArray.length] = [x, y];
                nextStateData[(x + y * width) * 4] = 255;
            }
            else if(currentStateData[((x + y * width) * 4) + 2] > 3) 
                nextStateData[(x + y * width) * 4] = 0;
        }
        y++;
        if(middleRight != -1 && middleRight < 255 && currentStateData[((x + y * width) * 4) + 2] < 4)
        {
            currentStateData[((x + y * width) * 4) + 2]++;
            //console.log(`Cell ${[x, y]} adding neighbor, count at: ${currentStateData[((x + y * width) * 4) + 2]}`);
            if(currentStateData[((x + y * width) * 4) + 2] == 3) 
            {
                nonZeroArray[nonZeroArray.length] = [x, y];
                nextStateData[(x + y * width) * 4] = 255;
            }
            else if(currentStateData[((x + y * width) * 4) + 2] > 3) 
                nextStateData[(x + y * width) * 4] = 0;
        }
        y++;
        if(bottomRight != -1 && bottomRight < 255 && currentStateData[((x + y * width) * 4) + 2] < 4)
        {
            currentStateData[((x + y * width) * 4) + 2]++;
            //console.log(`Cell ${[x, y]} adding neighbor, count at: ${currentStateData[((x + y * width) * 4) + 2]}`);
            if(currentStateData[((x + y * width) * 4) + 2] == 3) 
            {
                nonZeroArray[nonZeroArray.length] = [x, y];
                nextStateData[(x + y * width) * 4] = 255;
            }
            else if(currentStateData[((x + y * width) * 4) + 2] > 3) 
                nextStateData[(x + y * width) * 4] = 0;
        }  
        // #endregion
        
        // #region ( Bottom )
        x--;
        if(bottom != -1 && bottom < 255 && currentStateData[((x + y * width) * 4) + 2] < 4)
        {
            currentStateData[((x + y * width) * 4) + 2]++;
            //console.log(`Cell ${[x, y]} adding neighbor, count at: ${currentStateData[((x + y * width) * 4) + 2]}`);
            if(currentStateData[((x + y * width) * 4) + 2] == 3) 
            {
                nonZeroArray[nonZeroArray.length] = [x, y];
                nextStateData[(x + y * width) * 4] = 255;
            }
            else if(currentStateData[((x + y * width) * 4) + 2] > 3) 
                nextStateData[(x + y * width) * 4] = 0;
        } 
        // #endregion
    }

    currentState.data.set(nextStateData);
    ctx.putImageData(currentState, 0, 0);

    display_ctx.scale(window.innerWidth/width, window.innerHeight/height);
    display_ctx.drawImage(canvas, 0, 0);
    display_ctx.scale(1/(window.innerWidth/width), 1/(window.innerHeight/height));


    // display_ctx.scale(6, 6);
    display_ctx.clearRect(0, 0, 200, 20);
    display_ctx.strokeStyle = "green";
    display_ctx.strokeText(`FPS: ${(1000/frameTime).toFixed(1)}`, 10, 10);
    display_ctx.strokeText(`cell count: ${nonZeroArray.length.toLocaleString()}`, 75, 10);
    // display_ctx.scale(1/6, 1/6);
    
    window.requestAnimationFrame(updateLoop);
}
// display_ctx.scale(5, 5);
display_ctx.imageSmoothingEnabled = false;

window.requestAnimationFrame(updateLoop);