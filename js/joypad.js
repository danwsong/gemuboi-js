class Joypad {
    constructor(gb) {
        this.gb = gb;

        this._p1 = 0;

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
        switch (this._p1) {
            case 0:
                return 0xc0 | (!(this.start || this.down) << 3) | (!(this.select || this.up) << 2) | (!(this.b || this.left) << 1) | !(this.a || this.right);
            case 1:
                return 0xd0 | (!this.start << 3) | (!this.select << 2) | (!this.b << 1) | !this.a;
            case 2:
                return 0xe0 | (!this.down << 3) | (!this.up << 2) | (!this.left << 1) | !this.right;
            case 3:
                return 0xff;
        }
    }

    set p1(value) {
        this._p1 = (value & 0x30) >> 4;
    }
}
