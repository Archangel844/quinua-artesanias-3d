const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Asegurar carpetas de assets
const modelsDir = path.join(__dirname, 'assets', 'models');
const imagesDir = path.join(__dirname, 'assets', 'images');
if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'modelo_glb_file') {
      cb(null, modelsDir);
    } else {
      cb(null, imagesDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// Middleware seguro para uploads
const uploadHandler = (req, res, next) => {
  upload.fields([
    { name: 'modelo_glb_file', maxCount: 1 },
    { name: 'imagen_file', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      console.log('Multer note:', err.message);
    }
    next();
  });
};

// Probar conexión DB
pool.getConnection()
  .then(connection => {
    console.log('Conexión a MySQL (quinua_3d_db) exitosa');
    connection.release();
  })
  .catch(err => {
    console.error('Error conectando a MySQL:', err.message);
  });

// --- RUTAS DE AUTENTICACIÓN ---

app.post('/api/auth/register', async (req, res, next) => {
  const { nombre, email, password, especialidad, rol, telefono, direccion_quinua, ubicacion_maps, biografia } = req.body;

  try {
    const [exist] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (exist.length > 0) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = rol || 'artesano';
    const mapsUrl = ubicacion_maps || 'https://www.google.com/maps/search/?api=1&query=Quinua+Ayacucho+Peru';

    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, especialidad, rol, telefono, direccion_quinua, ubicacion_maps, biografia) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, email, hashedPassword, especialidad || null, userRole, telefono || null, direccion_quinua || 'Pueblo Histórico de Quinua', mapsUrl, biografia || null]
    );

    res.status(201).json({ 
      message: `${userRole === 'turista' ? 'Turista' : 'Artesano'} registrado exitosamente`, 
      userId: result.insertId 
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const [users] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET || 'secreto_quinua_3d',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { 
        id: user.id, 
        nombre: user.nombre, 
        email: user.email, 
        especialidad: user.especialidad,
        rol: user.rol,
        telefono: user.telefono,
        direccion_quinua: user.direccion_quinua,
        ubicacion_maps: user.ubicacion_maps,
        biografia: user.biografia
      }
    });
  } catch (error) {
    next(error);
  }
});

app.put('/api/artesanos/perfil/:id', async (req, res, next) => {
  const { id } = req.params;
  const { direccion_quinua, ubicacion_maps, biografia, telefono, especialidad } = req.body;

  try {
    await pool.query(
      `UPDATE usuarios SET direccion_quinua = ?, ubicacion_maps = ?, biografia = ?, telefono = ?, especialidad = ? WHERE id = ?`,
      [direccion_quinua, ubicacion_maps, biografia, telefono, especialidad, id]
    );

    const [updated] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    res.json({ message: 'Perfil actualizado con éxito', user: updated[0] });
  } catch (error) {
    next(error);
  }
});

app.get('/api/artesanos/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const [users] = await pool.query(
      'SELECT id, nombre, email, especialidad, rol, telefono, direccion_quinua, ubicacion_maps, biografia, creado_en FROM usuarios WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Artesano no encontrado' });
    }

    const [artesanias] = await pool.query(
      'SELECT * FROM artesanias WHERE artesano_id = ? AND estado = "aprobado" ORDER BY creado_en DESC',
      [id]
    );

    res.json({ artesano: users[0], obras: artesanias });
  } catch (error) {
    next(error);
  }
});

// --- RUTAS DE ARTESANÍAS ---

app.get('/api/artesanias', async (req, res, next) => {
  try {
    const [artesanias] = await pool.query(`
      SELECT a.*, 
             u.nombre AS artesano_nombre,
             u.direccion_quinua AS artesano_direccion,
             u.ubicacion_maps AS artesano_maps,
             u.especialidad AS artesano_especialidad
      FROM artesanias a 
      LEFT JOIN usuarios u ON a.artesano_id = u.id 
      WHERE a.estado = 'aprobado'
      ORDER BY a.creado_en DESC
    `);
    res.json(artesanias);
  } catch (error) {
    next(error);
  }
});

