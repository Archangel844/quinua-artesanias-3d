const API_URL = 'http://localhost:3000/api';
let artesaniasData = [];
let currentUser = null;
let currentSelectedPiece = null;
let currentPublicArtesano = null;

// Estado global de Audio y Lenguaje
let currentAudio = new Audio();
let isPlaying = false;
let currentLang = 'es';
let currentAudioEs = 'assets/audio/desc_es.m4a';
let currentAudioQu = 'assets/audio/desc_qu.m4a';

// Configurar eventos del reproductor de audio
currentAudio.onended = () => {
  isPlaying = false;
  updateAudioUI(false);
};

currentAudio.onerror = (e) => {
  console.error('Error al cargar/reproducir archivo de audio:', e);
  isPlaying = false;
  updateAudioUI(false);
};

// 1. Cargar sesión guardada en localStorage
function cargarSesionUsuario() {
  const sessionData = localStorage.getItem('artesano');
  if (sessionData) {
    try {
      currentUser = JSON.parse(sessionData);
      renderHeaderSession();
    } catch (e) {
      console.error('Error parsing session data', e);
    }
  }
}

function renderHeaderSession() {
  const container = document.getElementById('user-session-actions');
  const navArtesano = document.getElementById('nav-li-artesano-panel');
  const navAdmin = document.getElementById('nav-li-admin-panel');

  if (!container) return;

  if (currentUser) {
    container.innerHTML = `
      <div class="user-badge-header">
        <i class="fa-solid fa-user"></i> ${currentUser.nombre} (${currentUser.rol === 'admin' ? 'Admin' : (currentUser.rol === 'turista' ? 'Turista' : 'Artesano')})
        <button class="btn-logout" onclick="cerrarSesion()" title="Cerrar Sesión"><i class="fa-solid fa-right-from-bracket"></i></button>
      </div>
    `;

    if (currentUser.rol === 'artesano') {
      if (navArtesano) navArtesano.style.display = 'block';
      if (navAdmin) navAdmin.style.display = 'none';
    } else if (currentUser.rol === 'admin') {
      if (navArtesano) navArtesano.style.display = 'block';
      if (navAdmin) navAdmin.style.display = 'block';
    } else {
      if (navArtesano) navArtesano.style.display = 'none';
      if (navAdmin) navAdmin.style.display = 'none';
    }
  } else {
    container.innerHTML = `
      <button class="btn-artesano" onclick="switchTab('tab-login')"><i class="fa-solid fa-user-lock"></i> Iniciar Sesión / Registro</button>
    `;
    if (navArtesano) navArtesano.style.display = 'none';
    if (navAdmin) navAdmin.style.display = 'none';
  }
}

function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('artesano');
  currentUser = null;
  renderHeaderSession();
  switchTab('tab-catalogo', document.getElementById('nav-catalogo'));
  alert('Has cerrado sesión exitosamente.');
}

