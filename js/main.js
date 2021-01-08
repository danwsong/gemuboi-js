let gb;
let cycles;
let next;
let paused = false;
let running = false;
let timeout;

function update() {
    if (paused || !running) {
        return;
    }
    timeout = null;
    if (gb.cartridge.hasRTC) {
        gb.cartridge.rtc.updateTime();
    }
    while (cycles < Display.cpuCyclesPerFrame) {
        try {
            cycles += gb.cycle();
        } catch (error) {
            console.log(error);
            running = false;
            return;
        }
    }
    cycles -= Display.cpuCyclesPerFrame;
    next += Display.frameInterval;
    timeout = setTimeout(update, next - performance.now());
}

addEventListener('beforeunload', () => {
    if (running) {
        gb.cartridge.save();
    }
});

document.addEventListener('visibilitychange', () => {
    if (running) {
        if (document.hidden) {
            paused = true;
        } else {
            paused = false;
            next = performance.now();
            update();
        }
    }
});

document.addEventListener('focus', () => {
    document.activeElement.blur();
}, true);

document.addEventListener('click', () => {
    if (Sound.ctx.state != 'running') {
        Sound.ctx.resume();
    }
});

const romInput = document.getElementById('romInput');
romInput.addEventListener('change', () => {
    if (running) {
        gb.cartridge.save();
        running = false;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
        gb = new GameBoy();
        try {
            gb.cartridge.load(new Uint8Array(reader.result));
            running = true;
            next = performance.now();
            cycles = 0;
            update();
        } catch (error) {
            console.log(error);
        }
    });
    reader.readAsArrayBuffer(romInput.files[0]);
});

document.addEventListener('keydown', e => {
    if (running) {
        switch (e.code) {
            case "Enter": gb.joypad.start = true; break;
            case "ShiftRight": gb.joypad.select = true; break;
            case "KeyZ": gb.joypad.b = true; break;
            case "KeyX": gb.joypad.a = true; break;
            case "ArrowDown": gb.joypad.down = true; break;
            case "ArrowUp": gb.joypad.up = true; break;
            case "ArrowLeft": gb.joypad.left = true; break;
            case "ArrowRight": gb.joypad.right = true; break;
        }
    }
});

document.addEventListener('keyup', e => {
    if (running) {
        switch (e.code) {
            case "Enter": gb.joypad.start = false; break;
            case "ShiftRight": gb.joypad.select = false; break;
            case "KeyZ": gb.joypad.b = false; break;
            case "KeyX": gb.joypad.a = false; break;
            case "ArrowDown": gb.joypad.down = false; break;
            case "ArrowUp": gb.joypad.up = false; break;
            case "ArrowLeft": gb.joypad.left = false; break;
            case "ArrowRight": gb.joypad.right = false; break;
        }
    }
});
