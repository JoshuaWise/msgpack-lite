export class Float {
    readonly value: number;

    constructor(value: number);
}

export class Codec {
    constructor();

    register(etype: number, Class: Function, packer: Function | Function[], unpacker: Function | Function[]): Codec;
}

export function decode(input: Uint8Array, codec?: Codec): any;

export function encode(input: any, codec?: Codec): Uint8Array;

