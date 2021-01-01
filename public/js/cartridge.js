class Cartridge {
    constructor(gb) {
        this.gb = gb;
    }

    readROM(address) {
        switch (this.cartridgeType) {
            case -1:
                throw 'no cartridge loaded';
            case 0x00:
                return this.rom[address];
            case 0x01:
            case 0x02:
            case 0x03:
                switch (address >> 12) {
                    case 0x0:
                    case 0x1:
                    case 0x2:
                    case 0x3:
                        return this.rom[address & 0x3fff];
                    case 0x4:
                    case 0x5:
                    case 0x6:
                    case 0x7:
                        return this.rom[(this.romBankNumber << 14) | (address & 0x3fff)];
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
                        return this.rom[address & 0x3fff];
                    case 0x4:
                    case 0x5:
                    case 0x6:
                    case 0x7:
                        return this.rom[(this.romBankNumber << 14) | (address & 0x3fff)];
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
                return this.ram[(this.ramBankNumber << 13) | address];
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
                        return this.ram[(this.ramBankNumber << 13) | address];
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
                this.ram[(this.ramBankNumber << 13) | address] = value;
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
                        this.ram[(this.ramBankNumber << 13) | address] = value;
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

        this.cartridgeType = file[0x147];

        const romSize = 32768 << file[0x148];
        if (file.length != romSize) {
            throw 'wrong file size';
        }

        const ramSize = file[0x149];
        if (this.title in localStorage) {
            this.ram = new Uint8Array(localStorage[this.title].split(',').map(parseFloat));
        } else {
            switch (ramSize) {
                case 0x00:
                    break;
                case 0x02:
                    this.ram = new Uint8Array(0x2000);
                    break;
                case 0x03:
                    this.ram = new Uint8Array(0x8000);
                    break;
                case 0x04:
                    this.ram = new Uint8Array(0x20000);
                    break;
                default:
                    throw 'unknown RAM size: 0x' + ramSize.toString(16);
            }
        }

        this.ramEnable = false;
        this.romBankNumber = 0;
        this.ramBankNumber = 0;
        this.ramBankMode = false;
        this.rom = file;
    }

    save() {
        if (this.ram) {
            localStorage[this.title] = this.ram;
        }
    }
}