var gameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = 720;
        this.canvas.height = 540;
        this.ctx = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    },
    clear : function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function startGame() {
    gameArea.start();
}

function drawHex(screen, hex, offset) {
    var zeroX = screen.canvas.width / 2;
    var zeroY = screen.canvas.height / 2;
    var radius = hex.radius;

    var hexX = (zeroX) - ((hex.x - hex.y) * (Math.sqrt(3) / 2) * (radius + offset));
    var hexY = (zeroY) - ((3/2) * hex.z * (radius + offset));

    screen.ctx.fillRect(hexX - 2, hexY - 2, 4, 4);
    screen.ctx.beginPath();
    screen.ctx.moveTo(
        hexX, 
        hexY + radius
    );
    screen.ctx.lineTo(
        hexX + (Math.sqrt(3) / 2) * radius, 
        hexY + radius / 2
    );
    screen.ctx.lineTo(
        hexX + (Math.sqrt(3) / 2) * radius,
        hexY - radius / 2
    );
    screen.ctx.lineTo(
        hexX,
        hexY - radius
    );
    screen.ctx.lineTo(
        hexX - (Math.sqrt(3) / 2) * radius,
        hexY - radius / 2
    );
    screen.ctx.lineTo(
        hexX - (Math.sqrt(3) / 2) * radius,
        hexY + radius / 2
    );
    screen.ctx.lineTo(
        hexX,
        hexY + radius
    );
    screen.ctx.closePath();
    screen.ctx.fill();
}

//x is right, y is left, z is down
class MapHex {
    constructor(x, y, z, radius, terrain, buildingState) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.id = ('' + x + y + z);
        this.terrain = terrain;
        this.buildingState = buildingState;
        this.radius = radius;
    }
}

/*
function generateTerrain(grid, xSize, ySize, zSize) {
    for (var hex = 0; hex < grid.length; 
}
*/

function buildGrid(xSize, ySize, zSize, radius) {
    var grid = []
    for (var x = 1 - xSize; x < xSize; x++) {
        for (var y = 1 - ySize; y < ySize; y++) {
            for (var z = 1 - zSize; z < zSize; z++) {
                if (x + y + z === 0) {
                    grid.push(new MapHex(x, y, z, radius, 'undefined', 'none'));
                }
            }
        }
    }
    console.log(grid);
    return grid;
}

startGame();
var gameGrid = buildGrid(6, 6, 6, 50);

for (i = 0; i < gameGrid.length; i++) {
    drawHex(gameArea, gameGrid[i], 5);
}