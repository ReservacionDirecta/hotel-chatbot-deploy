-- Asegurar que el usuario hotel_user tenga la contraseña correcta
ALTER USER hotel_user WITH PASSWORD 'password';

-- Asegurar que el usuario hotel_user tenga los permisos adecuados para la base de datos hotel_chatbot
GRANT ALL PRIVILEGES ON DATABASE hotel_chatbot TO hotel_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hotel_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hotel_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO hotel_user; 