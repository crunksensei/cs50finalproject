import type { LinksFunction } from "@remix-run/node";
import stylesheet from "~/tailwind.css";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
} from "@remix-run/react";


export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Layout>
          <Outlet />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </Layout>
      </body>
    </html>
  );
}

function Layout({children}: {children: React.ReactNode}) {
  return (
    <>
    <nav className="flex justify-between items-center px-10 py-5">
      <Link prefetch="intent" to="/" className="text-2xl font-semibold">
        Game Reviews <span className="text-teal-700">DB</span> 
      </Link>
      <div className="flex gap-4">
          <Link to="/login">
            <button className="bg-teal-500 px-4 py-2 rounded-lg text-white">Login</button>
          </Link>
          <Link to="/register">
            <button className="bg-teal-500 px-4 py-2 rounded-lg text-white">Register</button>
          </Link>
        </div>
    </nav>
    <main>{children}</main>
    </>
  )
}
