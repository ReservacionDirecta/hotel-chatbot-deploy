const { Client } = require('pg');

// Configuración de la conexión
const client = new Client({
  user: 'hotel_user',
  host: 'localhost',
  database: 'hotel_chatbot',
  password: 'Chmb@2025',
  port: 5432,
});

// Conectar a la base de datos
client.connect()
  .then(() => {
    console.log('Conexión exitosa a la base de datos PostgreSQL');
    return client.query('SELECT current_user, current_database()');
  })
  .then(res => {
    console.log('Resultado de la consulta:');
    console.log(res.rows[0]);
    client.end();
  })
  .catch(err => {
    console.error('Error al conectar a la base de datos:', err);
    client.end();
  }); 