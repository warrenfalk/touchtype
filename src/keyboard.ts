export const Keyboard = {
  KEY_A: 65,
  KEY_B: 66,
  KEY_C: 67,
  KEY_D: 68,
  KEY_E: 69,
  KEY_F: 70,
  KEY_G: 71,
  KEY_H: 72,
  KEY_I: 73,
  KEY_J: 74,
  KEY_K: 75,
  KEY_L: 76,
  KEY_M: 77,
  KEY_N: 78,
  KEY_O: 79,
  KEY_P: 80,
  KEY_Q: 81,
  KEY_R: 82,
  KEY_S: 83,
  KEY_T: 84,
  KEY_U: 85,
  KEY_V: 86,
  KEY_W: 87,
  KEY_X: 88,
  KEY_Y: 89,
  KEY_Z: 90,
  KEY_0: 48,
  KEY_1: 49,
  KEY_2: 50,
  KEY_3: 51,
  KEY_4: 52,
  KEY_5: 53,
  KEY_6: 54,
  KEY_7: 55,
  KEY_8: 56,
  KEY_9: 57,
  KEY_APOSTROPHE: 222,
  KEY_COMMA: 188,
  KEY_DASH: 189,
  KEY_PERIOD: 190,
  KEY_SEMICOLON: 186,
  KEY_SPACE : 32,
}

const byKey: Key[] = [];
const byChar: {[ch: string]: Key} = {};

export class Key {
    key: number;
    ch: string;
    x: number;
    y: number;
    w: number;
    finger: number;
    constructor(key: number, ch: string, x: number, y: number, w: number, finger: number) {
        this.key = key;
        this.ch = ch;
        this.x = x;
        this.y = y;
        this.w = w;
        this.finger = finger;
        byKey[key] = this;
        byChar[key] = this;
    }
    static byKey(key: number) { return byKey[key]; }
    static byChar(ch: string) { return byChar[ch]; }
}

export const keys = [
  new Key(Keyboard.KEY_1, '1', -5, 2, 1, 1),
  new Key(Keyboard.KEY_2, '2', -4, 2, 1, 2),
  new Key(Keyboard.KEY_3, '3', -3, 2, 1, 3),
  new Key(Keyboard.KEY_4, '4', -2, 2, 1, 4),
  new Key(Keyboard.KEY_5, '5', -1, 2, 1, 4),
  new Key(Keyboard.KEY_6, '6', 0, 2, 1, 4),
  new Key(Keyboard.KEY_7, '7', 1, 2, 1, 5),
  new Key(Keyboard.KEY_8, '8', 2, 2, 1, 5),
  new Key(Keyboard.KEY_9, '9', 3, 2, 1, 6),
  new Key(Keyboard.KEY_0, '0', 4, 2, 1, 7),
  new Key(Keyboard.KEY_DASH, "-", 5, 2, 1, 8),

  new Key(Keyboard.KEY_A, 'a', -4.5, 0, 1, 1),
  new Key(Keyboard.KEY_S, 's', -3.5, 0, 1, 2),
  new Key(Keyboard.KEY_D, 'd', -2.5, 0, 1, 3),
  new Key(Keyboard.KEY_F, 'f', -1.5, 0, 1, 4),
  new Key(Keyboard.KEY_G, 'g', -0.5, 0, 1, 4),
  new Key(Keyboard.KEY_H, 'h', 0.5, 0, 1, 5),
  new Key(Keyboard.KEY_J, 'j', 1.5, 0, 1, 5),
  new Key(Keyboard.KEY_K, 'k', 2.5, 0, 1, 6),
  new Key(Keyboard.KEY_L, 'l', 3.5, 0, 1, 7),
  new Key(Keyboard.KEY_SEMICOLON, ';', 4.5, 0, 1, 8),
  new Key(Keyboard.KEY_APOSTROPHE, "'", 5.5, 0, 1, 8),

  new Key(Keyboard.KEY_Q, 'q', -4.8, 1, 1, 1),
  new Key(Keyboard.KEY_W, 'w', -3.8, 1, 1, 2),
  new Key(Keyboard.KEY_E, 'e', -2.8, 1, 1, 3),
  new Key(Keyboard.KEY_R, 'r', -1.8, 1, 1, 4),
  new Key(Keyboard.KEY_T, 't', -0.8, 1, 1, 4),
  new Key(Keyboard.KEY_Y, 'y', 0.2, 1, 1, 5),
  new Key(Keyboard.KEY_U, 'u', 1.2, 1, 1, 5),
  new Key(Keyboard.KEY_I, 'i', 2.2, 1, 1, 6),
  new Key(Keyboard.KEY_O, 'o', 3.2, 1, 1, 7),
  new Key(Keyboard.KEY_P, 'p', 4.2, 1, 1, 8),

  new Key(Keyboard.KEY_Z, 'z', -4, -1, 1, 2),
  new Key(Keyboard.KEY_X, 'x', -3, -1, 1, 3),
  new Key(Keyboard.KEY_C, 'c', -2, -1, 1, 4),
  new Key(Keyboard.KEY_V, 'v', -1, -1, 1, 4),
  new Key(Keyboard.KEY_B, 'b', 0, -1, 1, 4),
  new Key(Keyboard.KEY_N, 'n', 1, -1, 1, 5),
  new Key(Keyboard.KEY_M, 'm', 2, -1, 1, 5),
  new Key(Keyboard.KEY_COMMA, ',', 3, -1, 1, 6),
  new Key(Keyboard.KEY_PERIOD, '.', 4, -1, 1, 7),
  
  new Key(Keyboard.KEY_SPACE, ' ', 0, -2, 5, 0),
];