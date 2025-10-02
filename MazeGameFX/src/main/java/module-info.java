module com.example.mazegamefx {
    requires javafx.controls;
    requires javafx.fxml;

    requires com.almasb.fxgl.all;

    opens com.example.mazegamefx to javafx.fxml;
    exports com.example.mazegamefx;
}