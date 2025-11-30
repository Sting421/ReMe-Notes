# Use Maven image to build the project (multi-stage)
FROM maven:3.9.4-eclipse-temurin-17 AS builder
WORKDIR /app

# Only copy mvn wrapper and pom first for better caching
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw

# Copy source and build
COPY src ./src
RUN ./mvnw -B -DskipTests package

# Runtime image with smaller footprint
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy jar produced by the build stage
COPY --from=builder /app/target/*.jar ./app.jar

# Expose default Spring Boot port
EXPOSE 8080

# Allow passing java options via environment
ENV JAVA_OPTS=""

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
