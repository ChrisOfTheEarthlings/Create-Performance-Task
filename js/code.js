function startGame() {
    gameArea.start();
}

var gameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = 1180;
        this.canvas.height = 630;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[1]);
    },
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

//x is right, y is left, z is down
class MapHex {
    constructor(x, y, z, terrain, buildingState) {
        this.x = x;
        this.y = y;
        this.id = ('' + x + y + z);
        this.terrain = terrain
        this.buildingState = buildingState
    }
}

/*
function generateTerrain(grid, xSize, ySize, zSize) {
    for (var hex = 0; hex < grid.length; 
}
*/

function buildGrid(xSize, ySize, zSize) {
    var grid = []
    for (var x = 1 - xSize; x < xSize; x++) {
        for (var y = 1 - ySize; y < ySize; y++) {
            for (var z = 1 - zSize; z < zSize; z++) {
                if (x + y + z === 0) {
                    grid.push(new MapHex(x, y, z, 'undefined', 'none'));
                    console.log(grid);
                }
            }
        }
    }
}

startGame();