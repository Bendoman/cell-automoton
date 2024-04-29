// Customizable conways game of life simulator.
// You will be able to adjust zoom level, place down individual blocks, play and pause the simulation, change the color rules, change the reproduction rules.
// Select from preset starter builds and save their own for later. 

//#region ( Canvas Setup )
var canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('canvas'));
var ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", (e) => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
//#endregion

//#region ( Elements )
var lock_toggle_on = false;
var toggle = document.getElementById("sidebar_expand");
var canvas_container = document.getElementById("canvas_container");
var sidebar = document.getElementById("sidebar");

var fastforward_counter = document.getElementById("fastforward_counter");
var trail_toggle_checkbox = document.getElementById("trail_toggle_checkbox");
trail_toggle_checkbox.checked = false;
var clear_grid_button = document.getElementById("clear_grid_button");
//#endregion

//#region ( Helper Methods )
// Gets the cursors x and y positions on the provided canvas based on event trigger
function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    var mousePos = {
      x: x,
      y: y
    };
    
    return mousePos;
}
//#endregion

//#region ( Variables )
var cellSize = 35;
var boardOriginX = 0;
var boardOriginY = 0; 
var cellFillOpacity = 0.75;

var imageScaling = 1;
var scrollSpeed = 2;
// var zoomspeed = 5;
var gameSpeed = 100;
var paused = false;


var debugOptions = false;
var outlineCells = false;

// Grid variables
var rowCount = 86;
var columnCount = 156;

var displayRowCount = 9*10;
var displayColumnCount = 16*10;

var originX = -2;
var originY = -2;

// Color code values
// TODO Color fadeout, very easy.
var minColorValue = 25;
var colorIncrement = 15;
var decayRate = 2.5;
var decayToggle = false;

var backgroundColor = '#343d46';
var strokeColor = '#FFF';
var highlightColor = "rgb(255, 100, 0)"

var rotation = 1;

//#region ( TODO Board )
// TODO Interpret JSON object as automoton
// TODO Store JSON in browser db
// TODO Display ghost of automoton to place
// TODO Section to the side, css transition on collapse animation.
// TODO Update canvas size accordingly
//#endregion


// grid = Array.apply(null, Array(rowCount)).map(function () {})

// To zoom in or out, create a new grid with the updated row and column count and transpose the old onto new 
// ( smaller grid can be applied directly overtop, smaller grid much the same just with check to see if index exists )
var grid = [...Array(rowCount)].map(e => Array(columnCount).fill(0));

var rectWidth;
var rectHeight;

//#region ( Event Listeners )
window.addEventListener("resize", (e) => { priorityDraw(); });

//#region ( Failed Drag to Move )
// var dragActive = false; 
canvas.addEventListener("pointerdown", (e) => {
    if(highlightedCell != null) {
        // birthCell(highlightedCell[0], highlightedCell[1]);
        createGlider(highlightedCell[0], highlightedCell[1], rotation);
    }
});

// window.addEventListener("pointerup", (e) => { dragActive = false; });

var mouseX;
var mouseY;
canvas.addEventListener("pointermove", (e) => {
    var mousePos = getCursorPosition(canvas, e);
    mouseX = mousePos.x;
    mouseY = mousePos.y;

    priorityDraw()
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

        if(paused)
            fastforward_counter.innerHTML = 0;
        else 
            fastforward_counter.innerHTML = 1;
        
        gameSpeed = 100;
    }
});

var map = {};
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
    paused = true; 
    fastforward_counter.innerHTML = 0;
    gameSpeed = 100
}

function play_onclick() { 
    paused = false; 
    gameSpeed = 100

    fastforward_counter.innerHTML = 1;
}

function fastforward_onclick() { 
    paused = false; 

    if(gameSpeed > 1) {
        gameSpeed -= 25;
        fastforward_counter.innerHTML = parseInt(fastforward_counter.innerHTML) + 1;
    }
}

function trail_toggle_onclick() { decayToggle = trail_toggle_checkbox.checked; }

function clear_grid_onclick() {
    grid = [...Array(rowCount)].map(e => Array(columnCount).fill(0));
    // setUpGrid(); 
    priorityDraw();

    clear_grid_button.blur();
}

