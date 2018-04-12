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

var frame = 0;

function startGame() {
    gameArea.start();
}

//x is right, y is left, z is down
class MapHex {
    constructor(x, y, z, radius, terrain, buildingState) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.radius = radius;
        this.terrain = terrain || 'default';
        this.buildingState = buildingState || 'undeveloped';
    }
}

function buildGrid(xSize, ySize, zSize, radius) {
    var grid = []
    for (var x = 1 - xSize; x < xSize; x++) {
        for (var y = 1 - ySize; y < ySize; y++) {
            for (var z = 1 - zSize; z < zSize; z++) {
                if (x + y + z === 0) {
                    if (Math.random() > .4) {
                        grid.push(new MapHex(x, y, z, radius));
                    }
                }
            }
        }
    }
    console.log(grid);
    return grid;
}

function drawGrid(screen, grid, offset, zeroX, zeroY) {
    for (i = 0; i < grid.length; i++) {
        var hex = grid[i];
        var radius = hex.radius;
        var borderRad = radius + offset * 2;

        var hexX = (zeroX) - ((hex.x - hex.y) * (Math.sqrt(3) / 2) * (radius + offset));
        var hexY = (zeroY) - ((3/2) * hex.z * (radius + offset));

        screen.ctx.fillStyle = '#606060'

        screen.ctx.beginPath();
        screen.ctx.moveTo(hexX, hexY + borderRad); //bottom middle
        screen.ctx.lineTo(hexX + (Math.sqrt(3) / 2) * borderRad, hexY + borderRad / 2); //bottom right
        screen.ctx.lineTo(hexX + (Math.sqrt(3) / 2) * borderRad, hexY - borderRad / 2); //top right
        screen.ctx.lineTo(hexX, hexY - borderRad); //top middle
        screen.ctx.lineTo(hexX - (Math.sqrt(3) / 2) * borderRad, hexY - borderRad / 2); //top left
        screen.ctx.lineTo(hexX - (Math.sqrt(3) / 2) * borderRad, hexY + borderRad / 2); //bottom left
        screen.ctx.lineTo(hexX, hexY + borderRad); //bottom middle
        screen.ctx.closePath();
        screen.ctx.fill();

        screen.ctx.fillStyle = '#608038';

        screen.ctx.beginPath();
        screen.ctx.moveTo(hexX, hexY + radius); //bottom middle
        screen.ctx.lineTo(hexX + (Math.sqrt(3) / 2) * radius, hexY + radius / 2); //bottom right
        screen.ctx.lineTo(hexX + (Math.sqrt(3) / 2) * radius, hexY - radius / 2); //top right
        screen.ctx.lineTo(hexX, hexY - radius); //top middle
        screen.ctx.lineTo(hexX - (Math.sqrt(3) / 2) * radius, hexY - radius / 2); //top left
        screen.ctx.lineTo(hexX - (Math.sqrt(3) / 2) * radius, hexY + radius / 2); //bottom left
        screen.ctx.lineTo(hexX, hexY + radius); //bottom middle
        screen.ctx.closePath();
        screen.ctx.fill();
    }
}

function drawCursor(screen) {
    screen.ctx.fillStyle = '#000000';
    screen.ctx.fillRect(gameArea.canvas.width / 2 - 2, gameArea.canvas.height / 2 - 6, 4, 12);
    screen.ctx.fillRect(gameArea.canvas.width / 2 - 6, gameArea.canvas.height / 2 - 2, 12, 4);
}

function isNeighbor(grid, x1, y1, z1, x2, y2, z2) {
    for (i = 0; i < grid.length; i++) {
        if (grid[i].x === x1 && grid[i].y === y1 && grid[i] === z1) {
            for (j = 0; j < grid.length; j++) {
                if (grid[j].x === x2 && grid[j].y === y2 && grid[j].z === z2) {
                    return true;
                }
                return false;
            }
        }
        else {
            console.log('hex not found!')
            return('hex not found')
        }
    }
}

var mouseDown = false;
gameArea.canvas.addEventListener('mousedown', function(event) { mouseDown = true; });
window.addEventListener('mouseup', function(event) { mouseDown = false; });

gameArea.canvas.addEventListener('mousemove', function(event) {
    var changeX = event.movementX,
        changeY = event.movementY;

    if (mouseDown) {
        beginX += changeX;
        beginY += changeY;
    }
});

startGame();
var gameGrid = buildGrid(6, 6, 6, 50);

var beginX = gameArea.canvas.width;
var beginY = gameArea.canvas.height;

function update() {
    frame++;
    gameArea.clear();
    drawGrid(gameArea, gameGrid, 5, beginX, beginY);
    drawCursor(gameArea);
}

var interval = setInterval(update, 10);