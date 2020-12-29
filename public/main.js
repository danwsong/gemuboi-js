const COLORS = ['#000000', '#555555', '#AAAAAA', '#FFFFFF'];
const WIDTH = 160;
const HEIGHT = 144;
const SCALE = 4;

class Cartridge {
    constructor(gb) {
        this.gb = gb;

        this.cartridgeType = -1;
    }

    readROM(address) {
        switch (this.cartridgeType) {
            case -1:
                throw 'no cartridge loaded';
            case 0x00:
                return this.ROM[address];
            case 0x01:
            case 0x02:
            case 0x03:
                switch (address >> 12) {
                    case 0x0:
                    case 0x1:
                    case 0x2:
                    case 0x3:
                        return this.ROM[address & 0x3fff];
                    case 0x4:
                    case 0x5:
                    case 0x6:
                    case 0x7:
                        return this.ROM[(this.romBankNumber << 14) | (address & 0x3fff)];
                }
            case 0x0f:
            case 0x10:
            case 0x11:
            case 0x12:
            case 0x13:
                switch (address >> 12) {
                    case 0x0:
                    case 0x1:
                    case 0x2:
                    case 0x3:
                        return this.ROM[address & 0x3fff];
                    case 0x4:
                    case 0x5:
                    case 0x6:
                    case 0x7:
                        return this.ROM[(this.romBankNumber << 14) | (address & 0x3fff)];
                }
            default:
                throw 'unknown cartridge type: 0x' + this.cartridgeType.toString(16);
        }
    }

    writeROM(address, value) {
        switch (this.cartridgeType) {
            case -1:
                throw 'no cartridge loaded';
            case 0x00:
                break;
            case 0x01:
            case 0x02:
            case 0x03:
                switch (address >> 12) {
                    case 0x0:
                    case 0x1:
                        this.ramEnable = (value & 0b1111) == 0b1010;
                        break;
                    case 0x2:
                    case 0x3:
                        this.romBankNumber &= ~0b11111;
                        if ((value & 0b11111) == 0) {
                            value |= 0b00001;
                        }
                        this.romBankNumber |= (value & 0b11111);
                        break;
                    case 0x4:
                    case 0x5:
                        if (this.ramBankMode) {
                            this.ramBankNumber = value & 0b11;
                        } else {
                            this.romBankNumber |= (value & 0b11) << 5;
                        }
                        break;
                    case 0x6:
                    case 0x7:
                        this.ramBankMode = (value & 0b1) == 0b1;
                        break;
                }
                break;
            case 0x0f:
            case 0x10:
            case 0x11:
            case 0x12:
            case 0x13:
                switch (address >> 12) {
                    case 0x0:
                    case 0x1:
                        this.ramEnable = (value & 0b1111) == 0b1010;
                        break;
                    case 0x2:
                    case 0x3:
                        this.romBankNumber &= ~0b1111111;
                        if ((value & 0b1111111) == 0) {
                            value |= 0b0000001;
                        }
                        this.romBankNumber |= (value & 0b1111111);
                        break;
                    case 0x4:
                    case 0x5:
                        switch (value) {
                            case 0x00:
                            case 0x01:
                            case 0x02:
                            case 0x03:
                            case 0x08:
                            case 0x09:
                            case 0x0a:
                            case 0x0b:
                            case 0x0c:
                                this.ramBankNumber = value;
                            default:
                                break;
                        }
                        break;
                    case 0x6:
                    case 0x7:
                        break;
                }
                break;
            default:
                throw 'unknown cartridge type: 0x' + this.cartridgeType.toString(16);
        }
    }

    readRAM(address) {
        switch (this.cartridgeType) {
            case -1:
                throw 'no cartridge loaded';
            case 0x00:
                return 0x00;
            case 0x01:
                break;
            case 0x02:
            case 0x03:
                return this.RAM[(this.ramBankNumber << 13) | address];
            case 0x11:
                break;
            case 0x12:
            case 0x13:
            case 0x0f:
            case 0x10:
                switch (this.ramBankNumber) {
                    case 0x00:
                    case 0x01:
                    case 0x02:
                    case 0x03:
                        return this.RAM[(this.ramBankNumber << 13) | address];
                    case 0x08:
                    case 0x09:
                    case 0x0a:
                    case 0x0b:
                    case 0x0c:
                        return 0x00;
                    default:
                        return 0x00;
                }
            default:
                throw 'unknown cartridge type: 0x' + this.cartridgeType.toString(16);
        }
    }

    writeRAM(address, value) {
        switch (this.cartridgeType) {
            case -1:
                throw 'no cartridge loaded';
            case 0x00:
                break;
            case 0x01:
                break;
            case 0x02:
            case 0x03:
                this.RAM[(this.ramBankNumber << 13) | address] = value;
                break;
            case 0x11:
                break;
            case 0x12:
            case 0x13:
            case 0x0f:
            case 0x10:
                switch (this.ramBankNumber) {
                    case 0x00:
                    case 0x01:
                    case 0x02:
                    case 0x03:
                        this.RAM[(this.ramBankNumber << 13) | address] = value;
                        break;
                    case 0x08:
                    case 0x09:
                    case 0x0a:
                    case 0x0b:
                    case 0x0c:
                        break;
                    default:
                        break;
                }
                break;
            default:
                throw 'unknown cartridge type: 0x' + this.cartridgeType.toString(16);
        }
    }

    load(file) {
        this.title = new TextDecoder('ascii').decode(file.slice(0x134, 0x13f));
        document.title = this.title;
        this.cartridgeType = file[0x147];
        const romSize = 32768 << file[0x148];
        if (file.length != romSize) {
            throw 'wrong file size';
        }
        this.ROM = file;
        const ramSize = file[0x149];
        if (this.title in localStorage) {
            this.RAM = new Uint8Array(localStorage[this.title].split(',').map(parseFloat));
        } else {
            switch (ramSize) {
                case 0x00:
                    break;
                case 0x02:
                    this.RAM = new Uint8Array(0x2000);
                    break;
                case 0x03:
                    this.RAM = new Uint8Array(0x8000);
                    break;
                case 0x04:
                    this.RAM = new Uint8Array(0x20000);
                    break;
                default:
                    throw 'unknown RAM size: 0x' + ramSize.toString(16);
            }
        }
        this.ramEnable = false;
        this.romBankNumber = 0;
        this.ramBankNumber = 0;
        this.ramBankMode = false;
    }

