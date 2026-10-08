# tracker asks for this, local dev runs maven directly so it stays dormant
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# no curl in the slim image, bash tcp check is enough for the actuator port
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD bash -c 'cat < /dev/null > /dev/tcp/127.0.0.1/8080'
ENTRYPOINT ["java", "-jar", "app.jar"]