// 2. Cargar artesanías APROBADAS para el Catálogo Público
async function cargarArtesanias() {
  try {
    const response = await fetch(`${API_URL}/artesanias`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    artesaniasData = await response.json();

    if (!Array.isArray(artesaniasData) || artesaniasData.length === 0) {
      throw new Error('Sin artesanías en servidor');
    }

    renderArtesaniasGrid(artesaniasData);
  } catch (error) {
    console.log('Modo Cliente/Estático: Usando artesanías precargadas localmente.');
    const defaultPieces = [
      {
        id: 1,
        titulo: "Iglesia Tradicional de Quinua",
        descripcion_es: "Réplica artesanal en cerámica del templo histórico de la Villa de Quinua, Ayacucho.",
        descripcion_qu: "Quinua llaqtamanta unay iglesiap llimp'isqa saqichanmanta wakichisqa artisanía.",
        alto_cm: 25.0, ancho_cm: 15.0, fondo_cm: 12.0,
        precio: 85.00,
        artesano_nombre: "Maestro Ceramista Mamani",
        artesano_id: 1,
        modelo_glb: "assets/models/iglesia_quinua.glb",
        imagen_url: null,
        audio_es: "assets/audio/desc_es.m4a",
        audio_qu: "assets/audio/desc_qu.m4a"
      },
      {
        id: 2,
        titulo: "Torito de Quinua Protector",
        descripcion_es: "Figura mística colocada en los techos de las casas quinuañas para la buena suerte y protección.",
        descripcion_qu: "Wasi qatapi churasqa torito, allin kawsaypaq wan amachakuypaq.",
        alto_cm: 18.0, ancho_cm: 10.0, fondo_cm: 8.0,
        precio: 65.00,
        artesano_nombre: "Artesana Faustina Flores",
        artesano_id: 2,
        modelo_glb: "assets/models/iglesia.glb",
        imagen_url: null,
        audio_es: "assets/audio/desc_es.m4a",
        audio_qu: "assets/audio/desc_qu.m4a"
      }
    ];
    artesaniasData = defaultPieces;
    renderArtesaniasGrid(artesaniasData);
  }
}

function renderArtesaniasGrid(piezas) {
  const grid = document.getElementById('catalogo-grid');
  if (!grid) return;
  grid.innerHTML = '';

  piezas.forEach(pieza => {
    const card = document.createElement('div');
    card.className = 'card card-product';
    card.onclick = () => openModelViewerDynamic(pieza);

    const imgThumb = pieza.imagen_url 
      ? (pieza.imagen_url.startsWith('assets/') ? pieza.imagen_url : `assets/images/${pieza.imagen_url}`)
      : null;

    card.innerHTML = `
      <div class="card-badge">3D / AR</div>
      ${imgThumb ? `<img src="${imgThumb}" alt="${pieza.titulo}" class="card-img-thumb" onerror="this.style.display='none'">` : '<div class="card-icon"><i class="fa-solid fa-cube"></i></div>'}
      <h3>${pieza.titulo}</h3>
      <p class="author"><i class="fa-solid fa-user-pen"></i> Por: ${pieza.artesano_nombre || 'Artesano de Quinua'}</p>
      <p class="desc">${pieza.descripcion_es || 'Cerámica tradicional en 3D'}</p>
      <p class="card-price">S/ ${(parseFloat(pieza.precio) || 85.00).toFixed(2)}</p>
      <button class="btn-view-3d"><i class="fa-solid fa-cube"></i> Ver en 3D y Comprar</button>
    `;
    grid.appendChild(card);
  });
}

// 3. Abrir la pieza seleccionada en el Visor 3D (#tab-visor-detalle)
function openModelViewer(titulo, modelSrc, desc, audioEs = 'assets/audio/desc_es.m4a', audioQu = 'assets/audio/desc_qu.m4a', artesanoNombre = 'Artesano Ceramista', artesanoId = 1, alto = 25.0, ancho = 15.0, fondo = 12.0, precio = 85.00, piezaObj = null) {
  stopAudio();
  switchTab('tab-visor-detalle');

  currentSelectedPiece = piezaObj || {
    id: 1,
    titulo,
    precio,
    artesano_id: artesanoId
  };

  // Actualizar títulos e información
  const titleElem = document.getElementById('model-title');
  if (titleElem) titleElem.textContent = titulo;

  const authorElem = document.getElementById('model-author-name');
  if (authorElem) authorElem.innerHTML = `<i class="fa-solid fa-user-pen"></i> Por: ${artesanoNombre}`;

  const descText = document.getElementById('model-description-text');
  if (descText) descText.textContent = desc;

  const infoCruz = document.getElementById('info-cruz');
  if (infoCruz) infoCruz.textContent = desc;

  // Actualizar Ficha Técnica de Medidas y Precio
  const specAlto = document.getElementById('spec-alto');
  if (specAlto) specAlto.textContent = parseFloat(alto).toFixed(1);

  const specAncho = document.getElementById('spec-ancho');
  if (specAncho) specAncho.textContent = parseFloat(ancho).toFixed(1);

  const specFondo = document.getElementById('spec-fondo');
  if (specFondo) specFondo.textContent = parseFloat(fondo).toFixed(1);

  const specPrecio = document.getElementById('spec-precio');
  if (specPrecio) specPrecio.textContent = parseFloat(precio).toFixed(2);

  // Configurar Visor <model-viewer>
  const viewer = document.getElementById('main-viewer');
  if (viewer) {
    viewer.src = modelSrc;

    const progressBar = document.getElementById('progress-bar');
    const onProgress = (event) => {
      const progress = event.detail.totalProgress;
      if (progressBar) {
        progressBar.style.width = `${progress * 100}%`;
        if (progress === 1) {
          setTimeout(() => { progressBar.style.width = '0%'; }, 500);
        }
      }
    };

    const onError = (event) => {
      console.error('Error al cargar modelo 3D:', modelSrc, event);
      if (viewer.src && !viewer.src.endsWith('iglesia_quinua.glb')) {
        console.log('Intentando modelo por defecto: assets/models/iglesia_quinua.glb');
        viewer.src = 'assets/models/iglesia_quinua.glb';
      }
    };

    if (viewer._progressHandler) viewer.removeEventListener('progress', viewer._progressHandler);
    if (viewer._errorHandler) viewer.removeEventListener('error', viewer._errorHandler);
    viewer._progressHandler = onProgress;
    viewer._errorHandler = onError;
    viewer.addEventListener('progress', onProgress);
    viewer.addEventListener('error', onError);
  }

  currentAudioEs = audioEs;
  currentAudioQu = audioQu;
}

function openModelViewerDynamic(pieza) {
  const modelSrc = pieza.modelo_glb 
    ? (pieza.modelo_glb.startsWith('assets/') ? pieza.modelo_glb : `assets/models/${pieza.modelo_glb}`)
    : 'assets/models/iglesia_quinua.glb';

  const audioEs = pieza.audio_es 
    ? (pieza.audio_es.startsWith('assets/') ? pieza.audio_es : `assets/audio/${pieza.audio_es}`)
    : 'assets/audio/desc_es.m4a';

  const audioQu = pieza.audio_qu 
    ? (pieza.audio_qu.startsWith('assets/') ? pieza.audio_qu : `assets/audio/${pieza.audio_qu}`)
    : 'assets/audio/desc_qu.m4a';

  openModelViewer(
    pieza.titulo, 
    modelSrc, 
    pieza.descripcion_es, 
    audioEs, 
    audioQu, 
    pieza.artesano_nombre || 'Artesano de Quinua',
    pieza.artesano_id || 1,
    pieza.alto_cm || 25.0,
    pieza.ancho_cm || 15.0,
    pieza.fondo_cm || 12.0,
    pieza.precio || 85.00,
    pieza
  );
}

// 4. Ver Perfil Público del Artesano (Ubicación Google Maps y Obras)
function abrirPerfilArtesanoActual() {
  if (currentSelectedPiece && currentSelectedPiece.artesano_id) {
    verPerfilArtesanoPublico(currentSelectedPiece.artesano_id);
  } else {
    verPerfilArtesanoPublico(1);
  }
}

async function verPerfilArtesanoPublico(artesanoId) {
  switchTab('tab-perfil-artesano-publico');
  try {
    const res = await fetch(`${API_URL}/artesanos/${artesanoId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    currentPublicArtesano = data.artesano;

    document.getElementById('pub-artesano-nombre').textContent = data.artesano.nombre;
    document.getElementById('pub-artesano-especialidad').innerHTML = `<i class="fa-solid fa-certificate"></i> Especialidad: ${data.artesano.especialidad || 'Cerámica Tradicional'}`;
    document.getElementById('pub-artesano-direccion').innerHTML = `<i class="fa-solid fa-location-dot"></i> Dirección: ${data.artesano.direccion_quinua || 'Pueblo Histórico de Quinua, Ayacucho'}`;
    document.getElementById('pub-artesano-bio').textContent = data.artesano.biografia || 'Maestro artesano dedicado a la preservación del arte alfarero de Quinua.';

    const grid = document.getElementById('pub-artesano-obras-grid');
    grid.innerHTML = '';

    if (data.obras && data.obras.length > 0) {
      data.obras.forEach(pieza => {
        const card = document.createElement('div');
        card.className = 'card card-product';
        card.onclick = () => openModelViewerDynamic({ ...pieza, artesano_nombre: data.artesano.nombre });

        card.innerHTML = `
          <div class="card-badge">3D</div>
          <h3>${pieza.titulo}</h3>
          <p class="desc">${pieza.descripcion_es}</p>
          <p class="card-price">S/ ${(parseFloat(pieza.precio) || 85.00).toFixed(2)}</p>
          <button class="btn-view-3d"><i class="fa-solid fa-cube"></i> Ver en 3D</button>
        `;
        grid.appendChild(card);
      });
    } else {
      grid.innerHTML = '<p class="subtitle">Este artesano aún no tiene obras publicadas.</p>';
    }
  } catch (error) {
    console.error('Error al cargar perfil de artesano:', error);
  }
}

function abrirUbicacionMapsActual() {
  if (currentPublicArtesano && currentPublicArtesano.ubicacion_maps) {
    window.open(currentPublicArtesano.ubicacion_maps, '_blank');
  } else {
    window.open('https://www.google.com/maps/search/?api=1&query=Quinua+Ayacucho+Peru', '_blank');
  }
}

// 5. Panel Privado del Artesano (Mis Obras & Publicación)
async function cargarPanelArtesano() {
  if (!currentUser) return;

  document.getElementById('priv-welcome-text').textContent = `Bienvenido/a, ${currentUser.nombre}. Gestiona tus publicaciones y estado de aprobación.`;

  // Pre-llenar formulario de edición de perfil
  if (document.getElementById('edit-direccion')) document.getElementById('edit-direccion').value = currentUser.direccion_quinua || '';
  if (document.getElementById('edit-maps')) document.getElementById('edit-maps').value = currentUser.ubicacion_maps || '';
  if (document.getElementById('edit-bio')) document.getElementById('edit-bio').value = currentUser.biografia || '';

  try {
    const res = await fetch(`${API_URL}/artesanias/mis-obras/${currentUser.id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const obras = await res.json();

    let aprobadas = 0;
    let pendientes = 0;

    const grid = document.getElementById('mis-obras-grid');
    if (!grid) return;
    grid.innerHTML = '';

    obras.forEach(pieza => {
      if (pieza.estado === 'aprobado') aprobadas++;
      else if (pieza.estado === 'pendiente') pendientes++;

      const card = document.createElement('div');
      card.className = 'card';

      const badgeClass = pieza.estado === 'aprobado' ? 'badge-aprobado' : (pieza.estado === 'pendiente' ? 'badge-pendiente' : 'badge-rechazado');
      const badgeText = pieza.estado === 'aprobado' ? 'Aprobado' : (pieza.estado === 'pendiente' ? 'En Revisión Admin' : 'Rechazado');

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <h3>${pieza.titulo}</h3>
          <span class="${badgeClass}">${badgeText}</span>
        </div>
        <p class="desc">${pieza.descripcion_es}</p>
        <p><strong>Medidas:</strong> ${pieza.alto_cm}cm x ${pieza.ancho_cm}cm x ${pieza.fondo_cm}cm</p>
        <p class="card-price">Precio: S/ ${(parseFloat(pieza.precio) || 0).toFixed(2)}</p>
        <button class="btn-view-3d" style="margin-top:10px;" onclick='openModelViewerDynamic(${JSON.stringify(pieza)})'><i class="fa-solid fa-eye"></i> Previsualizar 3D</button>
      `;
      grid.appendChild(card);
    });

    document.getElementById('stat-total-obras').textContent = obras.length;
    document.getElementById('stat-aprobadas').textContent = aprobadas;
    document.getElementById('stat-pendientes').textContent = pendientes;

  } catch (error) {
    console.error('Error al cargar panel del artesano:', error);
  }
}

// 6. Panel de Moderación de Administrador
async function cargarAdminPendientes() {
  const container = document.getElementById('admin-pendientes-list');
  if (!container) return;

  try {
    const res = await fetch(`${API_URL}/admin/pendientes`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const pendientes = await res.json();

    container.innerHTML = '';

    if (pendientes.length === 0) {
      container.innerHTML = '<p class="subtitle"><i class="fa-solid fa-circle-check" style="color:#27ae60;"></i> No hay publicaciones pendientes de aprobación.</p>';
      return;
    }

    pendientes.forEach(pieza => {
      const card = document.createElement('div');
      card.className = 'admin-card';

      card.innerHTML = `
        <div class="admin-card-info">
          <h3>${pieza.titulo}</h3>
          <p><strong>Artesano:</strong> ${pieza.artesano_nombre} (${pieza.artesano_email || 'Sin correo'})</p>
          <p><strong>Descripción:</strong> ${pieza.descripcion_es}</p>
          <p><strong>Medidas:</strong> ${pieza.alto_cm}cm x ${pieza.ancho_cm}cm x ${pieza.fondo_cm}cm | <strong>Precio:</strong> S/ ${(parseFloat(pieza.precio)||0).toFixed(2)}</p>
          <p><strong>Archivo 3D:</strong> ${pieza.modelo_glb}</p>
        </div>
        <div class="admin-actions">
          <button class="btn-approve" onclick="cambiarEstadoObra(${pieza.id}, 'aprobado')"><i class="fa-solid fa-check"></i> Aprobar</button>
          <button class="btn-reject" onclick="cambiarEstadoObra(${pieza.id}, 'rechazado')"><i class="fa-solid fa-xmark"></i> Rechazar</button>
        </div>
      `;
      container.appendChild(card);
    });

  } catch (error) {
    console.error('Error al cargar publicaciones pendientes:', error);
  }
}

async function cambiarEstadoObra(id, nuevoEstado) {
  try {
    const res = await fetch(`${API_URL}/admin/artesanias/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (res.ok) {
      alert(`Publicación ${nuevoEstado === 'aprobado' ? 'aprobada y publicada en el catálogo' : 'rechazada'}.`);
      cargarAdminPendientes();
      cargarArtesanias();
    } else {
      alert('Error al actualizar estado');
    }
  } catch (error) {
    console.error('Error en cambio de estado:', error);
  }
}

// 7. Modales de Publicación y Checkout Yape
function abrirModalPublicar() {
  const modal = document.getElementById('modal-publicar');
  if (modal) modal.style.display = 'flex';
}

function cerrarModalPublicar() {
  const modal = document.getElementById('modal-publicar');
  if (modal) modal.style.display = 'none';
}

function abrirModalYape() {
  if (!currentSelectedPiece) return;
  const modal = document.getElementById('modal-checkout');
  if (!modal) return;

  document.getElementById('checkout-title').textContent = currentSelectedPiece.titulo;
  document.getElementById('checkout-monto').textContent = `S/ ${(parseFloat(currentSelectedPiece.precio) || 85.00).toFixed(2)}`;

  modal.style.display = 'flex';
}

function cerrarModalYape() {
  const modal = document.getElementById('modal-checkout');
  if (modal) modal.style.display = 'none';
}

// 8. Control de Audio
function toggleAudio() {
  if (isPlaying) {
    currentAudio.pause();
    isPlaying = false;
    updateAudioUI(false);
  } else {
    let selectedSrc = currentAudioEs;
    if (currentLang === 'qu' && currentAudioQu) {
      selectedSrc = currentAudioQu;
    }

    const targetUrl = new URL(selectedSrc, window.location.href).href;
    if (currentAudio.src !== targetUrl) {
      currentAudio.src = selectedSrc;
    }

    currentAudio.play().then(() => {
      isPlaying = true;
      updateAudioUI(true);
    }).catch(err => {
      console.error('Error al reproducir audio:', err);
      alert('No se pudo reproducir el audio. Verifica los archivos en assets/audio/.');
    });
  }
}

function updateAudioUI(playing) {
  const btn = document.getElementById('btn-play-audio');
  const lbl = document.getElementById('lbl-audio');
  const icon = btn ? btn.querySelector('i') : null;

  if (playing) {
    if (lbl) lbl.textContent = 'Pausar Narración';
    if (icon) icon.className = 'fa-solid fa-pause';
    if (btn) btn.classList.add('playing');
  } else {
    if (lbl) lbl.textContent = 'Escuchar Narración';
    if (icon) icon.className = 'fa-solid fa-volume-high';
    if (btn) btn.classList.remove('playing');
  }
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  isPlaying = false;
  updateAudioUI(false);
}

// 9. Selector de Idiomas
function changeLanguage(lang) {
  currentLang = lang;

  const langButtons = document.querySelectorAll('.lang-selector button');
  langButtons.forEach(btn => {
    btn.classList.remove('active');
    const onclickAttr = btn.getAttribute('onclick') || '';
    if (onclickAttr.includes(`'${lang}'`)) {
      btn.classList.add('active');
    }
  });

  const audioStatus = document.getElementById('audio-status');
  if (audioStatus) {
    if (lang === 'es') audioStatus.textContent = 'Audio en Español';
    else if (lang === 'qu') audioStatus.textContent = 'Audio en Quechua';
    else if (lang === 'en') audioStatus.textContent = 'Audio en Inglés (Versión ES)';
  }

  if (isPlaying) {
    currentAudio.pause();
    isPlaying = false;
    toggleAudio();
  }
}

// 10. Filtro de Búsqueda
function filterContent() {
  const input = document.getElementById('search-input');
  if (!input) return;
  const filter = input.value.toLowerCase().trim();

  const cards = document.querySelectorAll('.grid-cards .card');
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(filter) ? '' : 'none';
  });
}

// 11. Manejo de Pestañas (Navegación del Sitio)
function switchTab(tabId, element = null) {
  stopAudio();

  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));

  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => item.classList.remove('active'));

  const activeTab = document.getElementById(tabId);
  if (activeTab) activeTab.classList.add('active');

  if (element) element.classList.add('active');

  if (tabId === 'tab-perfil-artesano-privado') {
    cargarPanelArtesano();
  } else if (tabId === 'tab-admin') {
    cargarAdminPendientes();
  }
}

