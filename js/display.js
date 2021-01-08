class Display {
    constructor(gb) {
        this.gb = gb;

        this.lcdOn = true;
        this.windowTilemap = false;
        this.windowOn = false;
        this.bgWindowTileMode = true;
        this.bgTilemap = false;
        this.objHeight = false;
        this.objOn = false;
        this.bgOn = true;

        this.lycMatchInt = false;
        this.mode10Int = false;
        this.mode01Int = false;
        this.mode00Int = false;
        this.lycMatch = false;
        this.mode = 0;

        this.scy = 0;
        this.scx = 0;

        this.ly = 0;

        this.lyc = 0;

        this._bgp = 0;
        this._obp0 = 0;
        this._obp1 = 0;

        this.bgPalette = [0, 0, 0, 0];
        this.objPalette = [[0, 0, 0, 0], [0, 0, 0, 0]];

        this.bgColorIndex = 0;
        this.bgColorInc = false;

        this.objColorIndex = 0;
        this.objColorInc = false;

        this._bcpd = new Uint8Array(0x40);
        this._ocpd = new Uint8Array(0x40);

        this.bgColorPalette = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
        this.objColorPalette = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];

        this.wy = 0;
        this.wx = 0;

        this._vbk = 0;

        this.hdmaSrc = 0;
        this.hdmaDst = 0;

        this._hdma5 = 0;

        this.hdmaOn = false;
        this.hblankHdmaOn = false;
        this.hdmaTrigger = false;
        this.hdmaCounter = 0;

        this.cycles = 0;
        this.windowLine = 0;

        this.vram = new Uint8Array(0x4000);
        this.oam = new Uint8Array(0xa0);

        this.imageData = Display.ctx.createImageData(Display.canvasWidth, Display.canvasHeight);
        this.pixels = new Uint32Array(this.imageData.data.buffer);
        this.bgClear = new Uint8Array(Display.width);
        this.bgPriority = new Uint8Array(Display.width);
    }

    get lcdc() {
        return (this.lcdOn << 7) | (this.windowTilemap << 6) | (this.windowOn << 5) | (this.bgWindowTileMode << 4) | (this.bgTilemap << 3) | (this.objHeight << 2) | (this.objOn << 1) | this.bgOn;
    }

    set lcdc(value) {
        this.lcdOn = (value & 0x80) != 0;
        this.windowTilemap = (value & 0x40) != 0;
        this.windowOn = (value & 0x20) != 0;
        this.bgWindowTileMode = (value & 0x10) != 0;
        this.bgTilemap = (value & 0x8) != 0;
        this.objHeight = (value & 0x4) != 0;
        this.objOn = (value & 0x2) != 0;
        this.bgOn = (value & 0x1) != 0;
    }

    get stat() {
        return 0x80 | (this.lycMatchInt << 6) | (this.mode10Int << 5) | (this.mode01Int << 4) | (this.mode00Int << 3) | (this.lycMatch << 2) | this.mode;
    }

    set stat(value) {
        this.lycMatchInt = (value & 0x40) != 0;
        this.mode10Int = (value & 0x20) != 0;
        this.mode01Int = (value & 0x10) != 0;
        this.mode00Int = (value & 0x8) != 0;
    }

    set dma(value) {
        const src = value << 8;
        for (let index = 0; index < this.oam.length; index++) {
            this.oam[index] = this.gb.readAddress(src + index)
        }
    }

    get bgp() {
        return this._bgp;
    }

    set bgp(value) {
        this._bgp = value;
        this.bgPalette = [value & 0x3, (value >> 2) & 0x3, (value >> 4) & 0x3, (value >> 6) & 0x3];
    }

    get obp0() {
        return this._obp0;
    }

    set obp0(value) {
        this._obp0 = value;
        this.objPalette[0] = [value & 0x3, (value >> 2) & 0x3, (value >> 4) & 0x3, (value >> 6) & 0x3];
    }

    get obp1() {
        return this._obp1;
    }

    set obp1(value) {
        this._obp1 = value;
        this.objPalette[1] = [value & 0x3, (value >> 2) & 0x3, (value >> 4) & 0x3, (value >> 6) & 0x3];
    }

    set hdma1(value) {
        if (!this.gb.gbc) {
            return;
        }
        this.hdmaSrc = (value << 8) | (this.hdmaSrc & 0x00ff);
    }

    set hdma2(value) {
        if (!this.gb.gbc) {
            return;
        }
        this.hdmaSrc = (this.hdmaSrc & 0xff00) | (value & 0xf0);
    }

    set hdma3(value) {
        if (!this.gb.gbc) {
            return;
        }
        this.hdmaDst = ((value & 0x1f) << 8) | (this.hdmaDst & 0x00ff);
    }

    set hdma4(value) {
        if (!this.gb.gbc) {
            return;
        }
        this.hdmaDst = (this.hdmaDst & 0xff00) | (value & 0xf0);
    }

    get hdma5() {
        if (!this.gb.gbc) {
            return 0xff;
        }
        return ((!this.hdmaOn && !this.hblankHdmaOn) << 7) | ((this.hdmaCounter - 1) & 0x7f);
    }

    set hdma5(value) {
        if (!this.gb.gbc) {
            return;
        }
        if ((value & 0x80) == 0 && this.hblankHdmaOn) {
            this.hblankHdmaOn = false;
            return;
        }
        this.hdmaOn = (value & 0x80) == 0;
        this.hblankHdmaOn = (value & 0x80) != 0;
        if (this.hblankHdmaOn && this.mode == Display.modes.hblank) {
            this.hdmaOn = true;
        }
        this._hdma5 = value;
        this.hdmaCounter = (value & 0x7f) + 1;
    }

    get bcps() {
        if (!this.gb.gbc) {
            return 0xff;
        }
        return 0x40 | (this.bgColorInc << 7) | this.bgColorIndex;
    }

    set bcps(value) {
        if (!this.gb.gbc) {
            return;
        }
        this.bgColorInc = (value & 0x80) != 0;
        this.bgColorIndex = value & 0x3f;
    }

    get bcpd() {
        if (!this.gb.gbc) {
            return 0xff;
        }
        return this._bcpd[this.bgColorIndex];
    }

    set bcpd(value) {
        if (!this.gb.gbc) {
            return;
        }
        this._bcpd[this.bgColorIndex] = value;
        if ((this.bgColorIndex & 0x1) != 0) {
            this.bgColorPalette[this.bgColorIndex >> 3][(this.bgColorIndex & 0x6) >> 1] = ((value & 0x7f) << 8) | (this.bgColorPalette[this.bgColorIndex >> 3][(this.bgColorIndex & 0x6) >> 1] & 0xff)
        } else {
            this.bgColorPalette[this.bgColorIndex >> 3][(this.bgColorIndex & 0x6) >> 1] = (this.bgColorPalette[this.bgColorIndex >> 3][(this.bgColorIndex & 0x6) >> 1] & 0xff00) | value;
        }
        if (this.bgColorInc) {
            this.bgColorIndex = (this.bgColorIndex + 1) & 0x3f;
        }
    }

    get ocps() {
        if (!this.gb.gbc) {
            return 0xff;
        }
        return 0x40 | (this.objColorInc << 7) | this.objColorIndex;
    }

    set ocps(value) {
        if (!this.gb.gbc) {
            return;
        }
        this.objColorInc = (value & 0x80) != 0;
        this.objColorIndex = value & 0x3f;
    }

    get ocpd() {
        if (!this.gb.gbc) {
            return 0xff;
        }
        return this._ocpd[this.objColorIndex];
    }

    set ocpd(value) {
        if (!this.gb.gbc) {
            return;
        }
        this._ocpd[this.objColorIndex] = value;
        if ((this.objColorIndex & 0x1) != 0) {
            this.objColorPalette[this.objColorIndex >> 3][(this.objColorIndex & 0x6) >> 1] = ((value & 0x7f) << 8) | (this.objColorPalette[this.objColorIndex >> 3][(this.objColorIndex & 0x6) >> 1] & 0xff)
        } else {
            this.objColorPalette[this.objColorIndex >> 3][(this.objColorIndex & 0x6) >> 1] = (this.objColorPalette[this.objColorIndex >> 3][(this.objColorIndex & 0x6) >> 1] & 0xff00) | value;
        }
        if (this.objColorInc) {
            this.objColorIndex = (this.objColorIndex + 1) & 0x3f;
        }
    }

    get vbk() {
        if (!this.gb.gbc) {
            return 0xff;
        }
        return 0xfe | this._vbk;
    }

    set vbk(value) {
        if (!this.gb.gbc) {
            return;
        }
        this._vbk = value & 0x1;
    }

    readVRAM(address) {
        return this.vram[(this._vbk << 13) | address];
    }

    writeVRAM(address, value) {
        this.vram[(this._vbk << 13) | address] = value;
    }

    renderLine() {
        const address = (this.ly + Display.canvasMargin) * Display.canvasWidth + Display.canvasMargin;
        for (let x = 0; x < Display.width; x++) {
            if (this.bgOn) {
                if (this.windowOn && this.ly >= this.wy && x >= this.wx - 7) {
                    const tilemapY = (this.windowLine >> 3) & 0x1f;
                    const tilemapX = ((x - (this.wx - 7)) >> 3) & 0x1f;
                    const tilemapAddress = (this.windowTilemap ? 0x1c00 : 0x1800) | (tilemapY << 5) | tilemapX;

                    let tile = this.vram[tilemapAddress];
                    if (!this.bgWindowTileMode && tile < 0x80) {
                        tile += 0x100;
                    }
                    const tileY = this.windowLine & 0x7;
                    const tileAddress = (tile << 4) | (tileY << 1);

                    const tileX = (x - (this.wx - 7)) & 0x7;
                    const palette = (((this.vram[tileAddress + 1] << tileX) & 0x80) >> 6) | (((this.vram[tileAddress] << tileX) & 0x80) >> 7);

                    this.bgClear[x] = palette;
                    this.pixels[address + x] = Display.palette[this.bgPalette[palette]];
                } else {
                    const tilemapY = ((this.ly + this.scy) >> 3) & 0x1f;
                    const tilemapX = ((x + this.scx) >> 3) & 0x1f;
                    const tilemapAddress = (this.bgTilemap ? 0x1c00 : 0x1800) | (tilemapY << 5) | tilemapX;

                    let tile = this.vram[tilemapAddress];
                    if (!this.bgWindowTileMode && tile < 0x80) {
                        tile += 0x100;
                    }
                    const tileY = (this.ly + this.scy) & 0x7;
                    const tileAddress = (tile << 4) | (tileY << 1);

                    const tileX = (x + this.scx) & 0x7;
                    const palette = (((this.vram[tileAddress + 1] << tileX) & 0x80) >> 6) | (((this.vram[tileAddress] << tileX) & 0x80) >> 7);

                    this.bgClear[x] = palette;
                    this.pixels[address + x] = Display.palette[this.bgPalette[palette]];
                }
            } else {
                this.bgClear[x] = 0;
                this.pixels[address + x] = 0xffffffff;
            }
        }

        if (this.objOn) {
            const objs = [];
            for (let obj = 0; obj < 40 && objs.length < 10; obj++) {
                const objY = this.oam[obj * 4] - 16;
                const objX = this.oam[obj * 4 + 1] - 8;
                const tileY = (this.ly - objY) & 0xff;
                if (tileY < (this.objHeight ? 16 : 8)) {
                    let index = objs.length;
                    const compObjX = this.oam[objs[index - 1] * 4 + 1] - 8;
                    while (index > 0 && objX < compObjX) {
                        index--;
                    }
                    objs.splice(index, 0, obj);
                }
            }

            for (let index = objs.length - 1; index >= 0; index--) {
                const obj = objs[index];
                const objY = this.oam[obj * 4] - 16;
                const objX = this.oam[obj * 4 + 1] - 8;
                const tile = this.oam[obj * 4 + 2] & (this.objHeight ? 0xfe : 0xff);
                const attr = this.oam[obj * 4 + 3];
                const priority = (attr & 0x80) != 0;
                const yFlip = (attr & 0x40) != 0;
                const xFlip = (attr & 0x20) != 0;
                const paletteNumber = (attr & 0x10) >> 4;

                if (objX > -8 && objX < Display.width) {
                    let tileY = this.ly - objY;
                    if (yFlip) {
                        tileY = (this.objHeight ? 15 : 7) - tileY;
                    }
                    const tileAddress = (tile << 4) | (tileY << 1);

                    for (let x = Math.max(objX, 0); x < Math.min(objX + 8, Display.width); x++) {
                        let tileX = x - objX;
                        if (xFlip) {
                            tileX = 7 - tileX;
                        }
                        const palette = (((this.vram[tileAddress + 1] << tileX) & 0x80) >> 6) | (((this.vram[tileAddress] << tileX) & 0x80) >> 7);

                        if (palette != 0 && (!priority || this.bgClear[x] == 0)) {
                            this.pixels[address + x] = Display.palette[this.objPalette[paletteNumber][palette]];
                        }
                    }
                }
            }
        }
    }

    renderLineColor() {
        const address = (this.ly + Display.canvasMargin) * Display.canvasWidth + Display.canvasMargin;
        for (let x = 0; x < Display.width; x++) {
            if (this.windowOn && this.ly >= this.wy && x >= this.wx - 7) {
                const tilemapY = (this.windowLine >> 3) & 0x1f;
                const tilemapX = ((x - (this.wx - 7)) >> 3) & 0x1f;
                const tilemapAddress = (this.windowTilemap ? 0x1c00 : 0x1800) | (tilemapY << 5) | tilemapX;
                const tileAttributeAddress = 0x2000 | tilemapAddress;

                const attributes = this.vram[tileAttributeAddress];
                this.bgPriority[x] = (attributes & 0x80) != 0;
                const yFlip = (attributes & 0x40) != 0;
                const xFlip = (attributes & 0x20) != 0;
                const bankAddress = (attributes & 0x8) << 10;
                const paletteNumber = attributes & 0x7;

                let tile = this.vram[tilemapAddress];
                if (!this.bgWindowTileMode && tile < 0x80) {
                    tile += 0x100;
                }
                let tileY = this.windowLine & 0x7;
                if (yFlip) {
                    tileY = 7 - tileY;
                }
                const tileAddress = bankAddress | (tile << 4) | (tileY << 1);

                let tileX = (x - (this.wx - 7)) & 0x7;
                if (xFlip) {
                    tileX = 7 - tileX;
                }
                const palette = (((this.vram[tileAddress + 1] << tileX) & 0x80) >> 6) | (((this.vram[tileAddress] << tileX) & 0x80) >> 7);

                this.bgClear[x] = palette;
                this.pixels[address + x] = Display.colorPalette[this.bgColorPalette[paletteNumber][palette]];
            } else {
                const tilemapY = ((this.ly + this.scy) >> 3) & 0x1f;
                const tilemapX = ((x + this.scx) >> 3) & 0x1f;
                const tilemapAddress = (this.bgTilemap ? 0x1c00 : 0x1800) | (tilemapY << 5) | tilemapX;
                const tileAttributeAddress = 0x2000 | tilemapAddress;

                const attributes = this.vram[tileAttributeAddress];
                this.bgPriority[x] = (attributes & 0x80) != 0;
                const yFlip = (attributes & 0x40) != 0;
                const xFlip = (attributes & 0x20) != 0;
                const bankAddress = (attributes & 0x8) << 10;
                const paletteNumber = attributes & 0x7;

                let tile = this.vram[tilemapAddress];
                if (!this.bgWindowTileMode && tile < 0x80) {
                    tile += 0x100;
                }
                let tileY = (this.ly + this.scy) & 0x7;
                if (yFlip) {
                    tileY = 7 - tileY;
                }
                const tileAddress = bankAddress | (tile << 4) | (tileY << 1);

                let tileX = (x + this.scx) & 0x7;
                if (xFlip) {
                    tileX = 7 - tileX;
                }
                const palette = (((this.vram[tileAddress + 1] << tileX) & 0x80) >> 6) | (((this.vram[tileAddress] << tileX) & 0x80) >> 7);

                this.bgClear[x] = palette;
                this.pixels[address + x] = Display.colorPalette[this.bgColorPalette[paletteNumber][palette]];
            }
        }

        if (this.objOn) {
            const objs = [];
            for (let obj = 0; obj < 40 && objs.length < 10; obj++) {
                const objY = this.oam[obj * 4] - 16;
                const tileY = (this.ly - objY) & 0xff;
                if (tileY < (this.objHeight ? 16 : 8)) {
                    objs.push(obj);
                }
            }

            for (let index = objs.length - 1; index >= 0; index--) {
                const obj = objs[index];
                const objY = this.oam[obj * 4] - 16;
                const objX = this.oam[obj * 4 + 1] - 8;
                const tile = this.oam[obj * 4 + 2] & (this.objHeight ? 0xfe : 0xff);
                const attr = this.oam[obj * 4 + 3];
                const priority = (attr & 0x80) != 0;
                const yFlip = (attr & 0x40) != 0;
                const xFlip = (attr & 0x20) != 0;
                const bankAddress = (attr & 0x8) << 10;
                const paletteNumber = attr & 0x7;

                if (objX > -8 && objX < Display.width) {
                    let tileY = this.ly - objY;
                    if (yFlip) {
                        tileY = (this.objHeight ? 15 : 7) - tileY;
                    }
                    const tileAddress = bankAddress | (tile << 4) | (tileY << 1);

                    for (let x = Math.max(objX, 0); x < Math.min(objX + 8, Display.width); x++) {
                        let tileX = x - objX;
                        if (xFlip) {
                            tileX = 7 - tileX;
                        }
                        const palette = (((this.vram[tileAddress + 1] << tileX) & 0x80) >> 6) | (((this.vram[tileAddress] << tileX) & 0x80) >> 7);

                        if (palette != 0 && (!this.bgOn || this.bgClear[x] == 0 || (this.bgPriority[x] == 0 && !priority))) {
                            this.pixels[address + x] = Display.colorPalette[this.objColorPalette[paletteNumber][palette]];
                        }
                    }
                }
            }
        }
    }

    renderFrame() {
        Display.ctx.putImageData(this.imageData, 0, 0);
    }

    cycle() {
        if (this.lcdOn) {
            this.lycMatch = this.ly == this.lyc;
            if (this.lycMatch && this.lycMatchInt && this.cycles == 0) {
                this.gb.requestInterrupt(GameBoy.statInterrupt);
            }

            if (this.ly < Display.height) {
                if (this.cycles == 0) {
                    if (this.mode10Int) {
                        this.gb.requestInterrupt(GameBoy.statInterrupt);
                    }
                    this.mode = Display.modes.searchOAM;
                }
                if (this.cycles == 80) {
                    this.mode = Display.modes.transfer;
                }
                if (this.cycles == 248) {
                    if (this.mode00Int) {
                        this.gb.requestInterrupt(GameBoy.statInterrupt);
                    }
                    this.mode = Display.modes.hblank;
                    if (this.gb.gbc) {
                        this.renderLineColor();
                    } else {
                        this.renderLine();
                    }
                    if (this.hblankHdmaOn) {
                        this.hdmaTrigger = true;
                    }
                }
            }
            if (this.ly == Display.height && this.cycles == 0) {
                if (this.mode01Int) {
                    this.gb.requestInterrupt(GameBoy.statInterrupt);
                }
                this.gb.requestInterrupt(GameBoy.vblankInterrupt);
                this.mode = Display.modes.vblank;
                this.renderFrame();
            }

            this.cycles += Display.cyclesPerCPUCycle;
            if (this.cycles == Display.cyclesPerLine) {
                this.cycles = 0;
                if (this.windowOn && this.ly >= this.wy && this.wx <= 166) {
                    this.windowLine++;
                }
                this.ly++;
                if (this.ly == Display.linesPerFrame) {
                    this.ly = 0;
                    this.windowLine = 0;
                }
            }
        } else {
            this.ly = 0;
            this.mode = Display.modes.hblank;
        }
    }
}
Display.width = 160;
Display.height = 144;
Display.frequency = 4194304;
Display.cyclesPerLine = 456;
Display.linesPerFrame = 154;
Display.cyclesPerCPUCycle = Display.frequency / GameBoy.frequency;
Display.cpuCyclesPerFrame = Display.cyclesPerLine * Display.linesPerFrame / Display.cyclesPerCPUCycle;
Display.frameDuration = Display.cpuCyclesPerFrame / GameBoy.frequency;
Display.frameInterval = Display.frameDuration * 1000;
Display.palette = [
    0xffffffff, 0xffaaaaaa, 0xff555555, 0xff000000,
];
Display.colorPalette = Array.from(Array(0x8000), (v, k) => {
    const b = Math.floor((k >> 10) * 0xff / 0x1f);
    const g = Math.floor(((k & 0x3e0) >> 5) * 0xff / 0x1f);
    const r = Math.floor((k & 0x1f) * 0xff / 0x1f);
    return 0xff000000 | (b << 16) | (g << 8) | r;
});
Display.modes = {
    hblank: 0,
    vblank: 1,
    searchOAM: 2,
    transfer: 3,
}
Display.canvasMargin = 16;
Display.canvasWidth = Display.width + 2 * Display.canvasMargin;
Display.canvasHeight = Display.height + 2 * Display.canvasMargin;
Display.canvas = document.getElementById('canvas');
Display.canvas.width = Display.canvasWidth;
Display.canvas.height = Display.canvasHeight;
Display.ctx = Display.canvas.getContext('2d');