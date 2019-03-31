import React, { Component } from 'react';
import logo from './logo.svg';
import './Touchtype.css';
// @ts-ignore
import P5Wrapper from 'react-p5-wrapper';
import {levels} from './levels';
import {ranks} from './ranks';
import {Key} from './keyboard';

class Touchtype extends Component {
  render() {
    return (
      <P5Wrapper sketch={sketch}/>
    );
  }
}

export default Touchtype;

let user = localStorage.touchtypeUser;
if (!user) {
  window.location.href = "./user.html";
}

type ErrorResult = { error: Error }
type SuccessResult<T> = { success: T }
type Result<T> = ErrorResult | SuccessResult<T>
function isError<T>(result: Result<T>): result is ErrorResult { return (result as any).error !== undefined; }
type ResultCallback<T> = (result: Result<T>) => void

type UserProgress = {
  level: number,
  attempts: number,
  rank: number,
}
type GameRecord = {}
type UserRecord = {}

type LoadProgressArgs = {user: string}
type LoadProgressResult = UserProgress
type GetRecordsArgs = {}
type GetRecordsResult = {
  record: GameRecord,
  [user: string]: UserRecord,
}

function apiPost<TReq,TRes>(path: string, data: TReq, callback: ResultCallback<TRes>) {
	var xhr = new XMLHttpRequest();
	xhr.open("POST", path, true);
	xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
	xhr.send(JSON.stringify(data));
	xhr.onloadend = function () {
    const response = JSON.parse(xhr.responseText) as TRes;
		callback({success: response});
	};
}

/*
Note to self:  The plan here is as follows

1. Get this working again, possibly just mock all of the api calls
2. Convert all of the state mutating functions to be more functional
3. Begin changing to a model of subscribing to server state (perhaps implement leaderboard)
4. Implement gRPC
*/

function loadProgress(forUser: string, callback: ResultCallback<UserProgress>) {
	apiPost<LoadProgressArgs, LoadProgressResult>(
    './api/load-progress',
    {user: forUser},
    result => {
      if (isError(result)) {
        return callback(result)
      }
      let data = result.success;
      let save = Object.assign({}, {
        level: 0,
        attempts: 0,
        rank: 0,
      }, data);
      callback({success: save});
    }
  )
}

function calcWinTime(challengeText: string, rank: number) {
	let words = challengeText.length * 0.2;
	let minutes = words / ranks[rank].wpm;
	let seconds = minutes * 60;
	let ms = seconds * 1000;
	return Math.ceil(ms);
}


