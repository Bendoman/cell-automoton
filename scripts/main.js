// Customizable conways game of life simulator.
// You will be able to adjust zoom level, place down individual blocks, play and pause the simulation, change the color rules, change the reproduction rules.
// Select from preset starter builds and save their own for later. 

//#region ( Canvas Setup )
let canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('canvas'));
let ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", (e) => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
//#endregion

//#region ( Elements )
let lock_toggle_on = false;
let toggle = document.getElementById("sidebar_expand");
let canvas_container = document.getElementById("canvas_container");
let sidebar = document.getElementById("sidebar");

let fastforward_counter = document.getElementById("fastforward_counter");
let trail_toggle_checkbox = document.getElementById("trail_toggle_checkbox");
trail_toggle_checkbox.checked = false;
let clear_grid_button = document.getElementById("clear_grid_button");

let play_svg = document.getElementById("play_svg");
let pause_svg = document.getElementById("pause_svg");
let rewind_svg = document.getElementById("rewind_svg");
let fastforward_svg = document.getElementById("fastforward_svg");
let controls_container = document.getElementById("controls_container");
//#endregion

//#region ( Helper Methods )
// Gets the cursors x and y positions on the provided canvas based on event trigger
function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    let mousePos = {
      x: x,
      y: y
    };
    
    return mousePos;
}
//#endregion

//#region ( Variables )
let cellSize = 35;
let boardOriginX = 0;
let boardOriginY = 0; 

let imageScaling = 1;
let scrollSpeed = 2;
// let zoomspeed = 5;

let baseTickDelay = 100;
let tickDelay = baseTickDelay;

let counterValue = 7;
let delayIncrement = 25;
let paused = false;

let debugOptions = false;
let outlineCells = false;

// Grid variables
let rowCount = 1000;
let columnCount = 1000;

let displayRowCount = 9*10;
let displayColumnCount = 16*10;

let originX = -2;
let originY = -2;

// Color code values
// TODO Color fadeout, very easy.
let minColorValue = 255;
let colorIncrement = 15;
// TODO CUSTOM DECAY RATE SLIDER
let decayRate = 5;
let decayToggle = false;

let backgroundColor = '#343d46';
let strokeColor = '#FFF';
let highlightColor = "rgb(255, 100, 0)"
let highlightedCell = [];

let rotation = 1;

//#region ( TODO Board )
// TODO Interpret JSON object as automoton
// TODO Store JSON in browser db
// TODO Display ghost of automoton to place
// TODO Section to the side, css transition on collapse animation.
// TODO Update canvas size accordingly
// TODO Scroll based on number of cells dragged across

// TODO Remove width definition from elements so that it is responsive
// TODO Birth on phone pointerup at x and y
// TODO Pinch zoom for phone

// TODO FPS and cell counters

// TODO Fix sidebar content scrolling

// TODO Split live cell rules and read cell rules into seperate functions

// TODO Pause returns gamespeed to previous and add a slowdown button

// TODO Check live cell and all its dead neighbors instead of every single cell.

// TODO Have reset grid set it back to what it was before playing the simulation ( If paused and cleared ) 
// TODO Extended, have STOP button to make this more clear, with tooltip.
// TODO ctrl z + ctrl y ( Only works while paused )

// TODO Drag to spawn option
// TODO rick click to delete


// TODO:DONE Highlight selected playback option

// TODO Fix reset grid pause bug 
//#endregion


// grid = Array.apply(null, Array(rowCount)).map(function () {})

// To zoom in or out, create a new grid with the updated row and column count and transpose the old onto new 
// ( smaller grid can be applied directly overtop, smaller grid much the same just with check to see if index exists )
let rectWidth;
let rectHeight;

//#region ( Event Listeners )
window.addEventListener("resize", (e) => { priorityDraw(); });

//#region ( Failed Drag to Move )
let dragActive = false; 
canvas.addEventListener("pointerdown", (e) => {
    findCursor();
    if(highlightedCell != null) {

        for(let i = 0; i < columnCount/2; i++) {
            birthCell(highlightedCell[0], highlightedCell[1] + i);
        }
        priorityDraw(); 
    }
    dragActive = true; 
});

canvas.addEventListener("pointerup", (e) => { dragActive = false; })

let mouseX;
let mouseY;
let previousHighlightedCell = [];
canvas.addEventListener("pointermove", (e) => {
    let mousePos = getCursorPosition(canvas, e);
    mouseX = mousePos.x;
    mouseY = mousePos.y;
 
    // findCursor();
    
    // if(!dragActive || (highlightedCell[0] == previousHighlightedCell[0] && highlightedCell[1] == previousHighlightedCell[1]))
    //     return
    // birthCell(highlightedCell[0], highlightedCell[1]);


    // priorityDraw()      
});
//#endregion

