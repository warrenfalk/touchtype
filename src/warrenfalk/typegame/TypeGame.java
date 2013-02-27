package warrenfalk.typegame;

import java.awt.Font;
import java.awt.FontFormatException;
import java.awt.font.FontRenderContext;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.HashMap;

import org.lwjgl.font.glfont.FTFont;
import org.lwjgl.font.glfont.FTGLPolygonFont;
import org.lwjgl.input.Keyboard;
import org.lwjgl.openal.AL;
import org.lwjgl.opengl.Display;
import org.lwjgl.opengl.DisplayMode;
import org.lwjgl.opengl.GL11;
import org.lwjgl.opengl.PixelFormat;
import org.newdawn.slick.openal.Audio;
import org.newdawn.slick.openal.AudioLoader;
import org.newdawn.slick.util.ResourceLoader;

public class TypeGame {
	
	static String[] challenges;
	
	static Key[] keys = new Key[] {
		new Key(Keyboard.KEY_A, 'a', -4.5f, 0f, 1f, 1),
		new Key(Keyboard.KEY_S, 's', -3.5f, 0f, 1f, 2),
		new Key(Keyboard.KEY_D, 'd', -2.5f, 0f, 1f, 3),
		new Key(Keyboard.KEY_F, 'f', -1.5f, 0f, 1f, 4),
		new Key(Keyboard.KEY_G, 'g', -0.5f, 0f, 1f, 4),
		new Key(Keyboard.KEY_H, 'h', 0.5f, 0f, 1f, 5),
		new Key(Keyboard.KEY_J, 'j', 1.5f, 0f, 1f, 5),
		new Key(Keyboard.KEY_K, 'k', 2.5f, 0f, 1f, 6),
		new Key(Keyboard.KEY_L, 'l', 3.5f, 0f, 1f, 7),
		new Key(Keyboard.KEY_SEMICOLON, ';', 4.5f, 0f, 1f, 8),
		new Key(Keyboard.KEY_APOSTROPHE, '\'', 5.5f, 0f, 1f, 8),

		new Key(Keyboard.KEY_Q, 'q', -4.8f, 1f, 1f, 1),
		new Key(Keyboard.KEY_W, 'w', -3.8f, 1f, 1f, 2),
		new Key(Keyboard.KEY_E, 'e', -2.8f, 1f, 1f, 3),
		new Key(Keyboard.KEY_R, 'r', -1.8f, 1f, 1f, 4),
		new Key(Keyboard.KEY_T, 't', -0.8f, 1f, 1f, 4),
		new Key(Keyboard.KEY_Y, 'y', 0.2f, 1f, 1f, 5),
		new Key(Keyboard.KEY_U, 'u', 1.2f, 1f, 1f, 5),
		new Key(Keyboard.KEY_I, 'i', 2.2f, 1f, 1f, 6),
		new Key(Keyboard.KEY_O, 'o', 3.2f, 1f, 1f, 7),
		new Key(Keyboard.KEY_P, 'p', 4.2f, 1f, 1f, 8),

		new Key(Keyboard.KEY_Z, 'z', -4f, -1f, 1f, 2),
		new Key(Keyboard.KEY_X, 'x', -3f, -1f, 1f, 3),
		new Key(Keyboard.KEY_C, 'c', -2f, -1f, 1f, 4),
		new Key(Keyboard.KEY_V, 'v', -1f, -1f, 1f, 4),
		new Key(Keyboard.KEY_B, 'b', 0f, -1f, 1f, 4),
		new Key(Keyboard.KEY_N, 'n', 1f, -1f, 1f, 5),
		new Key(Keyboard.KEY_M, 'm', 2f, -1f, 1f, 5),
		new Key(Keyboard.KEY_COMMA, ',', 3f, -1f, 1f, 6),
		new Key(Keyboard.KEY_PERIOD, '.', 4f, -1f, 1f, 7),
		
		new Key(Keyboard.KEY_SPACE, ' ', 0f, -2f, 5f, 0),
	};
	
	final static int[] fingerHomes = new int[] {
		Keyboard.KEY_SPACE,
		Keyboard.KEY_A,
		Keyboard.KEY_S,
		Keyboard.KEY_D,
		Keyboard.KEY_F,
		Keyboard.KEY_J,
		Keyboard.KEY_K,
		Keyboard.KEY_L,
		Keyboard.KEY_SEMICOLON,
	};
	
	final static int[] fingers = new int[fingerHomes.length];
	
