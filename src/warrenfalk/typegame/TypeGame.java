package warrenfalk.typegame;

import java.awt.Font;
import java.awt.FontFormatException;
import java.awt.event.MouseEvent;
import java.awt.font.FontRenderContext;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;

import org.lwjgl.font.demos.Trackball;
import org.lwjgl.font.glfont.FTFont;
import org.lwjgl.font.glfont.FTGLPolygonFont;
import org.lwjgl.opengl.Display;
import org.lwjgl.opengl.DisplayMode;
import org.lwjgl.opengl.GL11;
import org.lwjgl.opengl.PixelFormat;

public class TypeGame {

	public static Trackball trackball = new Trackball();

	public static void main(String[] args) throws Exception {
		int width = 1066;
		int height = 600;

		PixelFormat pf = new PixelFormat(8, 16, 8, 16);
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
		GL11.glFrustum(left, right, bottom, top, 40f, 1000f);
		// GL11.glOrtho(left, right, top, bottom, 1, -1);
		GL11.glMatrixMode(GL11.GL_MODELVIEW);

		Font f = loadFont("/fonts/Comfortaa-Regular.ttf", 60);
		FontRenderContext fcontext = FTFont.STANDARDCONTEXT;
		// FTFont font = new FTGLExtrdFont(f, fcontext);
		FTFont font = new FTGLPolygonFont(f, fcontext);

		FloatBuffer fb = ByteBuffer.allocateDirect(16 * 4)
				.order(ByteOrder.LITTLE_ENDIAN).asFloatBuffer();
		trackball.tbInit(MouseEvent.BUTTON1);
		trackball.tbReshape(width, height);

		while (true) {
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
			GL11.glColor4f(0.7f, 0.7f, 0.7f, 1f);
			GL11.glVertex2f(1f, 1f);
			GL11.glVertex2f(-1f, 1f);
			GL11.glEnd();
			GL11.glMatrixMode(GL11.GL_MODELVIEW);
			GL11.glPopMatrix();
			GL11.glMatrixMode(GL11.GL_PROJECTION);
			GL11.glPopMatrix();

			// begin scene
			GL11.glPushMatrix();
			trackball.tbMatrix(fb);
			GL11.glMultMatrix(fb);

			// text
			GL11.glColor4f(0f, 0f, 0f, 1f);
			GL11.glScalef(14f, -14f, 1f);
			// GL11.glRotatef(0f, 1f, 0f, 0f);
			GL11.glTranslatef(-400f, 0, -900f);
			font.render("a bird in the hand is worth two in the bush");

			// end scene
			GL11.glPopMatrix();

			Display.update();
			Display.sync(60);

			if (Display.isCloseRequested()) {
				Display.destroy();
				System.exit(0);
			}
		}
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