    save() {
        if (this.RAM) {
            localStorage[this.title] = this.RAM;
        }
    }
}

class Joypad {
    constructor(gb) {
        this.gb = gb;

        this.selectButton = false;
        this.selectDirection = false;

        this.start = false;
        this.select = false;
        this.b = false;
        this.a = false;

        this.down = false;
        this.up = false;
        this.left = false;
        this.right = false;
    }

    get p1() {
        let _p1 = 0b111111;
        _p1 ^= this.selectButton << 5;
        _p1 ^= this.selectDirection << 4;
        if (this.selectButton) {
            _p1 ^= this.start << 3;
            _p1 ^= this.select << 2;
            _p1 ^= this.b << 1;
            _p1 ^= this.a;
        }
        if (this.selectDirection) {
            _p1 ^= this.down << 3;
            _p1 ^= this.up << 2;
            _p1 ^= this.left << 1;
            _p1 ^= this.right;
        }
        return _p1;
    }

    set p1(value) {
        this.selectButton = (value & 0b100000) == 0;
        this.selectDirection = (value & 0b10000) == 0;
    }
}

class Timer {
    constructor(gb) {
        this.gb = gb;

        this._div = 0;

        this.tima = 0;
        this.tma = 0;
        this.timerEnable = false;
        this.clockSelect = 0b00;

        this.overflowDelay = false;

        this.TAC_CYCLES = [0b0000001000000000, 0b0000000000001000, 0b0000000000100000, 0b0000000010000000];
    }

    get div() {
        return this._div >> 8;
    }

    set div(value) {
        this._div = 0;
    }

    get tac() {
        return (this.timerEnable << 2) | this.clockSelect;
    }

    set tac(value) {
        this.timerEnable = (value & 0b100) != 0;
        this.clockSelect = value & 0b11;
    }

    cycle() {
        this._div += 4;
        if (this.timerEnable) {
            const bit = this.TAC_CYCLES[this.clockSelect];
            if ((~this._div & (this._div - 1) & bit) != 0) {
                this.tima = (this.tima + 1) & 0xff;
                if (this.tima == 0) {
                    this.overflowDelay = true;
                } else if (this.overflowDelay) {
                    this.overflowDelay = false;
                    this.tima = this.tma;
                    this.gb.requestInterrupt(this.gb.TIMER);
                }
            }
        }
    }
}

