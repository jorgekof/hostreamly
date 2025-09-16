# Hostreamly - Guía de Estilo de Marca

## Identidad Visual

### Logotipo
- **Símbolo**: Icono de Play en gradiente de marca
- **Tipografía**: "Hostreamly" con gradiente índigo a cyan
- **Uso**: Siempre mantener proporciones y espaciado adecuado

### Paleta de Colores

#### Colores Primarios
- **Índigo Principal**: `#6366f1` (HSL: 239 84% 67%)
- **Cyan Acento**: `#06b6d4` (HSL: 188 95% 43%)
- **Púrpura Secundario**: `#8b5cf6`
- **Rosa Acento**: `#ec4899`

#### Colores de Soporte
- **Neutros**: Escala de grises para texto y fondos
- **Estados**: Success, Warning, Error según estándares

### Gradientes de Marca

#### Gradiente Principal
```css
background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
```

#### Gradiente Hero
```css
background: linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #06b6d4 100%);
```

#### Gradiente Video
```css
background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
```

## Tipografía

### Fuentes Principales
- **Primaria**: Inter (sans-serif)
- **Secundaria**: System fonts como fallback

### Jerarquía Tipográfica
- **H1**: 4xl-7xl, font-bold, gradiente de texto
- **H2**: 3xl-4xl, font-bold, color de marca
- **H3**: xl-2xl, font-semibold
- **Body**: base, font-normal
- **Caption**: sm, text-muted-foreground

## Componentes de UI

### Botones

#### Botón Primario
```css
.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.25);
}
```

#### Botón Secundario
```css
.btn-secondary {
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #6366f1;
  background: transparent;
}
```

### Tarjetas
- **Fondo**: Blanco con sombra sutil
- **Borde**: Gris claro, hover con color de marca
- **Transiciones**: 300ms ease-in-out
- **Hover**: Elevación y cambio de borde

### Iconos
- **Estilo**: Outline/stroke
- **Tamaño**: 16px, 20px, 24px según contexto
- **Color**: Color de marca o neutro según función

## Espaciado y Layout

### Sistema de Espaciado
- **Base**: 4px (0.25rem)
- **Escala**: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px

### Grid y Contenedores
- **Max Width**: 1200px para contenido principal
- **Padding**: 16px móvil, 24px tablet, 32px desktop
- **Gap**: 16px-32px según contexto

## Animaciones y Transiciones

### Duraciones Estándar
- **Rápida**: 150ms (hover states)
- **Normal**: 300ms (transiciones generales)
- **Lenta**: 500ms (animaciones complejas)

### Easing
- **Estándar**: `ease-in-out`
- **Entrada**: `ease-out`
- **Salida**: `ease-in`

## Modo Oscuro

### Implementación
- **Fondo**: `#0f172a` (slate-900)
- **Texto**: `#f8fafc` (slate-50)
- **Colores de marca**: Mantener saturación, ajustar luminosidad

## Aplicación en Video Hosting

### Elementos Específicos
- **Player Controls**: Usar cyan como color principal
- **Progress Bar**: Gradiente de marca
- **Upload Areas**: Borde punteado con color de marca
- **Status Indicators**: Verde para éxito, cyan para procesando

### Iconografía de Video
- **Play**: Triángulo sólido
- **Pause**: Dos barras verticales
- **Upload**: Flecha hacia arriba con nube
- **Settings**: Engranaje

## Mejores Prácticas

### Accesibilidad
- **Contraste**: Mínimo 4.5:1 para texto normal
- **Focus States**: Visible y consistente
- **Alt Text**: Descriptivo para imágenes

### Responsive Design
- **Mobile First**: Diseñar primero para móvil
- **Breakpoints**: 640px, 768px, 1024px, 1280px
- **Touch Targets**: Mínimo 44px para elementos interactivos

### Performance
- **Imágenes**: Optimizar y usar formatos modernos
- **Animaciones**: Usar transform y opacity cuando sea posible
- **Carga**: Lazy loading para contenido no crítico

## Ejemplos de Uso

### Landing Page
- Hero con gradiente de fondo
- Botones con gradiente de marca
- Tarjetas con hover effects
- Estadísticas con texto gradiente

### Dashboard
- Sidebar con colores de marca
- Cards con bordes sutiles
- Estados de carga con colores apropiados
- Navegación clara y consistente

### Video Player
- Controles con tema de marca
- Progress bar con gradiente
- Overlay con transparencia
- Botones de acción destacados

---

*Esta guía debe ser consultada por todos los miembros del equipo de desarrollo y diseño para mantener consistencia visual en toda la plataforma.*