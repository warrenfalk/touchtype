/* This file exists to get a global into place so that p5 doesn't fuck up immediately on load */
import p5 from 'p5'
(globalThis as any).p5 = p5;
