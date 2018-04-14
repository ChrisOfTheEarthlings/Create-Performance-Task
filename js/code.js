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

var frame = 0, 
    radius = 50,
    offset = 5;
    icons = [new Image(), new Image(), new Image(), new Image()];

icons[0].src = 'assets/icons/people.png';
icons[1].src = 'assets/icons/lumber.png';
icons[2].src = 'assets/icons/corn.png';
icons[3].src = 'assets/icons/iron.png';

var playerResources = [50, 50, 50, 50];

function startGame() {
    gameArea.start();
    var interval = setInterval(update, 1000/60);
}

//x is right, y is left, z is down
class MapHex {
    constructor(x, y, z, radius, offset, terrain, buildings) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.radius = radius;
        this.offset = offset;

        this.borderRad = radius + offset*2;
        this.hexX = (x - y) * (Math.sqrt(3) / 2) * (radius + offset);
        this.hexY = (3/2) * z * (radius + offset);

        this.terrain = terrain || 'default';
        this.buildingState = 0;
        this.isBuilding = 0;
        this.buildings = buildings || [];
        this.buildingOptions = getBuildingOptions(this.terrain);
        this.owner = 'none';
        this.selected = false;
        this.nextBuilding = 0;
    }
}

MapHex.prototype.startBuild = function() {
    if (this.nextBuilding === 4) {
        this.nextBuilding = 3;
    }
    if (compareArrays(playerResources, this.buildingOptions[this.nextBuilding].cost)) {
        this.isBuilding = 1;
    }
}


function buildGrid(xSize, ySize, zSize, radius, offset) {
    var grid = []
    for (var x = 1 - xSize; x < xSize; x++) {
        for (var y = 1 - ySize; y < ySize; y++) {
            for (var z = 1 - zSize; z < zSize; z++) {
                if (x + y + z === 0) {
                    var randomNum = Math.random();
                    if ((x === y) && (y === z) && (z == 0)) {
                        grid.push(new MapHex(x, y, z, radius, offset, 'home'));
                    }
                    else if (randomNum < .4) {
                        grid.push(new MapHex(x, y, z, radius, offset, 'water'));
                    }
                    else if (randomNum < .7) {
                        grid.push(new MapHex(x, y, z, radius, offset, 'grassland'));
                    }
                    else if (randomNum < .75) {
                        grid.push(new MapHex(x, y, z, radius, offset, 'cornfield'));
                    }
                    else if (randomNum < .9) {
                        grid.push(new MapHex(x, y, z, radius, offset, 'forest'));
                    }
                    else {
                        grid.push(new MapHex(x, y, z, radius, offset, 'mountain'));
                    }
                }
            }
        }
    }
    console.log(grid);
    return grid;
}

