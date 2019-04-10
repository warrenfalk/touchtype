import React, { Component } from 'react';
import './Touchtype.css';
import {levels} from './levels';
import {ranks} from './ranks';
import {Key, Keyboard, keys, fingerHomes} from './keyboard';
import {Assets, preloadAssets} from './assets';
import {P5Sketch} from './P5Sketch';
import {Storage, UserProgress} from './storage';
import {apiPost, isError, ResultCallback} from './api';
import p5 from 'p5';

// prevent accidental use of localStorage
declare var localStorage: {};

class Touchtype extends Component {
  render() {
    return (
      <P5Sketch sketch={sketch}/>
    );
  }
}

export default Touchtype;

let user = Storage.user.get();
/*
if (!user) {
  window.location.href = "./user.html";
}
*/

type GameLevelState = {
  attempts: number,
  fail: boolean,
  level: number,
  levelStartTime: number,
  challengeText: string,
  winTime: number,
  myRecord?: number,
  gameRecord?: TimeRecord,
  progress: number,
  nextChar: string,
  nextKey: Key,
  currentLetterStartTime?: number,
}

type GameState = {
  level: GameLevelState,
  rank: number,
  saving: boolean,
  
  keyQueue: number[],
  badKey: false | number,
  messages: Message[],
}

type Message = {
  message: string,
  expire: number
}
type TimeRecord = {
  time: number,
  user: string,
}
type LoadProgressArgs = {user: string}
type LoadProgressResult = UserProgress
type GetRecordsArgs = {}
type GetRecordsResult = {
  record: TimeRecord,
  users: {
    [user: string]: number,
  }
}

const Settings = {
  spacing: 2,
}


/*
Note to self:  The plan here is as follows

1. Get this working again, possibly just mock all of the api calls
2. Convert all of the state mutating functions to be more functional
3. Begin changing to a model of subscribing to server state (perhaps implement leaderboard)
4. Implement gRPC
*/

function loadProgress(forUser: string, callback: ResultCallback<UserProgress>) {
  if (forUser === "guest") {
    const progress = Storage.progress.get();
    callback({success: progress});
    return
  }
  apiPost<LoadProgressArgs, LoadProgressResult>(
    './api/load-progress',
    {user: forUser},
    result => {
      if (isError(result)) {
        return callback(result)
      }
      const data = result.success;
      const save = Object.assign({}, {
        level: 0,
        attempts: 0,
        rank: 0,
      }, data);
      callback({success: save});
    }
  )
}

function calcWinTime(challengeText: string, rank: number) {
  const words = challengeText.length * 0.2;
  const minutes = words / ranks[rank].wpm;
  const seconds = minutes * 60;
  const ms = seconds * 1000;
  return Math.ceil(ms);
}

function getChallengeText(levels: string[], level: number) {
  return levels[level]
}