// 12. Conexión de Autenticación (Login y Registro)
function switchAuthTab(mode) {
  const loginBox = document.getElementById('auth-login-box');
  const registerBox = document.getElementById('auth-register-box');
  const btnLogin = document.getElementById('btn-tab-login');
  const btnRegister = document.getElementById('btn-tab-register');

  if (mode === 'register') {
    if (loginBox) loginBox.style.display = 'none';
    if (registerBox) registerBox.style.display = 'block';
    if (btnLogin) btnLogin.classList.remove('active');
    if (btnRegister) btnRegister.classList.add('active');
  } else {
    if (loginBox) loginBox.style.display = 'block';
    if (registerBox) registerBox.style.display = 'none';
    if (btnLogin) btnLogin.classList.add('active');
    if (btnRegister) btnRegister.classList.remove('active');
  }
}

function toggleRegFields() {
  const rol = document.getElementById('reg-rol').value;
  const grpEsp = document.getElementById('group-reg-especialidad');
  const grpDir = document.getElementById('group-reg-direccion');

  if (rol === 'turista') {
    if (grpEsp) grpEsp.style.display = 'none';
    if (grpDir) grpDir.style.display = 'none';
  } else {
    if (grpEsp) grpEsp.style.display = 'flex';
    if (grpDir) grpDir.style.display = 'flex';
  }
}