	static class Key {
		final int key;
		final char ch;
		final float x;
		final float y;
		final float w;
		final int finger;
		
		final static HashMap<Integer,Key> byKey = new HashMap<Integer,Key>();
		final static HashMap<Character,Key> byChar = new HashMap<Character,Key>();
		
		Key(int key, char ch, float x, float y, float w, int finger) {
			this.key = key;
			this.ch = ch;
			this.x = x;
			this.y = y;
			this.w = w;
			this.finger = finger;
			byKey.put(key, this);
			byChar.put(ch, this);
		}
	}

	public static void main(String[] args) throws Exception {
		int width = 1066;
		int height = 600;

		PixelFormat pf = new PixelFormat().withDepthBits(24).withSamples(4).withSRGB(true);
		Display.setDisplayMode(new DisplayMode(width, height));
		Display.create(pf);
		Display.setVSyncEnabled(true);

		GL11.glClearColor(1f, 1f, 1f, 0f);
		
		GL11.glEnable(GL11.GL_BLEND);
		GL11.glBlendFunc(GL11.GL_SRC_ALPHA, GL11.GL_ONE_MINUS_SRC_ALPHA);

		GL11.glViewport(0, 0, width, height);
		GL11.glMatrixMode(GL11.GL_PROJECTION);
		GL11.glLoadIdentity();
		float left = -width / 2;
		float top = -height / 2;
		float right = width + left;
		float bottom = height + top;
		GL11.glOrtho(left, right, top, bottom, 0, 1000);
		GL11.glMatrixMode(GL11.GL_MODELVIEW);
		GL11.glLoadIdentity();

		Font f = loadFont("/fonts/Comfortaa-Regular.ttf", 60);
		Font f2 = loadFont("/fonts/NEUROPOL.ttf", 20);
		FontRenderContext fcontext = FTFont.STANDARDCONTEXT;
		// FTFont font = new FTGLExtrdFont(f, fcontext);
		FTFont font = new FTGLPolygonFont(f, fcontext);
		FTFont statusFont = new FTGLPolygonFont(f2, fcontext);
		
		DecimalFormat secondsFormat = new DecimalFormat("###,##0.0");
		
		Audio clickEffect = AudioLoader.getAudio("WAV", ResourceLoader.getResourceAsStream("sounds/click.wav"));
		Audio click2Effect = AudioLoader.getAudio("WAV", ResourceLoader.getResourceAsStream("sounds/click2.wav"));
		Audio buzzerEffect = AudioLoader.getAudio("WAV", ResourceLoader.getResourceAsStream("sounds/buzzer.wav"));
		Audio bellEffect = AudioLoader.getAudio("WAV", ResourceLoader.getResourceAsStream("sounds/bell.wav"));
		Audio successEffect = AudioLoader.getAudio("WAV", ResourceLoader.getResourceAsStream("sounds/success.wav"));

		float cursorPosition = 0f;
		float idealOffset = -(width * 0.3f);
		float textLinePosition = idealOffset;
		int level = readLastLevel();
		int nextChar = 0;
		
		int tries = 0;
		long startTime = 0L;

		String challengeText = getChallengeText(level);
		long msToWin = calcWinTime(challengeText);
		cursorPosition = calculateCursorPosition(font, challengeText, nextChar);
		while (true) {
			// process input
			char cchar = Character.toLowerCase(challengeText.charAt(nextChar));
			while (Keyboard.next()) {
				if (Keyboard.getEventKeyState()) {
					char kchar = Keyboard.getEventCharacter();
					if (kchar != 0) {
						kchar = Character.toLowerCase(kchar);
						if (nextChar == 0 && cchar != ' ' && (kchar == ' ' || kchar == '.')) {
							// ignore
						}
						else if (kchar == cchar) {
							if (nextChar == 0) {
								startTime = System.currentTimeMillis();
							}
							if (kchar == ' ')
								click2Effect.playAsSoundEffect(1f, 0.3f, false);
							else
								clickEffect.playAsSoundEffect(1f, 0.3f, false);
							nextChar++;
							if (nextChar == challengeText.length()) {
								nextChar = 0;
								long elapsed = System.currentTimeMillis() - startTime;
								boolean success = elapsed <= msToWin;
								if (success) {
									successEffect.playAsSoundEffect(1f, 0.6f, false);
									tries = 0;
									level++;
									saveLevel(level);
									challengeText = getChallengeText(level);
									msToWin = calcWinTime(challengeText);
								}
								else {
									tries++;
									bellEffect.playAsSoundEffect(1f, 1f, false);
								}
								startTime = 0L;
							}
							cursorPosition = calculateCursorPosition(font, challengeText, nextChar);
						}
						else {
							buzzerEffect.playAsSoundEffect(1f, 0.7f, false);
							startTime = 0L;
							if (nextChar > 0)
								tries++;
							nextChar = 0;
							cursorPosition = calculateCursorPosition(font, challengeText, nextChar);
						}
					}
				}
			}
			
			// world tick
			float idealTextLinePosition = idealOffset - cursorPosition;
			float textLineDiff = idealTextLinePosition - textLinePosition;
			float textLineMove = textLineDiff * 0.07f;
			textLinePosition = textLinePosition + textLineMove;
			
			GL11.glMatrixMode(GL11.GL_MODELVIEW);
			GL11.glPushMatrix(); // save base view matrix
			GL11.glTranslatef(textLinePosition, 0, 0);
			
			// begin drawing
			GL11.glClear(GL11.GL_COLOR_BUFFER_BIT | GL11.GL_DEPTH_BUFFER_BIT);
			
			// gradient background
			GL11.glMatrixMode(GL11.GL_PROJECTION);
			GL11.glPushMatrix();
			GL11.glLoadIdentity();
			GL11.glMatrixMode(GL11.GL_MODELVIEW);
			GL11.glPushMatrix();
			GL11.glLoadIdentity();
			GL11.glBegin(GL11.GL_QUADS);
			GL11.glColor4f(1f, 1f, 1f, 1f);
			GL11.glVertex2f(-1f, -1f);
			GL11.glVertex2f(1f, -1f);
			GL11.glColor4f(0.4f, 0.4f, 0.4f, 1f);
			GL11.glVertex2f(1f, 1f);
			GL11.glVertex2f(-1f, 1f);
			GL11.glEnd();
			GL11.glMatrixMode(GL11.GL_MODELVIEW);
			GL11.glPopMatrix();
			GL11.glMatrixMode(GL11.GL_PROJECTION);
			GL11.glPopMatrix();

			// begin scene
			GL11.glMatrixMode(GL11.GL_MODELVIEW);
			
			// cursor (arrow)
			GL11.glPushMatrix(); // save view matrix
			GL11.glTranslatef(cursorPosition, 60f, 0f);
			GL11.glScalef(5f, -5f, 1f);
			GL11.glColor4f(1f, 0f, 0f, 0.8f);
			GL11.glBegin(GL11.GL_QUADS);
			GL11.glVertex3f(-1f, -13f, 0f);
			GL11.glVertex3f(-1f, -3f, 0f);
			GL11.glVertex3f(1f, -3f, 0f);
			GL11.glVertex3f(1f, -13f, 0f);
			GL11.glEnd();
			GL11.glBegin(GL11.GL_TRIANGLES);
			GL11.glVertex3f(0f, -3f, 0f);
			GL11.glVertex3f(0f, 0f, 0f);
			GL11.glVertex3f(3f, -4f, 0f);
			GL11.glVertex3f(0f, -3f, 0f);
			GL11.glVertex3f(-3f, -4f, 0f);
			GL11.glVertex3f(0f, 0f, 0f);
			GL11.glEnd();
			GL11.glPopMatrix(); // restore view matrix
			
			// cursor -> current character 
			/*
			GL11.glPushMatrix(); // save view matrix
			String nextCharString = challengeText.substring(nextChar, nextChar + 1);
			float nextCharScale = 2f;
			if (" ".equals(nextCharString)) {
				nextCharString = "[space]";
				nextCharScale = 0.5f;
			}
			float nextCharWidth = font.advance(nextCharString);
			GL11.glTranslatef(cursorPosition - (nextCharWidth * nextCharScale / 2f), -40f - 40f * nextCharScale, 0f);
			GL11.glScalef(nextCharScale, nextCharScale, 1f);
			GL11.glColor4f(1f, 0f, 0f, 0.8f);
			font.render(nextCharString);
			GL11.glPopMatrix(); // restore view matrix
			*/

			// status text
			GL11.glPushMatrix(); // save view matrix
			status(statusFont, 0, 0, "Level :", "" + (level + 1));
			status(statusFont, 1, 0, "To win :", secondsFormat.format((double)msToWin / 1000.0) + " secs");
			String time;
			if (startTime == 0) {
				time = "0.0 secs";
			}
			else {
				long elapsed = System.currentTimeMillis() - startTime;
				time = secondsFormat.format((double)elapsed / 1000.0) + " secs";
			}
			status(statusFont, 2, 0, "Your time :", time);
			status(statusFont, 3, 0, "Attempt :", "" + (tries + 1));
			GL11.glPopMatrix(); // restore view matrix
			
			// text
			GL11.glPushMatrix(); // save view matrix
			// whitish completed text
			GL11.glColor4f(0.8f, 0.8f, 0.8f, 1f);
			String before = challengeText.substring(0, nextChar);
			String next = challengeText.substring(nextChar, nextChar + 1);
			String after = challengeText.substring(nextChar + 1);
			float advance = font.advance(before);
			font.render(before);
			// red current character
			GL11.glColor4f(1f, 0f, 0f, 1f);
			GL11.glTranslatef(advance, 0f, 0f);
			advance = font.advance(next);
			font.render(next);
			// black future characters
			GL11.glColor4f(0f, 0f, 0f, 1f);
			GL11.glTranslatef(advance, 0f, 0f);
			font.render(after);
			GL11.glPopMatrix(); // restore view matrix
			
			GL11.glPushMatrix(); // save view matrix
			float keyStride = 28f;
			float keySpace = 4f;
			for (Key key : keys) {
				GL11.glColor4f(0f, 0.3f, 0.9f, Keyboard.isKeyDown(key.key) ? 1f : 0.2f);
				GL11.glLoadIdentity();
				GL11.glTranslatef(key.x * keyStride, -120f + key.y * keyStride, 0f);
				drawKeyShape(keyStride * key.w - keySpace, keyStride - keySpace);
			}
			// reset all fingers to home positions
			for (int i = 0; i < fingers.length; i++)
				fingers[i] = fingerHomes[i];
			Key ckey = Key.byChar.get(cchar);
			fingers[ckey.finger] = ckey.key;
			for (int i = 0; i < fingers.length; i++) {
				Key key = Key.byKey.get(fingers[i]);
				GL11.glLoadIdentity();
				GL11.glTranslatef(key.x * keyStride, -120f + key.y * keyStride, 0f);
				float alpha = ckey.finger == i ? 1f : 0.2f;
				GL11.glColor4f(0f, 0f, 0f, alpha);
				drawFingerShape(keyStride - keySpace - 5f);
			}
			GL11.glPopMatrix(); // restore view matrix
			
			// end scene
			GL11.glPopMatrix(); // restore base view matrix

			Display.update();
			Display.sync(60);

			if (Display.isCloseRequested()) {
				Display.destroy();
				AL.destroy();
				System.exit(0);
			}
		}
	}
	
