// Variable global para almacenar los puntos de interés cargados
let puntosDeInteres = [];

/**
 * Convierte grados a radianes.
 * @param {number} grados - Ángulo en grados.
 * @returns {number} Ángulo en radianes.
 */
function gradosARadianes(grados) {
  return (grados * Math.PI) / 180;
}

/**
 * Calcula la distancia entre dos coordenadas usando la fórmula de Haversine.
 * @param {number[]} coord1 - Arreglo de coordenadas [latitud, longitud] del punto 1.
 * @param {number[]} coord2 - Arreglo de coordenadas [latitud, longitud] del punto 2.
 * @returns {number} Distancia en kilómetros.
 */
function calcularDistancia(coord1, coord2) {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = gradosARadianes(coord2[0] - coord1[0]);
  const dLon = gradosARadianes(coord2[1] - coord1[1]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(gradosARadianes(coord1[0])) *
      Math.cos(gradosARadianes(coord2[0])) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Muestra un mensaje personalizado usando SweetAlert2.
 * @param {string} icon - Icono del mensaje (e.g., 'success', 'error', 'warning', 'info').
 * @param {string} title - Título del mensaje.
 * @param {string} text - Contenido del mensaje.
 * @returns {Promise} Una promesa que resuelve cuando el usuario cierra la alerta.
 */
function mostrarSweetAlert(icon, title, text) {
  return Swal.fire({
    icon: icon,
    title: title,
    text: text,
    customClass: {
      confirmButton: "sweet-alert-button", // Clase CSS personalizada para el botón
    },
    buttonsStyling: false, // Deshabilita el estilo por defecto para usar la clase personalizada
  });
}

/**
 * Carga los puntos de interés desde el archivo data.json de forma asíncrona.
 */
async function cargarPuntosDeInteres() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) {
      throw new Error(`Error HTTP! estado: ${response.status}`);
    }
    puntosDeInteres = await response.json();
    mostrarOpcionesPuntos(); // Una vez cargados, popula el select
  } catch (error) {
    console.error("Error al cargar los puntos de interés:", error);
    mostrarSweetAlert(
      "error",
      "Error",
      "No se pudieron cargar los puntos de interés. Por favor, intente de nuevo más tarde."
    );
  }
}

/**
 * Popula el elemento <select> con los puntos de interés cargados.
 */
function mostrarOpcionesPuntos() {
  const selectPunto = document.getElementById("selectPunto");
  selectPunto.innerHTML = '<option value="">Seleccione un destino</option>'; // Limpia y añade opción por defecto

  puntosDeInteres.forEach((punto) => {
    const option = document.createElement("option");
    // Almacena las coordenadas como un string JSON en el valor de la opción
    option.value = JSON.stringify([punto.latitude, punto.longitude]);
    option.textContent = punto.name;
    selectPunto.appendChild(option);
  });
}

/**
 * Muestra el historial de cálculos guardado en localStorage.
 */
function mostrarHistorial() {
  const listaHistorial = document.getElementById("listaHistorial");
  listaHistorial.innerHTML = ""; // Limpia las entradas anteriores

  const historial = JSON.parse(localStorage.getItem("historialCalculos")) || [];

  if (historial.length === 0) {
    listaHistorial.innerHTML = "<li>No hay cálculos previos.</li>";
  } else {
    // Recorre el historial y crea un elemento <li> por cada cálculo
    historial.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `Desde (${item.latitud}, ${item.longitud}) hasta ${item.destino}: ${item.distancia} km (el ${item.fecha})`;
      listaHistorial.appendChild(li);
    });
  }
}

// Capturar elementos del DOM
const form = document.getElementById("formCoordenadas");
const ayudaBtn = document.getElementById("ayuda");

// Evento para mostrar ayuda con SweetAlert2
ayudaBtn.addEventListener("click", () => {
  mostrarSweetAlert(
    "info",
    "¿No sabes tus coordenadas?",
    "Puedes encontrarlas fácilmente en Google Maps. Haz clic con el botón derecho en cualquier lugar del mapa y verás las coordenadas en el menú contextual. ¡Cópialas y pégalas aquí!"
  ).then(() => {
    // Abre Google Maps después de que el usuario haga clic en 'OK'
    window.open("https://www.google.com/maps", "_blank");
  });
});

// Evento para calcular la distancia al enviar el formulario
form.addEventListener("submit", (e) => {
  e.preventDefault(); // Evita el envío por defecto del formulario

  const latitud = parseFloat(document.getElementById("latitud").value);
  const longitud = parseFloat(document.getElementById("longitud").value);
  const selectPunto = document.getElementById("selectPunto");
  const selectedValue = selectPunto.value;

  // Validaciones
  if (isNaN(latitud) || isNaN(longitud)) {
    mostrarSweetAlert(
      "error",
      "Error de Entrada",
      "Por favor, ingrese valores numéricos válidos para latitud y longitud."
    );
    return;
  }
  if (!selectedValue) {
    mostrarSweetAlert(
      "warning",
      "Advertencia",
      "Por favor, seleccione un destino de la lista."
    );
    return;
  }

  const coordUsuario = [latitud, longitud];
  // Parsea las coordenadas del destino de nuevo a un arreglo
  const coordenadaDestino = JSON.parse(selectedValue);

  const distancia = calcularDistancia(coordenadaDestino, coordUsuario);

  const nombreDestino = selectPunto.options[selectPunto.selectedIndex].text;

  // Mostrar resultado con SweetAlert2
  mostrarSweetAlert(
    "success",
    "¡Distancia Calculada!",
    `La distancia desde tu ubicación hasta ${nombreDestino} es de ${distancia.toFixed(
      2
    )} km.`
  );

  // Guardar cálculo en localStorage para el historial
  const datosCalculo = {
    latitud,
    longitud,
    destino: nombreDestino,
    distancia: distancia.toFixed(2),
    fecha: new Date().toLocaleString(), // Fecha y hora de la consulta
  };

  // Recupera el historial existente o crea un nuevo array si no hay
  let historial = JSON.parse(localStorage.getItem("historialCalculos")) || [];
  historial.push(datosCalculo); // Añade el nuevo cálculo al historial
  localStorage.setItem("historialCalculos", JSON.stringify(historial)); // Guarda el historial actualizado

  // Actualiza la visualización del historial
  mostrarHistorial();

  // Opcional: precargar los campos de latitud y longitud con los últimos valores usados
  localStorage.setItem("ultimaLatitud", latitud);
  localStorage.setItem("ultimaLongitud", longitud);
});

// Evento que se dispara cuando todo el DOM ha sido cargado
window.addEventListener("DOMContentLoaded", () => {
  cargarPuntosDeInteres(); // Carga los destinos al iniciar la página
  mostrarHistorial(); // Muestra el historial existente

  // Precarga los campos de latitud y longitud si hay valores guardados
  const ultimaLatitud = localStorage.getItem("ultimaLatitud");
  const ultimaLongitud = localStorage.getItem("ultimaLongitud");
  if (ultimaLatitud && ultimaLongitud) {
    document.getElementById("latitud").value = ultimaLatitud;
    document.getElementById("longitud").value = ultimaLongitud;
  }
});