function drawHexagon(zeroX, zeroY, hex, screen, border) {
    var hexX = zeroX - hex.hexX,
        hexY = zeroY - hex.hexY;
    if (border) {
        radius = hex.borderRad;
    }
    else {
        radius = hex.radius;
    }

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

function drawGrid(screen, grid, offset, zeroX, zeroY) {
    for (i = 0; i < grid.length; i++) {
        
        var hex = grid[i];

        if (hex.selected === true) {
            console.log(hex.terrain);
        }

        if (hex.terrain !== 'water') {
            screen.ctx.fillStyle = '#303030'

            drawHexagon(zeroX, zeroY, hex, gameArea, true);
    
            switch (hex.terrain) {
                case 'mountain': 
                    screen.ctx.fillStyle = '#505058';
                    break;
                case 'cornfield': 
                    screen.ctx.fillStyle = '#808008';
                    break;
                case 'forest': 
                    screen.ctx.fillStyle = '#306018';
                    break;
                case 'grassland': 
                    screen.ctx.fillStyle = '#608038';
                    break;
                case 'home': 
                    screen.ctx.fillStyle = '#906060';
                    break;
                default: 
                    screen.ctx.fillStyle = '#000000';
                    break;
            }
    
            drawHexagon(zeroX, zeroY, hex, gameArea, false);
        }

        if (hex.selected) {
            screen.ctx.fillStyle = '#ffffff25';
            drawHexagon(zeroX, zeroY, hex, gameArea, false);
        }
    }
}

function drawCursor(screen) {
    screen.ctx.fillStyle = '#000000';
    screen.ctx.fillRect(centerX - 2, centerY - 6, 4, 12);
    screen.ctx.fillRect(centerX - 6, centerY - 2, 12, 4);
}

function drawResourceCounter(screen, resource, x, y, color) {
    var color = color || '#802020';
    screen.ctx.fillStyle = color;
    screen.ctx.font = '24px Ubuntu';

    screen.ctx.drawImage(icons[0], x, y);
    screen.ctx.fillText(': ' + resource[0], x + 25, y + 25);
    screen.ctx.drawImage(icons[1], x + 75, y);
    screen.ctx.fillText(': ' + resource[1], x + 100, y + 25);
    screen.ctx.drawImage(icons[2], x + 150, y);
    screen.ctx.fillText(': ' + resource[2], x + 175, y + 25);
    screen.ctx.drawImage(icons[3], x + 222, y);
    screen.ctx.fillText(': ' + resource[3], x + 250, y + 25);
}

function drawSideboard(screen) {
    var leftEdge = gameArea.canvas.width * (2/3),
        hex = findSelectedHex(gameGrid);

    //main sideboard pane
    screen.ctx.fillStyle = '#404040';
    screen.ctx.fillRect(leftEdge, 0, gameArea.canvas.width, gameArea.canvas.height);

    //draw resource pane
    screen.ctx.fillStyle = '#505050';
    screen.ctx.fillRect(leftEdge + 10, 10, leftEdge/2 - 20, 50)

    drawResourceCounter(screen, playerResources, leftEdge + 32, 20, '#ffffff');

    //draw terrain and building status indicators
    screen.ctx.fillStyle = '#ffffff';
    screen.ctx.fillText('Terrain: ' + hex.terrain, leftEdge + 10, 90);
    screen.ctx.fillText('Building Status: ' + hex.buildingState + '%', leftEdge + 10, 130);

    //draw building pane
    screen.ctx.fillStyle = '#505050';
    screen.ctx.fillRect(leftEdge + 10, 140, leftEdge/2 - 20, gameArea.canvas.height - 200);

    screen.ctx.fillStyle = '#404040';
    screen.ctx.fillRect(leftEdge + 20, 150, leftEdge/2 - 40, 100);
    if (hex.terrain !== 'ocean') {        
        if (!compareArrays(playerResources, hex.buildingOptions[0].cost)) {
            drawResourceCounter(screen, hex.buildingOptions[0].cost, leftEdge + 32, 160, '#802020');
            screen.ctx.fillStyle = '#802020';
            screen.ctx.fillText(hex.buildingOptions[0].type, leftEdge + 30, 230);
        }
        else if (hex.buildings.length >= 1) {
            drawResourceCounter(screen, hex.buildingOptions[0].cost, leftEdge + 32, 160, '#000000');
            screen.ctx.fillStyle = '#000000';
            screen.ctx.fillText(hex.buildingOptions[0].type, leftEdge + 30, 230);
        }
        else {
            drawResourceCounter(screen, hex.buildingOptions[0].cost, leftEdge + 32, 160, '#ffffff');
            screen.ctx.fillStyle = '#ffffff';
            screen.ctx.fillText(hex.buildingOptions[0].type, leftEdge + 30, 230);
        }
    }

    screen.ctx.fillStyle = '#404040';
    screen.ctx.fillRect(leftEdge + 20, 260, leftEdge/2 - 40, 100);
    if ((hex.terrain !== 'water') && (hex.terrain !== 'ocean')) {
        if ((!compareArrays(playerResources, hex.buildingOptions[1].cost)) || (hex.buildings.length < 1)) {
            drawResourceCounter(screen, hex.buildingOptions[1].cost, leftEdge + 32, 270, '#802020');
            screen.ctx.fillStyle = '#802020';
            screen.ctx.fillText(hex.buildingOptions[1].type, leftEdge + 30, 340);
        }
        else if (hex.buildings.length >= 2) {
            drawResourceCounter(screen, hex.buildingOptions[1].cost, leftEdge + 32, 270, '#000000');
            screen.ctx.fillStyle = '#000000';
            screen.ctx.fillText(hex.buildingOptions[1].type, leftEdge + 30, 340);
        }
        else {
            drawResourceCounter(screen, hex.buildingOptions[1].cost, leftEdge + 32, 270, '#ffffff');
            screen.ctx.fillStyle = '#ffffff';
            screen.ctx.fillText(hex.buildingOptions[1].type, leftEdge + 30, 340);
        }
    }

    screen.ctx.fillStyle = '#404040';
    screen.ctx.fillRect(leftEdge + 20, 370, leftEdge/2 - 40, 100);
    if ((hex.terrain !== 'water') && (hex.terrain !== 'ocean')) {
        if ((!compareArrays(playerResources, hex.buildingOptions[2].cost)) || (hex.buildings.length < 2)) {
            drawResourceCounter(screen, hex.buildingOptions[2].cost, leftEdge + 32, 380, '#802020');
            screen.ctx.fillStyle = '#802020';
            screen.ctx.fillText(hex.buildingOptions[2].type, leftEdge + 30, 450);
        }
        else if (hex.buildings.length >= 3) {
            drawResourceCounter(screen, hex.buildingOptions[2].cost, leftEdge + 32, 380, '#000000');
            screen.ctx.fillStyle = '#000000';
            screen.ctx.fillText(hex.buildingOptions[2].type, leftEdge + 30, 450);
        }
        else {
            drawResourceCounter(screen, hex.buildingOptions[2].cost, leftEdge + 32, 380, '#ffffff');
            screen.ctx.fillStyle = '#ffffff';
            screen.ctx.fillText(hex.buildingOptions[2].type, leftEdge + 30, 450);
        }
    }

    //draw 'build' button
    screen.ctx.fillStyle = '#505050';
    screen.ctx.fillRect(leftEdge + 60, 490, leftEdge/2 - 120, 40);

    screen.ctx.fillStyle = '#ffffff';
    screen.ctx.fillText('build', leftEdge + 151, 520);
}

function findSelectedHex(grid) {
    for (i = 0; i < grid.length; i++) {
        if (grid[i].selected === true) {
            return grid[i];
        }
    }
    return new MapHex('none', '', '', null, null, 'ocean', 0);
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

    for (i = 0; i < grid.length; i++) {
        if ((grid[i].x === x) && (grid[i].y === y) && (grid[i].z === z)) {
            grid[i].selected = true;
        }
        else {
            grid[i].selected = false;
        }
    }
}

class Building {
    constructor(type) {
        this.type = type || 'generic';

        switch (type) {
            case 'road': 
                this.cost = [0, 5, 5, 0];
                this.yeild = [0, 0, 0, 0]; //Yield per second
                this.flavorText = 'A road, must be built but produces no resources.';
                break;
            case 'bridge': 
                this.cost = [0, 5, 5, 0];
                this.yeild = [0, 0, 0, 0]; //Yield per second
                this.flavorText = 'A bridge for crossing water.';
                break;
            case 'settlement':
                this.cost = [0, 20, 10, 5];
                this.yeild = [.25, .05, -.25, .05];
                this.flavorText = 'A settlement, build to increase Population';
                break;
            case 'settlement +':
                this.cost = [20, 20, 10, 40];
                this.yeild = [.75, .05, -.25, .05];
                this.flavorText = 'An additional settlement, build to quadruple Population increase';
                break;
            case 'mine':
                this.cost = [10, 30, 0, 10];
                this.yeild = [0, 0, -.25, .25];
                this.flavorText = 'A mine, build to produce Iron';
                break;
            case 'mine +':
                this.cost = [20, 40, 0, 20];
                this.yeild = [0, 0, -.25, .75];
                this.flavorText = 'An additional mine, build to quadruple Iron production';
                break;
            case 'farm':
                this.cost = [10, 20, 5, 15];
                this.yeild = [-.25, 0, 1, 0];
                this.flavorText = 'A farm, build to produce Corn';
                break;
            case 'farm +':
                this.cost = [20, 30, 5, 25];
                this.yeild = [-.25, 0, 3, 0];
                this.flavorText = 'An additional farm, build to quadruple Corn production';
                break;
            case 'wood cutter':
                this.cost = [10, 10, 0 , 30];
                this.yeild = [0, .25, -.25, 0];
                this.flavorText = 'A wood cutter, build to produce Lumber';
                break;
            case 'wood cutter +':
                this.cost = [20, 20, 0, 40];
                this.yeild = [0, .75, -.75, 0];
                this.flavorText = 'An additional wood cutter, build to quadruple Lumber production';
                break;
            case 'castle lv. 1':
                this.cost = [5, 5, 5, 5];
                this.yeild = [.25, .25, .25, .25];
                this.flavorText = 'A level 1 castle. Achieve level 3 to win';
                break;
            case 'castle lv. 2':
                this.cost = [20, 20, 20, 20];
                this.yeild = [.75, .75, .75, .75];
                this.flavorText = 'A level 2 castle. Achieve level 3 to win';
                break;
            case 'castle lv. 3':
                this.cost = [99, 99, 99, 99];
                this.yeild = [3, 3, 3, 3];
                this.flavorText = 'A level 3 castle. If this is built you win!';
                break;
            default:
                this.cost = [100, 100, 100, 100];
                this.yeild = [0, 0, 0, 0];
                this.flavorText = 'Unidentified';
                break;
        }
    }
}

function compareArrays (first, second){
    var n = 0;
    for (i = 0; i < first.length; i++) {
        if (first[i] >= second[i]) {
            n++;
        }
    }
    if (n === first.length) {
        return true;
    }
    return false;
}

function getBuildingOptions(terrain) {
    var options = [];

    options.push(new Building('road'))

    switch (terrain) {
        case 'home': 
            options.shift();
            options.push(new Building('castle lv. 1'));
            options.push(new Building('castle lv. 2'));
            options.push(new Building('castle lv. 3'));
            break;
        case 'grassland':
            options.push(new Building('settlement'));
            options.push(new Building('settlement +'));
            break;
        case 'mountain':
            options.push(new Building('mine'));
            options.push(new Building('mine +'));
            break;
        case 'cornfield':
            options.push(new Building('farm'));
            options.push(new Building('farm +'));
            break;
        case 'forest':
            options.push(new Building('wood cutter'));
            options.push(new Building('wood cutter +'));
            break;
        case 'water':
            options.shift();
            options.push(new Building('bridge'));
            break;
        default:
            return [];
    }

    return options;
}

var mouseDown = false;
gameArea.canvas.addEventListener('mousedown', function(event) { 
    mouseDown = true;
    if ((event.offsetX > 720 + 60) && (event.offsetX < 1080 - 60)) {
        if ((event.offsetY > 490) && (event.offsetY < 530)) {
            console.log([event.offsetX, event.offsetY]);
            findSelectedHex(gameGrid).startBuild();
        }
    }
});

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

var gameGrid = buildGrid(5, 5, 5, radius, offset);

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
    for (i = 0; i < gameGrid.length; i++) {
        if (gameGrid[i].isBuilding === 1) {
            if (gameGrid[i].buildingState < 100) {
                gameGrid[i].buildingState++;
            }
            else {
                gameGrid[i].buildingState = 0;
                gameGrid[i].buildings.push(gameGrid[i].buildingOptions[gameGrid[i].nextBuilding]);
                gameGrid[i].nextBuilding++;
                gameGrid[i].isBuilding = 0;
            }
        }
    }
}