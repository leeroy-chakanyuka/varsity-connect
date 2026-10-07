package com.varsityconnect;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class VarsityConnectApplication {

  /* keep this thin, composition lives in feature packages */

  public static void main(String[] args) {
    SpringApplication.run(VarsityConnectApplication.class, args);
  }
}
