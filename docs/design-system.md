# WODITOS — Design System & Branding

> Versión: 1.0 · Última actualización: 2026-03-27  
> Uso interno para desarrollo y diseño de producto

---

## 1. Identidad de marca

### Nombre y posicionamiento

**Woditos** — herramienta de gestión para coaches de grupos presenciales de running y entrenamiento funcional.

**Tono de voz:** directo, energético, sin frivolidades. Habla de igual a igual con el coach. No es corporativo ni académico. Es el compañero que tiene todo bajo control.

**Palabras clave de marca:** orden, control, comunidad, movimiento, profesionalismo.

---

## 2. Paleta de colores

### Colores primarios

| Nombre | Variable CSS | Valor HSL | Uso |
|--------|-------------|-----------|-----|
| Primary (naranja) | `hsl(16, 100%, 58%)` | #FF6B35 aprox | CTAs principales, acentos activos, íconos destacados |
| Secondary (verde) | `hsl(165, 100%, 39%)` | #00C896 aprox | Confirmaciones, estados positivos, asistencia presente |
| Accent (amarillo) | `hsl(45, 100%, 60%)` | #FFCC33 aprox | Alertas suaves, estados "tarde", highlights |

### Colores semánticos

| Nombre | Variable CSS | Uso |
|--------|-------------|-----|
| Destructive | `hsl(0, 72%, 51%)` | Errores, cancelaciones, ausencias |
| Info | `hsl(217, 47%, 55%)` | Información neutral, crews, estadísticas |

### Colores de superficie (modo oscuro — default)

| Nombre | Variable | Descripción |
|--------|----------|-------------|
| Background | `hsl(230, 20%, 9%)` | Fondo principal de la app |
| Card | `hsl(228, 19%, 12%)` | Cards, paneles, modales |
| Sidebar | `hsl(229, 21%, 10%)` | Sidebar de navegación |
| Border | `hsl(240, 12%, 18%)` | Bordes de cards y divisores |
| Muted foreground | `hsl(250, 10%, 55%)` | Textos secundarios, placeholders |

### Colores de superficie (modo claro)

| Nombre | Variable | Descripción |
|--------|----------|-------------|
| Background | `hsl(0, 0%, 98%)` | Fondo principal |
| Card | `hsl(0, 0%, 100%)` | Cards y paneles |
| Sidebar | `hsl(230, 20%, 96%)` | Sidebar |

---

## 3. Tipografía

### Fuentes

```
Display (títulos):  font-family usada con clase `font-display`
Body (cuerpo):      Sistema sans-serif estándar (Tailwind default)
```

### Escala tipográfica

| Clase Tailwind | Tamaño | Peso | Uso |
|---------------|--------|------|-----|
| `font-display text-3xl font-extrabold` | 30px | 800 | Títulos de página (H1) |
| `font-display text-xl font-bold` | 20px | 700 | Subtítulos de sección (H2) |
| `font-display font-bold` | 16px | 700 | Títulos de cards (H3) |
| `text-sm font-medium` | 14px | 500 | Labels, navegación |
| `text-sm` | 14px | 400 | Cuerpo de texto |
| `text-xs` | 12px | 400 | Textos secundarios, fechas, metadata |
| `text-xs uppercase tracking-wider font-bold` | 12px | 700 | Labels de estadísticas (ALL CAPS) |

### Gradiente de texto de marca

```css
.text-gradient-primary {
  background: linear-gradient(135deg, hsl(16,100%,58%), hsl(17,81%,52%));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 4. Espaciado y layout

### Contenedores de página

```
max-w-4xl mx-auto   → Dashboard, Agenda, Comunidad
max-w-5xl mx-auto   → Coach Panel
max-w-3xl mx-auto   → Asistencia, Perfil
max-w-sm            → Login, Register (columna única centrada)
```

### Padding estándar

```
Páginas desktop:  p-8  (2rem)
Páginas móvil:    p-4  (1rem)
Cards:            p-4 o p-5
Botones:          px-4 py-2
```

### Gap entre elementos

```
Secciones:        space-y-6 o space-y-8
Cards en grid:    gap-3
Botones en fila:  gap-2
```

---

## 5. Componentes de UI

### Cards

```tsx
// Card estándar
<div className="bg-card border border-border rounded-xl p-4">

// Card con borde de color (sesiones en agenda)
<div className="bg-card border border-border rounded-xl p-4 border-l-4 border-l-secondary">

// Card con borde activo (sesión confirmada)
<div className="bg-card border border-secondary/30 rounded-xl p-4">
```

### Botones

```tsx
// CTA principal (naranja gradient)
<Button className="gradient-primary text-primary-foreground">

// Outline
<Button variant="outline">

// Ghost (ícono)
<Button variant="ghost" size="icon">

// Destructivo
<Button variant="destructive">
```

### Gradiente del botón primario

```css
.gradient-primary {
  background: linear-gradient(135deg, hsl(16,100%,58%), hsl(17,81%,52%));
}
```

### Badges de estado

```tsx
// Confirmado/presente
<Badge className="bg-secondary/10 text-secondary border-secondary/30">