async function realizarLogin(email, password) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('artesano', JSON.stringify(data.user));
      currentUser = data.user;
      renderHeaderSession();
      alert(`¡Bienvenido/a, ${data.user.nombre}!`);

      if (data.user.rol === 'admin') {
        switchTab('tab-admin', document.getElementById('nav-admin-panel'));
      } else if (data.user.rol === 'artesano') {
        switchTab('tab-perfil-artesano-privado', document.getElementById('nav-artesano-panel'));
      } else {
        switchTab('tab-catalogo', document.getElementById('nav-catalogo'));
      }
    } else {
      alert(`Error de ingreso: ${data.message}`);
    }
  } catch (error) {
    console.error('Error en login:', error);
    alert('No se pudo conectar con el servidor backend.');
  }
}

async function realizarRegistro(nombre, email, password, especialidad, rol, direccion) {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password, especialidad, rol, direccion_quinua: direccion })
    });

    const data = await res.json();

    if (res.ok) {
      alert(`¡Registro exitoso!\n${data.message || 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.'}`);
      const regForm = document.getElementById('form-register');
      if (regForm) regForm.reset();

      switchAuthTab('login');
      const loginEmail = document.getElementById('login-email');
      if (loginEmail) loginEmail.value = email;
    } else {
      alert(`Error en el registro: ${data.message || 'No se pudo registrar.'}`);
    }
  } catch (error) {
    console.error('Error en registro:', error);
    alert('No se pudo conectar con el servidor backend.');
  }
}

