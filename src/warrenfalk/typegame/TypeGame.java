package warrenfalk.typegame;

import java.awt.Font;
import java.awt.FontFormatException;
import java.awt.font.FontRenderContext;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.IntBuffer;
import java.text.DecimalFormat;
import java.util.ArrayList;

import org.lwjgl.BufferUtils;
import org.lwjgl.font.glfont.FTFont;
import org.lwjgl.font.glfont.FTGLPolygonFont;
import org.lwjgl.input.Keyboard;
import org.lwjgl.openal.AL;
import org.lwjgl.openal.AL10;
import org.lwjgl.opengl.Display;
import org.lwjgl.opengl.DisplayMode;
import org.lwjgl.opengl.GL11;
import org.lwjgl.opengl.PixelFormat;
import org.lwjgl.util.WaveData;
import org.newdawn.slick.openal.Audio;
import org.newdawn.slick.openal.AudioLoader;
import org.newdawn.slick.util.ResourceLoader;

public class TypeGame {
	
	static String[] challenges;

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
		Audio buzzerEffect = AudioLoader.getAudio("WAV", ResourceLoader.getResourceAsStream("sounds/buzzer.wav"));
		Audio bellEffect = AudioLoader.getAudio("WAV", ResourceLoader.getResourceAsStream("sounds/bell.wav"));
		Audio successEffect = AudioLoader.getAudio("WAV", ResourceLoader.getResourceAsStream("sounds/success.wav"));

		float cursorPosition = 0f;
		float idealOffset = -(width * 0.3f);
		float textLinePosition = idealOffset;
		int level = 0;
		int nextChar = 0;
		
		int tries = 0;
		long startTime = 0L;

		String challengeText = getChallengeText(level);
		long msToWin = calcWinTime(challengeText);
		cursorPosition = calculateCursorPosition(font, challengeText, nextChar);
		while (true) {
			// process input
			while (Keyboard.next()) {
				if (Keyboard.getEventKeyState()) {
					char kchar = Keyboard.getEventCharacter();
					if (kchar != 0) {
						kchar = Character.toLowerCase(kchar);
						char cchar = Character.toLowerCase(challengeText.charAt(nextChar));
						if (kchar == cchar) {
							if (nextChar == 0) {
								startTime = System.currentTimeMillis();
							}
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
			GL11.glColor4f(0f, 0f, 0f, 1f);
			font.render(challengeText);
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
