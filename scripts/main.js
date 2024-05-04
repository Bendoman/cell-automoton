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
let cellFillOpacity = 0.75;

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
let rowCount = 500;
let columnCount = 500;

let displayRowCount = 9*10;
let displayColumnCount = 16*10;

let originX = -2;
let originY = -2;

// Color code values
// TODO Color fadeout, very easy.
let minColorValue = 25;
let colorIncrement = 15;
let decayRate = 2.5;
let decayToggle = false;

let backgroundColor = '#343d46';
let strokeColor = '#FFF';
let highlightColor = "rgb(255, 100, 0)"

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
// let dragActive = false; 
canvas.addEventListener("pointerdown", (e) => {
    if(highlightedCell != null) {
        createGlider(highlightedCell[0], highlightedCell[1], rotation);
    }
});

// window.addEventListener("pointerup", (e) => { dragActive = false; });

let mouseX;
let mouseY;
canvas.addEventListener("pointermove", (e) => {
    let mousePos = getCursorPosition(canvas, e);
    mouseX = mousePos.x;
    mouseY = mousePos.y;

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
    // grid = [...Array(rowCount)].map(e => Array(columnCount).fill([0, 0]));
    setUpGrid(); 
    priorityDraw();

    clear_grid_button.blur();
}

function reset_grid_onclick() {
    // grid = [...Array(rowCount)].map(e => Array(columnCount).fill([0, 0]));
    setUpGrid(); 
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

//#region ( Helper Functions )

let scannedCells = [];
let nonZeroNeighbors = [];
function birthCell(y, x) {
    if(grid[y][x] == undefined)
        grid[y][x] = [0, 0, 0];
    
    nonZeroNeighbors.push([y, x, minColorValue]);
    grid[y][x][2] = minColorValue;
}

function setUpGrid() {    
    grid = [...Array(rowCount)].map(e => Array(columnCount));
    scannedCells = [];
    nonZeroNeighbors = [];

    birthCell(5, 6);
    birthCell(5, 7);
    birthCell(5, 8);

    birthCell(25, 24);
    birthCell(25, 25);
    birthCell(25, 26);

    createGlider(50, 10, 1);
    createGlider(12, 10, 4);    
    createGlider(55, 5, 3);
    createGlider(12, 25, 2);    
    createGlider(65, 32, 4);
    createGlider(12, 100, 4);


    // priorityDraw();
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
function getNeighbors(x, y) {
    if(x < 0 || x > columnCount || y < 0 || y > rowCount - 1)
        return;

    let neighbors = 0;
    
    // If these indecies are within the grid
    // Check cells at same rank in rows above and below.
    if(y - 1 >= 0) {
        if(grid[y - 1][x] >= minColorValue)
            neighbors++;
        if(x - 1 >= 0 && grid[y - 1][x - 1] >= minColorValue)
            neighbors++;
        if(x + 1 < columnCount && grid[y - 1][x + 1] >= minColorValue)
            neighbors++;
    }

    if(y + 1 < rowCount - 1) {
        if(grid[y + 1][x] >= minColorValue) 
            neighbors++;
        if(x - 1 >= 0 && grid[y + 1][x - 1] >= minColorValue) 
            neighbors++;   
        if(x + 1 < columnCount && grid[y + 1][x + 1] >= minColorValue) 
            neighbors++;    
    }

    // Check cells at rank plus/minus in same row.
    if(x - 1 >= 0 && grid[y][x - 1] >= minColorValue)
        neighbors++;
    if(x + 1 < columnCount && grid[y][x + 1] >= minColorValue) 
        neighbors++;    
    return neighbors;
} 

function getColor(hex) {
    return `rgb(${hex}, 0, ${hex})`
}

function validCoordinates(y, x) {
    return !(y < 0 || y >= rowCount || x < 0 || x >= columnCount);
} 

function updateScannedCell(y, x) {
    if(grid[y][x] == undefined)
        grid[y][x] = [0, 0, 0];

    // Incrementing Neighbors
    grid[y][x][0] += 1;

    if(grid[y][x][1] == 0) {
        // Setting scanned to one
        grid[y][x][1] = 1;
        scannedCells.push([y, x]);
    }            
}  

function updateNeighbors(cell) {
        let y = cell[0];
        let x = cell[1];
    
        // Left side
        y += 1;
        x -= 1;
        if(validCoordinates(y, x)) 
            updateScannedCell(y, x);

        y -= 1;
        if(validCoordinates(y, x)) 
            updateScannedCell(y, x);

        y -= 1;
        if(validCoordinates(y, x)) 
            updateScannedCell(y, x);
        
        x += 1;
        // Top
        if(validCoordinates(y, x)) 
            updateScannedCell(y, x);

        x += 1;
        // Right side
        if(validCoordinates(y, x)) 
            updateScannedCell(y, x);

        y += 1;
        if(validCoordinates(y, x)) 
            updateScannedCell(y, x);

        y += 1;
        if(validCoordinates(y, x)) 
            updateScannedCell(y, x);

        x -= 1;
        // Bottom
        if(validCoordinates(y, x)) 
            updateScannedCell(y, x);
}

function newUpdateCells() {
    rectWidth = canvas.width/displayColumnCount;
    rectHeight = canvas.height/displayRowCount;
    
    // Draw all non cells with more than 0 neighbors
    let offsetX;
    let offsetY;

    nonZeroNeighbors = structuredClone(nonZeroNeighbors);
    for(let i = nonZeroNeighbors.length - 1; i >= 0; i--) {
        cell = nonZeroNeighbors[i]
        if(cell[2] <= 0)
            continue;
        
        let y = cell[0];
        let x = cell[1];
        cell[2] = grid[y][x][2];

        offsetX = x - originX;
        offsetY = y - originY;  

        // Drawing based on viewport origin x and y 
        if(x >= originX && x <= originX + displayColumnCount &&
            y >= originY && y <= originY + displayRowCount && cell[2] > 0) {
            ctx.fillStyle = getColor(cell[2]);
            ctx.fillRect(offsetX * rectWidth, offsetY * rectHeight, rectWidth, rectHeight); 
        }

        // If cell is live, update n count for all neighboring cells
        if(cell[2] >= minColorValue)
            updateNeighbors(cell);

        if(cell[2] > 0 && cell[2] < minColorValue) 
            cell[2] -= decayRate;
            // return;
        
        if(cell[2] > 0 && cell[2] < 255) {
            cell[2] += colorIncrement;    
        }
    };

    for(let i = nonZeroNeighbors.length - 1; i >= 0; i--) {
        cell = nonZeroNeighbors[i];

        if(cell[2] < minColorValue)
            continue;

        let y = cell[0];
        let x = cell[1];
        let n = grid[y][x][0];

        // Death conditions       
        if(n < 2 || n > 3) {
            if(decayToggle)
                cell[2] = minColorValue - decayRate;    
            else 
                cell[2] = 0; 
            if(cell[2] == 0)
                nonZeroNeighbors.splice(i, 1);

        }

        // Updating value
        grid[y][x][2] = cell[2];
        
        // Resetting neighbor count to be recalculated next tick
        grid[y][x][0] = 0;
    }

    // Resetting scan toggle
    for(let i = scannedCells.length - 1; i >= 0; i-- ) {
        cell = scannedCells[i]
        let y = cell[0];
        let x = cell[1];

        grid[y][x][1] = 0;
        
        if(grid[y][x][2] < minColorValue && grid[cell[0]][cell[1]][0] == 3) {
            birthCell(y, x);
        }
        
        grid[y][x][0] = 0;
        scannedCells.splice(i, 1);
    };
}

// function newUpdateCells() {
//     updatedGrid = [];

//     rectWidth = canvas.width/displayColumnCount;
//     rectHeight = canvas.height/displayRowCount;
    
//     let offsetX;
//     let offsetY;

//     for(let i = 0; i < nonZeroCells.length; i++) {
//         //////////console.log(nonZeroCells.length, i);
//         grid[nonZeroCells[i][0]][nonZeroCells[i][1]] = nonZeroCells[i][2];
//     }

//     nonZeroCells.forEach((cell) => {
//         let y = cell[0];
//         let x = cell[1];

//         offsetX = x - originX;
//         offsetY = y - originY;

//         if(grid[y][x] == 0) {
//             nonZeroCells.splice(nonZeroCells.indexOf(cell), 1);
//             return;
//         }

//         if(cell[2] < minColorValue)
//             cell[2] -= decayRate;
//         if(cell[2] < 255)
//             cell[2] += colorIncrement;   

//         if(x >= originX && x <= originX + displayColumnCount &&
//             y >= originY && y <= originY + displayRowCount) {
//              ctx.fillStyle = getColor(x, y);
//              ctx.fillRect(offsetX * rectWidth, offsetY * rectHeight, rectWidth, rectHeight); 
//          }

//         if(cell[2] < minColorValue)
//             updatedGrid.push([y, x, cell[2]]);

//         // Itself
//         // //////////console.log(`Rules applying to cell y: ${y}, x: ${x}, m: ${grid[y][x]}`);
//         updatedGrid.push([y, x, applyLiveCellRules(y, x, cell[2])]);

//         // Left side
//         applyDeadCellRules(y + 1, x - 1, cell);
//         applyDeadCellRules(y, x - 1, cell);
//         applyDeadCellRules(y - 1, x - 1, cell);
        
//         // Top
//         applyDeadCellRules(y - 1, x, cell);

//         // Right side
//         applyDeadCellRules(y - 1, x + 1, cell);
//         applyDeadCellRules(y, x + 1, cell);
//         applyDeadCellRules(y + 1, x + 1, cell);

//         // Bottom
//         applyDeadCellRules(y + 1, x, cell);
//     });

//     // debugger;
//     // //////////console.log(nonZeroCells);
//     // nonZeroCells.push([y, x, grid[y][x]]);

//     updatedGrid.forEach((cell) => {
//         // //////////console.log(`Cell ${cell[0]}, ${cell[1]}, being updated with value ${cell[2]}`);
//         // if(!nonZeroCells.includes([cell[0], cell[1], cell[2]]))
        
//         if(!arrayIncludes(nonZeroCells, cell))
//             nonZeroCells.push([cell[0], cell[1], cell[2]]);

//         grid[cell[0]][cell[1]] = cell[2];
//     });
// }

// function updateCells() { 
//     updatedGrid = [];

//     rectWidth = canvas.width/displayColumnCount;
//     rectHeight = canvas.height/displayRowCount;
    
//     let offsetX;
//     let offsetY;

//     for(let y = 0; y < rowCount; y++) { 
//         for(let x = 0; x < columnCount; x++) { 
//             offsetX = x - originX;
//             offsetY = y - originY;

//             if(mouseX >= (offsetX * rectWidth) && mouseX < (offsetX * rectWidth) + rectWidth &&
//             mouseY >= (offsetY * rectHeight) && mouseY < (offsetY * rectHeight) + rectHeight) {
//                 ctx.fillStyle = highlightColor;
//                 ctx.fillRect(offsetX * rectWidth, offsetY * rectHeight, rectWidth, rectHeight); 
//                 highlightedCell = [x, y];
//                 displayGlider(x, y, rotation, offsetX, offsetY);
//             }

//             if(grid[y][x] > 0 && grid[y][x] < minColorValue) {
//                 grid[y][x] -= decayRate;
                
//                 if(x >= originX && x <= originX + displayColumnCount &&
//                     y >= originY && y <= originY + displayRowCount) {
//                         ctx.fillStyle = getColor(x, y);
//                         ctx.fillRect(offsetX * rectWidth, offsetY * rectHeight, rectWidth, rectHeight); 
//                 }
//             }

//             let n = getNeighbors(x, y);
//             updatedGrid.push([x, y, grid[y][x]]);

//             // if(x == 0 && y == 0) {
//             //     ctx.strokeStyle = "#DCE0D9";
//             //     ctx.strokeRect(offsetX * rectWidth, offsetY * rectHeight, rectWidth*columnCount, rectHeight*rowCount)
//             // }

//             if(grid[y][x] < minColorValue) {
//                 if(n == 3)
//                     updatedGrid[updatedGrid.length - 1][2] = minColorValue;
//                 continue;
//             }

//             if(x >= originX && x <= originX + displayColumnCount &&
//                y >= originY && y <= originY + displayRowCount) {
//                 ctx.fillStyle = getColor(x, y);
//                 ctx.fillRect(offsetX * rectWidth, offsetY * rectHeight, rectWidth, rectHeight); 
//             }
            
//             if(outlineCells) {
//                 ctx.strokeStyle = strokeColor;
//                 ctx.strokeRect(x * rectWidth, y * rectHeight, rectWidth, rectHeight); 
//             }
            
//             if(debugOptions) {
//                 ctx.strokeText(`[${x}, ${y}]`, x * rectWidth + 5, y * rectHeight + 10, rectWidth);
//                 ctx.strokeText(`[Neighbors = ${n}]`, x * rectWidth + 5, y * rectHeight + (rectHeight/2), rectWidth);
//             }
            
//             if(grid[y][x] != 0 && grid[y][x] < 255)
//                 updatedGrid[updatedGrid.length - 1][2] += colorIncrement;    

//             if(n < 2){
//                 if(decayToggle)
//                     updatedGrid[updatedGrid.length - 1][2] = minColorValue - decayRate;
//                 else 
//                     updatedGrid[updatedGrid.length - 1][2] = 0;
//             }
//             else if (n > 3) {
            
//                 if(decayToggle)            
//                     updatedGrid[updatedGrid.length - 1][2] = minColorValue - decayRate;
//                 else
//                     updatedGrid[updatedGrid.length - 1][2] = 0;
//             }
//         }
//     } 
//     // TODO Find a better way to copy an array by reference and do this all with only one loop if performance becomes an issue
//     for(let i = 0; i < updatedGrid.length; i++) {
//         grid[updatedGrid[i][1]][updatedGrid[i][0]] = updatedGrid[i][2];
//     }
// } 
 
function drawBoundary() {
    ctx.strokeStyle = "white";
    ctx.strokeRect(-originX * rectWidth, -originY * rectHeight, rectWidth*columnCount, rectHeight*rowCount)
}

setUpGrid();
function updateAndDraw() {
    if(!paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawBoundary();
        newUpdateCells();
    }
    setTimeout(updateAndDraw, tickDelay);
}
updateAndDraw();


//#endregion
function priorityDraw() {
    console.log(nonZeroNeighbors.length);

    rectWidth = canvas.width/displayColumnCount;
    rectHeight = canvas.height/displayRowCount;

    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all non cells with more than 0 neighbors
    let offsetX;
    let offsetY;
    for(let i = nonZeroNeighbors.length - 1; i >= 0; i--) {
        cell = nonZeroNeighbors[i];
        let y = cell[0];
        let x = cell[1];

        offsetX = x - originX;
        offsetY = y - originY;  

        // Drawing based on viewport origin x and y 
        if(x >= originX && x <= originX + displayColumnCount &&
            y >= originY && y <= originY + displayRowCount && cell[2] > 0) {
            ctx.fillStyle = getColor(cell[2]);
            ctx.fillRect(offsetX * rectWidth, offsetY * rectHeight, rectWidth, rectHeight); 
        }
    };
    
    drawBoundary();
}