let canvas
let ctx

let state = "menu"
let prevstate = "game"

let states = {}

const mousepos = new Vector2()

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
}

const path = "Q9329E/"
const sources = {
    player: 'player.png',
    enemy: 'enemy.png',
}
const Assets = {}

function loadAssets(assetMap) {
    const promises = []

    for (const [key, src] of Object.entries(assetMap)) {
        promises.push(new Promise((resolve, reject) => {
            const img = new Image()
            img.src = path+src
            img.onload = () => {
                Assets[key] = img
                resolve()
            }
            img.onerror = reject
        }))
    }

    return Promise.all(promises)
}

$(document).ready(function ready() {
    canvas = document.getElementById('gameCanvas')
    ctx = canvas.getContext('2d')

    $(canvas).on('mousemove', getMouse)

    $(window).on('keydown', (e) => {
        if (keys.hasOwnProperty(e.key.toLowerCase())) {
            keys[e.key.toLowerCase()] = 1
        }
    })
    $(window).on('keyup', (e) => {
        if (keys.hasOwnProperty(e.key.toLowerCase())) {
            keys[e.key.toLowerCase()] = 0
        }
    })

    loadAssets(sources).then(() => {
        states["menu"] = new Menu()
        main()
    }).catch(err => {
        console.error('Failed to load assets:', err)
    })
})

function getMouse(e){
    const rect = canvas.getBoundingClientRect()
    mousepos.x = Math.ceil(e.clientX - rect.left)
    mousepos.y = Math.ceil(e.clientY - rect.top)
}

function Vector2(x=0, y=0) {
    this.x = x
    this.y = y
    this.set = function(vector2) {
        this.x = vector2.x
        this.y = vector2.y
        return this
    }
    this.add = function(vector2) {
        this.x += vector2.x
        this.y += vector2.y
        return this
    }
    this.mult = function(num) {
        this.x *= num
        this.y *= num
        return this
    }
    this.rotate = function(deg) {
        let rad = deg * (Math.PI/180)
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        let x = this.x
        let y = this.y
        this.x = x * c + y * -s
        this.y = x * s + y * c
        return this
    }

    this.copy = function() {
        return new Vector2(this.x, this.y)
    }
    this.toString = function (){
        return "(" + this.x + ", " + this.y +")"
    }
    this.normalise = function (){
        let lenght = Math.sqrt(this.x**2+this.y**2)
        if (lenght>0) {
            this.x /= lenght
            this.y /= lenght
        }
        return this
    }
    this.lenght = function (){
        return Math.sqrt(this.x**2+this.y**2)
    }
    this.distanceTo = function (vector2){
        return Math.sqrt((this.x-vector2.x)**2+(this.y-vector2.y)**2)
    }
}

function Rect(x=0, y=0, w=0, h=0) {
    this.pos = new Vector2(x, y)
    this.size = new Vector2(w, h)
    this.copy = function() {
        return new Rect(this.pos.x, this.pos.y, this.size.x, this.size.y)
    }
    this.toString = function (){
        return "(" + this.pos.x + ", " +  this.pos.y + ", " +  this.size.x + ", " +  this.size.y+")"
    }
    this.collide = function(rect) {
        return (this.pos.x < rect.pos.x + rect.size.x &&
            this.pos.x + rect.size.x > rect.pos.x &&
            this.pos.y < rect.pos.y + rect.size.y &&
            this.pos.y + this.size.y > rect.pos.y)
    }
    this.draw = function (){
        let style = ctx.strokeStyle
        ctx.strokeStyle = "red";
        ctx.beginPath ()
        ctx.strokeRect(this.pos.x, this.pos.y, this.size.x, this.size.y)
        ctx.stroke ()
        ctx.strokeStyle = style
    }

}

function draw(img, pos, offset=[0, 0], rotation=0){
    ctx.save()
    ctx.translate(pos.x, pos.y)
    if (rotation!==0) {
        ctx.rotate(rotation * (Math.PI/180))
    }
    let w = img.width
    let h = img.height
    ctx.drawImage(img, -w / 2 + w*offset[0], -h / 2 + h*offset[1])
    ctx.restore()

    let topleft = new Vector2(w*offset[0],  h*offset[1])
    topleft.rotate(rotation)

    topleft.x = topleft.x + w/-2 + pos.x
    topleft.y = topleft.y + h/-2 + pos.y

    let rect = new Rect(topleft.x, topleft.y, w, h)

    let r = Math.abs((rotation+90) % 180-90)
    let area1 = rect.size.copy()
    let area2 = rect.size.copy()
    let absrect = new Rect(0, 0, area1.rotate(-r).x, area2.rotate(r).y)
    absrect.pos.x = rect.pos.x+rect.size.x/2-absrect.size.x/2
    absrect.pos.y = rect.pos.y+rect.size.y/2-absrect.size.y/2

    return absrect
}

function Zombie(img, health, speed) {
    this.img = img
    this.health = health
    this.speed = speed
    this.pos = new Vector2(0, 0)
    this.move = function() {
        return 0
    }
}

function Player(img, health, speed) {
    this.img = img
    this.health = health
    this.speed = speed
    this.pos = new Vector2(100, 100)
    this.rot = 0

    this.update = function() {
        let vect = new Vector2(keys.d-keys.a, keys.s-keys.w)
        vect.normalise()
        this.pos.add(vect.mult(this.speed))
    }
    this.draw = function() {
         draw(this.img, this.pos, [0, 0], this.rot)

    }
}

class Game {
    constructor() {
        state = "game"
        this.player = new Player(Assets.player, 100, 3)
    }
    update() {
        if (prevstate==="menu" && state==="game"){
            console.log("game")
        }

        this.player.update()
        this.player.draw()

    }
}

class Menu {
    constructor() {
    }
    update() {
        if (prevstate==="game" && state==="menu"){
            console.log("menu")}

        states["game"] = new Game()

    }
}

function main() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let ps = state

    states[state].update()

    prevstate = ps

    requestAnimationFrame(main)

}
