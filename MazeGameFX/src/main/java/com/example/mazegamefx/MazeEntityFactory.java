package com.example.mazegamefx;

import com.almasb.fxgl.dsl.FXGL;
import com.almasb.fxgl.entity.Entity;
import com.almasb.fxgl.entity.EntityFactory;
import com.almasb.fxgl.entity.SpawnData;
import com.almasb.fxgl.entity.Spawns;
import com.almasb.fxgl.entity.components.CollidableComponent;
import javafx.scene.paint.Color;
import javafx.scene.shape.Rectangle;
import javafx.scene.text.Text;

public class MazeEntityFactory implements EntityFactory {

    @Spawns("player")
    public Entity newPlayer(SpawnData data) {
        return FXGL.entityBuilder(data)
                .type(EntityType.PLAYER)
                .viewWithBBox(new Rectangle(36, 36, Color.BLUE))
                .with(new CollidableComponent(true))
                .build();
    }

    @Spawns("enemy")
    public Entity newEnemy(SpawnData data) {
        return FXGL.entityBuilder(data)
                .type(EntityType.ENEMY)
                .viewWithBBox(new Rectangle(36, 36, Color.RED))
                .with(new CollidableComponent(true))
                .build();
    }

    @Spawns("wall")
    public Entity newWall(SpawnData data) {
        return FXGL.entityBuilder(data)
                .type(EntityType.WALL)
                .viewWithBBox(new Rectangle(40, 40, Color.DARKBLUE))
                .with(new CollidableComponent(true))
                .build();
    }

    @Spawns("exit")
    public Entity newExit(SpawnData data) {
        return FXGL.entityBuilder(data)
                .type(EntityType.EXIT)
                .view(new Rectangle(36, 36, Color.GREEN))
                .with(new CollidableComponent(true))
                .build();
    }
}