function reset_grid_onclick() {
    grid = [...Array(rowCount)].map(e => Array(columnCount).fill(0));
    setUpGrid(); 
    priorityDraw();

    clear_grid_button.blur();
}

function recenter_onclick() {
    originX = -2;
    originY = -2;
    priorityDraw();
}



//#endregion

//#region ( Helper Functions )
var colorPallete = [
    '#A79277',
    '#D1BB9E',
    '#EAD8C0',
    '#FFF2E1'
];
function getRandomColorFromList() {
    return colorPallete[Math.floor(Math.random() * colorPallete.length)];
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  
function getColor(x, y) {
    return `rgb(${grid[y][x]}, 0, ${grid[y][x]})`
}

function birthCell(x, y) {
    grid[y][x] = minColorValue;
}

function killCell(x, y) {

}

function setUpGrid() {    
    // grid = [...Array(rowCount)].map(e => Array(columnCount).fill(0));

    // Inital state
    grid[5][6] = minColorValue;
    grid[5][7] = minColorValue;
    grid[5][8] = minColorValue;

    birthCell(0, 0);
    birthCell(0, 1);
    birthCell(1, 1);

    createGlider(14, 14);
    createGlider(12, 10);

    createGlider(20, 20, 1);
    createGlider(10, 35, 2);

    createGlider(20, 35, 3);
    createGlider(10, 20, 4);

    priorityDraw();
}
//#endregion

//#region ( Automoton Factories )
// Somehow do rotation
function createGlider(x, y, rotation) {
    // Point of origin
    grid[y][x] = minColorValue;

    var yOffset = 1;
    var xOffset = 1; 
    if(rotation == 1) {
        var yOffset = 1;
        var xOffset = -1; 
    } else if (rotation == 3) {
        var yOffset = -1;
        var xOffset = 1; 
    } else if (rotation == 2) {
        var yOffset = -1;
        var xOffset = -1; 
    }

    grid[y + (1*yOffset)][x] = minColorValue;
    grid[y + (2*yOffset)][x] = minColorValue;

    grid[y + (2*yOffset)][x - (1*xOffset)] = minColorValue;    
    grid[y + (1*yOffset)][x - (2*xOffset)] = minColorValue;
}

function displayGlider(x, y, rotation, offsetX, offsetY) {
    var yOffset = 1;
    var xOffset = 1; 
    if(rotation == 1) {
        var yOffset = 1;
        var xOffset = -1; 
    } else if (rotation == 3) {
        var yOffset = -1;
        var xOffset = 1; 
    } else if (rotation == 2) {
        var yOffset = -1;
        var xOffset = -1; 
    }

    ctx.fillStyle = highlightColor;
    
    // grid[y][x]
    // [y + (1*yOffset)][x]
    // console.log(((offsetY + 1*yOffset) * rectHeight));
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
    var neighbors = 0;
    // console.log('Within get neighbors call', x, y);
    
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

    if(y + 1 < rowCount) {
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

// Left here for future debugging
// console.log(`Live cell to the left of ${x}, ${y}, ${grid[y][x - 1]}`)
    
    return neighbors;
} 

function updateCells() { 
    rectWidth = canvas.width/displayColumnCount;
    rectHeight = canvas.height/displayRowCount;
    
    var updatedGrid = [];
    var offsetX;
    var offsetY;
    for(var y = 0; y < rowCount; y++) { 
        for(var x = 0; x < columnCount; x++) { 
            offsetX = x - originX;
            offsetY = y - originY;

            if(mouseX >= (offsetX * rectWidth) && mouseX < (offsetX * rectWidth) + rectWidth &&
            mouseY >= (offsetY * rectHeight) && mouseY < (offsetY * rectHeight) + rectHeight) {
                ctx.fillStyle = highlightColor;
                ctx.fillRect(offsetX * rectWidth, offsetY * rectHeight, rectWidth, rectHeight); 
                highlightedCell = [x, y];
                displayGlider(x, y, rotation, offsetX, offsetY);
            }

            if(grid[y][x] > 0 && grid[y][x] < minColorValue) {
                // ctx.globalAlpha = 0.8;
                grid[y][x] -= decayRate;
                // ctx.globalAlpha = 1;
                
                if(x >= originX && x <= originX + displayColumnCount &&
                    y >= originY && y <= originY + displayRowCount) {
                        ctx.fillStyle = getColor(x, y);
                        ctx.fillRect(offsetX * rectWidth, offsetY * rectHeight, rectWidth, rectHeight); 
                }
            }

            var n = getNeighbors(x, y);
            updatedGrid.push([x, y, grid[y][x]]);
            // offsetX = x - originX;
            // offsetY = y - originY;

            if(x == 0 && y == 0) {
                ctx.strokeStyle = "#DCE0D9";
                ctx.strokeRect(offsetX * rectWidth, offsetY * rectHeight, rectWidth*columnCount, rectHeight*rowCount)
            }

            if(grid[y][x] < minColorValue) {
                if(n == 3)
                    updatedGrid[updatedGrid.length - 1][2] = minColorValue;
                continue;
            }

            if(x >= originX && x <= originX + displayColumnCount &&
               y >= originY && y <= originY + displayRowCount) {
                ctx.fillStyle = getColor(x, y);
                ctx.fillRect(offsetX * rectWidth, offsetY * rectHeight, rectWidth, rectHeight); 
            }
            
            if(outlineCells) {
                ctx.strokeStyle = strokeColor;
                ctx.strokeRect(x * rectWidth, y * rectHeight, rectWidth, rectHeight); 
            }
            
            if(debugOptions) {
                ctx.strokeText(`[${x}, ${y}]`, x * rectWidth + 5, y * rectHeight + 10, rectWidth);
                ctx.strokeText(`[Neighbors = ${n}]`, x * rectWidth + 5, y * rectHeight + (rectHeight/2), rectWidth);
            }
            
            if(grid[y][x] != 0 && grid[y][x] < 255)
                updatedGrid[updatedGrid.length - 1][2] += colorIncrement;    

            if(n < 2){
                if(decayToggle)
                    updatedGrid[updatedGrid.length - 1][2] = minColorValue - decayRate;
                else 
                    updatedGrid[updatedGrid.length - 1][2] = 0;
            }
            else if (n > 3) {
            
                if(decayToggle)            
                    updatedGrid[updatedGrid.length - 1][2] = minColorValue - decayRate;
                else
                    updatedGrid[updatedGrid.length - 1][2] = 0;
            }
        }
    } 
    // TODO Find a better way to copy an array by reference and do this all with only one loop if performance becomes an issue
    for(var i = 0; i < updatedGrid.length; i++) {
        grid[updatedGrid[i][1]][updatedGrid[i][0]] = updatedGrid[i][2];
    }
} 
 
setUpGrid();
function updateAndDraw() {
    if(!paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        updateCells(); 

    }
    setTimeout(updateAndDraw, gameSpeed);
}
updateAndDraw();
//#endregion

function priorityDraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    rectWidth = canvas.width/displayColumnCount;
    rectHeight = canvas.height/displayRowCount;

    for(var y = 0; y < rowCount; y++) { 
        for(var x = 0; x < columnCount; x++) { 
            offsetX = x - originX;
            offsetY = y - originY;

            // Highlight cell
            if(mouseX >= (offsetX * rectWidth) && mouseX < (offsetX * rectWidth) + rectWidth &&
            mouseY >= (offsetY * rectHeight) && mouseY < (offsetY * rectHeight) + rectHeight) {
                ctx.fillStyle = highlightColor;
                ctx.fillRect(offsetX * rectWidth, offsetY * rectHeight, rectWidth, rectHeight); 
                highlightedCell = [x, y];
                displayGlider(x, y, rotation, offsetX, offsetY);
            }
            
            if(x == 0 && y == 0) {
                ctx.strokeStyle = "#DCE0D9";
                ctx.strokeRect(offsetX * rectWidth, offsetY * rectHeight, rectWidth*columnCount, rectHeight*rowCount)
            }

            if(grid[y][x] > 0 && 
                x >= originX && x <= originX + displayColumnCount &&
                y >= originY && y <= originY + displayRowCount) {   
                    ctx.fillStyle = getColor(x, y);
                    ctx.fillRect(offsetX * rectWidth, offsetY * rectHeight, rectWidth, rectHeight); 
             }
        }
    }
}