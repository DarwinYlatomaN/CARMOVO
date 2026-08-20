const categoriasDB = [
    "Todos", "Económicos", "Sedanes", "SUVs", "Pick-ups 4x4", 
    "Minivans", "Todoterreno", "Crossovers", "Furgonetas", 
    "Híbridos", "Premium / Lujo", "Eventos"
];

const autosDB = [
    // ---------------- ECONÓMICOS (5 autos) ----------------
    { id: 1, nombre: "Kia Picanto", tipo: "Hatchback Compacto", categoria: "Económicos", precio: 110.00, rating: 4.6, pasajeros: 4, caracteristicaExtra: "Económico", iconoExtra: "fa-leaf", etiqueta: "Ciudad", claseEtiqueta: "azul", imagen: "../recursos/imagenes/economicos/Kia-picanto.jpg" },
    { id: 2, nombre: "Chevrolet Spark", tipo: "Hatchback City Car", categoria: "Económicos", precio: 95.00, rating: 4.5, pasajeros: 4, caracteristicaExtra: "Gasolina", iconoExtra: "fa-gas-pump", etiqueta: "Oferta", claseEtiqueta: "naranja", imagen: "../recursos/imagenes/economicos/Chevrolet-spark.webp" },
    { id: 3, nombre: "Hyundai i10", tipo: "Hatchback Urbano", categoria: "Económicos", precio: 105.00, rating: 4.7, pasajeros: 5, caracteristicaExtra: "Mecánico", iconoExtra: "fa-gear", etiqueta: "Popular", claseEtiqueta: "verde", imagen: "../recursos/imagenes/economicos/Hyundai i10.jpg" },
    { id: 4, nombre: "Toyota Agya", tipo: "Hatchback Económico", categoria: "Económicos", precio: 115.00, rating: 4.8, pasajeros: 5, caracteristicaExtra: "Bajo Consumo", iconoExtra: "fa-leaf", etiqueta: "Confiable", claseEtiqueta: "azul", imagen: "../recursos/imagenes/economicos/Toyota-agya.jpg" },
    { id: 5, nombre: "Suzuki Celerio", tipo: "City Car", categoria: "Económicos", precio: 90.00, rating: 4.4, pasajeros: 4, caracteristicaExtra: "Súper Económico", iconoExtra: "fa-wallet", etiqueta: "Barato", claseEtiqueta: "morada", imagen: "../recursos/imagenes/economicos/Suzuki-celerio.jpg" },

    // ---------------- SEDANES (5 autos) ----------------
    { id: 6, nombre: "Toyota Yaris", tipo: "Sedán Ejecutivo", categoria: "Sedanes", precio: 140.00, rating: 4.8, pasajeros: 5, caracteristicaExtra: "Mecánico", iconoExtra: "fa-gear", etiqueta: "Más Buscado", claseEtiqueta: "naranja", imagen: "../recursos/imagenes/sedanes/Toyota-yaris.webp" },
    { id: 7, nombre: "Nissan Versa", tipo: "Sedán Amplio", categoria: "Sedanes", precio: 155.00, rating: 4.7, pasajeros: 5, caracteristicaExtra: "Automático", iconoExtra: "fa-gear", etiqueta: "Confort", claseEtiqueta: "verde", imagen: "../recursos/imagenes/sedanes/Toyota-versa.jpg" },
    { id: 8, nombre: "Kia Rio", tipo: "Sedán Deportivo", categoria: "Sedanes", precio: 145.00, rating: 4.6, pasajeros: 5, caracteristicaExtra: "Cámara Trasera", iconoExtra: "fa-camera", etiqueta: "Popular", claseEtiqueta: "azul", imagen: "../recursos/imagenes/sedanes/Kia-rio.jpg" },
    { id: 9, nombre: "Hyundai Accent", tipo: "Sedán Familiar", categoria: "Sedanes", precio: 150.00, rating: 4.7, pasajeros: 5, caracteristicaExtra: "Maletera 480L", iconoExtra: "fa-suitcase-rolling", etiqueta: "Espacioso", claseEtiqueta: "morada", imagen: "../recursos/imagenes/sedanes/Hyundai-accent.jpg" },
    { id: 10, nombre: "Mazda 3", tipo: "Sedán Premium", categoria: "Sedanes", precio: 175.00, rating: 4.9, pasajeros: 5, caracteristicaExtra: "Diseño Elegante", iconoExtra: "fa-gem", etiqueta: "Exclusivo", claseEtiqueta: "naranja", imagen: "../recursos/imagenes/sedanes/Mazda-cx5.jpg" },

    // ---------------- SUVs (5 autos) ----------------
    { id: 11, nombre: "Hyundai Tucson", tipo: "SUV Familiar", categoria: "SUVs", precio: 190.00, rating: 4.7, pasajeros: 5, caracteristicaExtra: "Automático", iconoExtra: "fa-gear", etiqueta: "Popular", claseEtiqueta: "azul", imagen: "../recursos/imagenes/SUVs/Hyundai-tuson.jpg" },
    { id: 12, nombre: "Kia Sportage", tipo: "SUV Dinámica", categoria: "SUVs", precio: 200.00, rating: 4.8, pasajeros: 5, caracteristicaExtra: "Maletera Amplia", iconoExtra: "fa-suitcase-rolling", etiqueta: "Nuevo", claseEtiqueta: "morada", imagen: "../recursos/imagenes/SUVs/Kia-sportage.jpg" },
    { id: 13, nombre: "Toyota RAV4", tipo: "SUV Todocamino", categoria: "SUVs", precio: 220.00, rating: 4.9, pasajeros: 5, caracteristicaExtra: "Tracción 4x4", iconoExtra: "fa-mountain", etiqueta: "Top Rent", claseEtiqueta: "naranja", imagen: "../recursos/imagenes/SUVs/Toyota-rav4.jpg" },
    { id: 14, nombre: "Honda CR-V", tipo: "SUV Ejecutiva", categoria: "SUVs", precio: 230.00, rating: 4.9, pasajeros: 5, caracteristicaExtra: "Asientos Cuero", iconoExtra: "fa-couch", etiqueta: "Premium", claseEtiqueta: "verde", imagen: "../recursos/imagenes/SUVs/Honda-cr-v.jpg" },
    { id: 15, nombre: "Mazda CX-5", tipo: "SUV Deportiva", categoria: "SUVs", precio: 215.00, rating: 4.8, pasajeros: 5, caracteristicaExtra: "Modo Sport", iconoExtra: "fa-flag-checkered", etiqueta: "Dinámico", claseEtiqueta: "azul", imagen: "../recursos/imagenes/SUVs/Mazda cx-5.webp" },

    // ---------------- PICK-UPS 4x4 (5 autos) ----------------
    { id: 16, nombre: "Toyota Hilux", tipo: "Pick-up / Mina", categoria: "Pick-ups 4x4", precio: 280.00, rating: 4.9, pasajeros: 5, caracteristicaExtra: "Tracción 4x4", iconoExtra: "fa-mountain", etiqueta: "Más Buscado", claseEtiqueta: "naranja", imagen: "../recursos/imagenes/pickups/Toyota-hilux.jpg" },
    { id: 17, nombre: "Ford Ranger", tipo: "Pick-up Todo Terreno", categoria: "Pick-ups 4x4", precio: 265.00, rating: 4.7, pasajeros: 5, caracteristicaExtra: "Turbo Diesel", iconoExtra: "fa-gas-pump", etiqueta: "Potencia", claseEtiqueta: "verde", imagen: "../recursos/imagenes/pickups/Ford-ranger.jpg" },
    { id: 18, nombre: "Mitsubishi L200", tipo: "Pick-up Trabajo", categoria: "Pick-ups 4x4", precio: 250.00, rating: 4.6, pasajeros: 5, caracteristicaExtra: "Mecánico", iconoExtra: "fa-gear", etiqueta: "Trabajo", claseEtiqueta: "azul", imagen: "../recursos/imagenes/pickups/Mitsubishi-l200.jpg" },
    { id: 19, nombre: "Nissan Frontier", tipo: "Pick-up Fuerte", categoria: "Pick-ups 4x4", precio: 255.00, rating: 4.7, pasajeros: 5, caracteristicaExtra: "Suspensión Reforzada", iconoExtra: "fa-shield-halved", etiqueta: "Confiable", claseEtiqueta: "morada", imagen: "../recursos/imagenes/pickups/Nissan-frontier.jpg" },
    { id: 20, nombre: "Volkswagen Amarok", tipo: "Pick-up Premium", categoria: "Pick-ups 4x4", precio: 290.00, rating: 4.8, pasajeros: 5, caracteristicaExtra: "Motor V6", iconoExtra: "fa-gauge-high", etiqueta: "Premium", claseEtiqueta: "naranja", imagen: "../recursos/imagenes/pickups/Volkswagen-amarok.webp" },

    // ---------------- MINIVANS (5 autos) ----------------
    { id: 21, nombre: "Hyundai H-1", tipo: "Minivan Turismo", categoria: "Minivans", precio: 320.00, rating: 4.8, pasajeros: 11, caracteristicaExtra: "Gran Espacio", iconoExtra: "fa-people-group", etiqueta: "Turismo", claseEtiqueta: "morada", imagen: "../recursos/imagenes/minivans/Hyundai-h1.jpg" },
    { id: 22, nombre: "Chevrolet N400", tipo: "Minivan Trabajo", categoria: "Minivans", precio: 180.00, rating: 4.5, pasajeros: 8, caracteristicaExtra: "Mecánico", iconoExtra: "fa-gear", etiqueta: "Económica", claseEtiqueta: "azul", imagen: "../recursos/imagenes/minivans/Chevrolet-n400.webp" },
    { id: 23, nombre: "Kia Carnival", tipo: "Minivan VIP", categoria: "Minivans", precio: 380.00, rating: 4.9, pasajeros: 8, caracteristicaExtra: "Asientos VIP", iconoExtra: "fa-couch", etiqueta: "Premium", claseEtiqueta: "naranja", imagen: "../recursos/imagenes/minivans/kia-carnival.jpg" },
    { id: 24, nombre: "Suzuki Ertiga", tipo: "Minivan Familiar", categoria: "Minivans", precio: 210.00, rating: 4.6, pasajeros: 7, caracteristicaExtra: "Rendidor", iconoExtra: "fa-leaf", etiqueta: "Familia", claseEtiqueta: "verde", imagen: "../recursos/imagenes/minivans/Suzuki-ertiga.jpg" },
    { id: 25, nombre: "Toyota Avanza", tipo: "Minivan Compacta", categoria: "Minivans", precio: 195.00, rating: 4.7, pasajeros: 7, caracteristicaExtra: "Motor 1.5L", iconoExtra: "fa-gas-pump", etiqueta: "Popular", claseEtiqueta: "azul", imagen: "../recursos/imagenes/minivans/Toyota-avanza.jpg" },

    // ---------------- TODOTERRENO (5 autos) ----------------
    { id: 26, nombre: "Jeep Wrangler", tipo: "Off-Road Puro", categoria: "Todoterreno", precio: 350.00, rating: 4.9, pasajeros: 5, caracteristicaExtra: "4x4 Extremo", iconoExtra: "fa-mountain", etiqueta: "Aventura", claseEtiqueta: "naranja", imagen: "../recursos/imagenes/todoTerreno/Jeep-wrangler.jpg" },
    { id: 27, nombre: "Toyota Land Cruiser", tipo: "SUV Expedición", categoria: "Todoterreno", precio: 450.00, rating: 5.0, pasajeros: 7, caracteristicaExtra: "V8 Safari", iconoExtra: "fa-gauge-high", etiqueta: "Premium", claseEtiqueta: "morada", imagen: "../recursos/imagenes/todoTerreno/Toyota-land.jpg" },
    { id: 28, nombre: "Ford Bronco", tipo: "4x4 Deportivo", categoria: "Todoterreno", precio: 400.00, rating: 4.8, pasajeros: 5, caracteristicaExtra: "G.O.A.T Modes", iconoExtra: "fa-compass", etiqueta: "Nuevo", claseEtiqueta: "azul", imagen: "../recursos/imagenes/todoTerreno/Ford-bronco.jpg" },
    { id: 29, nombre: "Mitsubishi Montero", tipo: "4x4 Clásico", categoria: "Todoterreno", precio: 320.00, rating: 4.7, pasajeros: 7, caracteristicaExtra: "Caja Reductora", iconoExtra: "fa-gear", etiqueta: "Fuerte", claseEtiqueta: "verde", imagen: "../recursos/imagenes/todoTerreno/Mitsubishi-montero.jpg" },
    { id: 30, nombre: "Nissan Patrol", tipo: "Off-Road VIP", categoria: "Todoterreno", precio: 480.00, rating: 4.9, pasajeros: 8, caracteristicaExtra: "Lujo 4x4", iconoExtra: "fa-gem", etiqueta: "Top", claseEtiqueta: "naranja", imagen: "../recursos/imagenes/todoTerreno/Nissan-patrol.jpg" },

    // ---------------- CROSSOVERS (5 autos) ----------------
    { id: 31, nombre: "Nissan Kicks", tipo: "Crossover Urbano", categoria: "Crossovers", precio: 170.00, rating: 4.6, pasajeros: 5, caracteristicaExtra: "Automático", iconoExtra: "fa-gear", etiqueta: "Urbano", claseEtiqueta: "verde", imagen: "Nissan-Kicks.png" },
    { id: 32, nombre: "Volkswagen T-Cross", tipo: "Crossover Deportivo", categoria: "Crossovers", precio: 185.00, rating: 4.7, pasajeros: 5, caracteristicaExtra: "Turbo", iconoExtra: "fa-wind", etiqueta: "Dinámico", claseEtiqueta: "azul", imagen: "VW-Tcross.png" },
    { id: 33, nombre: "Chevrolet Tracker", tipo: "Crossover Moderno", categoria: "Crossovers", precio: 175.00, rating: 4.6, pasajeros: 5, caracteristicaExtra: "Wifi Integrado", iconoExtra: "fa-wifi", etiqueta: "Tech", claseEtiqueta: "morada", imagen: "Chevrolet-Tracker.png" },
    { id: 34, nombre: "Hyundai Creta", tipo: "Crossover Amplio", categoria: "Crossovers", precio: 180.00, rating: 4.7, pasajeros: 5, caracteristicaExtra: "Cámara 360", iconoExtra: "fa-camera", etiqueta: "Popular", claseEtiqueta: "naranja", imagen: "Hyundai-Creta.png" },
    { id: 35, nombre: "Kia Seltos", tipo: "Crossover Robusto", categoria: "Crossovers", precio: 185.00, rating: 4.7, pasajeros: 5, caracteristicaExtra: "Pantalla 10\"", iconoExtra: "fa-desktop", etiqueta: "Confort", claseEtiqueta: "azul", imagen: "Kia-Seltos.png" },

    // ---------------- FURGONETAS (5 autos) ----------------
    { id: 36, nombre: "Renault Master", tipo: "Furgón de Carga", categoria: "Furgonetas", precio: 220.00, rating: 4.5, pasajeros: 3, caracteristicaExtra: "13m³ Carga", iconoExtra: "fa-box", etiqueta: "Carga", claseEtiqueta: "morada", imagen: "Renault-Master.png" },
    { id: 37, nombre: "Peugeot Boxer", tipo: "Furgón Comercial", categoria: "Furgonetas", precio: 240.00, rating: 4.6, pasajeros: 3, caracteristicaExtra: "Diesel", iconoExtra: "fa-gas-pump", etiqueta: "Trabajo", claseEtiqueta: "azul", imagen: "Peugeot-Boxer.png" },
    { id: 38, nombre: "Mercedes Sprinter", tipo: "Furgón Premium", categoria: "Furgonetas", precio: 290.00, rating: 4.8, pasajeros: 3, caracteristicaExtra: "Alta Capacidad", iconoExtra: "fa-truck-fast", etiqueta: "Top Rent", claseEtiqueta: "naranja", imagen: "Mercedes-Sprinter.png" },
    { id: 39, nombre: "Fiat Ducato", tipo: "Furgón Trabajo", categoria: "Furgonetas", precio: 230.00, rating: 4.5, pasajeros: 3, caracteristicaExtra: "Puerta Lateral", iconoExtra: "fa-door-open", etiqueta: "Práctico", claseEtiqueta: "verde", imagen: "Fiat-Ducato.png" },
    { id: 40, nombre: "Ford Transit", tipo: "Furgón Eficiente", categoria: "Furgonetas", precio: 250.00, rating: 4.7, pasajeros: 3, caracteristicaExtra: "Sensores Retro", iconoExtra: "fa-sensor", etiqueta: "Seguro", claseEtiqueta: "azul", imagen: "Ford-Transit.png" },

    // ---------------- HÍBRIDOS (5 autos) ----------------
    { id: 41, nombre: "Toyota Corolla Cross", tipo: "SUV Híbrida", categoria: "Híbridos", precio: 210.00, rating: 4.8, pasajeros: 5, caracteristicaExtra: "Eco Híbrido", iconoExtra: "fa-leaf", etiqueta: "Eco", claseEtiqueta: "verde", imagen: "Corolla-Cross.png" },
    { id: 42, nombre: "Suzuki Swift", tipo: "Hatchback Mild-Hybrid", categoria: "Híbridos", precio: 140.00, rating: 4.6, pasajeros: 5, caracteristicaExtra: "Súper Ahorro", iconoExtra: "fa-piggy-bank", etiqueta: "Ciudad", claseEtiqueta: "azul", imagen: "Suzuki-Swift.png" },
    { id: 43, nombre: "Kia Niro", tipo: "Crossover Híbrido", categoria: "Híbridos", precio: 220.00, rating: 4.7, pasajeros: 5, caracteristicaExtra: "Autocargable", iconoExtra: "fa-battery-full", etiqueta: "Tecnología", claseEtiqueta: "morada", imagen: "Kia-Niro.png" },
    { id: 44, nombre: "Toyota Prius", tipo: "Sedán Híbrido", categoria: "Híbridos", precio: 195.00, rating: 4.9, pasajeros: 5, caracteristicaExtra: "Híbrido Pionero", iconoExtra: "fa-bolt", etiqueta: "Clásico Eco", claseEtiqueta: "naranja", imagen: "Toyota-Prius.png" },
    { id: 45, nombre: "Hyundai Ioniq", tipo: "Sedán Eco", categoria: "Híbridos", precio: 205.00, rating: 4.7, pasajeros: 5, caracteristicaExtra: "Aerodinámico", iconoExtra: "fa-wind", etiqueta: "Moderno", claseEtiqueta: "azul", imagen: "Hyundai-Ioniq.png" },

    // ---------------- PREMIUM / LUJO (5 autos) ----------------
    { id: 46, nombre: "BMW Serie 3", tipo: "Sedán Deportivo", categoria: "Premium / Lujo", precio: 450.00, rating: 4.9, pasajeros: 5, caracteristicaExtra: "Cuero Premium", iconoExtra: "fa-couch", etiqueta: "Lujo", claseEtiqueta: "morada", imagen: "BMW-Serie3.png" },
    { id: 47, nombre: "Audi A4", tipo: "Sedán Ejecutivo", categoria: "Premium / Lujo", precio: 420.00, rating: 4.8, pasajeros: 5, caracteristicaExtra: "Confort VIP", iconoExtra: "fa-star", etiqueta: "Ejecutivo", claseEtiqueta: "azul", imagen: "Audi-A4.png" },
    { id: 48, nombre: "Mercedes-Benz C-Class", tipo: "Sedán Elegante", categoria: "Premium / Lujo", precio: 460.00, rating: 4.9, pasajeros: 5, caracteristicaExtra: "Techo Panorámico", iconoExtra: "fa-sun", etiqueta: "Exclusivo", claseEtiqueta: "naranja", imagen: "Mercedes-C-Class.png" },
    { id: 49, nombre: "Volvo S60", tipo: "Sedán Seguro", categoria: "Premium / Lujo", precio: 410.00, rating: 4.9, pasajeros: 5, caracteristicaExtra: "Alta Seguridad", iconoExtra: "fa-shield", etiqueta: "Seguro", claseEtiqueta: "verde", imagen: "Volvo-S60.png" },
    { id: 50, nombre: "Lexus IS", tipo: "Deportivo Híbrido Premium", categoria: "Premium / Lujo", precio: 440.00, rating: 4.8, pasajeros: 5, caracteristicaExtra: "Silencioso", iconoExtra: "fa-volume-xmark", etiqueta: "Innovador", claseEtiqueta: "morada", imagen: "Lexus-IS.png" },

    // ---------------- EVENTOS (5 autos) ----------------
    { id: 51, nombre: "Mercedes-Benz Clase E", tipo: "Auto para Bodas", categoria: "Eventos", precio: 600.00, rating: 5.0, pasajeros: 4, caracteristicaExtra: "Chófer Incluido", iconoExtra: "fa-user-tie", etiqueta: "Bodas", claseEtiqueta: "morada", imagen: "Mercedes-ClaseE.png" },
    { id: 52, nombre: "Porsche Macan", tipo: "SUV Deportiva Premium", categoria: "Eventos", precio: 650.00, rating: 5.0, pasajeros: 5, caracteristicaExtra: "Status VIP", iconoExtra: "fa-crown", etiqueta: "Exclusivo", claseEtiqueta: "naranja", imagen: "Porsche-Macan.png" },
    { id: 53, nombre: "Audi Q7", tipo: "SUV de Gala", categoria: "Eventos", precio: 550.00, rating: 4.9, pasajeros: 7, caracteristicaExtra: "3 Filas VIP", iconoExtra: "fa-users", etiqueta: "Gala", claseEtiqueta: "azul", imagen: "Audi-Q7.png" },
    { id: 54, nombre: "Range Rover Evoque", tipo: "SUV Elegante", categoria: "Eventos", precio: 580.00, rating: 4.9, pasajeros: 5, caracteristicaExtra: "Diseño Británico", iconoExtra: "fa-gem", etiqueta: "Impactante", claseEtiqueta: "verde", imagen: "Range-Rover-Evoque.png" },
    { id: 55, nombre: "Chrysler 300C", tipo: "Limusina Corta", categoria: "Eventos", precio: 500.00, rating: 4.8, pasajeros: 4, caracteristicaExtra: "Estilo Clásico", iconoExtra: "fa-champagne-glasses", etiqueta: "Matrimonios", claseEtiqueta: "morada", imagen: "Chrysler-300c.png" }
];