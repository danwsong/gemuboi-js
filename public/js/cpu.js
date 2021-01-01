class GameBoy {
    constructor() {
        this.display = new Display(this);
        this.timer = new Timer(this);
        this.joypad = new Joypad(this);
        this.cartridge = new Cartridge(this);
        this.sound = new Sound(this);

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

        this.boot = new Uint8Array([
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
        this.wram = new Uint8Array(0x2000);
        this.hram = new Uint8Array(0x7f);
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
        this._if = value & GameBoy.interrupts;
    }

    get ie() {
        return this._ie;
    }

    set ie(value) {
        this._ie = value & GameBoy.interrupts;
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
                    return this.boot[address];
                } else {
                    return this.cartridge.readROM(address & 0x7fff);
                }
            case 0x8:
            case 0x9:
                return this.display.vram[address & 0x1fff];
            case 0xa:
            case 0xb:
                return this.cartridge.readRAM(address & 0x1fff);
            case 0xc:
            case 0xd:
                return this.wram[address & 0x1fff];
            case 0xe:
            case 0xf:
                if (address < 0xfe00) {
                    return this.wram[address & 0x1fff];
                } else if (address < 0xff00) {
                    return this.display.oam[address & 0xff];
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
                        case 0x10: return this.sound.nr10;
                        case 0x11: return this.sound.nr11;
                        case 0x12: return this.sound.nr12;
                        case 0x13: return this.sound.nr13;
                        case 0x14: return this.sound.nr14;
                        case 0x16: return this.sound.nr21;
                        case 0x17: return this.sound.nr22;
                        case 0x18: return this.sound.nr23;
                        case 0x19: return this.sound.nr24;
                        case 0x1a: return this.sound.nr30;
                        case 0x1b: return this.sound.nr31;
                        case 0x1c: return this.sound.nr32;
                        case 0x1d: return this.sound.nr33;
                        case 0x1e: return this.sound.nr34;
                        case 0x20: return this.sound.nr41;
                        case 0x21: return this.sound.nr42;
                        case 0x22: return this.sound.nr43;
                        case 0x23: return this.sound.nr44;
                        case 0x24: return this.sound.nr50;
                        case 0x25: return this.sound.nr51;
                        case 0x26: return this.sound.nr52;
                        case 0x30:
                        case 0x31:
                        case 0x32:
                        case 0x33:
                        case 0x34:
                        case 0x35:
                        case 0x36:
                        case 0x37:
                        case 0x38:
                        case 0x39:
                        case 0x3a:
                        case 0x3b:
                        case 0x3c:
                        case 0x3d:
                        case 0x3e:
                        case 0x3f: return this.sound.readWave(address & 0xf);
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
                    return this.hram[address & 0x7f];
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
                this.display.vram[address & 0x1fff] = value; break;
            case 0xa:
            case 0xb:
                this.cartridge.writeRAM(address & 0x1fff, value); break;
            case 0xc:
            case 0xd:
                this.wram[address & 0x1fff] = value; break;
            case 0xe:
            case 0xf:
                if (address < 0xfe00) {
                    this.wram[address & 0x1fff] = value;
                } else if (address < 0xff00) {
                    this.display.oam[address & 0xff] = value;
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
                        case 0x10: this.sound.nr10 = value; break;
                        case 0x11: this.sound.nr11 = value; break;
                        case 0x12: this.sound.nr12 = value; break;
                        case 0x13: this.sound.nr13 = value; break;
                        case 0x14: this.sound.nr14 = value; break;
                        case 0x16: this.sound.nr21 = value; break;
                        case 0x17: this.sound.nr22 = value; break;
                        case 0x18: this.sound.nr23 = value; break;
                        case 0x19: this.sound.nr24 = value; break;
                        case 0x1a: this.sound.nr30 = value; break;
                        case 0x1b: this.sound.nr31 = value; break;
                        case 0x1c: this.sound.nr32 = value; break;
                        case 0x1d: this.sound.nr33 = value; break;
                        case 0x1e: this.sound.nr34 = value; break;
                        case 0x20: this.sound.nr41 = value; break;
                        case 0x21: this.sound.nr42 = value; break;
                        case 0x22: this.sound.nr43 = value; break;
                        case 0x23: this.sound.nr44 = value; break;
                        case 0x24: this.sound.nr50 = value; break;
                        case 0x25: this.sound.nr51 = value; break;
                        case 0x26: this.sound.nr52 = value; break;
                        case 0x30:
                        case 0x31:
                        case 0x32:
                        case 0x33:
                        case 0x34:
                        case 0x35:
                        case 0x36:
                        case 0x37:
                        case 0x38:
                        case 0x39:
                        case 0x3a:
                        case 0x3b:
                        case 0x3c:
                        case 0x3d:
                        case 0x3e:
                        case 0x3f: this.sound.writeWave(address & 0xf, value); break;
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
                    this.hram[address & 0x7f] = value;
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
                if ((this.ie & this.if & GameBoy.vblankInterrupt) != 0) {
                    this.clearInterrupt(GameBoy.vblankInterrupt);
                    this.callInterrupt(0x0040);
                } else if ((this.ie & this.if & GameBoy.statInterrupt) != 0) {
                    this.clearInterrupt(GameBoy.statInterrupt);
                    this.callInterrupt(0x0048);
                } else if ((this.ie & this.if & GameBoy.timerInterrupt) != 0) {
                    this.clearInterrupt(GameBoy.timerInterrupt);
                    this.callInterrupt(0x0050);
                } else if ((this.ie & this.if & GameBoy.serialInterrupt) != 0) {
                    this.clearInterrupt(GameBoy.serialInterrupt);
                    this.callInterrupt(0x0058);
                } else if ((this.ie & this.if & GameBoy.joypadInterrupt) != 0) {
                    this.clearInterrupt(GameBoy.joypadInterrupt);
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

        let soundCycles = this.cycles;
        while (soundCycles-- > 0) {
            this.sound.cycle();
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
GameBoy.frequency = 1048576;
GameBoy.joypadInterrupt = 0b00010000;
GameBoy.serialInterrupt = 0b00001000;
GameBoy.timerInterrupt = 0b00000100;
GameBoy.statInterrupt = 0b00000010;
GameBoy.vblankInterrupt = 0b00000001;
GameBoy.interrupts = 0b00011111;