class Display {
    constructor(gb) {
        this.HBLANK = 0b00;
        this.VBLANK = 0b01;
        this.SEARCH_OAM = 0b10;
        this.TRANSFER = 0b11;

        this.PALETTE = new Uint32Array(new Uint8Array([
            0xff, 0xef, 0xce, 0xff,
            0xde, 0x94, 0x4a, 0xff,
            0xad, 0x29, 0x21, 0xff,
            0x31, 0x19, 0x52, 0xff,
        ]).buffer);

        this.gb = gb;

        this.lcdOn = false;
        this.windowTilemap = false;
        this.windowOn = false;
        this.bgWindowTileMode = false;
        this.bgTilemap = false;
        this.objHeight = false;
        this.objOn = false;
        this.bgOn = false;

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

        this.dot = 0;
        this.windowLine = 0;

        this.VRAM = new Uint8Array(0x2000);
        this.OAM = new Uint8Array(0xA0);
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

    set dma(value) {
        const h = value << 8;
        for (let l = 0; l < this.OAM.length; l++) {
            this.OAM[l] = this.gb.readAddress(h | l)
        }
        this.gb.cycles -= this.OAM.length;
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
        for (let _y = 0; _y < SCALE; _y++) {
            for (let _x = 0; _x < SCALE; _x++) {
                pixels[(y * SCALE + _y) * WIDTH * SCALE + (x * SCALE + _x)] = this.PALETTE[value];
            }
        }
    }

    renderLine() {
        const bg = new Uint8Array(WIDTH);
        for (let x = 0; x < WIDTH; x++) {
            if (this.bgOn) {
                if (this.windowOn && this.ly >= this.wy && x >= this.wx - 7) {
                    const tilemapY = (this.windowLine >> 3) & 0b11111;
                    const tilemapX = ((x - (this.wx - 7)) >> 3) & 0b11111;
                    const tilemapAddress = (this.windowTilemap ? 0x1c00 : 0x1800) | (tilemapY << 5) | tilemapX;

                    let tile = this.VRAM[tilemapAddress];
                    if (!this.bgWindowTileMode && tile < 0x80) {
                        tile += 0x100;
                    }
                    const tileY = this.windowLine & 0b111;
                    const tileAddress = (tile << 4) | (tileY << 1);

                    const tileX = (x - (this.wx - 7)) & 0b111;
                    const palette = (((this.VRAM[tileAddress + 1] << tileX) & 0b10000000) >> 6) | (((this.VRAM[tileAddress] << tileX) & 0b10000000) >> 7);

                    bg[x] = palette;
                    this.writePixel(this.ly, x, this.bgPalette[palette]);
                } else {
                    const tilemapY = ((this.ly + this.scy) >> 3) & 0b11111;
                    const tilemapX = ((x + this.scx) >> 3) & 0b11111;
                    const tilemapAddress = (this.bgTilemap ? 0x1c00 : 0x1800) | (tilemapY << 5) | tilemapX;

                    let tile = this.VRAM[tilemapAddress];
                    if (!this.bgWindowTileMode && tile < 0x80) {
                        tile += 0x100;
                    }
                    const tileY = (this.ly + this.scy) & 0b111;
                    const tileAddress = (tile << 4) | (tileY << 1);

                    const tileX = (x + this.scx) & 0b111;
                    const palette = (((this.VRAM[tileAddress | 0b1] << tileX) & 0b10000000) >> 6) | (((this.VRAM[tileAddress] << tileX) & 0b10000000) >> 7);

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
                const objY = this.OAM[obj << 2];
                if (this.ly + (this.objHeight ? 0 : 8) < objY && this.ly + 16 >= objY) {
                    objs.push(obj);
                }
            }
            objs.sort((a, b) => {
                const objXA = this.OAM[(a << 2) | 0b01];
                const objXB = this.OAM[(b << 2) | 0b01];
                if (objXA != objXB) {
                    return objXB - objXA;
                }
                return b - a;
            });
            objs.forEach(obj => {
                const objAddress = obj << 2;
                const objY = this.OAM[objAddress | 0b00];
                const objX = this.OAM[objAddress | 0b01];
                const tile = this.OAM[objAddress | 0b10] & ~(this.objHeight ? 0b1 : 0b0);
                const attributes = this.OAM[objAddress | 0b11];
                const priority = (attributes & 0b10000000) != 0;
                const yFlip = (attributes & 0b1000000) != 0;
                const xFlip = (attributes & 0b100000) != 0;
                const paletteNumber = (attributes & 0b10000) >> 4;

                if (objX != 0 && objX < WIDTH + 8) {
                    let tileY = this.ly - objY + 16;
                    if (yFlip) {
                        tileY = (this.objHeight ? 15 : 7) - tileY;
                    }
                    const tileAddress = (tile << 4) | (tileY << 1);

                    const minX = (objX > 8) ? objX - 8 : 0;
                    const maxX = (objX < WIDTH) ? objX : WIDTH;
                    const beginX = xFlip ? maxX - 1 : minX;
                    const endX = xFlip ? minX - 1 : maxX;
                    const incX = xFlip ? -1 : 1;
                    for (let x = beginX, tileX = 0; x != endX; x += incX, tileX++) {
                        const palette = (((this.VRAM[tileAddress + 1] << tileX) & 0b10000000) >> 6) | (((this.VRAM[tileAddress] << tileX) & 0b10000000) >> 7);

                        if (!this.bgOn || (palette != 0b00 && (!priority || bg[x] == 0b00))) {
                            this.writePixel(this.ly, x, this.objPalette[paletteNumber][palette]);
                        }
                    }
                }
            });
        }
    }

    renderFrame() {
        ctx.putImageData(imageData, 0, 0);
    }

    cycle() {
        this.lycMatch = this.ly == this.lyc;
        if (this.lycMatch && this.lycMatchInt && this.dot == 0) {
            this.gb.requestInterrupt(this.gb.STAT);
        }

        if (this.lcdOn) {
            if (this.ly < HEIGHT) {
                if (this.dot == 0) {
                    if (this.mode10Int) {
                        this.gb.requestInterrupt(this.gb.STAT);
                    }
                    this.mode = this.SEARCH_OAM;
                }
                if (this.dot == 80) {
                    this.mode = this.TRANSFER;
                }
                if (this.dot == 248) {
                    if (this.dot == 248 && this.mode00Int) {
                        this.gb.requestInterrupt(this.gb.STAT);
                    }
                    this.mode = this.HBLANK;
                    this.renderLine();
                }
            }
            if (this.ly == HEIGHT && this.dot == 0) {
                if (this.mode01Int) {
                    this.gb.requestInterrupt(this.gb.STAT);
                }
                this.gb.requestInterrupt(this.gb.VBLANK);
                this.mode = this.VBLANK;
                this.renderFrame();
            }

            this.dot += 4;
            if (this.dot == 456) {
                this.dot = 0;
                if (this.windowOn && this.ly >= this.wy && this.wx <= 166) {
                    this.windowLine++;
                }
                this.ly++;
                if (this.ly == 154) {
                    this.ly = 0;
                    this.windowLine = 0;
                }
            }
        }
    }
}

class GameBoy {
    constructor() {
        this.INTERRUPT = 0b00011111;
        this.JOYPAD = 0b00010000;
        this.SERIAL = 0b00001000;
        this.TIMER = 0b00000100;
        this.STAT = 0b00000010;
        this.VBLANK = 0b00000001;

        this.display = new Display(this);
        this.timer = new Timer(this);
        this.joypad = new Joypad(this);
        this.cartridge = new Cartridge(this);

        this.a = 0;
        this.fz = false;
        this.fn = false;
        this.fh = false;
        this.fc = false;
        this.b = 0;
        this.c = 0;
        this.d = 0;
        this.e = 0;
        this.h = 0;
        this.l = 0;
        this._pc = 0;
        this._sp = 0;

        this.ime = false;

        this.halt = false;

        this._if = 0;
        this._ie = 0;

        this.bootDone = false;

        this.cycles = 0;

        this.BOOT = new Uint8Array([
            0x31, 0xfe, 0xff, 0xaf, 0x21, 0xff, 0x9f, 0x32, 0xcb, 0x7c, 0x20, 0xfb, 0x21, 0x26, 0xff, 0x0e,
            0x11, 0x3e, 0x80, 0x32, 0xe2, 0x0c, 0x3e, 0xf3, 0xe2, 0x32, 0x3e, 0x77, 0x77, 0x3e, 0xfc, 0xe0,
            0x47, 0x11, 0x04, 0x01, 0x21, 0x10, 0x80, 0x1a, 0xcd, 0x95, 0x00, 0xcd, 0x96, 0x00, 0x13, 0x7b,
            0xfe, 0x34, 0x20, 0xf3, 0x11, 0xd8, 0x00, 0x06, 0x08, 0x1a, 0x13, 0x22, 0x23, 0x05, 0x20, 0xf9,
            0x3e, 0x19, 0xea, 0x10, 0x99, 0x21, 0x2f, 0x99, 0x0e, 0x0c, 0x3d, 0x28, 0x08, 0x32, 0x0d, 0x20,
            0xf9, 0x2e, 0x0f, 0x18, 0xf3, 0x67, 0x3e, 0x64, 0x57, 0xe0, 0x42, 0x3e, 0x91, 0xe0, 0x40, 0x04,
            0x1e, 0x02, 0x0e, 0x0c, 0xf0, 0x44, 0xfe, 0x90, 0x20, 0xfa, 0x0d, 0x20, 0xf7, 0x1d, 0x20, 0xf2,
            0x0e, 0x13, 0x24, 0x7c, 0x1e, 0x83, 0xfe, 0x62, 0x28, 0x06, 0x1e, 0xc1, 0xfe, 0x64, 0x20, 0x06,
            0x7b, 0xe2, 0x0c, 0x3e, 0x87, 0xe2, 0xf0, 0x42, 0x90, 0xe0, 0x42, 0x15, 0x20, 0xd2, 0x05, 0x20,
            0x4f, 0x16, 0x20, 0x18, 0xcb, 0x4f, 0x06, 0x04, 0xc5, 0xcb, 0x11, 0x17, 0xc1, 0xcb, 0x11, 0x17,
            0x05, 0x20, 0xf5, 0x22, 0x23, 0x22, 0x23, 0xc9, 0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b,
            0x03, 0x73, 0x00, 0x83, 0x00, 0x0c, 0x00, 0x0d, 0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e,
            0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99, 0xbb, 0xbb, 0x67, 0x63, 0x6e, 0x0e, 0xec, 0xcc,
            0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e, 0x3c, 0x42, 0xb9, 0xa5, 0xb9, 0xa5, 0x42, 0x3c,
            0x21, 0x04, 0x01, 0x11, 0xa8, 0x00, 0x1a, 0x13, 0xbe, 0x20, 0xfe, 0x23, 0x7d, 0xfe, 0x34, 0x20,
            0xf5, 0x06, 0x19, 0x78, 0x86, 0x23, 0x05, 0x20, 0xfb, 0x86, 0x20, 0xfe, 0x3e, 0x01, 0xe0, 0x50,
        ]);
        this.WRAM = new Uint8Array(0x2000);
        this.HRAM = new Uint8Array(0x7f);
    }

    get f() {
        return (this.fz << 7) | (this.fn << 6) | (this.fh << 5) | (this.fc << 4);
    }

    set f(value) {
        this.fz = (value & 0b10000000) != 0;
        this.fn = (value & 0b01000000) != 0;
        this.fh = (value & 0b00100000) != 0;
        this.fc = (value & 0b00010000) != 0;
    }

    get bc() {
        return (this.b << 8) | this.c;
    }

    get de() {
        return (this.d << 8) | this.e;
    }

    get hl() {
        return (this.h << 8) | this.l;
    }

    get sp() {
        return this._sp;
    }

    get sph() {
        return this._sp >> 8;
    }

    get spl() {
        return this._sp & 0xff;
    }

    get pc() {
        return this._pc;
    }

    get pch() {
        return this._pc >> 8;
    }

    get pcl() {
        return this._pc & 0xff;
    }

    set bc(value) {
        this.b = (value >> 8) & 0xff;
        this.c = value & 0xff;
    }

    set de(value) {
        this.d = (value >> 8) & 0xff;
        this.e = value & 0xff;
    }

    set hl(value) {
        this.h = (value >> 8) & 0xff;
        this.l = value & 0xff;
    }

    set sp(value) {
        this._sp = value & 0xffff;
    }

    set pc(value) {
        this._pc = value & 0xffff;
    }

    get if() {
        return this._if;
    }

    set if(value) {
        this._if = value & this.INTERRUPT;
    }

    get ie() {
        return this._ie;
    }

    set ie(value) {
        this._ie = value & this.INTERRUPT;
    }

    reset() {
        this._pc = 0;
        this.bootDone = false;
        this.ime = true;
        this.halt = false;
        this._if = 0;
        this._ie = 0;
    }

    requestInterrupt(interrupt) {
        this._if |= interrupt;
    }

    clearInterrupt(interrupt) {
        this._if &= ~interrupt;
    }

    callInterrupt(address) {
        this.writeAddress(--this.sp, this.pch);
        this.writeAddress(--this.sp, this.pcl);
        this.pc = address;
        this.cycles += 3;
    }

    readAddress(address) {
        this.cycles += 1;
        switch (address >> 12) {
            case 0x0:
            case 0x1:
            case 0x2:
            case 0x3:
            case 0x4:
            case 0x5:
            case 0x6:
            case 0x7:
                if (!this.bootDone && address < 0x100) {
                    return this.BOOT[address];
                } else {
                    return this.cartridge.readROM(address & 0x7fff);
                }
            case 0x8:
            case 0x9:
                return this.display.VRAM[address & 0x1fff];
            case 0xa:
            case 0xb:
                return this.cartridge.readRAM(address & 0x1fff);
            case 0xc:
            case 0xd:
                return this.WRAM[address & 0x1fff];
            case 0xe:
            case 0xf:
                if (address < 0xfe00) {
                    return this.WRAM[address & 0x1fff];
                } else if (address < 0xff00) {
                    return this.display.OAM[address & 0xff];
                } else if (address < 0xff80) {
                    switch (address & 0xff) {
                        case 0x00: return this.joypad.p1;
                        case 0x01: return 0x00;
                        case 0x02: return 0x00;
                        case 0x04: return this.timer.div;
                        case 0x05: return this.timer.tima;
                        case 0x06: return this.timer.tma;
                        case 0x07: return this.timer.tac;
                        case 0x0f: return this.if;
                        case 0x40: return this.display.lcdc;
                        case 0x41: return this.display.stat;
                        case 0x42: return this.display.scy;
                        case 0x43: return this.display.scx;
                        case 0x44: return this.display.ly;
                        case 0x45: return this.display.lyc;
                        case 0x47: return this.display.bgp;
                        case 0x48: return this.display.obp0;
                        case 0x49: return this.display.obp1;
                        case 0x4a: return this.display.wy;
                        case 0x4b: return this.display.wx;
                        default: return 0x00;
                    }
                } else if (address < 0xffff) {
                    return this.HRAM[address & 0x7f];
                } else {
                    return this.ie;
                }
        }
    }

    writeAddress(address, value) {
        this.cycles += 1;
        switch (address >> 12) {
            case 0x0:
            case 0x1:
            case 0x2:
            case 0x3:
            case 0x4:
            case 0x5:
            case 0x6:
            case 0x7:
                this.cartridge.writeROM(address & 0x7fff, value); break;
            case 0x8:
            case 0x9:
                this.display.VRAM[address & 0x1fff] = value; break;
            case 0xa:
            case 0xb:
                this.cartridge.writeRAM(address & 0x1fff, value); break;
            case 0xc:
            case 0xd:
                this.WRAM[address & 0x1fff] = value; break;
            case 0xe:
            case 0xf:
                if (address < 0xfe00) {
                    this.WRAM[address & 0x1fff] = value;
                } else if (address < 0xff00) {
                    this.display.OAM[address & 0xff] = value;
                } else if (address < 0xff80) {
                    switch (address & 0xff) {
                        case 0x00: this.joypad.p1 = value; break;
                        case 0x01: break;
                        case 0x02: break;
                        case 0x04: this.timer.div = value; break;
                        case 0x05: this.timer.tima = value; break;
                        case 0x06: this.timer.tma = value; break;
                        case 0x07: this.timer.tac = value; break;
                        case 0x0f: this.if = value; break;
                        case 0x40: this.display.lcdc = value; break;
                        case 0x41: this.display.stat = value; break;
                        case 0x42: this.display.scy = value; break;
                        case 0x43: this.display.scx = value; break;
                        case 0x45: this.display.lyc = value; break;
                        case 0x46: this.display.dma = value; break;
                        case 0x47: this.display.bgp = value; break;
                        case 0x48: this.display.obp0 = value; break;
                        case 0x49: this.display.obp1 = value; break;
                        case 0x4a: this.display.wy = value; break;
                        case 0x4b: this.display.wx = value; break;
                        case 0x50: this.bootDone = true; break;
                        default: break;
                    }
                } else if (address < 0xffff) {
                    this.HRAM[address & 0x7f] = value;
                } else {
                    this.ie = value;
                }
        }
    }

    readRegister(register) {
        switch (register) {
            case 0b000: return this.b;
            case 0b001: return this.c;
            case 0b010: return this.d;
            case 0b011: return this.e;
            case 0b100: return this.h;
            case 0b101: return this.l;
            case 0b110: return this.readAddress(this.hl);
            case 0b111: return this.a;
        }
    }

    writeRegister(register, value) {
        switch (register) {
            case 0b000: this.b = value; break;
            case 0b001: this.c = value; break;
            case 0b010: this.d = value; break;
            case 0b011: this.e = value; break;
            case 0b100: this.h = value; break;
            case 0b101: this.l = value; break;
            case 0b110: this.writeAddress(this.hl, value); break;
            case 0b111: this.a = value; break;
        }
    }

    readDoubleRegisterIndirect(register) {
        switch (register) {
            case 0b00: return this.readAddress(this.bc);
            case 0b01: return this.readAddress(this.de);
            case 0b10: return this.readAddress(this.hl++);
            case 0b11: return this.readAddress(this.hl--);
        }
    }

    writeDoubleRegisterIndirect(register, value) {
        switch (register) {
            case 0b00: this.writeAddress(this.bc, value); break;
            case 0b01: this.writeAddress(this.de, value); break;
            case 0b10: this.writeAddress(this.hl++, value); break;
            case 0b11: this.writeAddress(this.hl--, value); break;
        }
    }

    readDoubleRegister(register) {
        switch (register) {
            case 0b00: return this.bc;
            case 0b01: return this.de;
            case 0b10: return this.hl;
            case 0b11: return this.sp;
        }
    }

    writeDoubleRegister(register, value) {
        switch (register) {
            case 0b00: this.bc = value; break;
            case 0b01: this.de = value; break;
            case 0b10: this.hl = value; break;
            case 0b11: this.sp = value; break;
        }
    }

    popDoubleRegister(register) {
        switch (register) {
            case 0b00: this.c = this.readAddress(this.sp++); this.b = this.readAddress(this.sp++); break;
            case 0b01: this.e = this.readAddress(this.sp++); this.d = this.readAddress(this.sp++); break;
            case 0b10: this.l = this.readAddress(this.sp++); this.h = this.readAddress(this.sp++); break;
            case 0b11: this.f = this.readAddress(this.sp++); this.a = this.readAddress(this.sp++); break;
        }
    }

    pushDoubleRegister(register) {
        switch (register) {
            case 0b00: this.writeAddress(--this.sp, this.b); this.writeAddress(--this.sp, this.c); break;
            case 0b01: this.writeAddress(--this.sp, this.d); this.writeAddress(--this.sp, this.e); break;
            case 0b10: this.writeAddress(--this.sp, this.h); this.writeAddress(--this.sp, this.l); break;
            case 0b11: this.writeAddress(--this.sp, this.a); this.writeAddress(--this.sp, this.f); break;
        }
    }

    readCondition(condition) {
        switch (condition) {
            case 0b00: return !this.fz;
            case 0b01: return this.fz;
            case 0b10: return !this.fc;
            case 0b11: return this.fc;
        }
    }

    cycle() {
        this.cycles = 0;

        if ((this.ime || this.halt) && (this.ie & this.if) != 0) {
            this.halt = false;
            if (this.ime) {
                this.ime = false;
                if ((this.ie & this.if & this.VBLANK) != 0) {
                    this.clearInterrupt(this.VBLANK);
                    this.callInterrupt(0x0040);
                } else if ((this.ie & this.if & this.STAT) != 0) {
                    this.clearInterrupt(this.STAT);
                    this.callInterrupt(0x0048);
                } else if ((this.ie & this.if & this.TIMER) != 0) {
                    this.clearInterrupt(this.TIMER);
                    this.callInterrupt(0x0050);
                } else if ((this.ie & this.if & this.SERIAL) != 0) {
                    this.clearInterrupt(this.SERIAL);
                    this.callInterrupt(0x0058);
                } else if ((this.ie & this.if & this.JOYPAD) != 0) {
                    this.clearInterrupt(this.JOYPAD);
                    this.callInterrupt(0x0060);
                }
            }
        }

        if (this.halt) {
            this.cycles += 1;
        } else {
            this.decode();
        }

        let displayCycles = this.cycles;
        while (displayCycles-- > 0) {
            this.display.cycle();
        }

        let timerCycles = this.cycles;
        while (timerCycles-- > 0) {
            this.timer.cycle();
        }

        return this.cycles;
    }

    decode() {
        const instr = this.readAddress(this.pc++);
        const quad = instr >> 6;
        const ops = instr & 0b111111;
        const op1 = ops >> 3, op2 = ops & 0b111;
        if (quad === 0b00) {
            if (op2 == 0b110) {
                // LD r, n
                const imm = this.readAddress(this.pc++);
                this.writeRegister(op1, imm);
            } else if (op2 == 0b010) {
                if ((op1 & 0b1) == 0b1) {
                    // LD A, (rr)
                    this.a = this.readDoubleRegisterIndirect(op1 >> 1);
                } else {
                    // LD (rr), A
                    this.writeDoubleRegisterIndirect(op1 >> 1, this.a);
                }
            } else if ((op1 & 0b1) == 0b0 && op2 == 0b001) {
                // LD dd, nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.writeDoubleRegister(op1 >> 1, (imm2 << 8) | imm1);
            } else if (op1 == 0b001 && op2 == 0b000) {
                // LD (nn), SP
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                let address = (imm2 << 8) | imm1;
                this.writeAddress(address++, this.spl);
                this.writeAddress(address++, this.sph);
            } else if (op2 == 0b100) {
                // INC r
                const tmp = (this.readRegister(op1) + 1) & 0xff;
                this.writeRegister(op1, tmp);
                this.fh = (tmp & 0xf) == 0;
                this.fn = false;
                this.fz = tmp == 0;
            } else if (op2 == 0b101) {
                // DEC r
                const tmp = (this.readRegister(op1) - 1) & 0xff;
                this.writeRegister(op1, tmp);
                this.fh = (tmp & 0xf) == 0xf;
                this.fn = true;
                this.fz = tmp == 0;
            } else if ((op1 & 0b1) == 0b1 && op2 == 0b001) {
                // ADD HL, ss
                const ss = this.readDoubleRegister(op1 >> 1);
                this.fc = this.hl + ss > 0xffff;
                this.fh = (this.hl & 0xfff) + (ss & 0xfff) > 0xfff;
                this.fn = false;
                this.hl += ss;
                this.cycles += 1;
            } else if ((op1 & 0b1) == 0b0 && op2 == 0b011) {
                // INC ss
                this.writeDoubleRegister(op1 >> 1, this.readDoubleRegister(op1 >> 1) + 1);
                this.cycles += 1;
            } else if ((op1 & 0b1) == 0b1 && op2 == 0b011) {
                // DEC ss
                this.writeDoubleRegister(op1 >> 1, this.readDoubleRegister(op1 >> 1) - 1);
                this.cycles += 1;
            } else if (op1 == 0b000 && op2 == 0b111) {
                // RLCA
                const carry = this.a & 0b10000000;
                this.a = ((this.a << 1) | (carry >> 7)) & 0xff;
                this.fc = carry != 0;
                this.fh = false;
                this.fn = false;
                this.fz = false;
            } else if (op1 == 0b001 && op2 == 0b111) {
                // RRCA
                const carry = this.a & 0b1;
                this.a = ((carry << 7) | (this.a >> 1)) & 0xff;
                this.fc = carry != 0;
                this.fh = false;
                this.fn = false;
                this.fz = false;
            } else if (op1 == 0b010 && op2 == 0b111) {
                // RLA
                const carry = this.a & 0b10000000;
                this.a = ((this.a << 1) | this.fc) & 0xff;
                this.fc = carry != 0;
                this.fh = false;
                this.fn = false;
                this.fz = false;
            } else if (op1 == 0b011 && op2 == 0b111) {
                // RRA
                const carry = this.a & 0b1;
                this.a = ((this.fc << 7) | (this.a >> 1)) & 0xff;
                this.fc = carry != 0;
                this.fh = false;
                this.fn = false;
                this.fz = false;
            } else if (op1 == 0b011 && op2 == 0b000) {
                // JR e
                const offset = this.readAddress(this.pc++) << 24 >> 24;
                this.pc += offset;
                this.cycles += 1;
            } else if ((op1 & 0b100) == 0b100 && op2 == 0b000) {
                // JR cc, e
                const offset = this.readAddress(this.pc++) << 24 >> 24;
                if (this.readCondition(op1 & 0b11)) {
                    this.pc += offset;
                    this.cycles += 1;
                }
            } else if (op1 == 0b100 && op2 == 0b111) {
                // DAA
                let tmp = this.a;
                if (!this.fn) {
                    if (this.fc || tmp > 0x99) {
                        tmp += 0x60;
                        this.fc = true;
                    }
                    if (this.fh || (tmp & 0xf) > 0x9) {
                        tmp += 0x06;
                    }
                } else {
                    if (this.fc) {
                        tmp -= 0x60;
                    }
                    if (this.fh) {
                        tmp -= 0x6;
                    }
                }
                this.fh = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b101 && op2 == 0b111) {
                // CPL
                this.a ^= 0xff;
                this.fh = true;
                this.fn = true;
            } else if (op1 == 0b000 && op2 == 0b000) {
                // NOP
            } else if (op1 == 0b110 && op2 == 0b111) {
                // SCF
                this.fc = true;
                this.fh = false;
                this.fn = false;
            } else if (op1 == 0b111 && op2 == 0b111) {
                // CCF
                this.fc = !this.fc;
                this.fh = false;
                this.fn = false;
            } else if (op1 == 0b010 && op2 == 0b000) {
                // STOP

            } else {
                throw 'unknown instruction: 0x' + instr.toString(16);
            }
        } else if (quad === 0b01) {
            if (op1 != 0b110 || op2 != 0b110) {
                // LD r, r'
                this.writeRegister(op1, this.readRegister(op2));
            } else {
                // HALT
                this.halt = true;
            }
        } else if (quad === 0b10) {
            const r = this.readRegister(op2);
            if (op1 == 0b000) {
                // ADD A, r
                const tmp = this.a + r;
                this.fc = tmp > 0xff;
                this.fh = (this.a & 0xf) + (r & 0xf) > 0xf;
                this.fn = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b001) {
                // ADC A, r
                const carry = this.fc;
                const tmp = this.a + r + carry;
                this.fc = tmp > 0xff;
                this.fh = (this.a & 0xf) + (r & 0xf) + carry > 0xf;
                this.fn = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b010) {
                // SUB A, r
                const tmp = this.a - r;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (r & 0xf) < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b011) {
                // SBC A, r
                const carry = this.fc
                const tmp = this.a - r - carry;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (r & 0xf) - carry < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b100) {
                // AND A, r
                const tmp = this.a & r;
                this.fc = false;
                this.fh = true;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 0b101) {
                // XOR A, r
                const tmp = this.a ^ r;
                this.fc = false;
                this.fh = false;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 0b110) {
                // OR A, r
                const tmp = this.a | r;
                this.a |= r;
                this.fc = false;
                this.fh = false;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 0b111) {
                // CP A, r
                const tmp = this.a - r;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (r & 0xf) < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
            }
        } else if (quad === 0b11) {
            if (op1 == 0b110 && op2 == 0b010) {
                // LD A, (C)
                this.a = this.readAddress(0xff00 | this.c);
            } else if (op1 == 0b100 && op2 == 0b010) {
                // LD (C), A
                this.writeAddress(0xff00 | this.c, this.a);
            } else if (op1 == 0b110 && op2 == 0b000) {
                // LD A, (n)
                const imm = this.readAddress(this.pc++);
                this.a = this.readAddress(0xff00 | imm);
            } else if (op1 == 0b100 && op2 == 0b000) {
                // LD (n), A
                const imm = this.readAddress(this.pc++);
                this.writeAddress(0xff00 | imm, this.a);
            } else if (op1 == 0b111 && op2 == 0b010) {
                // LD A, (nn)
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.a = this.readAddress((imm2 << 8) | imm1);
            } else if (op1 == 0b101 && op2 == 0b010) {
                // LD (nn), A
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.writeAddress((imm2 << 8) | imm1, this.a);
            } else if (op1 == 0b111 && op2 == 0b001) {
                // LD SP, HL
                this.sp = this.hl;
                this.cycles += 1;
            } else if ((op1 & 0b1) == 0b0 && op2 == 0b101) {
                // PUSH qq
                this.pushDoubleRegister(op1 >> 1);
                this.cycles += 1;
            } else if ((op1 & 0b1) == 0b0 && op2 == 0b001) {
                // POP qq
                this.popDoubleRegister(op1 >> 1);
            } else if (op1 == 0b111 && op2 == 0b000) {
                // LDHL SP, e
                const offset = this.readAddress(this.pc++) << 24 >> 24;
                const tmp = this.sp + offset;
                this.fc = (this.sp & 0xff) + (offset & 0xff) > 0xff;
                this.fh = (this.sp & 0xf) + (offset & 0xf) > 0xf;
                this.fn = false;
                this.fz = false;
                this.hl = tmp;
                this.cycles += 1;
            } else if (op1 == 0b101 && op2 == 0b000) {
                // ADD SP, e
                const offset = this.readAddress(this.pc++) << 24 >> 24;
                const tmp = this.sp + offset;
                this.fc = (this.sp & 0xff) + (offset & 0xff) > 0xff;
                this.fh = (this.sp & 0xf) + (offset & 0xf) > 0xf;
                this.fn = false;
                this.fz = false;
                this.sp = tmp;
                this.cycles += 1;
                this.cycles += 1;
            } else if (op1 == 0b000 && op2 == 0b110) {
                // ADD A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a + imm
                this.fc = tmp > 0xff;
                this.fh = (this.a & 0xf) + (imm & 0xf) > 0xf;
                this.fn = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b001 && op2 == 0b110) {
                // ADC A, n
                const imm = this.readAddress(this.pc++);
                const carry = this.fc;
                const tmp = this.a + imm + carry
                this.fc = tmp > 0xff;
                this.fh = (this.a & 0xf) + (imm & 0xf) + carry > 0xf;
                this.fn = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b010 && op2 == 0b110) {
                // SUB A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a - imm;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (imm & 0xf) < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b011 && op2 == 0b110) {
                // SBC A, n
                const imm = this.readAddress(this.pc++);
                const carry = this.fc;
                const tmp = this.a - imm - carry;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (imm & 0xf) - carry < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b100 && op2 == 0b110) {
                // AND A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a & imm;
                this.fc = false;
                this.fh = true;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 0b101 && op2 == 0b110) {
                // XOR A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a ^ imm;
                this.fc = false;
                this.fh = false;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 0b110 && op2 == 0b110) {
                // OR A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a | imm;
                this.fc = false;
                this.fh = false;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 0b111 && op2 == 0b110) {
                // CP A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a - imm;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (imm & 0xf) < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
            } else if (op1 == 0b001 && op2 == 0b011) {
                this.decode_cb();
            } else if (op1 == 0b000 && op2 == 0b011) {
                // JP nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.pc = (imm2 << 8) | imm1;
                this.cycles += 1;
            } else if ((op1 & 0b100) == 0b000 && op2 == 0b010) {
                // JP cc, nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                if (this.readCondition(op1 & 0b11)) {
                    this.pc = (imm2 << 8) | imm1;
                    this.cycles += 1;
                }
            } else if (op1 == 0b101 && op2 == 0b001) {
                // JP HL
                this.pc = this.hl;
            } else if (op1 == 0b001 && op2 == 0b101) {
                // CALL nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.writeAddress(--this.sp, this.pch);
                this.writeAddress(--this.sp, this.pcl);
                this.pc = (imm2 << 8) | imm1;
                this.cycles += 1;
            } else if ((op1 & 0b100) == 0b000 && op2 == 0b100) {
                // CALL cc, nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                if (this.readCondition(op1 & 0b11)) {
                    this.writeAddress(--this.sp, this.pch);
                    this.writeAddress(--this.sp, this.pcl);
                    this.pc = (imm2 << 8) | imm1;
                    this.cycles += 1;
                }
            } else if (op1 == 0b001 && op2 == 0b001) {
                // RET
                this.pc = this.readAddress(this.sp++);
                this.pc |= this.readAddress(this.sp++) << 8;
                this.cycles += 1;
            } else if (op1 == 0b011 && op2 == 0b001) {
                // RETI
                this.pc = this.readAddress(this.sp++);
                this.pc |= this.readAddress(this.sp++) << 8;
                this.ime = true;
                this.cycles += 1;
            } else if ((op1 & 0b100) == 0b000 && op2 == 0b000) {
                // RET cc
                if (this.readCondition(op1 & 0b11)) {
                    this.pc = this.readAddress(this.sp++);
                    this.pc |= this.readAddress(this.sp++) << 8;
                    this.cycles += 1;
                }
                this.cycles += 1;
            } else if (op2 == 0b111) {
                // RST t
                this.writeAddress(--this.sp, this.pch);
                this.writeAddress(--this.sp, this.pcl);
                this.pc = op1 << 3;
                this.cycles += 1;
            } else if ((op1 & 0b110) == 0b110 && op2 == 0b011) {
                // DI/EI
                this.ime = (op1 & 0b1) != 0;
            } else {
                throw 'unknown instruction: 0x' + instr.toString(16);
            }
        }
    }

