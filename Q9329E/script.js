let canvas
let ctx

let state = "menu"
let prevState = "game"

let states = {}

const mousePos = new Vector2()
let mouseClick = [false, false]

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
}

let dt = 0.016

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
    $(canvas).on('mousedown', () => {
        mouseClick = [mouseClick[1], true]
        //console.log(mouseClick)
    })
    $(canvas).on('mouseup', () => {
        mouseClick = [mouseClick[1], false]
        //console.log(mouseClick)

    })

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
    mousePos.x = Math.ceil(e.clientX - rect.left)
    mousePos.y = Math.ceil(e.clientY - rect.top)
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
    this.collidepoint = function (vector2){
        return (this.pos.x < vector2.x &&
            this.pos.x + this.size.x > vector2.x &&
            this.pos.y < vector2.y &&
            this.pos.y + this.size.y > vector2.y)

    }

}

function draw(img, scale=[1, 1], pos, offset=[0, 0], rotation=0){
    ctx.save()
    ctx.translate(pos.x, pos.y)
    if (rotation!==0) {
        ctx.rotate(rotation * (Math.PI/180))
    }
    let w = img.width * scale[0]
    let h = img.height * scale[1]
    ctx.drawImage(img, -w / 2 + w*offset[0], -h / 2 + h*offset[1], w,  h)
    ctx.restore()

    return getRect(img, scale, pos, offset, rotation)
}

function getRect(img, scale=[1, 1], pos, offset=[0, 0], rotation=0){
    let w = img.width*scale[0]
    let h = img.height*scale[1]
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
        this.pos.add(vect.mult(this.speed*dt))
    }
    this.draw = function() {
         draw(this.img, [1, 1], this.pos, [0, 0], this.rot)

    }
}

class Button {
    constructor(img, scale, pos, offset, popup, sound=null) {
        this.img = img
        this.scale = scale
        this.pos = pos
        this.offset = offset
        this.popup = popup
        this.sound = sound

        this.xm = this.scale[0]
        this.ym = this.scale[1]
        this.rect = getRect(this.img, [this.xm, this.ym], this.pos, this.offset)

        this.on = [false, false]
        this.held = [false, false]
        this.clicked = 0
    }
    update(doDraw=true) {

        this.rect = draw(this.img, [this.xm, this.ym], this.pos, this.offset)
        this.on = [this.on[1], this.rect.collidepoint(mousePos)]

        if (this.on[1]) {
            this.xm = this.scale[0] * this.popup[0]
            this.ym = this.scale[1] * this.popup[1]
        } else {
            this.xm = this.scale[0]
            this.ym = this.scale[1]
            this.rect = getRect( this.img, [this.xm, this.ym], this.pos, this.offset,
            )
        }

        if (mouseClick[1] && !mouseClick[0] && this.on[1]) {
            this.held = [this.held[1], 1]
        } else {
            this.held = [this.held[1], 0]
        }

        if (this.held[1] && !this.held[0] && this.on[0]){
            this.clicked = 1
        } else {
            this.clicked = 0
        }

        if (doDraw) {
            this.draw()
        }

        if (this.clicked && this.sound) {
            //todo this.sound.play()
        }

        return this.rect
    }
    draw(){
        this.rect = draw(this.img, [this.xm, this.ym], this.pos, this.offset, 0)
        return this.rect
    }
}

class Game {
    constructor() {
        state = "game"
        this.player = new Player(Assets.player, 100, 300)
        this.button = new Button(Assets.enemy, [1, 1], new Vector2(100, 100), [0, 0], [1.1, 1.1])
    }
    update() {
        if (prevState==="menu" && state==="game"){
            console.log("game")
        }

        this.player.update()
        this.player.draw()

        this.button.update()
        if (this.button.clicked){
            console.log("clicked")
        }

    }
}

class Menu {
    constructor() {
    }
    update() {
        if (prevState==="game" && state==="menu"){
            console.log("menu")}

        states["game"] = new Game()

    }
}

function main(timestamp) {
    if (!main.lastTime) main.lastTime = timestamp;
    dt = (timestamp - main.lastTime) / 1000; // in seconds
    main.lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let ps = state

    states[state].update()

    prevState = ps

    requestAnimationFrame(main)

}
