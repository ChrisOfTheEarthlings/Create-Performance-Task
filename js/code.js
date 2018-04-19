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

var playerResources,
    changeInRes,
    interval,
    centerX, 
    centerY,
    mouseX,
    mouseY,
    gridCenterX,
    gridCenterY,
    hover,
    gameGrid,
    difficulty,
    mapSize,
    gameOver,
    reset;

function startGame() {
    gameArea.start();
    reset = false;
    gameOver = false;
    interval = setInterval(update, 1000/60);
    difficulty = 1;
    mapSize = 5;
    newGame();
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
        this.nextBuilding = this.buildings.length;
    }
}

MapHex.prototype.startBuild = function(resources) {
    if (this.nextBuilding === 4) {
        this.nextBuilding = 3;
    }
    if (compareArrays(playerResources, this.buildingOptions[this.nextBuilding].cost) && 
        (neighborsHaveBuildings(gameGrid, this)) && 
        (this.isBuilding !== 1)) {

        this.isBuilding = 1;
        for (i = 0; i < resources.length; i++) {
            resources[i] -= this.buildingOptions[this.nextBuilding].cost[i];
        }
    }
}


function buildGrid(xSize, ySize, zSize, radius, offset) {
    var grid = [];
    for (var x = 1 - xSize; x < xSize; x++) {
        for (var y = 1 - ySize; y < ySize; y++) {
            for (var z = 1 - zSize; z < zSize; z++) {
                if (x + y + z === 0) {
                    var randomNum = Math.random();
                    if (randomNum < .4) {
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
    var random = findRandomHex(grid),
        copy = grid[random];
    console.log(random)
    grid[random] = new MapHex(copy.x, copy.y, copy.z, radius, offset, 'castle', [new Building('castle lv. 1')]);

    gridCenterX += grid[random].hexX;
    gridCenterY += grid[random].hexY;
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
    for (cHex = 0; cHex < grid.length; cHex++) {
        
        var hex = grid[cHex];

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
                case 'castle': 
                    screen.ctx.fillStyle = '#906060';
                    break;
                default: 
                    screen.ctx.fillStyle = '#000000';
                    break;
            }
    
            drawHexagon(zeroX, zeroY, hex, gameArea, false);
        }

        if (hex.buildings.length > 0) {
            screen.ctx.fillStyle = '#ffffff';
            screen.ctx.fillText(hex.buildings[hex.buildings.length - 1].icon, zeroX - hex.hexX, zeroY - hex.hexY);
        }

        if (hex.isBuilding === 1) {
            screen.ctx.fillStyle = '#aaaaaa';
            screen.ctx.fillRect(zeroX - hex.hexX - 25, zeroY - hex.hexY + 10, 50, 10);
            screen.ctx.fillStyle = '#dddddd';
            screen.ctx.fillRect(zeroX - hex.hexX - 25, zeroY - hex.hexY + 10, 50 * (hex.buildingState / 100), 10)
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

function drawResourceCounter(screen, resource, x, y, color, floor) {
    var color = color || '#802020',
        floorResources = [];
    screen.ctx.fillStyle = color;
    screen.ctx.font = '24px Ubuntu';


    if (floor) {
        for (i = 0; i < 4; i++) {
            floorResources.push(Math.floor(resource[i]));
        }
    }
    else {
        for (i = 0; i < 4; i++) {
            floorResources.push(resource[i]);
        }
    }

    screen.ctx.drawImage(icons[0], x, y);
    screen.ctx.fillText(': ' + floorResources[0], x + 25, y + 25);
    screen.ctx.drawImage(icons[1], x + 75, y);
    screen.ctx.fillText(': ' + floorResources[1], x + 100, y + 25);
    screen.ctx.drawImage(icons[2], x + 150, y);
    screen.ctx.fillText(': ' + floorResources[2], x + 175, y + 25);
    screen.ctx.drawImage(icons[3], x + 222, y);
    screen.ctx.fillText(': ' + floorResources[3], x + 250, y + 25);
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

    drawResourceCounter(screen, playerResources, leftEdge + 32, 20, '#ffffff', true);

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
        if (hex.buildings.length >= 1) {
            drawResourceCounter(screen, hex.buildingOptions[0].cost, leftEdge + 32, 160, '#000000', true);
            screen.ctx.fillStyle = '#000000';
            screen.ctx.fillText(hex.buildingOptions[0].type, leftEdge + 30, 230);
        }
        else if (!compareArrays(playerResources, hex.buildingOptions[0].cost) 
            || (!neighborsHaveBuildings(gameGrid, findSelectedHex(gameGrid)))
            || (hex.isBuilding === 1)) {
            drawResourceCounter(screen, hex.buildingOptions[0].cost, leftEdge + 32, 160, '#802020', true);
            screen.ctx.fillStyle = '#802020';
            screen.ctx.fillText(hex.buildingOptions[0].type, leftEdge + 30, 230);
        }
        else {
            drawResourceCounter(screen, hex.buildingOptions[0].cost, leftEdge + 32, 160, '#ffffff', true);
            screen.ctx.fillStyle = '#ffffff';
            screen.ctx.fillText(hex.buildingOptions[0].type, leftEdge + 30, 230);
        }
    }

    screen.ctx.fillStyle = '#404040';
    screen.ctx.fillRect(leftEdge + 20, 260, leftEdge/2 - 40, 100);
    if ((hex.terrain !== 'water') && (hex.terrain !== 'ocean')) {
        if (hex.buildings.length >= 2) {
            drawResourceCounter(screen, hex.buildingOptions[1].cost, leftEdge + 32, 270, '#000000', true);
            screen.ctx.fillStyle = '#000000';
            screen.ctx.fillText(hex.buildingOptions[1].type, leftEdge + 30, 340);
        }
        else if ((!compareArrays(playerResources, hex.buildingOptions[1].cost)) || (hex.buildings.length < 1) 
            || (!neighborsHaveBuildings(gameGrid, findSelectedHex(gameGrid)))
            || (hex.isBuilding === 1)) {
            drawResourceCounter(screen, hex.buildingOptions[1].cost, leftEdge + 32, 270, '#802020', true);
            screen.ctx.fillStyle = '#802020';
            screen.ctx.fillText(hex.buildingOptions[1].type, leftEdge + 30, 340);
        }
        else {
            drawResourceCounter(screen, hex.buildingOptions[1].cost, leftEdge + 32, 270, '#ffffff', true);
            screen.ctx.fillStyle = '#ffffff';
            screen.ctx.fillText(hex.buildingOptions[1].type, leftEdge + 30, 340);
        }
    }

    screen.ctx.fillStyle = '#404040';
    screen.ctx.fillRect(leftEdge + 20, 370, leftEdge/2 - 40, 100);
    if ((hex.terrain !== 'water') && (hex.terrain !== 'ocean')) {
        if (hex.buildings.length >= 3) {
            drawResourceCounter(screen, hex.buildingOptions[2].cost, leftEdge + 32, 380, '#000000', true);
            screen.ctx.fillStyle = '#000000';
            screen.ctx.fillText(hex.buildingOptions[2].type, leftEdge + 30, 450);
        }
        else if ((!compareArrays(playerResources, hex.buildingOptions[2].cost)) || (hex.buildings.length < 2) 
            || (!neighborsHaveBuildings(gameGrid, findSelectedHex(gameGrid)))
            || (hex.isBuilding === 1)) {
            drawResourceCounter(screen, hex.buildingOptions[2].cost, leftEdge + 32, 380, '#802020', true);
            screen.ctx.fillStyle = '#802020';
            screen.ctx.fillText(hex.buildingOptions[2].type, leftEdge + 30, 450);
        }
        else {
            drawResourceCounter(screen, hex.buildingOptions[2].cost, leftEdge + 32, 380, '#ffffff', true);
            screen.ctx.fillStyle = '#ffffff';
            screen.ctx.fillText(hex.buildingOptions[2].type, leftEdge + 30, 450);
        }
    }

    //draw 'build' button
    screen.ctx.fillStyle = '#505050';
    if (hover) {
        screen.ctx.fillStyle = '#606060';
        hover = 0;
    }
    screen.ctx.fillRect(leftEdge + 60, 490, leftEdge/2 - 120, 40);

    screen.ctx.fillStyle = '#ffffff';
    screen.ctx.fillText('build', leftEdge + 151, 520);
}

function drawInfoScreen(mouseX, mouseY, screen) {
    var hex = findSelectedHex(gameGrid),
        bOps = [
            [740, 150, 1060, 250], 
            [740, 260, 1060, 360], 
            [740, 370, 1060, 470]
        ],
        bLength = bOps.length;
        
    for (c = 0; c < bLength; c++) {
        if ((mouseX > bOps[c][0]) && (mouseX < bOps[c][2]) && (mouseY > bOps[c][1]) && (mouseY < bOps[c][3])) {

            screen.ctx.fillStyle = '#303030';
            screen.ctx.fillRect(20, 20, 720 - 40, 540 - 40);
            screen.ctx.fillStyle = '#404040';
            screen.ctx.fillRect(30, 30, 720 - 60, 540 - 60);

            var hex = findSelectedHex(gameGrid);
            var building = hex.buildingOptions[c];

            screen.ctx.fillStyle = '#ffffff';
            screen.ctx.fillText('Building Info --- ' + building.type, 40, 60);
            screen.ctx.fillText('yield per second:', 40, 120);
            drawResourceCounter(gameArea, building.yield, 40, 130, '#ffffff', false);
            screen.ctx.fillText('Build time:', 40, 250);
            screen.ctx.fillText(building.time + ' seconds', 60, 290);
            screen.ctx.fillText('Description:', 40, 380);
            screen.ctx.fillText(building.flavorText, 60, 420, 600);
        }
    }
}

function drawStartScreen() {

}

function findSelectedHex(grid) {
    for (i = 0; i < grid.length; i++) {
        if (grid[i].selected === true) {
            return grid[i];
        }
    }
    return new MapHex('none', '', '', null, null, 'ocean', 0);
}

function findRandomHex(grid) {
    //returns array index value of tile
    return Math.floor(Math.random() * grid.length);
}

function neighborsHaveBuildings(grid, hex) {
    var directions = [[1, -1, 0], [1, 0, -1], [0, 1, -1], [0, -1, 1] [-1, 0, 1], [-1, 1, 0]];
    for (i = 0; i < grid.length; i++) {
        for (j = 0; j < directions.length; j++) {
            if ((Math.abs(hex.x - grid[i].x) === Math.abs(directions[j][0])) && 
                (Math.abs(hex.y - grid[i].y) === Math.abs(directions[j][1])) && 
                (Math.abs(hex.z - grid[i].z) === Math.abs(directions[j][2]))) {  
                
                if (grid[i].buildings.length !== 0) {
                    return true;
                }

            }
        }
    }
    return false;
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
        this.d = difficulty;

        switch (type) {
            case 'road': 
                this.cost = [5 * this.d, 5 * this.d, 5 * this.d, 5 * this.d];
                this.yield = [0, 0, 0, 0]; //Yield per second
                this.flavorText = 'A road, must be built but produces no resources.';
                this.icon = 'R';
                this.time = 5 * this.d;
                this.points = 0;
                break;
            case 'bridge': 
                this.cost = [5 * this.d, 5 * this.d, 5 * this.d, 5 * this.d];
                this.yield = [0, 0, 0, 0]; //Yield per second
                this.flavorText = 'A bridge for crossing water.';
                this.icon = 'B';
                this.time = 5 * this.d;
                this.points = 0;
                break;
            case 'settlement':
                this.cost = [5 * this.d, 20 * this.d, 10 * this.d, 5 * this.d];
                this.yield = [1, 0, 0, 0];
                this.flavorText = 'A settlement, build to increase Population';
                this.icon = 'S';
                this.time = 5 * this.d;
                this.points = 500;
                break;
            case 'settlement +':
                this.cost = [20 * this.d, 80 * this.d, 40 * this.d, 20 * this.d];
                this.yield = [3, 0, 0, 0];
                this.flavorText = 'An additional settlement, build to quadruple Population increase';
                this.icon = 'S+';
                this.time = 10 * this.d;
                this.points = 1000;
                break;
            case 'mine':
                this.cost = [5 * this.d, 20 * this.d, 5 * this.d, 10 * this.d];
                this.yield = [0, 0, 0, 1];
                this.flavorText = 'A mine, build to produce Iron';
                this.icon = 'M';
                this.time = 5 * this.d;
                this.points = 500;
                break;
            case 'mine +':
                this.cost = [20 * this.d, 80 * this.d, 20 * this.d, 40 * this.d];
                this.yield = [0, 0, 0, 3];
                this.flavorText = 'An additional mine, build to quadruple Iron production';
                this.icon = 'M+';
                this.time = 10 * this.d;
                this.points = 1000;
                break;
            case 'farm':
                this.cost = [20 * this.d, 10 * this.d, 5 * this.d, 5 * this.d];
                this.yield = [0, 0, 1, 0];
                this.flavorText = 'A farm, build to produce Corn';
                this.icon = 'F';
                this.time = 5 * this.d;
                this.points = 500;
                break;
            case 'farm +':
                this.cost = [80 * this.d, 40 * this.d, 20 * this.d, 20 * this.d];
                this.yield = [0, 0, 3, 0];
                this.flavorText = 'An additional farm, build to quadruple Corn production';
                this.icon = 'F+';
                this.time = 10 * this.d;
                this.points = 1000;
                break;
            case 'wood cutter':
                this.cost = [5 * this.d, 10 * this.d, 5 * this.d, 20 * this.d];
                this.yield = [0, 1, 0, 0];
                this.flavorText = 'A wood cutter, build to produce Lumber';
                this.icon = 'W';
                this.time = 5 * this.d;
                this.points = 500;
                break;
            case 'wood cutter +':
                this.cost = [20 * this.d, 40 * this.d, 20 * this.d, 80 * this.d];
                this.yield = [0, 3, 0, 0];
                this.flavorText = 'An additional wood cutter, build to quadruple Lumber production';
                this.icon = 'W+';
                this.time = 10 * this.d;
                this.points = 1000;
                break;
            case 'castle lv. 1':
                this.cost = [0 * this.d, 0 * this.d, 0 * this.d, 0 * this.d];
                this.yield = [1, 1, 1, 1];
                this.flavorText = 'A level 1 castle. Achieve level 3 to win';
                this.icon = 'C1';
                this.time = 0 * this.d;
                this.points = 0;
                break;
            case 'castle lv. 2':
                this.cost = [150 * this.d, 150 * this.d, 150 * this.d, 150 * this.d];
                this.yield = [1, 1, 1, 1];
                this.flavorText = 'A level 2 castle. Achieve level 3 to win';
                this.icon = 'C2';
                this.time = 20 * this.d;
                this.points = 500;
                break;
            case 'castle lv. 3':
                this.cost = [300 * this.d, 300 * this.d, 300 * this.d, 300 * this.d];
                this.yield = [3, 3, 3, 3];
                this.flavorText = 'A level 3 castle. If this is built you win!';
                this.icon = 'C3';
                this.time = 30 * this.d;
                this.points = 1000;
                break;
            default:
                this.cost = [100, 100, 100, 100];
                this.yield = [0, 0, 0, 0];
                this.flavorText = 'Unidentified';
                this.icon = 'U';
                this.time = 1000;
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
        case 'castle': 
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

function numberOfBuildings(grid) {
    var buildingNumber = 0;
    for (i = 0; i < grid.length; i++) {
        var hex = grid[i];
        buildingNumber += hex.buildings.length;
    }
    return buildingNumber;
}

function maxResources(numBuildings) {
    var maxResources = 20;
    maxResources += Math.floor(numBuildings * 10);
    if (maxResources > 900) {
        maxResources = 900;
    }
    return maxResources;
}

function build(grid) {
    for (i = 0; i < grid.length; i++) {
        if (grid[i].isBuilding === 1) {
            if (grid[i].buildingState < 100) {
                if ((frame / (grid[i].buildingOptions[grid[i].nextBuilding].time * .6))%1 === 0) {
                    grid[i].buildingState++;
                }
            }
            else {
                grid[i].buildingState = 0;
                grid[i].buildings.push(grid[i].buildingOptions[grid[i].nextBuilding]);
                grid[i].nextBuilding++;
                grid[i].isBuilding = 0;
            }
        }
    }
}

function updateResources(grid, resources) {
    var max = maxResources(numberOfBuildings(gameGrid));
    if ((frame / 60) % 1 === 0) {
        for (i = 0; i < grid.length; i++) {
            var hex = grid[i];
            for (j = 0; j < hex.buildings.length; j++) {
                for (k = 0; k < 4; k++) {
                    resources[k] += hex.buildings[j].yield[k];
                    changeInRes[k] += hex.buildings[j].yield[k];
                    if (resources[k] > max) {
                        resources[k] = max;
                    }
                }
            }
        }
    }
}

function detectWin(grid) {
    var length = grid.length;
    for (d = 0; d < length; d++) {
        var hex = grid[d];
        if (hex.buildings.length === 3) {
            if (hex.buildings[2].type === "castle lv. 3") {
                finishGame(gameArea);
                return true;
            }
        }
    }
    return false;
}

function finishGame(screen) {
    gameOver = true;
    screen.ctx.fillStyle = '#505050';
    screen.ctx.fillRect(0, 0, screen.canvas.width, screen.canvas.height);
    screen.ctx.fillStyle = '#404040';
    screen.ctx.fillRect(270, 300, 540, 100);
    screen.ctx.fillStyle = '#ffffff';
    screen.ctx.font = '58px Ubuntu';
    screen.ctx.fillText('You Won!', 430, 150);
    screen.ctx.fillText('New Game', 400, 370)
    var totalBuildings = 0,
        totalResources = changeInRes[0] + changeInRes[1] + changeInRes[2] + changeInRes[3],
        time = frame/60,
        score;

    for (p = 0; p < gameGrid.length; p++) {
        for (q = 0; q < gameGrid[p].buildings.length; q++) {
            totalBuildings += gameGrid[p].buildings[q].points;
        }
    }

    score = Math.floor((totalBuildings * 100) / (time));

    screen.ctx.fillText('your score was: ' + score, 275, 220);

}



var mouseDown = false;
gameArea.canvas.addEventListener('mousedown', function(event) { 
    mouseDown = true;
    if ((event.offsetX > 720 + 60) && (event.offsetX < 1080 - 60)) {
        if ((event.offsetY > 490) && (event.offsetY < 530)) {
            findSelectedHex(gameGrid).startBuild(playerResources);
            hover = 1;
        }
    }
    if (gameOver) {
        if ((event.offsetX > 270) && (event.offsetX < 810)) {
            if ((event.offsetY > 300) && (event.offsetY < 400)) {
                reset = true;
            }
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

    mouseX = event.offsetX;
    mouseY = event.offsetY;
});

var touchX, touchY;
gameArea.canvas.addEventListener('touchstart', function(event) {
    var first = event.changedTouches[0]
    touchX = parseInt(first.clientX);
    touchY = parseInt(first.clientY);
});

gameArea.canvas.addEventListener('touchmove', function(event) {
    var first = event.changedTouches[0],
        changeX = parseInt(first.clientX) - touchX,
        changeY = parseInt(first.clientY) - touchY;
    
    gridCenterX += changeX;
    gridCenterY += changeY;

    touchX = parseInt(first.clientX);
    touchY = parseInt(first.clientY);
    event.preventDefault();
});

function newGame() {
    frame = 0;
    changeInRes = [0, 0, 0, 0];
    playerResources = [30, 30, 30, 30];
    centerX = (gameArea.canvas.width * (2 / 3)) / 2;
    centerY = gameArea.canvas.height / 2;
    mouseX = null;
    mouseY = null;
    gridCenterX = centerX;
    gridCenterY = centerY;
    difficulty = 1;
    hover = 0;
    gameGrid = buildGrid(mapSize, mapSize, mapSize, radius, offset);
}

function update() {
    if (!gameOver) {
        frame++;
        gameArea.clear();
        selectTile(gameGrid);
        drawGrid(gameArea, gameGrid, offset, gridCenterX, gridCenterY);
        drawCursor(gameArea);
        drawSideboard(gameArea);
        build(gameGrid);
        updateResources(gameGrid, playerResources);
        drawInfoScreen(mouseX, mouseY, gameArea);
        detectWin(gameGrid);
    }
    else {
        if (reset) {
            newGame();
            gameOver = false;
            reset = false;
        }
    }
}

startGame();