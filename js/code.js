function startGame() {
    gameArea.start();
    var myGamePiece = new Component(30, 30, "red", 10, 120);
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

function Component(width, height, color, x, y, type) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    ctx = gameArea.context;
    ctx.fillStyle = color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
}

//x is right, y is left, z is down
function mapHex(x, y, z, terrain, buildingState) {
    this.x = x;
    this.y = y;
    this.id = ('' + x + y + z);
    this.terrain = terrain
    this.buildingState = buildingState
}