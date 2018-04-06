var gameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = 1180;
        this.canvas.height = 660;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[1]);
    }
}

function startGame() {
    gameArea.start();
}

