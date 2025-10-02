package com.example.mazegamefx;

import com.almasb.fxgl.app.GameApplication;
import com.almasb.fxgl.app.GameSettings;
import com.almasb.fxgl.dsl.FXGL;
import com.almasb.fxgl.entity.Entity;
import javafx.scene.input.KeyCode;

import java.util.Arrays;
import java.util.Map;
import java.util.Random;

import static com.almasb.fxgl.dsl.FXGL.*;

public class MazeGameApp extends GameApplication {

    private static final int CELL_SIZE = 40;
    private static final int ROWS = 15;
    private static final int COLS = 15;

    private Entity player;
    private Entity enemy;
    private int[][] mazeData;
    private double playerMoveTimer = 0;
    private static final double PLAYER_MOVE_INTERVAL = 0.2;
    private Random random = new Random();

    @Override
    protected void initSettings(GameSettings settings) {
        settings.setTitle("Maze Escape Game - FXGL");
        settings.setVersion("1.0");
        settings.setWidth(COLS * CELL_SIZE);
        settings.setHeight(ROWS * CELL_SIZE);
    }

    @Override
    protected void initGame() {
        getGameWorld().addEntityFactory(new MazeEntityFactory());
        generateMaze();
        spawnGameEntities();
    }

    @Override
    protected void initInput() {
        onKey(KeyCode.W, "Move Up", () -> tryMovePlayer(0, -1));
        onKey(KeyCode.UP, "Move Up Alt", () -> tryMovePlayer(0, -1));

        onKey(KeyCode.S, "Move Down", () -> tryMovePlayer(0, 1));
        onKey(KeyCode.DOWN, "Move Down Alt", () -> tryMovePlayer(0, 1));

        onKey(KeyCode.A, "Move Left", () -> tryMovePlayer(-1, 0));
        onKey(KeyCode.LEFT, "Move Left Alt", () -> tryMovePlayer(-1, 0));

        onKey(KeyCode.D, "Move Right", () -> tryMovePlayer(1, 0));
        onKey(KeyCode.RIGHT, "Move Right Alt", () -> tryMovePlayer(1, 0));

        onKey(KeyCode.R, "Restart", () -> getGameController().startNewGame());
    }

    @Override
    protected void initGameVars(Map<String, Object> vars) {
        vars.put("gameOver", false);
    }

    @Override
    protected void onUpdate(double tpf) {
        playerMoveTimer += tpf;

        if (!getb("gameOver")) {
            checkCollisions();
        }
    }

    private void generateMaze() {
        mazeData = new int[ROWS][COLS];

        for (int i = 0; i < ROWS; i++) {
            Arrays.fill(mazeData[i], 1);
        }

        generateMazeDFS(1, 1);

        mazeData[ROWS-2][COLS-2] = 0;

        addSecondPath();

        for (int y = 0; y < ROWS; y++) {
            for (int x = 0; x < COLS; x++) {
                if (mazeData[y][x] == 1) {
                    spawn("wall", x * CELL_SIZE, y * CELL_SIZE);
                }
            }
        }
    }

    private void generateMazeDFS(int x, int y) {
        mazeData[y][x] = 0;

        int[][] directions = {{0, -2}, {2, 0}, {0, 2}, {-2, 0}};
        java.util.Collections.shuffle(java.util.Arrays.asList(directions));

        for (int[] dir : directions) {
            int newX = x + dir[0];
            int newY = y + dir[1];

            if (newX > 0 && newX < COLS - 1 && newY > 0 && newY < ROWS - 1 && mazeData[newY][newX] == 1) {
                mazeData[y + dir[1] / 2][x + dir[0] / 2] = 0;
                generateMazeDFS(newX, newY);
            }
        }
    }

    private void addSecondPath() {
        createAlternativePath(1, 1, COLS-2, ROWS-2);

        for (int i = 0; i < 15; i++) {
            int x = random.nextInt(COLS - 2) + 1;
            int y = random.nextInt(ROWS - 2) + 1;

            if (mazeData[y][x] == 1) {
                if (wouldCreateNewPath(x, y)) {
                    mazeData[y][x] = 0;
                }
            }
        }
    }

    private void createAlternativePath(int startX, int startY, int endX, int endY) {
        int currentX = startX;
        int currentY = startY;

        while (currentX < endX - 2) {
            currentX++;
            if (currentX < COLS && currentY < ROWS) {
                mazeData[currentY][currentX] = 0;
            }
        }

        while (currentY < endY) {
            currentY++;
            if (currentX < COLS && currentY < ROWS) {
                mazeData[currentY][currentX] = 0;
            }
        }

        while (currentX < endX) {
            currentX++;
            if (currentX < COLS && currentY < ROWS) {
                mazeData[currentY][currentX] = 0;
            }
        }

        currentX = startX;
        currentY = startY;

        while (currentY < endY - 2) {
            currentY++;
            if (currentX < COLS && currentY < ROWS) {
                mazeData[currentY][currentX] = 0;
            }
        }

        while (currentX < endX) {
            currentX++;
            if (currentX < COLS && currentY < ROWS) {
                mazeData[currentY][currentX] = 0;
            }
        }
    }

    private boolean wouldCreateNewPath(int x, int y) {
        int connectedPaths = 0;
        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

        for (int[] dir : directions) {
            int nx = x + dir[0];
            int ny = y + dir[1];

            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && mazeData[ny][nx] == 0) {
                connectedPaths++;
            }
        }

        return connectedPaths >= 2;
    }

    private void spawnGameEntities() {
        player = spawn("player", CELL_SIZE, CELL_SIZE);

        enemy = spawn("enemy", (COLS - 3) * CELL_SIZE, (ROWS - 3) * CELL_SIZE);
        enemy.addComponent(new EnemyComponent());

        spawn("exit", (COLS - 2) * CELL_SIZE, (ROWS - 2) * CELL_SIZE);
    }

    private void tryMovePlayer(int dx, int dy) {
        if (getb("gameOver") || playerMoveTimer < PLAYER_MOVE_INTERVAL) return;

        int newX = (int)(player.getX() / CELL_SIZE) + dx;
        int newY = (int)(player.getY() / CELL_SIZE) + dy;

        if (newX >= 0 && newX < COLS && newY >= 0 && newY < ROWS && mazeData[newY][newX] == 0) {
            player.setPosition(newX * CELL_SIZE, newY * CELL_SIZE);
            playerMoveTimer = 0;
            checkGameState();
        }
    }

    private void checkGameState() {
        if ((int)(player.getX() / CELL_SIZE) == COLS - 2 &&
                (int)(player.getY() / CELL_SIZE) == ROWS - 2) {
            set("gameOver", true);
            showGameOver(true);
        }
    }

    private void checkCollisions() {
        if (player == null || enemy == null) {
            return;
        }

        if (player.isColliding(enemy)) {
            set("gameOver", true);
            showGameOver(false);
        }
    }

    private void showGameOver(boolean won) {
        if (won) {
            getDialogService().showMessageBox("Congratulations! You escaped the maze!", () -> {
                getGameController().startNewGame();
            });
        } else {
            getDialogService().showMessageBox("Game Over! You were caught by the enemy!", () -> {
                getGameController().startNewGame();
            });
        }
    }

    class Point {
        int x, y;
        Point(int x, int y) { this.x = x; this.y = y; }
    }

    public static void main(String[] args) {
        launch(args);
    }
}