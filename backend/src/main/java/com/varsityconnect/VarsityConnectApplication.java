package com.varsityconnect;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import com.varsityconnect.config.AppProperties;

@SpringBootApplication
@EnableJpaAuditing
@EnableConfigurationProperties(AppProperties.class)
public class VarsityConnectApplication {

  /* keep this thin, composition lives in feature packages */

  public static void main(String[] args) {
    SpringApplication.run(VarsityConnectApplication.class, args);
  }
}