canvas.addEventListener("wheel", (e) => {
    if(e.deltaY > 0) {
        displayRowCount += 9;
        displayColumnCount += 16;
    }
    else if(e.deltaY < 0 && displayRowCount > 0 && displayColumnCount - 16 > 0) {
        displayRowCount -= 9;
        displayColumnCount -= 16;
    }
    priorityDraw();
});

window.addEventListener("keypress", (e) => {
    if(e.code == "Space") {
        paused = !paused

        if(paused) {
            play_svg.classList.remove("controls_selected");
        } else {
            play_svg.classList.add("controls_selected");
        }
         
        pause_svg.classList.toggle("controls_selected");
    }
});


let map = {};
window.addEventListener("keydown", (e) => {
    map[e.code] = e.type == 'keydown';

    if(map["KeyW"] || map["ArrowUp"])
        originY -= scrollSpeed; 

    if(map["KeyS"] || map["ArrowDown"])
        originY += scrollSpeed; 

    if(map["KeyA"] || map["ArrowLeft"])
        originX -= scrollSpeed; 

    if(map["KeyD"] || map["ArrowRight"])
        originX += scrollSpeed; 
    
    if(map["KeyR"]) {
        if(rotation < 3)
            rotation++;
        else if(rotation == 3)
            rotation = 0;
    }

    priorityDraw();
});

window.addEventListener("keyup", (e) => {
    map[e.code] = e.type == 'keydown';
});

function expand_onclick() {
    toggle.classList.add("hidden");
    sidebar.classList.add("expanded");
}

function collapse_onclick() {
    toggle.classList.remove("hidden");
    sidebar.classList.remove("expanded");
}

function pause_onclick() { 
    play_svg.classList.remove("controls_selected");
    rewind_svg.classList.remove("controls_selected");
    fastforward_svg.classList.remove("controls_selected");
    
    pause_svg.classList.add("controls_selected");

    paused = true; 
}

function play_onclick() { 
    pause_svg.classList.remove("controls_selected");
    fastforward_svg.classList.remove("controls_selected");
    rewind_svg.classList.remove("controls_selected");
    
    play_svg.classList.add("controls_selected");

    paused = false; 
}

function fastforward_onclick() { 
    if(paused) {
        pause_svg.classList.remove("controls_selected");
        play_svg.classList.add("controls_selected");
    }
    paused = false; 

    if(tickDelay - delayIncrement < 10) 
        return;

    tickDelay -= delayIncrement;
}

function rewind_onclick() {
    if(paused) {
        pause_svg.classList.remove("controls_selected");
        play_svg.classList.add("controls_selected");
    }
    paused = false; 
    
    if(tickDelay + delayIncrement > 300)
        return;

    tickDelay += delayIncrement;
}

function trail_toggle_onclick() { decayToggle = trail_toggle_checkbox.checked; }

function clear_grid_onclick() {
    values_grid = [...Array(rowCount)].map(e => Array(columnCount));
    neighbors_grid = [...Array(rowCount)].map(e => Array(columnCount));
    non_zero_cells = [];


    priorityDraw();
    clear_grid_button.blur();
}

function reset_grid_onclick() {
    values_grid = [...Array(rowCount)].map(e => Array(columnCount));
    neighbors_grid = [...Array(rowCount)].map(e => Array(columnCount));
    non_zero_cells = [];

    priorityDraw();
    clear_grid_button.blur();
}

function recenter_onclick() {
    originX = -2;
    originY = -2;
    priorityDraw();
}

function reset_zoom_onclick() {
    displayRowCount = 9*10;
    displayColumnCount = 16*10;
    priorityDraw();
}
//#endregion



let values_grid = [];
let neighbors_grid = [];

let changed_cells = [];
let non_zero_cells = [];
function birthCell(y, x) {
    if(!validCoordinates(y, x))  
        return; 

    non_zero_cells.push([y, x]);
    values_grid[y][x] = minColorValue;
    neighbors_grid[y][x] = 0;
}

function setUpGrid() {    
    values_grid = [...Array(rowCount)].map(e => Array(columnCount));
    neighbors_grid = [...Array(rowCount)].map(e => Array(columnCount));
    non_zero_cells = [];

    birthCell(1, 0);
    birthCell(1, 1);
    birthCell(1, 2);

    createGlider(10, 10, 4);
}
//#endregion

