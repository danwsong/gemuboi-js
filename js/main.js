let gb;
let cycles;
let next;
let paused = false;
let running = false;

function update() {
    if (paused || !running) {
        return;
    }
    if (gb.cartridge.hasRTC) {
        gb.cartridge.rtc.updateTime();
    }
    while (cycles < Display.cpuCyclesPerFrame) {
        try {
            cycles += gb.cycle();
        } catch (error) {
            console.error(error);
            running = false;
            return;
        }
    }
    cycles -= Display.cpuCyclesPerFrame;
    next += Display.frameInterval;
    setTimeout(update, next - performance.now());
}

function loadAndStart(rom) {
    gb = new GameBoy();
    try {
        gb.cartridge.load(rom);
        running = true;
        next = performance.now();
        cycles = 0;
        update();
    } catch (error) {
        console.error(error);
    }
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

const romFileInput = document.getElementById('romFileInput');
romFileInput.addEventListener('change', () => {
    if (running) {
        gb.cartridge.save();
        running = false;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
        loadAndStart(new Uint8Array(reader.result));
    });
    reader.readAsArrayBuffer(romFileInput.files[0]);
});

const startDemoButton = document.getElementById('startDemoButton');
startDemoButton.addEventListener('click', () => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status >= 200 && xhr.status < 299) {
                loadAndStart(new Uint8Array(xhr.response));
            }
        }
    });
    xhr.open('GET', '/static/pocket.gb');
    xhr.send();
});

document.addEventListener('keydown', (ev) => {
    if (running) {
        switch (ev.code) {
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

document.addEventListener('keyup', (ev) => {
    if (running) {
        switch (ev.code) {
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
