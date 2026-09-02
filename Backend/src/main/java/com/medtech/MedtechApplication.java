package com.medtech;

import com.medtech.config.RenderDatabaseInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MedtechApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(MedtechApplication.class);
        app.addInitializers(new RenderDatabaseInitializer());
        app.run(args);
    }

}
