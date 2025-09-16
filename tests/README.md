# 🎬 Hostreamly - Sistema de Testing Automatizado

Este directorio contiene un sistema completo de testing automatizado que simula el comportamiento de usuarios reales para encontrar errores y problemas de rendimiento en la aplicación Hostreamly.

## 🎯 Objetivo

El sistema de testing está diseñado para:
- **Simular usuarios reales** navegando por la aplicación
- **Detectar errores automáticamente** en JavaScript, red y UI
- **Medir rendimiento** y identificar cuellos de botella
- **Generar reportes detallados** con screenshots y métricas
- **Probar funcionalidades críticas** como autenticación y editor de video

## 📁 Estructura de Archivos

```
tests/
├── auth-flow.spec.ts           # Pruebas de autenticación
├── video-editor.spec.ts        # Pruebas del editor de video
├── full-navigation.spec.ts     # Simulación completa de usuario
├── performance.spec.ts         # Métricas de rendimiento
├── user-simulation-bot.spec.ts # Bot avanzado de simulación
├── utils/
│   └── test-reporter.ts        # Reporter personalizado
└── README.md                   # Esta documentación
```

## 🚀 Inicio Rápido

### 1. Preparación

```bash
# Asegúrate de que el servidor de desarrollo esté ejecutándose
npm run dev

# En otra terminal, ejecuta los tests
npm run test:all
```

### 2. Comandos Disponibles

```bash
# Ejecutar todos los tests
npm run test:all

# Ejecutar con interfaz gráfica
npm run test:all:headed

# Ejecutar suite específica
npm run test:auth          # Solo autenticación
npm run test:editor        # Solo editor de video
npm run test:performance   # Solo rendimiento
npm run test:navigation    # Solo navegación completa
npm run test:bot          # Solo bot de simulación

# Herramientas de desarrollo
npm run test:ui           # Interfaz gráfica de Playwright
npm run test:debug        # Modo debug
npm run test:report       # Ver último reporte
```

## 🤖 Suites de Testing

### 1. **Autenticación** (`auth-flow.spec.ts`)
- ✅ Registro de nuevos usuarios
- ✅ Login con credenciales válidas/inválidas
- ✅ Validación de formularios
- ✅ Redirecciones post-autenticación
- ✅ Logout y limpieza de sesión

### 2. **Editor de Video** (`video-editor.spec.ts`)
- ✅ Carga de componentes del editor
- ✅ Interacción con herramientas de edición
- ✅ Funcionalidad del timeline
- ✅ Biblioteca de medios
- ✅ Sistema de exportación
- ✅ Plantillas predefinidas
- ✅ Responsividad del editor

### 3. **Navegación Completa** (`full-navigation.spec.ts`)
- ✅ Flujo completo de usuario (registro → edición)
- ✅ Exploración del dashboard
- ✅ Navegación entre páginas
- ✅ Pruebas de responsividad
- ✅ Detección de enlaces rotos
- ✅ Verificaciones de accesibilidad

### 4. **Rendimiento** (`performance.spec.ts`)
- ✅ Métricas de carga de páginas
- ✅ Tiempo de respuesta de interacciones
- ✅ Uso de memoria y recursos
- ✅ Análisis de requests de red
- ✅ Rendimiento en diferentes dispositivos
- ✅ Detección de memory leaks

### 5. **Bot de Simulación** (`user-simulation-bot.spec.ts`)
- ✅ Simulación avanzada de comportamiento humano
- ✅ Generación de datos de prueba realistas
- ✅ Flujos de trabajo complejos
- ✅ Pruebas de estabilidad prolongadas
- ✅ Detección automática de errores

## 📊 Sistema de Reportes

El sistema genera múltiples tipos de reportes:

### 1. **Reporte HTML** 📄
- Interfaz visual con gráficos
- Screenshots de errores
- Métricas de rendimiento
- Análisis de tendencias

### 2. **Reporte JSON** 📋
- Datos estructurados para análisis
- Integración con herramientas externas
- Histórico de ejecuciones

### 3. **Reporte de Consola** 💻
- Resumen inmediato en terminal
- Errores y advertencias destacados
- Recomendaciones automáticas

