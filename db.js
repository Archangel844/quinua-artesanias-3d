const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quinua_3d_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 2000
});

// Datos en memoria de respaldo cuando MySQL no esté disponible (ej: Replit sin MySQL)
const mockData = {
  usuarios: [
    { 
      id: 1, 
      nombre: 'Administrador Quinua', 
      email: 'admin@quinua.pe', 
      password: '$2a$10$wE9l13G08m/n1Y1mXn1GzeXwO1Q0vW91O0O.Y.X.X.X.X', 
      rol: 'admin', 
      especialidad: 'Administración General', 
      direccion_quinua: 'Plaza de Armas S/N, Quinua', 
      ubicacion_maps: 'https://www.google.com/maps/search/?api=1&query=Plaza+de+Armas+Quinua+Ayacucho',
      biografia: 'Administración y moderación del Museo Digital Quinua 3D'
    },
    { 
      id: 2, 
      nombre: 'Taller Familia Lope', 
      email: 'tallerlope@quinua.pe', 
      password: '$2a$10$wE9l13G08m/n1Y1mXn1GzeXwO1Q0vW91O0O.Y.X.X.X.X', 
      rol: 'artesano', 
      especialidad: 'Iglesias Tradicionales y Toritos', 
      direccion_quinua: 'Jr. Sucre N° 102, Pueblo Histórico de Quinua, Ayacucho', 
      ubicacion_maps: 'https://www.google.com/maps/search/?api=1&query=Quinua+Ayacucho+Peru',
      biografia: 'Maestro ceramista con más de 20 años de experiencia en alfarería quinuela tradicional.'
    }
  ],
  artesanias: [
    { 
      id: 1, 
      titulo: 'Iglesia Techada de Quinua', 
      descripcion_es: 'Cruz techada: Esta cruz se coloca en los tejados de las casas como símbolo de protección en las viviendas de Quinua.', 
      descripcion_qu: 'Maki rurasqa quinua iglesiacha protectora', 
      modelo_glb: 'iglesia_quinua.glb', 
      imagen_url: null, 
      artesano_id: 2, 
      alto_cm: 25.00, 
      ancho_cm: 15.00, 
      fondo_cm: 12.00, 
      precio: 85.00, 
      estado: 'aprobado', 
      artesano_nombre: 'Taller Familia Lope' 
    },
    { 
      id: 2, 
      titulo: 'Torito de Quinua Tradicional', 
      descripcion_es: 'Símbolo de fuerza, fecundidad y abundancia en la cultura andina.', 
      descripcion_qu: 'Torito maki rurasqa quinua marka', 
      modelo_glb: 'iglesia_quinua.glb', 
      imagen_url: null, 
      artesano_id: 2, 
      alto_cm: 30.00, 
      ancho_cm: 18.00, 
      fondo_cm: 14.00, 
      precio: 120.00, 
      estado: 'aprobado', 
      artesano_nombre: 'Taller Familia Lope' 
    }
  ],
  compras: []
};

// Ejecutor seguro de consultas (Intenta MySQL primero; si no conecta, usa Mock DB)
async function safeQuery(sql, params = []) {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.message.includes('connect')) {
      return handleMockQuery(sql, params);
    }
    throw err;
  }
}

function handleMockQuery(sql, params) {
  const cleanSql = sql.trim().toLowerCase();
  
  if (cleanSql.includes('from usuarios') && cleanSql.includes('email =')) {
    const email = params[0];
    const match = mockData.usuarios.filter(u => u.email.toLowerCase() === (email || '').toLowerCase());
    return [match];
  }
  
  if (cleanSql.includes('from usuarios') && cleanSql.includes('id =')) {
    const id = parseInt(params[0]);
    const match = mockData.usuarios.filter(u => u.id === id);
    return [match];
  }
  
  if (cleanSql.includes('insert into usuarios')) {
    const newUser = {
      id: mockData.usuarios.length + 1,
      nombre: params[0],
      email: params[1],
      password: params[2],
      especialidad: params[3],
      rol: params[4] || 'artesano',
      telefono: params[5] || null,
      direccion_quinua: params[6] || 'Pueblo Histórico de Quinua',
      ubicacion_maps: params[7] || 'https://www.google.com/maps/search/?api=1&query=Quinua+Ayacucho',
      biografia: params[8] || ''
    };
    mockData.usuarios.push(newUser);
    return [{ insertId: newUser.id }];
  }
  
  if (cleanSql.includes('from artesanias') && cleanSql.includes("estado = 'aprobado'")) {
    return [mockData.artesanias.filter(a => a.estado === 'aprobado')];
  }
  
  if (cleanSql.includes('from artesanias') && cleanSql.includes("estado = 'pendiente'")) {
    return [mockData.artesanias.filter(a => a.estado === 'pendiente')];
  }
  
  if (cleanSql.includes('from artesanias') && cleanSql.includes('artesano_id =')) {
    const artesanoId = parseInt(params[0]);
    return [mockData.artesanias.filter(a => a.artesano_id === artesanoId)];
  }
  
  if (cleanSql.includes('insert into artesanias')) {
    const newCraft = {
      id: mockData.artesanias.length + 1,
      titulo: params[0],
      descripcion_es: params[1],
      descripcion_qu: params[2],
      modelo_glb: params[3],
      imagen_url: params[4],
      artesano_id: parseInt(params[5]),
      alto_cm: params[6],
      ancho_cm: params[7],
      fondo_cm: params[8],
      precio: params[9],
      estado: 'pendiente',
      artesano_nombre: 'Artesano de Quinua'
    };
    mockData.artesanias.push(newCraft);
    return [{ insertId: newCraft.id }];
  }

  if (cleanSql.includes('update artesanias set estado')) {
    const estado = params[0];
    const id = parseInt(params[1]);
    const item = mockData.artesanias.find(a => a.id === id);
    if (item) item.estado = estado;
    return [{ affectedRows: 1 }];
  }

  if (cleanSql.includes('insert into compras')) {
    const newCompra = { 
      id: mockData.compras.length + 1, 
      turista_id: params[0], 
      artesania_id: params[1], 
      monto: params[2], 
      metodo_pago: params[3], 
      referencia_pago: params[4] 
    };
    mockData.compras.push(newCompra);
    return [{ insertId: newCompra.id }];
  }

  return [[]];
}

module.exports = {
  getConnection: async () => {
    try {
      const conn = await pool.getConnection();
      return conn;
    } catch (e) {
      return {
        release: () => {}
      };
    }
  },
  query: safeQuery
};