export function sketch (p: any) {
  let rotation = 0;

  const Images = {
    background: p.loadImage("dark_spotlight.jpg"),
  };

  let width: number
  let height: number
  let cursorX: number
  let textHeight: number
  let textY: number

  let loadingState: string;

  let gameState: {
    rank: number,
    attempts: number,
    fail: boolean,
    level: number,
    levelStartTime: number,
    challengeText: string,
    winTime?: number,
    myRecord?: UserRecord,
    gameRecord?: UserRecord,
    saving: boolean,
    
    progress?: number,
    nextChar?: string,
    nextKey?: Key,
    currentLetterStartTime?: number,
  };

  type UserRecord = {
  }

  function calcSizes() {
    width = window.innerWidth;
    height = window.innerHeight;
    let size = Math.min(width, height);
    const cursorX = Math.ceil(width * 0.1);
    const textHeight = Math.ceil(size * 0.1);
    const textY = Math.ceil(height * 0.4 + textHeight * 0.5);
  }

  function getChallengeText(level: number) {
    return levels[level]
  }

  function getUserRecordTime(forUser: string) {
    if (!forUser)
      forUser = user;
    let challenge = gameState.challengeText.toLowerCase();
    delete gameState.myRecord;
    delete gameState.gameRecord;
    console.log('getting record for', forUser);
    apiPost<GetRecordsArgs, GetRecordsResult>(
      './api/get-records',
      {user: forUser, challenge: challenge},
      (result) => {
        if (isError(result)) {
          console.error(result.error);
          return;
        }
        let response = result.success;
        gameState.gameRecord = response.record;
        let userRecord = response[forUser];
        console.log('record is', userRecord, response);
        if (userRecord && challenge == gameState.challengeText.toLowerCase()) {
          gameState.myRecord = userRecord;
        }
      }
    )
  }

  function saveProgress(forUser: string) {
    let saveData = {
      user: forUser,
      level: gameState.level,
      attempts: gameState.attempts,
      rank: gameState.rank || 0,
    };
    console.log("saving...");
    gameState.saving = true;
    apiPost("./api/save-progress", saveData, () => {
      console.log("done");
      gameState.saving = false;
    })
  }

  function setProgress(progress: number) {
    gameState.progress = progress;
    gameState.nextChar = gameState.challengeText[progress];
    gameState.nextKey = Key.byChar(gameState.nextChar.toLowerCase());
    gameState.currentLetterStartTime = p.millis();
  }  

  function resetProgress(noAttempt: boolean) {
    if (!noAttempt) {
      gameState.attempts++;
      saveProgress(user);
    }
    gameState.fail = false;
    gameState.levelStartTime = 0;
    setProgress(0);
  }  

  function gotoLevel(level: number, attempts: number) {
    gameState.attempts = attempts || 0
    gameState.level = level;
    gameState.challengeText = getChallengeText(level);
    gameState.winTime = calcWinTime(gameState.challengeText, gameState.rank);
    getUserRecordTime(user);
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
      gameState = {
        level: level || 0,
        levelStartTime: 0,
        attempts: attempts || 0,
        fail: false,
        rank: saved.rank || 0,
        challengeText: getChallengeText(level),
        saving: false,
      }
      gotoLevel(level, attempts);
      loadingState = "loaded";
    });
  }

	p.setup = function () {
    calcSizes();
    const background = p.createGraphics(width, height);
    background.image(Images.background, 0, 0, width, height);
    p.createCanvas(width, height);
	};

	p.draw = function () {
    p.image(Images.background, 0, 0, width, height);

    if (!loadingState) {
      initializeGameState();
      return;
    }

    /*
    if (loadingState === "loading") {
      return;
    }

    let timeNow = millis();
    let timeOnCurrentLetter = timeNow - gameState.currentLetterStartTime;
    let elapsedTime = timeNow - (gameState.levelStartTime || timeNow);
    let elapsedFraction = Math.min(1.0, elapsedTime / gameState.winTime);

    // process any keys
    if (keyQueue.length) {
      keyQueue.forEach(k => {
        let keyPressed = Key.byKey[k];
        badKey = false;
        if (keyPressed === gameState.nextKey) {
          // good job, play a click sound
          if (keyPressed == Key.byKey[Keyboard.KEY_SPACE]) {
            Sound.click2.play(null, null, 0.1);
          }
          else if (keyPressed) {
            Sound.click.play(null, null, 0.1);
          }
          let level = gameState.level;
          advanceProgress(elapsedTime);
          if (gameState.progress === 0) {
            if (gameState.level > level) 
              Sound.success.play(null, null, 0.1);
            else
              Sound.bell.play(null, null, 0.1);
          }
        }
        else if (k === 27) {
          resetProgress();
        }
        else if (keyPressed) {
          // whoops, buzzer
          badKey = k;
          Sound.buzzer.play(null, null, 0.1);
          if (gameState.progress)
            failLevel();
        }
      })
    }
    keyQueue = [];


    // split up the challenge text into the letter we expect next
    // and everything before it (finished)
    // and everything after it (remaining)
    let finishedText = gameState.challengeText.substring(0, gameState.progress);
    let remainText = gameState.challengeText.substring(gameState.progress + 1);

    // we'll set the text size and font now
    textSize(textHeight);
    textFont(Fonts.game);

    // get the width of each part so we can position it
    let nextCharWidth = lettersWidth(gameState.nextChar);
    let finishedTextWidth = lettersWidth(finishedText);
    let beginX = lettersWidth(gameState.challengeText[0]) * 0.5;
    let endX = lettersWidth(gameState.challengeText) - lettersWidth(gameState.challengeText.slice(-1)) * 0.5;

    // calculate how much of the text, in pixels, we've completed
    // we'll count the current character as half completed and so we'll use half its width
    // this way, if we shift the challenge text left by this many pixels
    // the center of the current character is always in the same place
    let actualProgressX = finishedTextWidth + (nextCharWidth * 0.5);
    // but the problem with that is that it makes it move jerkily
    // so we will animate it a bit
    // textShiftLeftX is the actual left-shiftedness of the challenge text
    // we will calculate how far it would have to move for it to be at our actual progress
    // but instead of moving it there immediately, we'll move it 7% of the way there (each frame)
    // this means that for large distances, it moves fast
    // but for small distances it moves slowly
    // and so as it gets closer (the distance grows smaller) it moves slower
    // This is called an "ease out" animation
    let difference = actualProgressX - textShiftLeftX;
    textShiftLeftX = textShiftLeftX + (difference * 0.1);

    // Now we draw the text
    noStroke();
    // We draw it in three parts so we can use three different colors
    fill(50, 50, 50);
    letters(finishedText, cursorX - textShiftLeftX, textY);

    fill(255, 0, 0);
    letters(gameState.nextChar, cursorX + finishedTextWidth - textShiftLeftX, textY);

    fill(230, 230, 230);
    letters(remainText, cursorX + finishedTextWidth + nextCharWidth - textShiftLeftX, textY);

    // show current position
    let cursorY = textY - textHeight - 18;
    noStroke();
    fill(255, 0, 0);
    ellipse(cursorX + finishedTextWidth - textShiftLeftX + (nextCharWidth * 0.5), cursorY, 13);
    if (gameState.fail)
      stroke(255, 0, 0);
    else
      stroke(255, 255, 255);
    strokeWeight(2);
    noFill();
    let progressPosition = finishedTextWidth + nextCharWidth * 0.5;
    ellipse(cursorX + progressPosition - textShiftLeftX, cursorY, 18);

    // show best pace position
    let paceY = textY + 10 + 18;

    let gameBest = gameState.gameRecord && gameState.gameRecord.time;
    if (gameBest) {
      let bestFraction = Math.min(1.0, elapsedTime / gameBest);
      let bestPosition = beginX + bestFraction * (endX - beginX);
      stroke(0, 90, 255);
      noFill();
      ellipse(cursorX + bestPosition - textShiftLeftX, paceY, 15);
    }

    let myBest = gameState.myRecord;
    if (myBest && myBest < gameBest) {
      let bestFraction = Math.min(1.0, elapsedTime / myBest);
      let bestPosition = beginX + bestFraction * (endX - beginX);
      stroke(120, 120, 120);
      noFill();
      ellipse(cursorX + bestPosition - textShiftLeftX, paceY, 15);
    }


    // show pace position
    if (!gameState.fail) {
      let pacePosition = beginX + elapsedFraction * (endX - beginX);
      stroke(255, 255, 0);
      noFill();
      ellipse(cursorX + pacePosition - textShiftLeftX, paceY, 15);
    }

    if (badKey) {
      drawKeyboard(1, gameState.nextKey, badKey);
    }
    else if (timeOnCurrentLetter > 2000) {
      // the user has been on this letter for a while,
      // so let's help him out by showing the keyboard

      // we'll fade the keyboard in over the course of a second
      let kbAlpha = 1 - Math.min(1000, 3000 - Math.min(timeOnCurrentLetter, 3000)) / 1000;
      drawKeyboard(kbAlpha, gameState.nextKey);
    }

    noStroke();
    textSize(18);
    textFont(Fonts.status);
    fill(100, 100, 100);
    text("Level", 120, 33);
    text("Attempts", 240, 33);
    text("Rank", 390, 33);
    if (gameState.gameRecord && gameState.gameRecord.time)
      text("Record", 600, 33);
    
    stroke(0, 128, 0);
    strokeWeight(1);
    fill(0, 255, 0);
    textSize(24);
    text(gameState.level, 180, 35);
    text(gameState.attempts, 330, 35);
    text(ranks[gameState.rank].name, 450, 35);
    if (gameState.gameRecord && gameState.gameRecord.time) {
      noStroke();
      fill(20, 120, 255)
      let wpm = calcWpm(gameState.challengeText, gameState.gameRecord.time)
      text(wpm + " wpm by " + gameState.gameRecord.user, 680, 35);
    }

    if (messages.length) {
      let messageY = height * 0.15;
      let messageHeight = height * 0.0275;
      textSize(messageHeight);
      textFont(Fonts.status);
      for (let i = 0; i < messages.length; i++) {
        let message = messages[i].message;
        let timeLeft = messages[i].expire - timeNow;
        if (timeLeft < 0)
          continue;
        let messageWidth = textWidth(message);
        let messageX = width * 0.5 - messageWidth * 0.5;
        let alpha = Math.min(timeLeft, 400) * (1/400);
        noStroke();
        fill(255, 255, 255, alpha * 255);
        text(message, messageX, messageY);
        messageY += messageHeight;
      }
      while (messages.length && messages[messages.length - 1].expire < timeNow)
        messages.pop();
    }


    //text(finishedText, idealX - finishedTextWidth, 300);
    //text(remainText, idealX + nextCharWidth, 300);

    //show("elapsedFraction", elapsedFraction);
    //show("elapsedTime", elapsedTime);
    //show("winTime", gameState.winTime)
    showAll();
    */
	};
};

