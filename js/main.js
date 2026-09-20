// Diccionario de textos e información de la pieza
const translations = {
  qu: {
    title: "Quinua Mawk'a Wasin 3D",
    infoCruz: "Cruz apamuy: Kay cruzqa wasikunapa qatampim churanakun amachasqa kanampaq."
  },
  es: {
    title: "Museo Digital de Quinua 3D",
    infoCruz: "Cruz techada: Esta cruz se coloca en los tejados de las casas como símbolo de protección."
  },
  en: {
    title: "Quinua Digital Museum 3D",
    infoCruz: "Roof Cross: This cross is placed on rooftops as a symbol of protection."
  }
};

// Función para cambiar de idioma dinámicamente
function changeLanguage(lang) {
  if (translations[lang]) {
    document.querySelector('header h1').textContent = translations[lang].title;
    document.getElementById('info-cruz').textContent = translations[lang].infoCruz;
  }
}

// Establecer idioma inicial por defecto
document.addEventListener('DOMContentLoaded', () => {
  changeLanguage('es');
});