declare module 'react-p5-wrapper' {
    import { Component } from 'react'

    export type P5Graphics = {
        image: (image: P5Image, x: number, y: number, width: number, height: number) => void;
    }
    export type P5Image = {}
    export type P5 = {
        loadImage: (path: string) => P5Image;
        millis: () => number;
        createGraphics: (width: number, height: number) => P5Graphics;
        createCanvas: (width: number, height: number) => void;
        setup: () => void;
        draw: () => void;
        image: (image: P5Image, x: number, y: number, width: number, height: number) => void;
    }
    export type SketchFunction = (p: P5) => void
    export default class P5Wrapper extends Component<{sketch: SketchFunction}> {

    }
}