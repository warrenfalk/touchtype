import p5 from 'p5'
import "p5/lib/addons/p5.sound";

export type Assets = {
    sounds: {
        bell: p5.SoundFile,
        buzzer: p5.SoundFile,
        click: p5.SoundFile,
        click2: p5.SoundFile,
        success: p5.SoundFile,
        applause: p5.SoundFile,
    },
    fonts: {
        game: p5.Font,
        status: p5.Font,
    },
    images: {
        background: p5.Image,
    }
}

export function preloadAssets(p: p5) {
    // hack because the type definition seems wrong
    const sound: any = p;
    console.log("Preloading assets");
    return {
        sounds: {
            bell: sound.loadSound('bell.mp3'),
            buzzer: sound.loadSound('buzzer.mp3'),
            click: sound.loadSound('click.mp3'),
            click2: sound.loadSound('click2.mp3'),
            success: sound.loadSound('success.mp3'),
            applause: sound.loadSound('applause.mp3'),
        },
        fonts: {
            game: p.loadFont("comfortaa-regular.otf"),
            status: p.loadFont("roboto-regular.ttf"),
        },
        images: {
            background: p.loadImage("dark_spotlight.jpg"),
        }
    }
}