//#region ( Automoton Factories )
// Somehow do rotation
function createGlider(x, y, rotation) {
    // Point of origin
    birthCell(y, x);

    let yOffset = 1;
    let xOffset = 1; 
    if(rotation == 1) {
        yOffset = 1;
        xOffset = -1; 
    } else if (rotation == 3) {
        yOffset = -1;
        xOffset = 1; 
    } else if (rotation == 2) {
        yOffset = -1;
        xOffset = -1; 
    }


    birthCell(y + (1*yOffset), x);
    birthCell(y + (2*yOffset), x);

    birthCell(y + (2*yOffset), x - (1*xOffset));
    birthCell(y + (1*yOffset), x - (2*xOffset));
}

function displayGlider(x, y, rotation, offsetX, offsetY) {
    let yOffset = 1;
    let xOffset = 1; 
    if(rotation == 1) {
        yOffset = 1;
        xOffset = -1; 
    } else if (rotation == 3) {
        yOffset = -1;
        xOffset = 1; 
    } else if (rotation == 2) {
        yOffset = -1;
        xOffset = -1; 
    }

    ctx.fillStyle = highlightColor;
    // [y + (1*yOffset)][x]
    ctx.fillRect(offsetX * rectWidth, ((offsetY + 1*yOffset) * rectHeight), rectWidth, rectHeight); 

    // [y + (1*yOffset)][x - (2*xOffset)]
    ctx.fillRect((offsetX - (2*xOffset)) * rectWidth, ((offsetY + 1*yOffset) * rectHeight), rectWidth, rectHeight); 

    // [y + (2*yOffset)][x]
    ctx.fillRect(offsetX * rectWidth, ((offsetY + 2*yOffset) * rectHeight), rectWidth, rectHeight); 

    // [y + (2*yOffset)][x - (1*xOffset)]
    ctx.fillRect((offsetX - (1*xOffset)) * rectWidth, ((offsetY + 2*yOffset) * rectHeight), rectWidth, rectHeight); 
}
//#endregion

//#region ( Loop logic )
function getColor(hex) {
    return `rgb(${hex}, 0, ${hex})`
}

function validCoordinates(y, x) {
    return !(y < 0 || y >= rowCount || x < 0 || x >= columnCount);
} 

function drawBoundary() {
    ctx.strokeStyle = "white";
    ctx.strokeRect(-originX * rectWidth, -originY * rectHeight, rectWidth*columnCount, rectHeight*rowCount)
}

function updateNeighbor(cellY, cellX, y, x) {
    if(validCoordinates(y, x)) 
    {
        
        // Living cell neighbor
        if(values_grid[y][x] >= minColorValue) 
        {
            neighbors_grid[cellY][cellX]++;
        } 
        else 
        {
            if(neighbors_grid[y][x] == undefined)
                neighbors_grid[y][x] = 0;
            if(values_grid[y][x] == undefined)
                values_grid[y][x] = 0;

            // Dead cell neighbor
            neighbors_grid[y][x]++;
            // console.log(`Dead cell ${[y,x]} updated neighbors to ${neighbors_grid[y][x]}`)
            if(neighbors_grid[y][x] == 3)
                changed_cells.push([y, x]);

        }
        
    }
}

function updateNeighbors(cell) {
    let cellY = cell[0];
    let cellX = cell[1];
    neighbors_grid[cellY][cellX] = 0;
    // console.log(`Cell ${cell} updating neighbors`);

    // Left side
    let y = cellY + 1;
    let x = cellX - 1;
    updateNeighbor(cellY, cellX, y, x); y--;
    updateNeighbor(cellY, cellX, y, x); y--;
    updateNeighbor(cellY, cellX, y, x); 
    
    // Top
    x++; updateNeighbor(cellY, cellX, y, x); x++; 

    // Right side
    updateNeighbor(cellY, cellX, y, x); y++;
    updateNeighbor(cellY, cellX, y, x); y++;
    updateNeighbor(cellY, cellX, y, x);

    // Bottom
    x--; updateNeighbor(cellY, cellX, y, x); 

    let neighbors = neighbors_grid[cellY][cellX];
    if(neighbors < 2 || neighbors > 3) 
        changed_cells.push(cell);
}