	// TODO: create display list or vbo
	private static void drawFingerShape(float diameter) {
		float outer = diameter / 2f;
		float inner = outer - 4f;
		GL11.glBegin(GL11.GL_TRIANGLE_FAN);
		GL11.glVertex3f(0f, 0f, 0f);
		float segments = 16f;
		float step = 2f * (float)Math.PI / segments;
		for (float a = 0f; a <= segments; a++) {
			float ar = a * step;
			GL11.glVertex3f((float)Math.cos(ar) * outer, -(float)Math.sin(ar) * outer, 0f);
		}
		GL11.glEnd();
	}

	// TODO: create display list or vbo
	private static void drawKeyShape(float width, float height) {
		float corner = 3f;
		float outerx = width / 2f;
		float outery = height / 2f;
		float innerx = outerx - corner;
		float innery = outery - corner;
		float rx0 = innerx + 2f * (float)Math.cos(0.78539815);
		float ry0 = innery + 2f * (float)Math.sin(0.78539815);
		GL11.glBegin(GL11.GL_QUADS);
		// main square (plus left/right edges)
		GL11.glVertex3f(-outerx, -innery, 0f);
		GL11.glVertex3f(-outerx, innery, 0f);
		GL11.glVertex3f(outerx, innery, 0f);
		GL11.glVertex3f(outerx, -innery, 0f);
		// top edge
		GL11.glVertex3f(-innerx, -outery, 0f);
		GL11.glVertex3f(-innerx, -innery, 0f);
		GL11.glVertex3f(innerx, -innery, 0f);
		GL11.glVertex3f(innerx, -outery, 0f);
		// bottom edge
		GL11.glVertex3f(-innerx, innery, 0f);
		GL11.glVertex3f(-innerx, outery, 0f);
		GL11.glVertex3f(innerx, outery, 0f);
		GL11.glVertex3f(innerx, innery, 0f);
		GL11.glEnd();
		// corners
		GL11.glBegin(GL11.GL_TRIANGLE_FAN);
		GL11.glVertex3f(-innerx, -innery, 0);
		GL11.glVertex3f(-innerx, -outery, 0f);
		GL11.glVertex3f(-rx0, -ry0, 0f);
		GL11.glVertex3f(-outerx, -innery, 0f);
		GL11.glEnd();
		GL11.glBegin(GL11.GL_TRIANGLE_FAN);
		GL11.glVertex3f(-innerx, innery, 0);
		GL11.glVertex3f(-innerx, outery, 0f);
		GL11.glVertex3f(-rx0, ry0, 0f);
		GL11.glVertex3f(-outerx, innery, 0f);
		GL11.glEnd();
		GL11.glBegin(GL11.GL_TRIANGLE_FAN);
		GL11.glVertex3f(innerx, innery, 0);
		GL11.glVertex3f(innerx, outery, 0f);
		GL11.glVertex3f(rx0, ry0, 0f);
		GL11.glVertex3f(outerx, innery, 0f);
		GL11.glEnd();
		GL11.glBegin(GL11.GL_TRIANGLE_FAN);
		GL11.glVertex3f(innerx, -innery, 0);
		GL11.glVertex3f(innerx, -outery, 0f);
		GL11.glVertex3f(rx0, -ry0, 0f);
		GL11.glVertex3f(outerx, -innery, 0f);
		GL11.glEnd();
	}

