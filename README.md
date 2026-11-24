# Events

Aplicación web para organizar eventos y gestionar el contenido que se prepara
para ellos. La interfaz está en español y el acceso está restringido a usuarios
autenticados y activos.

## ¿Qué es?

Events reúne en un solo lugar la gestión de eventos, sus cronogramas y los
contenidos registrados para cada bloque. También incluye gestión de usuarios y
roles, configuración del sistema y un asistente de ayuda opcional.

La aplicación está construida con Next.js 16, React 19 y TypeScript. Supabase
provee autenticación y base de datos. Las acciones disponibles dependen del rol
del usuario; la autorización se valida en el servidor.

## ¿Cómo funciona?

1. El usuario inicia sesión con correo y contraseña de Supabase Auth.
2. Una vez autenticado, puede acceder a las secciones permitidas para su cuenta.
3. En **Eventos**, los usuarios autorizados crean y mantienen eventos.
   Cada evento puede tener bloques en un cronograma.
4. En **Recepción**, los usuarios autorizados registran contenidos y archivos,
   que pueden asignarse para edición y revisión.
5. Los administradores pueden gestionar usuarios y roles, y ajustar la
   configuración general.
6. El asistente de ayuda responde preguntas sobre el uso de la aplicación si
   se configura la integración opcional con Gemini.

Las rutas de **Mis tareas** y **Cronograma** general todavía son módulos en
desarrollo. El cronograma de cada evento sí está disponible desde la sección
Eventos.

## ¿Qué necesito para comenzar?

- Node.js 20.9.0 o posterior y npm.
- Un proyecto de Supabase configurado para esta aplicación.
- La base de datos de Supabase preparada con las tablas, funciones, políticas
  de acceso y datos iniciales que utiliza la aplicación. Este repositorio no
  incluye migraciones SQL para crear ese esquema.
- Un usuario activo con permisos para iniciar sesión. Habilita el proveedor
  **Email** en Supabase Auth.

### 1. Instalar dependencias

Desde la carpeta del proyecto, ejecuta:

```bash
npm ci
```

### 2. Configurar el entorno local

Crea un archivo `.env.local` en la raíz y agrega las variables necesarias:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>

# Opcional: necesario para crear usuarios desde la sección Usuarios.
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Opcionales: habilitan el asistente de ayuda con Gemini.
GEMINI_API_KEY=<gemini-api-key>
# GEMINI_MODEL=gemini-flash-latest
```

Obtén los valores de Supabase y Gemini desde sus respectivos proyectos. No
incluyas credenciales reales en el repositorio ni las compartas. `.env.local`
está excluido del control de versiones. La clave `SUPABASE_SERVICE_ROLE_KEY`
debe permanecer exclusivamente en el servidor: no la renombres con el prefijo
`NEXT_PUBLIC_` ni la expongas al navegador.

Las dos variables `NEXT_PUBLIC_SUPABASE_*` son necesarias para iniciar sesión y
usar la aplicación. `SUPABASE_SERVICE_ROLE_KEY` solo es necesaria para crear
usuarios desde la aplicación. Sin `GEMINI_API_KEY`, el resto de la aplicación
puede utilizarse, pero el asistente no estará disponible.

### 3. Iniciar en modo desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La página inicial muestra
el formulario de acceso; después de iniciar sesión se abre el panel.

## Secciones disponibles

- **Inicio** (`/dashboard`): panel principal.
- **Eventos** (`/eventos`): gestión de eventos y acceso al cronograma de cada
  evento (`/eventos/<id>/cronograma`).
- **Recepción** (`/contenidos`): registro y flujo de revisión de contenidos.
- **Usuarios** (`/usuarios`): administración de usuarios y roles; requiere rol
  de administrador.
- **Administración** (`/administracion`): configuración del sistema; requiere
  rol de administrador.
- **Mis tareas** (`/tareas`) y **Cronograma** (`/cronograma`): módulos
  informativos aún no implementados.

## Comandos

```bash
npm run dev    # servidor de desarrollo
npm run lint   # análisis estático
npm run build  # compilación de producción
npm run start  # servidor de producción (después de compilar)
```
