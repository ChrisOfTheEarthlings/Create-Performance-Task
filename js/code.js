var gameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = 1080;
        this.canvas.height = 540;
        this.ctx = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    },
    clear : function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

var frame = 0;
var radius = 50;
var offset = 5

function startGame() {
    gameArea.start();
    var interval = setInterval(update, 10);
}

function drawHexagon(radius, hexX, hexY, screen) {
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

//x is right, y is left, z is down
class MapHex {
    constructor(x, y, z, radius, terrain, buildingState) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.radius = radius;
        this.terrain = terrain || 'default';
        this.buildingState = buildingState || 'undeveloped';
        this.selected = false;
    }
}


function buildGrid(xSize, ySize, zSize, radius) {
    var grid = []
    for (var x = 1 - xSize; x < xSize; x++) {
        for (var y = 1 - ySize; y < ySize; y++) {
            for (var z = 1 - zSize; z < zSize; z++) {
                if (x + y + z === 0) {
                    var randomNum = Math.random();
                    if (randomNum < .4) {
                        grid.push(new MapHex(x, y, z, radius, 'water'));
                    }
                    else if (randomNum < .7) {
                        grid.push(new MapHex(x, y, z, radius, 'grassland'));
                    }
                    else if (randomNum < .75) {
                        grid.push(new MapHex(x, y, z, radius, 'cornfield'));
                    }
                    else if (randomNum < .9) {
                        grid.push(new MapHex(x, y, z, radius, 'forest'));
                    }
                    else {
                        grid.push(new MapHex(x, y, z, radius, 'mountain'));
                    }
                }
            }
        }
    }

    console.log(grid);
    return grid;
}

function drawHex(zeroX, zeroY, radius, offset) {

}


function drawGrid(screen, grid, offset, zeroX, zeroY) {
    for (i = 0; i < grid.length; i++) {
        var hex = grid[i];
        var radius = hex.radius;
        var borderRad = radius + offset * 2;

        var hexX = (zeroX) - ((hex.x - hex.y) * (Math.sqrt(3) / 2) * (radius + offset));
        var hexY = (zeroY) - ((3/2) * hex.z * (radius + offset));

        if (hex.selected === true) {
            console.log(hex.terrain);
        }

        if (hex.terrain !== 'water') {
            screen.ctx.fillStyle = '#303030'

            drawHexagon(borderRad, hexX, hexY, gameArea);
    
            switch (hex.terrain) {
                case 'mountain': screen.ctx.fillStyle = '#505058';
                break;
                case 'cornfield': screen.ctx.fillStyle = '#808008';
                break;
                case 'forest': screen.ctx.fillStyle = '#306018';
                break;
                case 'grassland': screen.ctx.fillStyle = '#608038';
                break;
                default: screen.ctx.fillStyle = '#707070';
            }
    
            drawHexagon(radius, hexX, hexY, gameArea);
        }

        if (hex.selected) {
            screen.ctx.fillStyle = '#ffffff20';
            drawHexagon(radius, hexX, hexY, gameArea);
        }
    }
}

function drawCursor(screen) {
    screen.ctx.fillStyle = '#000000';
    screen.ctx.fillRect(centerX - 2, centerY - 6, 4, 12);
    screen.ctx.fillRect(centerX - 6, centerY - 2, 12, 4);
}

function drawSideboard(screen) {
    screen.ctx.fillStyle = '#404040';
    screen.ctx.fillRect(gameArea.canvas.width * (2 / 3), 0, gameArea.canvas.width, gameArea.canvas.height);
}

function isNeighbor(grid, x1, y1, z1, x2, y2, z2) {
    for (i = 0; i < grid.length; i++) {
        if ((grid[i].x === x1) && (grid[i].y === y1) && (grid[i] === z1)) {
            for (j = 0; j < grid.length; j++) {
                if ((grid[j].x === x2) && (grid[j].y === y2) && (grid[j].z === z2)) {
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

function selectTile(grid) {
    var pixX = gridCenterX - centerX, pixY = gridCenterY - centerY, q, r, x, y, z;
    
    q = Math.round((pixX * Math.sqrt(3)/3 - pixY / 3) / (radius + 5));
    r = Math.round(pixY * 2/3 / (radius + 5));

    x = q;
    y = -q-r;
    z = r;

    //console.log('' + x + y + z)

    for (i = 0; i < grid.length; i++) {
        if ((grid[i].x === x) && (grid[i].y === y) && (grid[i].z === z)) {
            grid[i].selected = true;
        }
        else {
            grid[i].selected = false;
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
        gridCenterX += changeX;
        gridCenterY += changeY;
    }
});

startGame();

var gameGrid = buildGrid(5, 5, 5, radius);

var centerX = (gameArea.canvas.width * (2 / 3)) / 2, 
    centerY = gameArea.canvas.height / 2,
    gridCenterX = centerX,
    gridCenterY = centerY;

function update() {
    frame++;
    gameArea.clear();
    selectTile(gameGrid);
    drawGrid(gameArea, gameGrid, offset, gridCenterX, gridCenterY);
    drawCursor(gameArea);
    drawSideboard(gameArea);
}