### 4. **Archivos Generados**
```
test-results/
├── hostreamly-report.html      # Reporte visual principal
├── hostreamly-report.json      # Datos estructurados
├── execution-summary.json      # Resumen de ejecución
├── screenshots/                # Capturas de errores
└── videos/                     # Grabaciones de tests
```

## 🔧 Configuración Avanzada

### Personalizar Tests

```typescript
// Ejemplo: Agregar nuevo test
test('Mi nueva funcionalidad', async ({ page }) => {
  await page.goto('/mi-pagina');
  await page.waitForLoadState('networkidle');
  
  // Tu lógica de testing aquí
  expect(await page.locator('.mi-elemento').isVisible()).toBe(true);
});
```

### Configurar Navegadores

```bash
# Ejecutar en Firefox
npm run test:all -- --browser=firefox

# Ejecutar en WebKit (Safari)
npm run test:all -- --browser=webkit

# Ejecutar en todos los navegadores
npm run test
```

### Variables de Entorno

```bash
# Configurar URL base
BASE_URL=http://localhost:3000 npm run test:all

# Configurar timeouts
TEST_TIMEOUT=30000 npm run test:all

# Modo headless
HEADLESS=false npm run test:all
```

## 🐛 Detección de Errores

El sistema detecta automáticamente:

### Errores de JavaScript
- Excepciones no capturadas
- Errores de sintaxis
- Referencias undefined
- Problemas de async/await

### Errores de Red
- Requests fallidos (4xx, 5xx)
- Timeouts de conexión
- Recursos no encontrados
- CORS issues

### Errores de UI
- Elementos no encontrados
- Layouts rotos
- Problemas de responsividad
- Contraste y accesibilidad

### Problemas de Rendimiento
- Tiempos de carga lentos (>5s)
- Memory leaks
- CPU usage alto
- Recursos grandes (>1MB)

## 📈 Métricas de Calidad

El sistema calcula un **Health Score** basado en:
- ✅ **Tasa de éxito de tests** (50%)
- ⚡ **Rendimiento promedio** (25%)
- 🐛 **Cantidad de errores** (15%)
- 🎯 **Cobertura funcional** (10%)

### Interpretación de Scores
- **90-100**: Excelente calidad
- **80-89**: Buena calidad
- **70-79**: Calidad aceptable
- **60-69**: Necesita mejoras
- **<60**: Requiere atención urgente

## 🔄 Integración Continua

### GitHub Actions
```yaml
# .github/workflows/tests.yml
name: Tests Automatizados
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:all
      - uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### Hooks de Git
```bash
# Pre-commit hook
#!/bin/sh
npm run test:auth || exit 1
```

## 🛠️ Solución de Problemas

### Problemas Comunes

**❌ "Servidor no disponible"**
```bash
# Solución: Iniciar servidor de desarrollo
npm run dev
```

**❌ "Tests muy lentos"**
```bash
# Solución: Ejecutar en paralelo
npm run test -- --workers=4
```

**❌ "Elementos no encontrados"**
```bash
# Solución: Aumentar timeouts
npm run test -- --timeout=60000
```

**❌ "Memory leaks detectados"**
```bash
# Solución: Ejecutar tests individuales
npm run test:auth
npm run test:editor
```

### Debug Avanzado

```bash
# Ejecutar con debug completo
DEBUG=pw:* npm run test:debug

# Generar trace detallado
npm run test -- --trace=on

# Ejecutar test específico
npm run test -- --grep="nombre del test"
```

## 📚 Recursos Adicionales

- [Documentación de Playwright](https://playwright.dev/)
- [Guía de Testing de React](https://testing-library.com/docs/react-testing-library/intro/)
- [Best Practices de E2E Testing](https://playwright.dev/docs/best-practices)

## 🤝 Contribuir

Para agregar nuevos tests:

1. Crea un nuevo archivo `.spec.ts` en `/tests`
2. Sigue la estructura de los tests existentes
3. Agrega el test al script `run-tests.js`
4. Actualiza esta documentación
5. Ejecuta `npm run test:all` para verificar

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en `test-results/`
2. Ejecuta `npm run test:debug` para más detalles
3. Consulta la documentación de Playwright
4. Abre un issue en el repositorio

---

**¡Happy Testing! 🐰✨**