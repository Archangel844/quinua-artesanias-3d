// Diccionario de textos e información de la pieza
const translations = {
  qu: {
    title: "Quinua Mawk'a Wasin 3D",
    infoCruz: "Cruz apamuy: Kay cruzqa wasikunapa qatampim churanakun amachasqa kanampaq.",
    audioSrc: "assets/audio/desc_qu.m4a"
  },
  es: {
    title: "Museo Digital de Quinua 3D",
    infoCruz: "Cruz techada: Esta cruz se coloca en los tejados de las casas como símbolo de protección.",
    audioSrc: "assets/audio/desc_es.m4a"
  },
  en: {
    title: "Quinua Digital Museum 3D",
    infoCruz: "Roof Cross: This cross is placed on rooftops as a symbol of protection.",
    audioSrc: "assets/audio/desc_en.m4a"
  }
};

let currentAudio = null;

// Función para cambiar de idioma y reproducir audio narrativo
function changeLanguage(lang) {
  if (translations[lang]) {
    // Cambiar texto en pantalla
    document.querySelector('header h1').textContent = translations[lang].title;
    document.getElementById('info-cruz').textContent = translations[lang].infoCruz;

    // Detener audio anterior si se está reproduciendo
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    // Reproducir nuevo audio si existe el archivo
    if (translations[lang].audioSrc) {
      currentAudio = new Audio(translations[lang].audioSrc);
      currentAudio.play().catch(error => console.log("Esperando interacción del usuario para reproducir audio."));
    }
  }
}

// Establecer idioma inicial por defecto
document.addEventListener('DOMContentLoaded', () => {
  changeLanguage('es');
});