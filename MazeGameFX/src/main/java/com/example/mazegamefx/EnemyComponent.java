package com.example.mazegamefx;

import com.almasb.fxgl.dsl.FXGL;
import com.almasb.fxgl.entity.Entity;
import com.almasb.fxgl.entity.component.Component;

import java.util.*;

public class EnemyComponent extends Component {

    private double moveTimer = 0;
    private static final double MOVE_INTERVAL = 0.4;
    private List<int[]> currentPath = new ArrayList<>();
    private int pathIndex = 0;

    @Override
    public void onUpdate(double tpf) {
        moveTimer += tpf;

        if (moveTimer >= MOVE_INTERVAL) {
            moveTimer = 0;
            chasePlayerWithBFS();
        }
    }

    private void chasePlayerWithBFS() {
        try {
            Entity player = FXGL.getGameWorld().getSingleton(EntityType.PLAYER);
            if (player == null) return;

            int playerCellX = (int)(player.getX() / 40);
            int playerCellY = (int)(player.getY() / 40);

            int enemyCellX = (int)(entity.getX() / 40);
            int enemyCellY = (int)(entity.getY() / 40);

            if (playerCellX == enemyCellX && playerCellY == enemyCellY) {
                return;
            }

            if (currentPath.isEmpty() || pathIndex >= currentPath.size() || moveTimer == 0) {
                currentPath = findPathBFS(enemyCellX, enemyCellY, playerCellX, playerCellY);
                pathIndex = 0;
            }

            if (!currentPath.isEmpty() && pathIndex < currentPath.size()) {
                int[] nextStep = currentPath.get(pathIndex);
                entity.setPosition(nextStep[0] * 40, nextStep[1] * 40);
                pathIndex++;
            } else {
                backupRandomMove(enemyCellX, enemyCellY);
            }

        } catch (Exception e) {
            System.out.println("Enemy BFS error: " + e.getMessage());
        }
    }

    private List<int[]> findPathBFS(int startX, int startY, int targetX, int targetY) {
        Queue<int[]> queue = new LinkedList<>();
        Map<String, int[]> parent = new HashMap<>();
        Set<String> visited = new HashSet<>();

        queue.offer(new int[]{startX, startY});
        visited.add(startX + "," + startY);
        parent.put(startX + "," + startY, null);

        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

        while (!queue.isEmpty()) {
            int[] current = queue.poll();
            int currentX = current[0];
            int currentY = current[1];

            if (currentX == targetX && currentY == targetY) {
                return reconstructPath(parent, startX, startY, targetX, targetY);
            }

            for (int[] dir : directions) {
                int newX = currentX + dir[0];
                int newY = currentY + dir[1];
                String key = newX + "," + newY;

                if (isValidMove(newX, newY) && !visited.contains(key)) {
                    visited.add(key);
                    parent.put(key, new int[]{currentX, currentY});
                    queue.offer(new int[]{newX, newY});
                }
            }
        }

        return new ArrayList<>();
    }

    private List<int[]> reconstructPath(Map<String, int[]> parent, int startX, int startY, int targetX, int targetY) {
        List<int[]> path = new ArrayList<>();
        int[] current = new int[]{targetX, targetY};

        while (current != null) {
            path.add(0, current);

            String key = current[0] + "," + current[1];
            current = parent.get(key);
        }

        if (!path.isEmpty()) {
            path.remove(0);
        }

        return path;
    }

    private void backupRandomMove(int currentX, int currentY) {
        List<int[]> possibleMoves = new ArrayList<>();
        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

        for (int[] dir : directions) {
            int newX = currentX + dir[0];
            int newY = currentY + dir[1];
            if (isValidMove(newX, newY)) {
                possibleMoves.add(new int[]{newX, newY});
            }
        }

        if (!possibleMoves.isEmpty()) {
            Random random = new Random();
            int[] randomMove = possibleMoves.get(random.nextInt(possibleMoves.size()));
            entity.setPosition(randomMove[0] * 40, randomMove[1] * 40);
        }
    }

    private boolean isValidMove(int cellX, int cellY) {
        if (cellX < 0 || cellX >= 15 || cellY < 0 || cellY >= 15) {
            return false;
        }

        return FXGL.getGameWorld().getEntitiesAt(new javafx.geometry.Point2D(cellX * 40, cellY * 40))
                .stream()
                .noneMatch(e -> e.getType() == EntityType.WALL);
    }
}