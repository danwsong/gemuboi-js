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
        this.mode = 0b00;

        this.scy = 0;
        this.scx = 0;

        this.ly = 0;

        this.lyc = 0;

        this._bgp = 0;
        this._obp0 = 0;
        this._obp1 = 0;

        this.bgPalette = [0b00, 0b00, 0b00, 0b00];
        this.objPalette = [[0b00, 0b00, 0b00, 0b00], [0b00, 0b00, 0b00, 0b00]];

        this.wy = 0;
        this.wx = 0;

        this.cycles = 0;
        this.windowLine = 0;

        this.vram = new Uint8Array(0x2000);
        this.oam = new Uint8Array(0xA0);

        this.imageData = Display.ctx.createImageData(Display.canvasWidth, Display.canvasHeight);
        this.pixels = new Uint32Array(this.imageData.data.buffer);
    }

    get lcdc() {
        return (this.lcdOn << 7) | (this.windowTilemap << 6) | (this.windowOn << 5) | (this.bgWindowTileMode << 4) | (this.bgTilemap << 3) | (this.objHeight << 2) | (this.objOn << 1) | this.bgOn;
    }

    set lcdc(value) {
        this.lcdOn = (value & 0b10000000) != 0;
        this.windowTilemap = (value & 0b01000000) != 0;
        this.windowOn = (value & 0b00100000) != 0;
        this.bgWindowTileMode = (value & 0b00010000) != 0;
        this.bgTilemap = (value & 0b00001000) != 0;
        this.objHeight = (value & 0b00000100) != 0;
        this.objOn = (value & 0b00000010) != 0;
        this.bgOn = (value & 0b00000001) != 0;
    }

    get stat() {
        return (this.lycMatchInt << 6) | (this.mode10Int << 5) | (this.mode01Int << 4) | (this.mode00Int << 3) | (this.lycMatch << 2) | this.mode;
    }

    set stat(value) {
        this.lycMatchInt = (value & 0b01000000) != 0;
        this.mode10Int = (value & 0b00100000) != 0;
        this.mode01Int = (value & 0b00010000) != 0;
        this.mode00Int = (value & 0b00001000) != 0;
    }

    get dma() {

    }

    set dma(value) {
        const h = value << 8;
        for (let l = 0; l < this.oam.length; l++) {
            this.oam[l] = this.gb.readAddress(h | l)
        }
    }

    get bgp() {
        return this._bgp;
    }

    set bgp(value) {
        this._bgp = value;
        this.bgPalette = [value & 0b11, (value >> 2) & 0b11, (value >> 4) & 0b11, (value >> 6) & 0b11];
    }

    get obp0() {
        return this._obp0;
    }

    set obp0(value) {
        this._obp0 = value;
        this.objPalette[0] = [value & 0b11, (value >> 2) & 0b11, (value >> 4) & 0b11, (value >> 6) & 0b11];
    }

    get obp1() {
        return this._obp1;
    }

    set obp1(value) {
        this._obp1 = value;
        this.objPalette[1] = [value & 0b11, (value >> 2) & 0b11, (value >> 4) & 0b11, (value >> 6) & 0b11];
    }

    writePixel(y, x, value) {
        this.pixels[(y + Display.canvasMargin) * Display.canvasWidth + (x + Display.canvasMargin)] = Display.palette[value];
    }

    renderLine() {
        const bg = new Uint8Array(Display.width);
        for (let x = 0; x < Display.width; x++) {
            if (this.bgOn) {
                if (this.windowOn && this.ly >= this.wy && x >= this.wx - 7) {
                    const tilemapY = (this.windowLine >> 3) & 0b11111;
                    const tilemapX = ((x - (this.wx - 7)) >> 3) & 0b11111;
                    const tilemapAddress = (this.windowTilemap ? 0x1c00 : 0x1800) | (tilemapY << 5) | tilemapX;

                    let tile = this.vram[tilemapAddress];
                    if (!this.bgWindowTileMode && tile < 0x80) {
                        tile += 0x100;
                    }
                    const tileY = this.windowLine & 0b111;
                    const tileAddress = (tile << 4) | (tileY << 1);

                    const tileX = (x - (this.wx - 7)) & 0b111;
                    const palette = (((this.vram[tileAddress + 1] << tileX) & 0b10000000) >> 6) | (((this.vram[tileAddress] << tileX) & 0b10000000) >> 7);

                    bg[x] = palette;
                    this.writePixel(this.ly, x, this.bgPalette[palette]);
                } else {
                    const tilemapY = ((this.ly + this.scy) >> 3) & 0b11111;
                    const tilemapX = ((x + this.scx) >> 3) & 0b11111;
                    const tilemapAddress = (this.bgTilemap ? 0x1c00 : 0x1800) | (tilemapY << 5) | tilemapX;

                    let tile = this.vram[tilemapAddress];
                    if (!this.bgWindowTileMode && tile < 0x80) {
                        tile += 0x100;
                    }
                    const tileY = (this.ly + this.scy) & 0b111;
                    const tileAddress = (tile << 4) | (tileY << 1);

                    const tileX = (x + this.scx) & 0b111;
                    const palette = (((this.vram[tileAddress | 0b1] << tileX) & 0b10000000) >> 6) | (((this.vram[tileAddress] << tileX) & 0b10000000) >> 7);

                    bg[x] = palette;
                    this.writePixel(this.ly, x, this.bgPalette[palette]);
                }
            } else {
                this.writePixel(this.ly, x, 0b00);
            }
        }

        if (this.objOn) {
            const objs = [];
            for (let obj = 0; obj < 40 && objs.length < 10; obj++) {
                const objY = this.oam[obj << 2];
                if (this.ly + (this.objHeight ? 0 : 8) < objY && this.ly + 16 >= objY) {
                    objs.push(obj);
                }
            }
            objs.sort((a, b) => {
                const objXA = this.oam[(a << 2) | 0b01];
                const objXB = this.oam[(b << 2) | 0b01];
                if (objXA != objXB) {
                    return objXB - objXA;
                }
                return b - a;
            });
            objs.forEach(obj => {
                const objAddress = obj << 2;
                const objY = this.oam[objAddress | 0b00];
                const objX = this.oam[objAddress | 0b01];
                const tile = this.oam[objAddress | 0b10] & ~(this.objHeight ? 0b1 : 0b0);
                const attributes = this.oam[objAddress | 0b11];
                const priority = (attributes & 0b10000000) != 0;
                const yFlip = (attributes & 0b1000000) != 0;
                const xFlip = (attributes & 0b100000) != 0;
                const paletteNumber = (attributes & 0b10000) >> 4;

                if (objX != 0 && objX < Display.width + 8) {
                    let tileY = this.ly - objY + 16;
                    if (yFlip) {
                        tileY = (this.objHeight ? 15 : 7) - tileY;
                    }
                    const tileAddress = (tile << 4) | (tileY << 1);

                    const minX = (objX > 8) ? objX - 8 : 0;
                    const maxX = (objX < Display.width) ? objX : Display.width;
                    const beginX = xFlip ? maxX - 1 : minX;
                    const endX = xFlip ? minX - 1 : maxX;
                    const incX = xFlip ? -1 : 1;
                    for (let x = beginX, tileX = 0; x != endX; x += incX, tileX++) {
                        const palette = (((this.vram[tileAddress + 1] << tileX) & 0b10000000) >> 6) | (((this.vram[tileAddress] << tileX) & 0b10000000) >> 7);

                        if (!this.bgOn || (palette != 0b00 && (!priority || bg[x] == 0b00))) {
                            this.writePixel(this.ly, x, this.objPalette[paletteNumber][palette]);
                        }
                    }
                }
            });
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
                    this.renderLine();
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
Display.palette = [
    0xffffffff, 0xffaaaaaa, 0xff555555, 0xff000000,
];
Display.modes = {
    hblank: 0b00,
    vblank: 0b01,
    searchOAM: 0b10,
    transfer: 0b11,
}
Display.canvasMargin = 16;
Display.canvasWidth = Display.width + 2 * Display.canvasMargin;
Display.canvasHeight = Display.height + 2 * Display.canvasMargin;
Display.canvas = document.getElementById('canvas');
Display.canvas.width = Display.canvasWidth;
Display.canvas.height = Display.canvasHeight;
Display.ctx = Display.canvas.getContext('2d');