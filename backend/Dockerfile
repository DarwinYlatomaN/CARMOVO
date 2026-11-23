# =====================================================================
# CARMOVO · Imagen para desplegar en la nube (Railway, Render, etc.)
# Etapa 1: compila el proyecto con Maven.  Etapa 2: solo lo necesario para ejecutarlo.
# =====================================================================
FROM eclipse-temurin:25-jdk AS compilacion
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -B dependency:go-offline
COPY src/ src/
RUN ./mvnw -q -B -DskipTests package && cp target/*.jar app.jar

FROM eclipse-temurin:25-jre
WORKDIR /app
ENV TZ=America/Lima
COPY --from=compilacion /app/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
