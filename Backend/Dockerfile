# Stage 1: Build the application
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# Memory tuning to comfortably fit inside Render Free Tier (512MB RAM)
ENTRYPOINT ["java", "-Xmx384m", "-XX:+UseSerialGC", "-jar", "app.jar"]
