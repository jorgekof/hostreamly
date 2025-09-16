# Hostreamly - Plataforma de Streaming y Gestión de Videos

![Hostreamly Logo](https://hostreamly.com/logo.png)

## 🚀 Descripción del Proyecto

**Hostreamly** es una plataforma completa de streaming y gestión de videos que proporciona soluciones empresariales para la distribución de contenido multimedia. Incluye funcionalidades avanzadas de CDN, DRM, analytics en tiempo real y múltiples integraciones.

## ✨ Características Principales

- 🎥 **Gestión Completa de Videos**: Subida, edición, organización y reproducción
- 📡 **Streaming en Vivo**: Transmisiones en tiempo real con Agora
- 🌐 **CDN Global**: Distribución mundial con Bunny.net
- 🔒 **Protección DRM**: Sistema avanzado de protección de contenido
- 📊 **Analytics Avanzadas**: Métricas detalladas y reportes en tiempo real
- 🔗 **API RESTful**: Documentación completa con Swagger
- 🪝 **Webhooks**: Sistema de notificaciones personalizables
- 🔌 **Integraciones**: Shopify, WordPress, Moodle, React Native

## 🏗️ Arquitectura Técnica

### Frontend
- **React 18** con TypeScript
- **Vite** como bundler
- **Tailwind CSS** + **shadcn/ui** para componentes
- **React Router** para navegación
- **React Query** para gestión de estado del servidor

### Backend
- **Node.js** + **Express.js**
- **MariaDB** con **Sequelize ORM**
- **Redis** para sesiones y caché
- **JWT** para autenticación
- **Winston** para logging
- **Helmet** + **Rate Limiting** para seguridad

### Servicios Externos
- **Bunny.net**: CDN y almacenamiento
- **Agora**: Streaming en tiempo real
- **Stripe**: Procesamiento de pagos

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js >= 16.0.0
- npm >= 8.0.0
- MariaDB >= 10.6
- Redis >= 6.0

### Instalación del Frontend

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/hostreamly.git
cd hostreamly

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus configuraciones

# Iniciar servidor de desarrollo
npm run dev
```

### Instalación del Backend

```bash
# Navegar al directorio del backend
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Ejecutar migraciones
npm run migrate

# Iniciar servidor
npm run dev
```

## 📁 Estructura del Proyecto

```
hostreamly/
├── src/                    # Frontend React
│   ├── components/         # Componentes reutilizables
│   ├── pages/             # Páginas de la aplicación
│   ├── hooks/             # Hooks personalizados
│   ├── services/          # Servicios y APIs
│   └── types/             # Definiciones de TypeScript
├── backend/               # API Node.js
│   ├── controllers/       # Controladores de rutas
│   ├── models/           # Modelos de base de datos
│   ├── routes/           # Definición de rutas
│   ├── middleware/       # Middleware personalizado
│   └── services/         # Servicios del backend
├── integrations/         # Plugins y SDKs
│   ├── shopify/         # App de Shopify
│   ├── wordpress/       # Plugin de WordPress
│   ├── moodle/          # Integración con Moodle
│   └── react-native/    # SDK móvil
├── templates/           # Plantillas HTML/CSS
└── tests/              # Tests automatizados
```

## 🔧 Scripts Disponibles

### Frontend
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run preview` - Preview del build
- `npm run test` - Ejecutar tests
- `npm run lint` - Linter de código

### Backend
- `npm run dev` - Servidor de desarrollo con nodemon
- `npm start` - Servidor de producción
- `npm run migrate` - Ejecutar migraciones
- `npm run seed` - Poblar base de datos
- `npm test` - Ejecutar tests

## 🌐 Despliegue

### Producción

1. **Frontend**: Desplegable en Vercel, Netlify o cualquier hosting estático
2. **Backend**: Compatible con Docker, AWS, DigitalOcean, etc.

### Variables de Entorno Requeridas

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hostreamly
DB_USER=usuario
DB_PASSWORD=contraseña

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Bunny.net
BUNNY_API_KEY=tu_api_key
BUNNY_LIBRARY_ID=tu_library_id

# Agora
AGORA_APP_ID=tu_app_id
AGORA_APP_CERTIFICATE=tu_certificate

# JWT
JWT_SECRET=tu_jwt_secret

# Stripe
STRIPE_PUBLIC_KEY=tu_public_key
STRIPE_SECRET_KEY=tu_secret_key
```

## 📚 Documentación

- **API Docs**: `http://localhost:3001/api/docs` (Swagger)
- **Guías de Integración**: `/integrations/`
- **Ejemplos de Uso**: `/examples/`

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

- **Email**: support@hostreamly.com
- **Documentación**: https://docs.hostreamly.com
- **Issues**: https://github.com/tu-usuario/hostreamly/issues

---

**Desarrollado con ❤️ por el equipo de Hostreamly**
