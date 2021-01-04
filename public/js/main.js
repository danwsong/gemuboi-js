let gb;
let cycles;
let next;
let paused = false;
let running = false;
let timeout;

function update() {
    timeout = null;
    while (cycles < Display.cpuCyclesPerFrame) {
        cycles += gb.cycle();
    }
    cycles -= Display.cpuCyclesPerFrame;
    next += Display.frameDuration * 1000;
    timeout = setTimeout(update, next - performance.now());
}

onbeforeunload = () => {
    if (running) {
        gb.cartridge.save();
    }
};

document.onvisibilitychange = () => {
    if (running) {
        if (document.hidden) {
            if (timeout != null) {
                clearTimeout(timeout);
                if (Sound.ctx.state == 'running') {
                    Sound.ctx.suspend();
                }
                paused = true;
            }
        } else {
            if (paused) {
                paused = false;
                if (Sound.ctx.state != 'running') {
                    Sound.ctx.resume();
                }
                next = performance.now();
                update();
            }
        }
    }
}

document.onclick = () => {
    if (Sound.ctx.state != 'running') {
        Sound.ctx.resume();
    }
}

const romInput = document.getElementById('rom-input');
romInput.onchange = () => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(romInput.files[0]);
    reader.onload = () => {
        if (running) {
            clearTimeout(update);
            gb.cartridge.save();
        }
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
    };
};

document.onkeydown = e => {
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
}

document.onkeyup = e => {
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
}