export function sketch (p: p5) {
  const Images = {
    background: p.loadImage("dark_spotlight.jpg"),
  };

  let width: number
  let height: number
  let cursorX: number
  let textHeight: number
  let textY: number

  let loadingState: string;

  let gameState: GameState;

  function calcSizes(canvasWidth: number, canvasHeight: number) {
    width = canvasWidth;
    height = canvasHeight;
    const size = Math.min(width, height);
    cursorX = Math.ceil(width * 0.1);
    textHeight = Math.ceil(size * 0.1);
    textY = Math.ceil(height * 0.4 + textHeight * 0.5);
  }

  function getRecords(forUser: string, forChallenge: string) {
    const challenge = forChallenge.toLowerCase();
    delete gameState.level.myRecord;
    delete gameState.level.gameRecord;
    console.log('getting record for', forUser);
    if (forUser === "guest") {
      const userRecords = Storage.recordTimes.get()[forUser] || {}
      const userRecord = userRecords[forChallenge]
      if (userRecord) {
        gameState.level.myRecord = userRecord;
        gameState.level.gameRecord = {user: "guest", time: userRecord};
      }
      // TODO: load a local record from storage
      return
    }
    apiPost<GetRecordsArgs, GetRecordsResult>(
      './api/get-records',
      {user: forUser, challenge: challenge},
      (result) => {
        if (isError(result)) {
          console.error(result.error);
          return;
        }
        const response = result.success;
        gameState.level.gameRecord = response.record;
        const userRecord = response.users[forUser];
        console.log('record is', userRecord, response);
        if (userRecord && challenge == gameState.level.challengeText.toLowerCase()) {
          gameState.level.myRecord = userRecord;
        }
      }
    )
  }

  function saveProgress(forUser: string) {
    console.log("saving...");
    const progress: UserProgress = {
      level: gameState.level.level,
      attempts: gameState.level.attempts,
      rank: gameState.rank || 0,
    }
    Storage.progress.put(progress);
    const saveData = {
      user: forUser,
      ...progress,
    };
    gameState.saving = true;
    apiPost("./api/save-progress", saveData, () => {
      console.log("done");
      gameState.saving = false;
    })
  }

  function setProgress(progress: number) {
    gameState.level.progress = progress;
    gameState.level.nextChar = gameState.level.challengeText[progress];
    gameState.level.nextKey = Key.byChar(gameState.level.nextChar.toLowerCase());
    gameState.level.currentLetterStartTime = p.millis();
  }  

  function resetProgress(noAttempt: boolean = false) {
    if (!noAttempt) {
      gameState.level.attempts++;
      saveProgress(user);
    }
    gameState.level.fail = false;
    gameState.level.levelStartTime = 0;
    setProgress(0);
  }  

  function gotoLevel(level: number, attempts: number) {
    gameState.level.attempts = attempts || 0
    gameState.level.level = level;
    gameState.level.challengeText = getChallengeText(levels, level);
    gameState.level.winTime = calcWinTime(gameState.level.challengeText, gameState.rank);
    getRecords(user, gameState.level.challengeText);
    resetProgress(true);
  }  

  function initializeGameState() {
    loadingState = "loading";
    loadProgress(user, result => {
      if (isError(result)) {
        console.error(result.error);
        return;
      }
      const saved = result.success;
      const level = saved.level
      const attempts = saved.attempts
      const challengeText = getChallengeText(levels, level);
      const rank = saved.rank || 0;
      const progress = 0;
      const nextChar = challengeText[progress];
      const nextKey = Key.byChar(nextChar.toLowerCase());
      gameState = {
        level: {
          level: level || 0,
          levelStartTime: 0,
          attempts: attempts || 0,
          fail: false,
          challengeText: challengeText,
          progress: progress,
          nextChar: nextChar,
          nextKey: nextKey,
          winTime: calcWinTime(challengeText, rank),
        },
        rank: rank,
        saving: false,
        keyQueue: [],
        badKey: false,
        messages: [],
      }
      gotoLevel(level, attempts);
      loadingState = "loaded";
    });
  }

  p.windowResized = function() {
    calcSizes(p.windowWidth, p.windowHeight);
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  }

  p.setup = function () {
    calcSizes(p.windowWidth, p.windowHeight);
    p.createCanvas(width, height);
    p.image(Images.background, 0, 0, width, height);
  };

  let Assets: Assets

  p.preload = function () {
     Assets = preloadAssets(p);
  }

  // this remembers the current left-shiftedness of the challenge text in pixels
  let textShiftLeftX = 0;
  p.draw = function () {
    p.image(Images.background, 0, 0, width, height);

    if (!loadingState) {
      initializeGameState();
      return;
    }

    if (loadingState === "loading") {
      return;
    }

    const timeNow = p.millis();
    const timeOnCurrentLetter = timeNow - (gameState.level.currentLetterStartTime || 0);
    const elapsedTime = timeNow - (gameState.level.levelStartTime || timeNow);
    const elapsedFraction = Math.min(1.0, elapsedTime / gameState.level.winTime);

    const keyQueue = gameState.keyQueue;
    // process any keys
    if (keyQueue.length) {
      keyQueue.forEach(k => {
        const keyPressed = Key.byKey(k);
        gameState.badKey = false;
        if (keyPressed === gameState.level.nextKey) {
          // good job, play a click sound
          if (keyPressed == Key.byKey(Keyboard.KEY_SPACE)) {
            Assets.Sound.click2.play(undefined, undefined, 0.1);
          }
          else if (keyPressed) {
            Assets.Sound.click.play(undefined, undefined, 0.1);
          }
          const level = gameState.level;
          advanceProgress(elapsedTime);
          if (gameState.level.progress === 0) {
            if (gameState.level > level) {
              Assets.Sound.success.play(undefined, undefined, 0.1);
            }
            else {
              Assets.Sound.bell.play(undefined, undefined, 0.1);
            }
          }
        }
        else if (k === 27) {
          resetProgress();
        }
        else if (keyPressed) {
          // whoops, buzzer
          gameState.badKey = k;
          Assets.Sound.buzzer.play(undefined, undefined, 0.1);
          if (gameState.level.progress)
            failLevel();
        }
      })
      gameState.keyQueue = [];
    }

    function advanceProgress(time: number) {
      if (gameState.level.progress === 0)
        gameState.level.levelStartTime = p.millis();
      const nextProgress = gameState.level.progress + 1;
      if (nextProgress === gameState.level.challengeText.length) {
        if (gameState.level.fail) {
          resetProgress();
        }
        else {
          // if this is a new record, play cheers
          if (!gameState.level.gameRecord || !gameState.level.gameRecord.time || time < gameState.level.gameRecord.time) {
            // only play it if there was an old record to beat
            if (gameState.level.gameRecord && gameState.level.gameRecord.time) {
              Assets.Sound.applause.play(undefined, undefined, 0.3);
              const wpm = calcWpm(gameState.level.challengeText, time);
              showMessage("New record: " + wpm + " wpm!");
            }
            gameState.level.gameRecord = {time: time, user: user}
          }
          if (!gameState.level.myRecord || time < gameState.level.myRecord)
            gameState.level.myRecord = time;
          saveUserRecordTime(user, time, gameState.level.challengeText);
          if (gameState.level.winTime < (p.millis() - gameState.level.levelStartTime))
            resetProgress();
          else
            advanceLevel(time);
        }
        return;
      }
      setProgress(nextProgress);
    }

    function failLevel() {
      if (!gameState.level.fail) {
        gameState.level.fail = true;
        saveProgress(user);
      }
    }
    
    function calcWpm(text: string, time: number): number {
      const words = text.length * 0.2;
      const minutes = time / 1000 / 60;
      const wpm = Math.round(words * 100 / minutes) / 100;
      return wpm;
    }
    
    function showMessage(message: string) {
      gameState.messages.unshift({message: message, expire: p.millis() + 2000})
    }

    function saveUserRecordTime(forUser: string, time: number, forChallenge: string) {
      const challenge = forChallenge.toLowerCase();
      const data = {
        user: forUser,
        challenge: challenge,
        time: time,
      }
      if (forUser === "guest") {
        const prevRecords = Storage.recordTimes.get();
        const prevUserRecords = prevRecords[forUser] || {};
        const prevUserRecord = prevUserRecords[challenge];
        if (!prevUserRecord || time < prevUserRecord) {
          const nextRecords = {
            ...prevRecords,
            [forUser]: {
              ...prevUserRecords,
              [challenge]: time
            }
          }
          Storage.recordTimes.put(nextRecords);
        }
      }
      console.log('saving time', data);
      apiPost('./api/save-time', data, () => {console.log('time saved')});
    }
    
    function advanceLevel(time: number) {
      let nextLevel = gameState.level.level + 1;
      if (nextLevel >= levels.length) {
        gameState.rank++;
        nextLevel = ranks[gameState.rank].startLevel;
      }
      gotoLevel(nextLevel, gameState.level.attempts + 1);
      saveProgress(user);
    }

    // We use a special letters function instead of the built in text function
    // this is necessary because text adjusts the spaces between different letters differently
    // and we can't allow that because we'll draw the text using multiple calls (for multiple
    // colors) and the spaces between letters would seem to change as we separate the text
    // at different places
    function letters(s: string, x: number, y: number) {
      if (s === "")
        return 0
      let cx = x;
      // for each character in the string...
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        // draw the character
        p.text(c, cx, y);
        // calculate the character width (with spacing)
        const cw = p.textWidth(c) + Settings.spacing;
        // move the cursor by that much to prepare for the next character
        cx += cw;
      }
    }
    // we use a special letters width to measure the width of each letter individually
    // to go along with our "letters" function which puts text on the screen one letter at a time
    function lettersWidth(s: string) {
      if (s === null || s === undefined || s === "")
        return 0;
      let cx = 0;
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        const cw = p.textWidth(c) + Settings.spacing;
        cx += cw;
      }
      return cx;
    }

    
    // split up the challenge text into the letter we expect next
    // and everything before it (finished)
    // and everything after it (remaining)
    const finishedText = gameState.level.challengeText.substring(0, gameState.level.progress);
    const remainText = gameState.level.challengeText.substring(gameState.level.progress + 1);

    // we'll set the text size and font now
    p.textSize(textHeight);
    p.textFont(Assets.Fonts.game);


    // get the width of each part so we can position it
    const nextCharWidth = lettersWidth(gameState.level.nextChar);
    const finishedTextWidth = lettersWidth(finishedText);
    const beginX = lettersWidth(gameState.level.challengeText[0]) * 0.5;
    const endX = lettersWidth(gameState.level.challengeText) - lettersWidth(gameState.level.challengeText.slice(-1)) * 0.5;

    // calculate how much of the text, in pixels, we've completed
    // we'll count the current character as half completed and so we'll use half its width
    // this way, if we shift the challenge text left by this many pixels
    // the center of the current character is always in the same place
    const actualProgressX = finishedTextWidth + (nextCharWidth * 0.5);
    // but the problem with that is that it makes it move jerkily
    // so we will animate it a bit
    // textShiftLeftX is the actual left-shiftedness of the challenge text
    // we will calculate how far it would have to move for it to be at our actual progress
    // but instead of moving it there immediately, we'll move it 7% of the way there (each frame)
    // this means that for large distances, it moves fast
    // but for small distances it moves slowly
    // and so as it gets closer (the distance grows smaller) it moves slower
    // This is called an "ease out" animation
    const difference = actualProgressX - textShiftLeftX;
    textShiftLeftX = textShiftLeftX + (difference * 0.1);

    // Now we draw the text
    p.noStroke();
    // We draw it in three parts so we can use three different colors
    p.fill(50, 50, 50);
    letters(finishedText, cursorX - textShiftLeftX, textY);

    p.fill(255, 0, 0);
    letters(gameState.level.nextChar, cursorX + finishedTextWidth - textShiftLeftX, textY);

    p.fill(230, 230, 230);
    letters(remainText, cursorX + finishedTextWidth + nextCharWidth - textShiftLeftX, textY);

    // show current position
    const cursorY = textY - textHeight - 18;
    p.noStroke();
    p.fill(255, 0, 0);
    p.ellipse(cursorX + finishedTextWidth - textShiftLeftX + (nextCharWidth * 0.5), cursorY, 13);
    if (gameState.level.fail)
      p.stroke(255, 0, 0);
    else
      p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.noFill();
    let progressPosition = finishedTextWidth + nextCharWidth * 0.5;
    p.ellipse(cursorX + progressPosition - textShiftLeftX, cursorY, 18);

    // show best pace position
    const paceY = textY + 10 + 18;

    const gameBest = gameState.level.gameRecord && gameState.level.gameRecord.time;
    if (gameBest) {
      const bestFraction = Math.min(1.0, elapsedTime / gameBest);
      const bestPosition = beginX + bestFraction * (endX - beginX);
      p.stroke(0, 90, 255);
      p.noFill();
      p.ellipse(cursorX + bestPosition - textShiftLeftX, paceY, 15);

      const myBest = gameState.level.myRecord;
      if (myBest && myBest < gameBest) {
        const bestFraction = Math.min(1.0, elapsedTime / myBest);
        const bestPosition = beginX + bestFraction * (endX - beginX);
        p.stroke(120, 120, 120);
        p.noFill();
        p.ellipse(cursorX + bestPosition - textShiftLeftX, paceY, 15);
      }  
    }

    // show pace position
    if (!gameState.level.fail) {
      const pacePosition = beginX + elapsedFraction * (endX - beginX);
      p.stroke(255, 255, 0);
      p.noFill();
      p.ellipse(cursorX + pacePosition - textShiftLeftX, paceY, 15);
    }

    // This function is responsible for drawing the keyboard on the screen
    // when helping the user out
    function drawKeyboard(alpha: number, hintKey: Key) {
      const windowSize = Math.min(width, height);

      const kbcenter = { x: width / 2, y: height * 0.8 };
      const keyWidth = Math.floor(windowSize * 0.04);
      const keyHeight = Math.floor(windowSize * 0.04);
      const keyHorizPeriod = Math.ceil(windowSize * 0.045);
      const keyVertPeriod = -Math.ceil(windowSize * 0.045);

      p.noStroke();

      // draw every key
      keys.forEach(key => {
        const keyAlpha = p.keyIsDown(key.key) ? 1.0 : 0.2;
        p.strokeWeight(1)
        p.stroke(255, 255, 255, 100)
        p.fill(0, 77, 230, keyAlpha * alpha * 255);
        const x = kbcenter.x + key.x * keyHorizPeriod;
        const y = kbcenter.y + key.y * keyVertPeriod;
        const w = keyWidth * key.w;

        p.rect(x - w * 0.5, y - keyHeight * 0.5, w, keyHeight, 3);
      })

      // draw a circle for each finger
      for (let i = 0; i < 9; i++) {
        // calculate the home position for this finger
        const h = fingerHomes[i];
        const hx = kbcenter.x + h.x * keyHorizPeriod;
        const hy = kbcenter.y + h.y * keyVertPeriod;
        if (hintKey.finger !== i) {
          // if this isn't the finger we're currently giving a hint for
          // then draw it on its home key in black
          p.fill(0, 0, 0, alpha * 255);
          p.ellipse(hx, hy, keyWidth - 5);
        }
        else {
          // this is the finger we're giving the hint for
          // find the location of the key it needs to go on
          const fx = kbcenter.x + hintKey.x * keyHorizPeriod;
          const fy = kbcenter.y + hintKey.y * keyVertPeriod;
          if (hx !== fx || hy !== fy) {
            // if it isn't in its home position, then draw a line from the home position
            // to where it needs to be
            p.strokeWeight(3);
            p.stroke(255, 0, 0, alpha * 255);
            p.line(hx, hy, fx, fy);
            p.strokeWeight(0);
          }
          p.fill(255, 0, 0, alpha * 255);
          p.ellipse(fx, fy, keyWidth - 5);
        }
      }
    }

    if (gameState.badKey) {
      drawKeyboard(1, gameState.level.nextKey);
    }
    else if (timeOnCurrentLetter > 2000) {
      // the user has been on this letter for a while,
      // so let's help him out by showing the keyboard

      // we'll fade the keyboard in over the course of a second
      const kbAlpha = 1 - Math.min(1000, 3000 - Math.min(timeOnCurrentLetter, 3000)) / 1000;
      drawKeyboard(kbAlpha, gameState.level.nextKey);
    }

    p.noStroke();
    p.textSize(18);
    p.textFont(Assets.Fonts.status);
    p.fill(100, 100, 100);
    p.text("Level", 120, 33);
    p.text("Attempts", 240, 33);
    p.text("Rank", 390, 33);
    if (gameState.level.gameRecord && gameState.level.gameRecord.time)
      p.text("Record", 600, 33);
    
    p.stroke(0, 128, 0);
    p.strokeWeight(1);
    p.fill(0, 255, 0);
    p.textSize(24);
    p.text(gameState.level.levelNumber, 180, 35);
    p.text(gameState.level.attempts, 330, 35);
    p.text(ranks[gameState.rank].name, 450, 35);
    if (gameState.level.gameRecord && gameState.level.gameRecord.time) {
      p.noStroke();
      p.fill(20, 120, 255)
      const wpm = calcWpm(gameState.level.challengeText, gameState.level.gameRecord.time)
      p.text(wpm + " wpm by " + gameState.level.gameRecord.user, 680, 35);
    }

    if (gameState.messages.length) {
      let messageY = height * 0.15;
      const messageHeight = height * 0.0275;
      p.textSize(messageHeight);
      p.textFont(Assets.Fonts.status);
      for (let i = 0; i < gameState.messages.length; i++) {
        const message = gameState.messages[i].message;
        const timeLeft = gameState.messages[i].expire - timeNow;
        if (timeLeft < 0)
          continue;
        const messageWidth = p.textWidth(message);
        const messageX = width * 0.5 - messageWidth * 0.5;
        const alpha = Math.min(timeLeft, 400) * (1/400);
        p.noStroke();
        p.fill(255, 255, 255, alpha * 255);
        p.text(message, messageX, messageY);
        messageY += messageHeight;
      }
      while (gameState.messages.length && gameState.messages[gameState.messages.length - 1].expire < timeNow)
        gameState.messages.pop();
    }

    //text(finishedText, idealX - finishedTextWidth, 300);
    //text(remainText, idealX + nextCharWidth, 300);

    //show("elapsedFraction", elapsedFraction);
    //show("elapsedTime", elapsedTime);
    //show("winTime", gameState.winTime)
    //showAll();
    
  };

  p.keyPressed = function() {
    const keyCode = p.keyCode;
    gameState.keyQueue.push(keyCode);
  }  
};


/*

// ---------------------------------------------------
// Show functions

let showVars = [];

function show(name, value) {
  showVars.push({name: name, value: value});
}

function showAll() {
  let widths = showVars.map(v => textWidth(v.name + ": "));
  let nameWidth = widths.reduce((a, v) => Math.max(a, v), 0);
  showVars.forEach((v, i) => {
    textSize(12);
    noStroke();
    fill(255, 255, 255, 200);
    const { name, value } = v;
    text(name + ": ", 4 + nameWidth - textWidth(name + ": "), 16 + 14 * i);
    text(value, 4 + nameWidth, 16 + 14 * i)
  })
  showVars = [];
}

*/

