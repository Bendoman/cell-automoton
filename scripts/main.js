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
var scrollSpeed = 10;

var translateX = 0;
var translateY = 0;

var dragActive = false;
var isFirstDrag = true;

var debugOptions = false;
var outlineCells = false;

// Grid variables
var rowCount = 9*7;
var columnCount = 16*7;

// Color code values
// TODO Color fadeout, very easy.
var minColorValue = 25;
var colorIncrement = 15;
var decayRate = 2.5;
var decayToggle = true;

var backgroundColor = '#343d46';
var strokeColor = '#FFF';


// grid = Array.apply(null, Array(rowCount)).map(function () {})

// To zoom in or out, create a new grid with the updated row and column count and transpose the old onto new 
// ( smaller grid can be applied directly overtop, smaller grid much the same just with check to see if index exists )
var grid = [...Array(rowCount)].map(e => Array(columnCount).fill(0));

var rectWidth;
var rectHeight;

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
    rectWidth = canvas.width/columnCount;
    rectHeight = canvas.height/rowCount;
    
    // Inital state
    grid[5][6] = minColorValue;
    grid[5][7] = minColorValue;
    grid[5][8] = minColorValue;
    birthCell(1, 1);
    birthCell(2, 1);
    birthCell(3, 1);

    createGlider(14, 14);
    createGlider(12, 10);

    createGlider(20, 20, 1);
    createGlider(10, 35, 2);

    createGlider(20, 35, 3);
    createGlider(10, 20, 4);
}
//#endregion

//#region ( Warhead Factories )
// Somehow do rotation
function createGlider(x, y, rotation) {
    if(y + 2 > rowCount || x - 2 < 0)
        return;

    // Point of origin
    grid[y][x] = minColorValue;

    var yOffset = 1;
    var xOffset = 1; 
    if(rotation == 1) {
        var yOffset = 1;
        var xOffset = -1; 
    } else if (rotation == 2) {
        var yOffset = -1;
        var xOffset = 1; 
    } else if (rotation == 3) {
        var yOffset = -1;
        var xOffset = -1; 
    }

    grid[y + (1*yOffset)][x] = minColorValue;
    grid[y + (2*yOffset)][x] = minColorValue;

    grid[y + (2*yOffset)][x - (1*xOffset)] = minColorValue;    
    grid[y + (1*yOffset)][x - (2*xOffset)] = minColorValue;
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
    var updatedGrid = [];

    for(var y = 0; y < rowCount; y++) { 
        for(var x = 0; x < columnCount; x++) { 
            if(grid[y][x] > 0 && grid[y][x] < minColorValue) {
                ctx.fillStyle = getColor(x, y);
                ctx.fillRect(x * rectWidth, y * rectHeight, rectWidth, rectHeight); 
                grid[y][x] -= decayRate;
            }

            var n = getNeighbors(x, y);
            updatedGrid.push([x, y, grid[y][x]]);

            if(grid[y][x] < minColorValue) {
                if(n == 3)
                    updatedGrid[updatedGrid.length - 1][2] = minColorValue;
                continue;
            }

            ctx.fillStyle = getColor(x, y);
            ctx.fillRect(x * rectWidth, y * rectHeight, rectWidth, rectHeight); 
            
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
function drawToConsole() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    updateCells(); 

    ctx.


    setTimeout(drawToConsole, 200);
}
drawToConsole();
//#endregion