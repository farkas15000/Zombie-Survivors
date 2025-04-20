let canvas
let ctx
const windowSize = new Vector2(1264, 720)
const middle = windowSize.copy().mult(0.5)
let volume = 0.5

let scoreboard = []
let lastname = ""

let state = "menu"
let prevState = "game"

let states = {}

const mousePos = new Vector2()
let mouseClick = [false, false]
let input = ""
let backspace = 0

const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    escape: false,
    enter: false,
    " ": false,
}

let dt = 0.016

const path = "Q9329E/assets/"
const assetSources = {
    player: 'player1.png',
    zombie1: 'zombie1.png',
    zombie2: 'zombie2.png',
    bullet: 'bullet1.png',
    grass: 'grass.png',
    shoot: 'shoot.png',
    button1: 'button2.png',
    button2: 'button3.png',
}
const audioSources = {
    music: 'Gustavo Santaolalla - The Last of Us (Main Theme).mp3',
    fire: 'fire.wav',
    click: 'click.wav',
    hit: 'hit.wav',
    hurt: 'hurt.wav',
}
const Assets = {}
const Audios = {}

const font = "Arial"

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

function loadAudio(audioMap) {
    const promises = []

    for (const [key, src] of Object.entries(audioMap)) {
        promises.push(new Promise((resolve, reject) => {
            const audio = new Audio()
            audio.src = path+src
            audio.addEventListener('canplaythrough', () => {
                Audios[key] = audio
                resolve()
            }, { once: true })
            audio.addEventListener('error', () => {
                reject(new Error(`Failed to load audio: ${src}`))
            })
        }))
    }
    return Promise.all(promises)
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min
}

$(document).ready(function ready() {
    canvas = document.getElementById('gameCanvas')
    ctx = canvas.getContext('2d')

    $(canvas).on('mousemove', getMouse)
    $(canvas).on('mousedown', () => {
        mouseClick = [mouseClick[1], true]
    })
    $(canvas).on('mouseup', () => {
        mouseClick = [mouseClick[1], false]

    })

    $(window).on('keydown', (e) => {
        if (keys.hasOwnProperty(e.key.toLowerCase())) {
            keys[e.key.toLowerCase()] = 1
        }
        if (e.key.length===1) {
            input += e.key
        }
        if (e.key==="Backspace") {
            backspace += 1
        }
    })
    $(window).on('keyup', (e) => {
        if (keys.hasOwnProperty(e.key.toLowerCase())) {
            keys[e.key.toLowerCase()] = 0
        }
    })

    //localStorage.clear()

    for (let i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i)==="scoreboard"){
            scoreboard = JSON.parse(localStorage.getItem("scoreboard"))
        }
        if (localStorage.key(i)==="volume"){
            volume = localStorage.getItem("volume")
        }
    }

    //localStorage.clear()

    loadAssets(assetSources).then(() => {
        loadAudio(audioSources).then(() => {

            states["menu"] = new Menu()
            states["perma"] = new Perma()

            main()

        }).catch(err => {
            console.error('Failed to load audio:', err)
        })

    }).catch(err => {
        console.error('Failed to load assets:', err)
    })
})

function startMusic(){
    let sound = Audios.music
    sound.loop = true
    sound.volume = volume*0.2
    sound.play()
}

function getMouse(e){
    const rect = canvas.getBoundingClientRect()
    mousePos.x = Math.ceil(e.clientX - rect.left)
    mousePos.y = Math.ceil(e.clientY - rect.top)
}

function clamp(value, min, max){
    return Math.min(Math.max(value, min), max)
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
        const c = Math.cos(rad)
        const s = Math.sin(rad)
        let x = this.x
        let y = this.y
        this.x = x * c + y * -s
        this.y = x * s + y * c
        return this
    }

    this.angleTo = function(vector2) {
        return Math.atan2(vector2.y - this.y, vector2.x - this.x)*180/Math.PI
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
    this.distanceToSquared = function (vector2){
        return (this.x-vector2.x)**2+(this.y-vector2.y)**2
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
        ctx.strokeStyle = "red"
        ctx.beginPath ()
        ctx.strokeRect(this.pos.x, this.pos.y, this.size.x, this.size.y)
        ctx.stroke ()
        ctx.strokeStyle = style
    }
    this.drawFill = function (color){
        let style = ctx.fillStyle
        ctx.fillStyle = color
        ctx.beginPath ()
        ctx.fillRect(this.pos.x, this.pos.y, this.size.x, this.size.y)
        ctx.stroke ()
        ctx.fillStyle = style
    }
    this.collidepoint = function (vector2){
        return (this.pos.x < vector2.x &&
            this.pos.x + this.size.x > vector2.x &&
            this.pos.y < vector2.y &&
            this.pos.y + this.size.y > vector2.y)

    }

}