	private static int readLastLevel() throws IOException {
		File level = getLevelSaveFile();
		if (!level.isFile())
			return 0;
		BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(level)));
		try {
			String line;
			while (null != (line = reader.readLine())) {
				return Integer.parseInt(line);
			}
			return 0;
		}
		finally {
			reader.close();
		}
	}
	
	private static void saveLevel(int levelNum) throws FileNotFoundException {
		File level = getLevelSaveFile();
		level.getParentFile().mkdirs();
		PrintWriter pw = new PrintWriter(level);
		try {
			pw.println(levelNum);
		}
		finally {
			pw.close();
		}
	}
	
	private static File getLevelSaveFile() {
		File userHome = new File(System.getProperty("user.home"));
		File settings = new File(userHome, ".touchtype");
		File level = new File(settings, "level");
		return level;
	}
	
	private static long calcWinTime(String challengeText) {
		return (long)(5000f * (float)challengeText.length() / 13f);
	}
	
	private static void status(FTFont statusFont, int row, int col, String label, String value) {
		GL11.glLoadIdentity(); // back to identity reference frame
		float labelWidth = statusFont.advance(label);
		GL11.glTranslatef(-320f + 200f * col - labelWidth, 250f - 24f * row, 0f);
		GL11.glColor4f(0f, 0f, 0f, 1f);
		statusFont.render(label);
		GL11.glTranslated(labelWidth + 13f, 0f, 0f);
		GL11.glColor4f(0.4f, 1f, 0.4f, 1f);
		statusFont.render(value);
	}
	
	private static String getChallengeText(int level) throws IOException {
		if (challenges == null)
			challenges = loadChallenges();
		return challenges[level];
	}
	
	private static String[] loadChallenges() throws IOException {
		InputStream in = ResourceLoader.getResourceAsStream("levels/progression.txt");
		BufferedReader reader = new BufferedReader(new InputStreamReader(in));
		ArrayList<String> lines = new ArrayList<String>();
		String line = null;
		while (null != (line = reader.readLine())) {
			line = line.trim();
			if (line.length() == 0)
				continue;
			lines.add(line);
		}
		return lines.toArray(new String[lines.size()]);
	}

	private static float calculateCursorPosition(FTFont font, String challengeText, int nextChar) {
		String completedText = challengeText.substring(0, nextChar);
		float completedWidth = font.advance(completedText);
		if (nextChar + 1 > challengeText.length())
			return completedWidth;
		String futureCompletedText = challengeText.substring(0, nextChar + 1);
		float futureCompletedWidth = font.advance(futureCompletedText);
		return completedWidth + (futureCompletedWidth - completedWidth) / 2f;
	}

	private static Font loadFont(String fontName, float fontSize)
			throws FontFormatException, IOException {
		InputStream s = TypeGame.class.getResourceAsStream(fontName);
		try {
			Font awtFont = Font.createFont(Font.TRUETYPE_FONT, s);
			return awtFont.deriveFont(fontSize);
		} finally {
			s.close();
		}
	}

}