    decode_cb() {
        const instr = this.readAddress(this.pc++);
        const quad = instr >> 6;
        const ops = instr & 0b111111;
        const op1 = ops >> 3, op2 = ops & 0b111;
        if (quad == 0b00) {
            const r = this.readRegister(op2);
            if (op1 == 0b000) {
                // RLC r
                const carry = r & 0b10000000;
                const tmp = ((r << 1) | (carry >> 7)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 0b001) {
                // RRC r
                const carry = r & 0b1;
                const tmp = ((carry << 7) | (r >> 1)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 0b010) {
                // RL r
                const carry = r & 0b10000000;
                const tmp = ((r << 1) | this.fc) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 0b011) {
                // RR r
                const carry = r & 0b1;
                const tmp = ((this.fc << 7) | (r >> 1)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 0b100) {
                // SLA r
                const carry = r & 0b10000000;
                const tmp = (r << 1) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 0b101) {
                // SRA r
                const carry = r & 0b1;
                const tmp = ((r & 0b10000000) | (r >> 1)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 0b110) {
                // SWAP r
                const tmp = ((r << 4) | (r >> 4)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 0b111) {
                // SRL r
                const carry = r & 0b1;
                const tmp = (r >> 1) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            }
        } else if (quad == 0b01) {
            // BIT b, r
            this.fh = true;
            this.fn = false;
            this.fz = (this.readRegister(op2) & (1 << op1)) == 0;
        } else if (quad == 0b10) {
            // RES b, r
            this.writeRegister(op2, this.readRegister(op2) & ~(1 << op1))
        } else if (quad == 0b11) {
            // SET b, r
            this.writeRegister(op2, this.readRegister(op2) | (1 << op1))
        }
    }
}

const canvas = document.getElementById('canvas');
canvas.width = WIDTH * SCALE;
canvas.height = HEIGHT * SCALE;
const ctx = canvas.getContext('2d');
const imageData = ctx.createImageData(canvas.width, canvas.height);
const pixels = new Uint32Array(imageData.data.buffer);

let gb = new GameBoy();
let cycles = 0;
let intervalId;
function update() {
    // const t0 = performance.now();
    while (cycles < 17556) {
        // try {
        cycles += gb.cycle();
        // } catch (error) {
        //     window.clearInterval(intervalId);
        //     console.log(error);
        //     break;
        // }
    }
    cycles -= 17556;
    // const t1 = performance.now();
    // console.log(t1 - t0);
}

window.onbeforeunload = () => {
    gb.cartridge.save();
};

document.getElementById('rom').onchange = e => {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = e => {
        const file = new Uint8Array(e.target.result);
        gb.cartridge.load(file);
        gb.reset();
        window.clearInterval(intervalId);
        intervalId = window.setInterval(update, 17);
    };
};

document.onkeydown = e => {
    switch (e.code) {
        case "Enter": gb.joypad.start = true; break;
        case "Backspace": gb.joypad.select = true; break;
        case "KeyZ": gb.joypad.b = true; break;
        case "KeyX": gb.joypad.a = true; break;
        case "ArrowDown": gb.joypad.down = true; break;
        case "ArrowUp": gb.joypad.up = true; break;
        case "ArrowLeft": gb.joypad.left = true; break;
        case "ArrowRight": gb.joypad.right = true; break;
    }
}

document.onkeyup = e => {
    switch (e.code) {
        case "Enter": gb.joypad.start = false; break;
        case "Backspace": gb.joypad.select = false; break;
        case "KeyZ": gb.joypad.b = false; break;
        case "KeyX": gb.joypad.a = false; break;
        case "ArrowDown": gb.joypad.down = false; break;
        case "ArrowUp": gb.joypad.up = false; break;
        case "ArrowLeft": gb.joypad.left = false; break;
        case "ArrowRight": gb.joypad.right = false; break;
    }
}