function write(text, font, size, x, y, color="Black", align="start"){
    let style = ctx.fillStyle
    ctx.fillStyle = color
    ctx.textAlign = align

    ctx.font = size + "px " + font
    ctx.fillText (text ,x , y)

    ctx.fillStyle = style
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

function Player(img, health, speed, firerate, bullets) {
    this.img = img
    this.health = health
    this.speed = speed
    this.firerate = firerate
    this.shootTimer = 1
    this.bulets = bullets
    this.shot = false
    this.pos = middle.copy()
    this.rot = 0
    let padding = 20
    this.wallRect = new Rect(padding, padding, windowSize.x-2*padding, windowSize.y-2*padding)
    this.healthRect = new Rect(0, 0, 80, 12)

    this.update = function() {

        let vect = new Vector2(keys.d-keys.a, keys.s-keys.w)
        vect.normalise().mult(this.speed*dt*(1-0.4*mouseClick[1]))
        if (this.wallRect.collidepoint(this.pos.copy().add(vect))){
            this.pos.add(vect)
        }
        this.rot = this.pos.angleTo(mousePos)-3+this.pos.distanceTo(mousePos)/280

        if (mouseClick[1] && this.shootTimer<=0){
            this.shootTimer = 1/this.firerate
            this.shot = true
            let bullet = new Bullet(Assets.bullet, new Vector2(50, 12).rotate(this.rot).add(this.pos), this.rot+getRndInteger(-2, 2), 1000)
            this.bulets.push(bullet)

            let sound = Audios.fire.cloneNode()
            sound.volume = volume*0.3
            sound.play()

        } else {
            this.shootTimer-=dt
        }

    }
    this.draw = function() {
        this.healthRect.pos.x = this.pos.x-39
        this.healthRect.pos.y = this.pos.y-50
        this.healthRect.drawFill("black")
        health = new Rect(this.healthRect.pos.x+1,this.healthRect.pos.y+1, Math.max(this.health*0.78, 0), 10)
        health.drawFill("red")

        draw(this.img, [1, 1], this.pos, [0.25, -0.03], this.rot)
        if (this.shot){
            this.shot = false
            draw(Assets.shoot, [0.7, 0.6],  new Vector2(52, 11).rotate(this.rot).add(this.pos), [0.6, 0], this.rot)

        }
    }
}

function Bullet(img, pos, rotation, speed) {
    this.img = img
    this.speed = speed
    this.pos = pos
    this.direction = new Vector2(1, 0).rotate(rotation)
    this.rot = rotation
    let padding = -100
    this.wallRect = new Rect(padding, padding, windowSize.x-2*padding, windowSize.y-2*padding)
    this.alive = true

    this.update = function() {

        this.pos.add(this.direction.copy().mult(this.speed*dt))

        if (!this.wallRect.collidepoint(this.pos)){
            this.alive = false
            return 0
        }
    }
    this.draw = function() {
        draw(this.img, [0.6, 0.6], this.pos, [0, 0], this.rot)

    }
}

function Zombie(img, health, speed, score, scale, player) {
    this.img = img
    this.health = health
    this.alive = true
    this.speed = speed
    this.score = score
    this.scale = scale
    this.player = player
    this.pos = middle.copy().mult(1.3).rotate(getRndInteger(0, 360)).add(middle)
    this.rot = 0

    this.update = function() {
        if (this.health<=0){
            this.alive=false
            return 1
        }

        this.rot = this.pos.angleTo(this.player.pos)
        if (this.pos.distanceTo(this.player.pos)>40) {
            let vect = new Vector2(this.speed * dt, 0).rotate(this.rot)
            this.pos.add(vect)
        } else {
            this.player.health-=dt*40
            let sound = Audios.hurt
            sound.volume = volume
            sound.play()
        }
        return 0
    }
    this.draw = function() {
        draw(this.img, [1.8*this.scale, 1.8*this.scale], this.pos, [0, 0], this.rot)

    }
}

class Button {
    constructor(img, scale, pos, offset, popup, text="", sound=null) {
        this.img = img
        this.scale = scale
        this.pos = pos
        this.offset = offset
        this.popup = popup
        this.text = text
        this.sound = sound

        this.xm = this.scale[0]
        this.ym = this.scale[1]
        this.rect = getRect(this.img, [this.xm, this.ym], this.pos, this.offset)

        this.on = [false, false]
        this.held = [false, false]
        this.clicked = 0
        this.grabbed = 0
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

        if ((this.clicked || (this.grabbed && mouseClick[1]))) {
            this.grabbed = 1
        } else {
            this.grabbed = 0
        }

        if (doDraw) {
            this.draw()
        }

        if (this.clicked && this.sound) {
            this.sound.volume = volume
            this.sound.play()
        }

        return this.rect
    }
    draw(){
        this.rect = draw(this.img, [this.xm, this.ym], this.pos, this.offset, 0)
        if (this.text){
            write(this.text, font, 32, this.rect.pos.x+this.rect.size.x/2, this.rect.pos.y+this.rect.size.y/2+10, "Black", "center")
        }
        return this.rect
    }
}

class Slider extends Button {
    static map_value(value, value_min, value_max, map_min, map_max) {
        return ((value - value_min) / (value_max - value_min)) * (map_max - map_min) + map_min
    }
    constructor(img, scale, pos, offset, popup, text="", sound, horizontal=true, posmap=[100, 300], value_map=[0, 100], stepsize=1) {
        super(img, scale, pos, offset, popup,text, sound)
        this.posMap = posmap
        this.valueMap = value_map
        this.stepSize = stepsize
        this.horizontal = horizontal
        this._value = 0
        this.value = value_map[0]
    }
    get value() {
        return this._value
    }
    set value(value) {
        let mod = value % this.stepSize
        value = Math.floor(clamp(value - mod + (mod * 2 >= this.stepSize ? this.stepSize : 0), this.valueMap[0], this.valueMap[1],))

        this._value = value
        this.pos[!this.horizontal?"y":"x"] = ((value - this.valueMap[0]) / (this.valueMap[1] - this.valueMap[0])) * (this.posMap[1] - this.posMap[0]) + this.posMap[0]
    }

    update(doDraw = true) {
        let rect = super.update(doDraw)

        if (this.grabbed && !this.clicked)
        {
            this.value = ((mousePos[!this.horizontal?"y":"x"]-this.posMap[0]) / (this.posMap[1] - this.posMap[0])) * (this.valueMap[1] - this.valueMap[0]) + this.valueMap[0]
        }

        return rect
    }
}

class Game {
    constructor(difficulty) {
        this.diff = difficulty
        this.score = 0
        state = "game"

        this.exit = new Button(Assets.button2, [0.8, 0.5], new Vector2(50, 40), [0, 0], [1.1, 1.1], "Exit", Audios.click)

        this.bullets = []
        this.player = new Player(Assets.player, 100, 300, 8, this.bullets)

        this.enemyCap=12*this.diff
        this.enemyMax=2+this.diff
        this.zombies  = []

        this.spawner = setInterval(this.spawn, 900-100*this.diff, this)

        startMusic()

    }
    destruct(){
        states["game"] = null
        clearInterval(this.spawner)
    }
    spawn(game){
        if (game.zombies.length<game.enemyMax){
            if (getRndInteger(0, 10) < 8) {
                game.zombies.push(new Zombie(Assets.zombie1, 13*game.diff, 100, 100*game.diff, 1, game.player))
            } else {
                game.zombies.push(new Zombie(Assets.zombie2, 23*game.diff, 60, 200*game.diff, 1.2, game.player))
            }
        }
    }

    update() {
        if (prevState==="menu" && state==="game"){
            //console.log("game")
        }

        draw(Assets.grass, [1, 1], middle, [0, 0], 0)

        // bullet zombie collide hit
        for (const zombie of this.zombies) {
            for (const bullet of this.bullets) {
                if (bullet.alive && zombie.alive && zombie.pos.distanceToSquared(bullet.pos) <= 30**2){
                    zombie.health-=10
                    bullet.alive=false

                    let sound = Audios.hit.cloneNode()
                    sound.volume = volume*0.5
                    sound.play()

                }
            }
        }
        this.killEntities(this.zombies)
        // zombie to zombie collision handle
        for (let i = 0; i < this.zombies.length; i++) {
            for (let j = i+1; j < this.zombies.length; j++) {
                let z1 = this.zombies[i]
                let z2 = this.zombies[j]
                let dist = z1.pos.distanceTo(z2.pos)
                let min = 60
                if (dist < min){
                    let vect = z1.pos.copy().mult(-1).add(z2.pos).normalise().mult((min-dist)/2)

                    z2.pos.add(vect)
                    z1.pos.add(vect.mult(-1))
                }
            }
        }
        for (const zombie of this.zombies) {
            let died = zombie.update()
            zombie.draw()

            if (died){
                this.enemyMax = Math.min(this.enemyCap, this.enemyMax+0.2*this.diff)
                this.score+=zombie.score
            }

        }

        this.killEntities(this.bullets)
        for (const bullet of this.bullets) {
            bullet.update()
            bullet.draw()
        }

        this.player.update()
        this.player.draw()

        write("Health: "+Math.ceil(Math.max(this.player.health, 0))+"%", font, 50, 30, windowSize.y-30, "White", "start")

        write("Score: " + this.score, font, 60, middle.x, 70, "White", "center")

        this.exit.update()
        if (this.exit.clicked){
            this.player.health = 0
        }

        if (this.player.health<=0){
            this.destruct()
            states["score"] = new Score(this.score)
        }

    }

    killEntities(list=[]){
        for (let i = list.length - 1; i >= 0; i--) {
            if (!list[i].alive) {
                list.splice(i, 1);
            }
        }
    }
}

class Menu {
    constructor() {
        this.middle =windowSize.copy().mult(0.5)

        this.easy = new Button(Assets.button1, [0.6, 0.8], new Vector2(-200, 0).add(this.middle), [0, 0], [1.1, 1.1], "Easy", Audios.click)
        this.medium = new Button(Assets.button1, [0.6, 0.8], new Vector2(0, 0).add(this.middle), [0, 0], [1.1, 1.1], "Medium", Audios.click)
        this.hard = new Button(Assets.button1, [0.6, 0.8], new Vector2(200, 0).add(this.middle), [0, 0], [1.1, 1.1], "Hard", Audios.click)
        this.dificulty =[this.easy, this.medium, this.hard]

        this.volume = new Slider(Assets.button2, [0.6, 0.6], new Vector2(100, this.middle.y+120), [0, 0], [1.1, 1.1], "", Audios.click,
            true, [this.middle.x-100, this.middle.x+100], [0, 100], 1)
        this.volumeline = new Rect(middle.x-133, this.middle.y+110, 266, 20)
        this.volume.value = volume*100

        this.scoreboard = new Button(Assets.button1, [0.8, 0.8], new Vector2(0, 220).add(this.middle), [0, 0], [1.1, 1.1], "Scoreboard", Audios.click)
        this.back = new Button(Assets.button2, [0.8, 0.5], new Vector2(50, 40), [0, 0], [1.1, 1.1], "Back", Audios.click)
        this.clear = new Button(Assets.button1, [0.5, 0.5], new Vector2(860, 40), [0, 0], [1.1, 1.1], "Clear", Audios.click)
        this.scoretab = false

    }
    update() {
        if (prevState==="game" && state==="menu"){
            //console.log("menu")
        }

        if (!this.scoretab) {
            for (const button of this.dificulty) {
                button.update()
            }

            write("Zombie Survivors", font, 70, this.middle.x, this.middle.y - 200, "White", "center")

            write("Start game", font, 50, this.middle.x, this.middle.y - 80, "White", "center")

            if (this.easy.clicked) {
                states["game"] = new Game(1)
            }
            if (this.medium.clicked) {
                states["game"] = new Game(2)
            }
            if (this.hard.clicked) {
                states["game"] = new Game(3)
            }

            this.volumeline.drawFill("white")
            this.volume.update()
            write("Volume: " + this.volume.value + "%", font, 30, this.middle.x - 350, this.volume.pos.y + 12, "White", )
            let vol = volume
            volume = this.volume.value / 100
            if (volume!==vol){
                localStorage.setItem("volume", volume)
                Audios.music.volume=volume*0.2
            }

            this.scoreboard.update()
            if (this.scoreboard.clicked) {
                this.scoretab = true
            }

            write("Készítette: Füleki Balázs Q9329E", font, 40, windowSize.x - 10, windowSize.y - 10, "White", "right")

        } else {
            this.back.update()
            if (this.back.clicked) {
                this.scoretab = false
            }
            this.clear.update()
            if (this.clear.clicked) {
                scoreboard = []
                localStorage.removeItem("scoreboard")
            }

            Score.listScores(100)
        }
    }
}

class Score {
    constructor(score) {
        state = "score"

        this.score = score
        this.name = lastname
    }
    static listScores(y){
        write("Scoreboard", font, 40, middle.x, y-45, "white", "center")

        if (scoreboard.length===0){
            write("No scores yet", font, 30, middle.x, y, "white", "center")
        }

        for (let i = scoreboard.length - 1; i >= 0; i--) {
            write(scoreboard[i], font, 30, middle.x, y, "white", "center")
            y+=35
        }

    }

    destruct(){
        states["score"] = null
    }
    update() {
        this.name+=input
        this.name = this.name.slice(0, this.name.length-backspace)

        write("Game over", font, 70, middle.x, 80, "white", "center")
        write("Your score: " + this.score, font, 50, middle.x, 160, "white", "center")
        write("Your name: " + this.name, font, 50, middle.x-450, 220, "white", )

        Score.listScores(345)

        if (keys.enter && this.name.trim()){
            this.name = this.name.trim()
            this.destruct()
            state = "menu"

            scoreboard.push(this.name + ": " + this.score)
            localStorage.setItem("scoreboard", JSON.stringify(scoreboard))
            lastname = this.name

            let sound = Audios.click
            sound.volume = volume
            sound.play()
        }
    }
}

class Perma {
    constructor() {
        this.middle =windowSize.copy().mult(0.5)
        this.info = new Button(Assets.button2, [0.7, 0.7], new Vector2(windowSize.x, 0), [-0.5, 0.5], [1, 1], "?")
    }
    update() {
        this.info.update()
        if (this.info.on[1]){
            let y=2.5
            let multi= 26
            write("Help menu", font, 24, this.middle.x+320, multi*y++, "White")
            y+=0.5
            write("Controls", font, 24, this.middle.x+320, multi*y++, "White")
            write("Up: W", font, 24, this.middle.x+320, multi*y++, "White")
            write("Left: A", font, 24, this.middle.x+320, multi*y++, "White")
            write("Down: S", font, 24, this.middle.x+320, multi*y++, "White")
            write("Right: D", font, 24, this.middle.x+320, multi*y++, "White")
            write("Shoot: Left click", font, 24, this.middle.x+320, multi*y++, "White")
            write("Save name and score: Enter", font, 24, this.middle.x+320, multi*y++, "White")
            y+=1
            write("Egyedűl maradtál egy", font, 24, this.middle.x+320, multi*y++, "White")
            write("zombi apokalipszis közepén.", font, 24, this.middle.x+320, multi*y++, "White")
            write("A küldetésed minél tovább", font, 24, this.middle.x+320, multi*y++, "White")
            write("életben maradni és", font, 24, this.middle.x+320, multi*y++, "White")
            write("magasabb pontszámot elérni", font, 24, this.middle.x+320, multi*y++, "White")
            write("a ranglétrán.", font, 24, this.middle.x+320, multi*y++, "White")
        }

    }
}

function main(timestamp) {
    if (!main.lastTime) main.lastTime = timestamp
    dt = (timestamp - main.lastTime) / 1000
    main.lastTime = timestamp

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let ps = state

    states[state].update()
    states["perma"].update()

    input = ""
    backspace = 0

    prevState = ps

    requestAnimationFrame(main)
}