// Pendiente/ausente
<Badge className="bg-destructive/15 text-destructive border-destructive/40">

// Tarde
<Badge className="bg-accent/15 text-accent border-accent/40">

// Neutral
<Badge variant="outline">
```

### Inputs

```tsx
<Input className="bg-card border-border" />
<Input className="bg-background border-border" />  // dentro de cards
```

---

## 6. Iconografía

**Librería:** `lucide-react`

### Íconos por sección

| Sección | Ícono principal |
|---------|----------------|
| Dashboard/Inicio | `Home` |
| Agenda | `Calendar` |
| Comunidad/Crew | `Users` |
| Biblioteca/Wiki | `BookOpen` |
| Perfil | `User` |
| Coach Panel | `Dumbbell` |
| Asistencias | `ClipboardCheck` |
| Sesiones | `Calendar` |
| Notificaciones | `Bell` |
| QR | `QrCode` |
| Grupos/Crews | `Users` |
| Estadísticas | `TrendingUp` |
| Racha | `Flame` |

### Tamaños de íconos

```
Navegación sidebar/mobile: size={18} o size={20}
Íconos en cards/stats: size={18}
Íconos decorativos grandes: size={32}
Botones: size={14} o size={16}
```

---

## 7. Animaciones

```css
/* Entrada de páginas */
.animate-fade-in {
  animation: fadeIn 0.2s ease-in;
}

/* Loading skeleton */
.animate-pulse  → usado en skeletons de carga

/* Spinner de carga */
.animate-spin   → usado en loading states
```

---

## 8. Colores por tipo de sesión

```typescript
const SESSION_COLORS = {
  running:    'border-l-secondary',   // verde
  functional: 'border-l-primary',     // naranja
  amrap:      'border-l-primary',     // naranja
  emom:       'border-l-accent',      // amarillo
  hiit:       'border-l-destructive', // rojo
  technique:  'border-l-info',        // azul
}
```

---

## 9. Roles y colores asociados

| Rol | Color UI sugerido | Badge |
|-----|------------------|-------|
| `super_admin` | Primary (naranja) | `bg-primary/10 text-primary` |
| `club_admin` | Secondary (verde) | `bg-secondary/10 text-secondary` |
| `coach` | Info (azul) | `bg-info/10 text-info` |
| `member` | Muted | `text-muted-foreground` |

---

## 10. Planes y sus colores

| Plan | Color | Badge |
|------|-------|-------|
| Free | Muted gray | `bg-muted text-muted-foreground` |
| Pro | Primary naranja | `bg-primary/10 text-primary border-primary/30` |
| Pro+ | Accent dorado | `bg-accent/10 text-accent border-accent/30` |

---

## 11. Modo oscuro / claro

La app **arranca en modo oscuro** por defecto. El toggle está en el sidebar desktop.

```typescript
// Hook de tema
const { theme, toggleTheme } = useTheme();
// theme: 'dark' | 'light'
```

El modo oscuro es la identidad visual principal de Woditos. El modo claro es una alternativa funcional pero el diseño está optimizado para oscuro.

---

## 12. Layout de la app

```
┌─────────────────────────────────────────────────────┐
│ Header: NextSessionBanner  |  Club Badge  |  Bell   │
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│   SIDEBAR    │           CONTENIDO                   │
│              │                                       │
│  Logo        │   max-w-[3xl/4xl/5xl] mx-auto        │
│  Nav items   │   space-y-6 o space-y-8               │
│  ──────────  │                                       │
│  [Coach]     │                                       │
│  Coach Panel │                                       │
│  Asistencias │                                       │
│  ──────────  │                                       │
│  Modo oscuro │                                       │
│  Avatar      │                                       │
│  Logout      │                                       │
└──────────────┴──────────────────────────────────────┘

MÓVIL:
┌─────────────────────────────────────────────────────┐
│ Logo  Woditos  |  Club Badge  |  Next  |  Bell      │
├─────────────────────────────────────────────────────┤
│                   CONTENIDO                          │
├─────────────────────────────────────────────────────┤
│  Inicio  Agenda  Crew  Wiki  Perfil  [Coach]        │
└─────────────────────────────────────────────────────┘
```

---

## 13. Reglas de diseño

1. **Bordes siempre `border-border`** — nunca colores hardcodeados en bordes
2. **Backgrounds de cards `bg-card`** — nunca `bg-white` ni colores fijos
3. **Texto primario `text-foreground`** — secundario `text-muted-foreground`
4. **`rounded-xl`** para cards grandes, `rounded-lg` para elementos medianos, `rounded-md` para botones e inputs
5. **Sin sombras** — la jerarquía se logra con bordes y opacidad de fondo
6. **Transiciones `transition-all`** en elementos interactivos
7. **`hover:bg-muted/50`** para filas de tabla interactivas
8. **Gradiente naranja** solo en el CTA principal por pantalla — no abusar

---

*Woditos Design System — uso interno del equipo de desarrollo*