app.get('/api/artesanias/mis-obras/:artesano_id', async (req, res, next) => {
  const { artesano_id } = req.params;
  try {
    const [artesanias] = await pool.query(
      'SELECT * FROM artesanias WHERE artesano_id = ? ORDER BY creado_en DESC',
      [artesano_id]
    );
    res.json(artesanias);
  } catch (error) {
    next(error);
  }
});

app.post('/api/artesanias/publicar', uploadHandler, async (req, res, next) => {
  try {
    const { 
      titulo, descripcion_es, descripcion_qu, 
      artesano_id, alto_cm, ancho_cm, fondo_cm, precio,
      modelo_glb_nombre, imagen_url_nombre 
    } = req.body || {};

    let finalGlb = modelo_glb_nombre || 'iglesia_quinua.glb';
    let finalImagen = imagen_url_nombre || null;

    if (req.files) {
      if (req.files.modelo_glb_file && req.files.modelo_glb_file[0]) {
        finalGlb = req.files.modelo_glb_file[0].filename;
      }
      if (req.files.imagen_file && req.files.imagen_file[0]) {
        finalImagen = req.files.imagen_file[0].filename;
      }
    }

    const [result] = await pool.query(
      `INSERT INTO artesanias 
        (titulo, descripcion_es, descripcion_qu, modelo_glb, imagen_url, artesano_id, alto_cm, ancho_cm, fondo_cm, precio, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
      [
        titulo || 'Obra Sin Título', 
        descripcion_es || '', 
        descripcion_qu || '', 
        finalGlb, 
        finalImagen, 
        artesano_id || 1, 
        parseFloat(alto_cm) || 0.00, 
        parseFloat(ancho_cm) || 0.00, 
        parseFloat(fondo_cm) || 0.00, 
        parseFloat(precio) || 0.00
      ]
    );

    res.status(201).json({ 
      message: 'Artesanía enviada a revisión exitosamente. El administrador la verificará pronto.', 
      artesaniaId: result.insertId 
    });
  } catch (error) {
    next(error);
  }
});

// --- RUTAS DE ADMINISTRACIÓN ---

app.get('/api/admin/pendientes', async (req, res, next) => {
  try {
    const [pendientes] = await pool.query(`
      SELECT a.*, u.nombre AS artesano_nombre, u.email AS artesano_email 
      FROM artesanias a 
      LEFT JOIN usuarios u ON a.artesano_id = u.id 
      WHERE a.estado = 'pendiente'
      ORDER BY a.creado_en ASC
    `);
    res.json(pendientes);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/artesanias/:id/estado', async (req, res, next) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!['aprobado', 'rechazado'].includes(estado)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }

  try {
    await pool.query('UPDATE artesanias SET estado = ? WHERE id = ?', [estado, id]);
    res.json({ message: `Artesanía marcada como ${estado} exitosamente` });
  } catch (error) {
    next(error);
  }
});

// --- RUTAS DE COMPRAS Y PAGOS (TURISTAS) ---

app.post('/api/compras', async (req, res, next) => {
  const { turista_id, artesania_id, monto, metodo_pago, referencia_pago } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO compras (turista_id, artesania_id, monto, metodo_pago, referencia_pago, estado_pago) 
       VALUES (?, ?, ?, ?, ?, 'completado')`,
      [turista_id || null, artesania_id, monto, metodo_pago || 'yape', referencia_pago]
    );

    res.status(201).json({ 
      message: '¡Pago registrado exitosamente! El artesano procesará tu envío.',
      compraId: result.insertId 
    });
  } catch (error) {
    next(error);
  }
});

// Manejador global de errores JSON
app.use((err, req, res, next) => {
  console.error('Express Error caught:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor backend escuchando en http://0.0.0.0:${PORT}`);
});