/*

let Sound;
let Fonts;
let Images;

function preload() {
	Sound = {
		bell:  loadSound('assets/bell.mp3'),
		buzzer: loadSound('assets/buzzer.mp3'),
		click: loadSound('assets/click.mp3'),
		click2: loadSound('assets/click2.mp3'),
		success: loadSound('assets/success.mp3'),
		applause: loadSound('assets/applause.mp3'),
	}
	Fonts = {
		game: loadFont("assets/comfortaa-regular.otf"),
		status: loadFont("assets/roboto-regular.ttf"),
	}
	Images = {
		background: loadImage("assets/dark_spotlight.jpg"),
	}
}

function setup() {
	calcSizes();
	createCanvas(width, height);
}

window.onresize = function(e) {
	calcSizes();
	resizeCanvas(width, height);
}

let width;
let height;
// this is how far from the left margin we line up the current letter on
let cursorX;
let textY;
let textHeight;
let background;

function calcSizes() {
	width = window.innerWidth;
	height = window.innerHeight;
	let size = Math.min(width, height);
	cursorX = Math.ceil(width * 0.1);
	textHeight = Math.ceil(size * 0.1);
	textY = Math.ceil(height * 0.4 + textHeight * 0.5);
	background = createGraphics(width, height);
	background.image(Images.background, 0, 0, width, height);
}

let challenges;

let keyQueue = [];
// this remembers the current left-shiftedness of the challenge text in pixels
let textShiftLeftX = 0;

let messages = [];
function showMessage(message) {
	messages.unshift({message: message, expire: millis() + 2000})
}

function advanceProgress(time) {
	if (gameState.progress === 0)
		gameState.levelStartTime = millis();
	let nextProgress = gameState.progress + 1;
	if (nextProgress === gameState.challengeText.length) {
		if (gameState.fail) {
			resetProgress();
		}
		else {
			// if this is a new record, play cheers
			if (time && (!gameState.gameRecord || !gameState.gameRecord.time || time < gameState.gameRecord.time)) {
				// only play it if there was an old record to beat
				if (gameState.gameRecord && gameState.gameRecord.time) {
					Sound.applause.play(null, null, 0.3);
					let wpm = calcWpm(gameState.challengeText, time);
					showMessage("New record: " + wpm + " wpm!");
				}
				gameState.gameRecord = {time: time, user: user}
			}
			if (!gameState.myRecord || time < gameState.myRecord)
				gameState.myRecord = time;
			saveUserRecordTime(user, time);
			if (gameState.winTime < (millis() - gameState.levelStartTime))
				resetProgress();
			else
				advanceLevel(time);
		}
		return;
	}
	setProgress(nextProgress);
}

function saveUserRecordTime(forUser, time) {
	if (!forUser)
		forUser = user;
	const challenge = gameState.challengeText.toLowerCase();
	let data = {
		user: user,
		challenge: challenge,
		time: time,
	}
	console.log('saving time', data);
	apiPost('./api/save-time', data, () => {console.log('time saved')});
}

function advanceLevel(time) {
	let nextLevel = gameState.level + 1;
	if (nextLevel >= levels.length) {
		gameState.rank++;
		nextLevel = ranks[gameState.rank].startLevel;
	}
	gotoLevel(nextLevel);
	saveProgress();
}

function failLevel() {
	if (!gameState.fail) {
		gameState.fail = true;
		saveProgress();
	}
}

let badKey = false;
function draw() {

}

function calcWpm(text, time) {
	let words = text.length * 0.2;
	let minutes = time / 1000 / 60;
	let wpm = Math.round(words * 100 / minutes) / 100;
	return wpm;
}

let fingerHomes = [
	{ x: 0, y: -2 }, // Thumb on Space
	{ x: -4.5, y: 0 }, // Left pinky on A
	{ x: -3.5, y: 0 }, // Left ring on S
	{ x: -2.5, y: 0 }, // Left middle on D
	{ x: -1.5, y: 0 }, // Left index on F
	{ x: 1.5, y: 0 }, // Right pinky on J
	{ x: 2.5, y: 0 }, // Right ring on K
	{ x: 3.5, y: 0 }, // Right middle on L
	{ x: 4.5, y: 0 }, // Right index on ;
]

// This function is responsible for drawing the keyboard on the screen
// when helping the user out
function drawKeyboard(alpha, hintKey) {
	let windowSize = Math.min(width, height);

	let kbcenter = { x: width / 2, y: height * 0.8 };
	let keyWidth = Math.floor(windowSize * 0.04);
	let keyHeight = Math.floor(windowSize * 0.04);
	let keyHorizPeriod = Math.ceil(windowSize * 0.045);
	let keyVertPeriod = -Math.ceil(windowSize * 0.045);

	noStroke();

	// draw every key
	keys.forEach(key => {
		let keyAlpha = keyIsDown(key.key) ? 1.0 : 0.2;
		strokeWeight(1)
		stroke(255, 255, 255, 100)
		fill(0, 77, 230, keyAlpha * alpha * 255);
		let x = kbcenter.x + key.x * keyHorizPeriod;
		let y = kbcenter.y + key.y * keyVertPeriod;
		let w = keyWidth * key.w;

		rect(x - w * 0.5, y - keyHeight * 0.5, w, keyHeight, 3);
	})

	// draw a circle for each finger
	for (let i = 0; i < 9; i++) {
		// calculate the home position for this finger
		let h = fingerHomes[i];
		let hx = kbcenter.x + h.x * keyHorizPeriod;
		let hy = kbcenter.y + h.y * keyVertPeriod;
		if (hintKey.finger !== i) {
			// if this isn't the finger we're currently giving a hint for
			// then draw it on its home key in black
			fill(0, 0, 0, alpha * 255);
			ellipse(hx, hy, keyWidth - 5);
		}
		else {
			// this is the finger we're giving the hint for
			// find the location of the key it needs to go on
			let fx = kbcenter.x + hintKey.x * keyHorizPeriod;
			let fy = kbcenter.y + hintKey.y * keyVertPeriod;
			if (hx !== fx || hy !== fy) {
				// if it isn't in its home position, then draw a line from the home position
				// to where it needs to be
				strokeWeight(3);
				stroke(255, 0, 0, alpha * 255);
				line(hx, hy, fx, fy);
				strokeWeight(0);
			}
			fill(255, 0, 0, alpha * 255);
			ellipse(fx, fy, keyWidth - 5);
		}
	}
}

// We use a special letters function instead of the built in text function
// this is necessary because text adjusts the spaces between different letters differently
// and we can't allow that because we'll draw the text using multiple calls (for multiple
// colors) and the spaces between letters would seem to change as we separate the text
// at different places
const spacing = 2;
function letters(s, x, y) {
	if (s === null || s === undefined || s === "")
		return 0
	let cx = x;
	// for each character in the string...
	for (let i = 0; i < s.length; i++) {
		let c = s[i];
		// draw the character
		text(c, cx, y);
		// calculate the character width (with spacing)
		let cw = textWidth(c) + spacing;
		// move the cursor by that much to prepare for the next character
		cx += cw;
	}
}

// we use a special letters width to measure the width of each letter individually
// to go along with our "letters" function which puts text on the screen one letter at a time
function lettersWidth(s) {
	if (s === null || s === undefined || s === "")
		return 0;
	let cx = 0;
	for (let i = 0; i < s.length; i++) {
		let c = s[i];
		let cw = textWidth(c) + spacing;
		cx += cw;
	}
	return cx;
}

function keyPressed() {
	keyQueue.push(keyCode);
}




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

