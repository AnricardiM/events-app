This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Inicio de sesión con Supabase

La pantalla inicial autentica con correo y contraseña mediante Supabase Auth. Para
conectar el proyecto:

1. Copia `.env.example` a `.env.local`.
2. En Supabase, copia la URL del proyecto y su publishable key en
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Habilita el proveedor Email y crea los usuarios desde **Authentication >
   Users**. El formulario permite iniciar sesión; el registro se administra
   desde Supabase.
4. Ejecuta `npm run dev` y visita `/login`. Las rutas del sistema (`/dashboard`,
   `/usuarios`, `/ingresos`, `/tareas`, `/cronograma` y `/administracion`)
   requieren una sesión válida y comparten el header y el menú lateral. La ruta
   `/` redirige a `/login`.

No uses la `service_role` key en estas variables ni en el navegador.

La creación administrativa de usuarios en `/usuarios` también requiere
`SUPABASE_SERVICE_ROLE_KEY` en el entorno del servidor. Esta credencial se usa
exclusivamente en una Server Action; nunca la publiques con el prefijo
`NEXT_PUBLIC_` ni la envíes al cliente. En Vercel, configúrala como variable de
entorno privada para el entorno correspondiente.

Los usuarios nuevos se crean con el correo confirmado y una contraseña inicial
definida por el administrador. Comparte esa contraseña únicamente mediante un
canal seguro. Las políticas actuales no permiten editar el nombre ni el correo
de perfiles existentes; en su lugar, el formulario los muestra como solo
lectura. La acción de desactivar no elimina físicamente cuentas de Auth.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