// Inicializar eventos al cargar el sitio
document.addEventListener('DOMContentLoaded', () => {
  cargarSesionUsuario();
  cargarArtesanias();

  // Formulario Login
  const loginForm = document.getElementById('form-login');
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      await realizarLogin(email, password);
    };
  }

  // Formulario Registro
  const regForm = document.getElementById('form-register');
  if (regForm) {
    regForm.onsubmit = async (e) => {
      e.preventDefault();
      const rol = document.getElementById('reg-rol').value;
      const nombre = document.getElementById('reg-nombre').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      const especialidad = document.getElementById('reg-especialidad').value;
      const direccion = document.getElementById('reg-direccion').value;
      await realizarRegistro(nombre, email, password, especialidad, rol, direccion);
    };
  }

  // Formulario Editar Perfil Artesano
  const profileForm = document.getElementById('form-perfil-artesano');
  if (profileForm) {
    profileForm.onsubmit = async (e) => {
      e.preventDefault();
      if (!currentUser) return;

      const direccion = document.getElementById('edit-direccion').value;
      const maps = document.getElementById('edit-maps').value;
      const bio = document.getElementById('edit-bio').value;

      try {
        const res = await fetch(`${API_URL}/artesanos/perfil/${currentUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            direccion_quinua: direccion,
            ubicacion_maps: maps,
            biografia: bio,
            especialidad: currentUser.especialidad
          })
        });

        const data = await res.json();
        if (res.ok) {
          currentUser = data.user;
          localStorage.setItem('artesano', JSON.stringify(currentUser));
          alert('Perfil actualizado con éxito');
        } else {
          alert('Error al actualizar perfil');
        }
      } catch (err) {
        console.error('Error al guardar perfil:', err);
      }
    };
  }

  // Formulario Publicar Obra en 3D
  const pubForm = document.getElementById('form-publicar-obra');
  if (pubForm) {
    pubForm.onsubmit = async (e) => {
      e.preventDefault();
      if (!currentUser) {
        alert('Debes iniciar sesión como artesano para publicar.');
        return;
      }

      const formData = new FormData();
      formData.append('titulo', document.getElementById('pub-titulo').value);
      formData.append('descripcion_es', document.getElementById('pub-desc-es').value);
      formData.append('descripcion_qu', document.getElementById('pub-desc-qu').value);
      formData.append('alto_cm', document.getElementById('pub-alto').value);
      formData.append('ancho_cm', document.getElementById('pub-ancho').value);
      formData.append('fondo_cm', document.getElementById('pub-fondo').value);
      formData.append('precio', document.getElementById('pub-precio').value);
      formData.append('artesano_id', currentUser.id);

      const glbNombreInput = document.getElementById('pub-glb-nombre').value;
      if (glbNombreInput) {
        formData.append('modelo_glb_nombre', glbNombreInput);
      }

      const fileGlb = document.getElementById('pub-glb-file').files[0];
      if (fileGlb) formData.append('modelo_glb_file', fileGlb);

      const fileImg = document.getElementById('pub-imagen-file').files[0];
      if (fileImg) formData.append('imagen_file', fileImg);

      try {
        const res = await fetch(`${API_URL}/artesanias/publicar`, {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (res.ok) {
          alert('¡Tu artesanía ha sido enviada a revisión por el administrador!');
          cerrarModalPublicar();
          pubForm.reset();
          cargarPanelArtesano();
        } else {
          alert(`Error: ${data.message || 'No se pudo registrar la obra'}`);
        }
      } catch (error) {
        console.error('Error al enviar obra:', error);
        alert('Error de conexión al enviar la obra.');
      }
    };
  }

  // Formulario Confirmar Pago Yape
  const yapeForm = document.getElementById('form-confirmar-yape');
  if (yapeForm) {
    yapeForm.onsubmit = async (e) => {
      e.preventDefault();
      const ref = document.getElementById('yape-ref').value;
      if (!currentSelectedPiece) return;

      try {
        const res = await fetch(`${API_URL}/compras`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            turista_id: currentUser ? currentUser.id : null,
            artesania_id: currentSelectedPiece.id,
            monto: currentSelectedPiece.precio || 85.00,
            metodo_pago: 'yape',
            referencia_pago: ref
          })
        });

        const data = await res.json();
        if (res.ok) {
          alert('¡Pago registrado con éxito!\nMuchas gracias por apoyar el arte tradicional de Quinua.');
          cerrarModalYape();
          yapeForm.reset();
        } else {
          alert('Error al procesar el pago.');
        }
      } catch (err) {
        console.error('Error en compra Yape:', err);
      }
    };
  }
});