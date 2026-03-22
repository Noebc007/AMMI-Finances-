# 🏛️ Iglesia Ammi Atlanta — Sistema Financiero

App web de contabilidad para Iglesia Ammi Atlanta.

---

## 🚀 OPCIÓN A — Subir a Vercel (más fácil, 5 min)

### Paso 1 — Crear cuenta en GitHub
1. Ve a https://github.com y crea una cuenta gratis
2. Haz clic en **"New repository"**
3. Nómbralo: `iglesia-ammi-finanzas`
4. Marca **Public** → clic en **Create repository**

### Paso 2 — Subir los archivos
En la página del repositorio vacío, haz clic en **"uploading an existing file"**
y sube TODOS los archivos de esta carpeta (respetando la estructura).

O si tienes Git instalado:
```bash
git init
git add .
git commit -m "primer commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/iglesia-ammi-finanzas.git
git push -u origin main
```

### Paso 3 — Conectar a Vercel
1. Ve a https://vercel.com y crea cuenta con tu GitHub
2. Clic en **"Add New Project"**
3. Selecciona el repositorio `iglesia-ammi-finanzas`
4. Vercel detecta Vite automáticamente
5. Clic en **Deploy** ✅

Tu app quedará en: `https://iglesia-ammi-finanzas.vercel.app`

---

## 💻 OPCIÓN B — Correrla en tu computadora

Necesitas tener Node.js instalado (https://nodejs.org — descarga la versión LTS).

```bash
# 1. Abre la terminal en esta carpeta
cd iglesia-ammi

# 2. Instala dependencias (solo la primera vez)
npm install

# 3. Inicia la app
npm run dev
```

Abre tu navegador en: **http://localhost:5173**

---

## 📁 Estructura del proyecto

```
iglesia-ammi/
├── index.html          ← entrada principal
├── package.json        ← dependencias
├── vite.config.js      ← configuración
├── vercel.json         ← configuración Vercel
└── src/
    ├── main.jsx        ← punto de entrada React
    └── App.jsx         ← toda la aplicación
```

---

## 💾 Datos

Los datos se guardan automáticamente en el navegador (localStorage).
Cada navegador/dispositivo tiene sus propios datos.

Para compartir datos entre múltiples personas, se necesitaría agregar
una base de datos en la nube (Supabase). Consulta con el desarrollador.

---

## ✝ Iglesia Ammi Atlanta — 2025