let updatedGrid = [];
function updateGrid() 
{
    rectWidth = width/displayColumnCount;
    rectHeight = height/displayRowCount;


    changed_cells = [];

    ctx.scale(rectWidth, rectHeight);
    for(let i = non_zero_cells.length - 1; i >= 0; i--)
    {
        let cell = non_zero_cells[i];
        let y = cell[0];
        let x = cell[1];
        
        // Drawing based on viewport origin x and y 
        // TODO REPLACE THIS WITH WEBGL LOGIC
        offsetX = x - originX;
        offsetY = y - originY;  
        if(x >= originX && x <= originX + displayColumnCount &&
            y >= originY && y <= originY + displayRowCount && values_grid[y][x] > 0) {
            ctx.fillStyle = getColor(values_grid[y][x]);
            // ctx.fillRect(offsetX * rectWidth, offsetY * rectHeight, rectWidth, rectHeight); 
            ctx.fillRect(offsetX, offsetY, 1, 1); 
        } 
        if(values_grid[y][x] <= 0) {
            non_zero_cells.splice(i, 1);
            continue;
        }
        

        if(values_grid[y][x] < minColorValue) {
            values_grid[y][x] -= decayRate;
            continue;
        }

        if(values_grid[y][x] >= minColorValue)
            updateNeighbors(cell);  
        
    }
    ctx.scale(1/rectWidth, 1/rectHeight);

    changedLoop();


}

function changedLoop() {
    ctx.strokeStyle = "white";
    // ctx.strokeText(`changed_cells count: ${changed_cells.length}`, 500, 10);
    for(let i = 0; i < changed_cells.length; i++) 
    {
        let cell = changed_cells[i];
        let y = cell[0];
        let x = cell[1];

        // console.log(`Cell ${cell} changed`);
        if(values_grid[y][x] >= minColorValue) {
            // console.log(`Cell ${cell} marked for death`);
            if(decayToggle)
                values_grid[y][x] = minColorValue - decayRate;
            else 
                values_grid[y][x] = 0;

            continue; 
        }

        if(neighbors_grid[y][x] == 3) {
            // console.log(`Cell ${cell} marked for BIRTH: Value ${values_grid[y][x]}`);
            if(values_grid[y][x] == 0)
                non_zero_cells.push([y, x]);
            values_grid[y][x] = minColorValue;
        }
    }
}


setUpGrid();
var filterStrength = 20;
var frameTime = 0, lastLoop = new Date, thisLoop;

let width = canvas.width;
let height = canvas.height;

base_grid = [...Array(rowCount)].map(e => Array(columnCount));
function updateAndDraw() {

    var thisFrameTime = (thisLoop=new Date) - lastLoop;
    frameTime+= (thisFrameTime - frameTime) / filterStrength;
    lastLoop = thisLoop;


    // neighbors_grid = [[]];
    // neighbors_grid = base_grid;
    neighbors_grid = structuredClone(base_grid);
    // neighbors_grid = [...Array(rowCount)].map(e => Array(columnCount));
    if(!paused) {
        // Reset neighbors
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        updateGrid();
        drawBoundary();
    }
    ctx.strokeStyle = "white";
    ctx.strokeText(`Drawn cell count: ${non_zero_cells.length}`, 250, 10);
    ctx.strokeText(`FPS: ${(1000/frameTime).toFixed(1)}`, 10, 10);
    // setTimeout(updateAndDraw, tickDelay);
    // console.log("\n==========\n")
    // debugger;
    window.requestAnimationFrame(updateAndDraw);
}
updateAndDraw();


function priorityDraw() {
    rectWidth = canvas.width/displayColumnCount;
    rectHeight = canvas.height/displayRowCount;

    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    
    // Draw all non cells with more than 0 neighbors
    let offsetX;
    let offsetY;
    for(let i = non_zero_cells.length - 1; i >= 0; i--) {
        cell = non_zero_cells[i];
        let y = cell[0];
        let x = cell[1];

        offsetX = x - originX;
        offsetY = y - originY;  

        // Drawing based on viewport origin x and y 
        if(x >= originX && x <= originX + displayColumnCount &&
            y >= originY && y <= originY + displayRowCount && values_grid[y][x] > 0) {
            ctx.fillStyle = getColor(values_grid[y][x]);
            ctx.fillRect(offsetX * rectWidth, offsetY * rectHeight, rectWidth, rectHeight); 
        }   
    }
    
    drawBoundary();
}

function drawMouseCircle(y, x) {

}

function findCursor() {
    rectWidth = canvas.width/displayColumnCount;
    rectHeight = canvas.height/displayRowCount;

    for(let y = 0; y < displayRowCount; y++) {
        for(let x = 0; x < displayColumnCount; x++) {
            if(mouseX >= (x * rectWidth) && mouseX < (x * rectWidth) + rectWidth &&
            mouseY >= (y * rectHeight) && mouseY < (y * rectHeight) + rectHeight) {
                // if(highlightedCell)
                highlightedCell = [y + originY, x + originX];
            }
        }
    }
}
//#endregion


