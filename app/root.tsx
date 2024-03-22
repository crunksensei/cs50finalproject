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
  useLoaderData,
} from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import { getSession } from "./utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  return { session };
}

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

function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData();
  return (
    <>
      <nav className="flex justify-between items-center px-10 py-5 w-full">
        <Link prefetch="intent" to="/" className="text-2xl font-semibold">
          Game Reviews <span className="text-teal-700">DB</span>
        </Link>
        <form
          action="/search"
          method="get"
          className="flex items-center w-1/3 mx-3"
        >
          <input
            type="search"
            name="query"
            placeholder="Search games"
            className="px-4 py-2 rounded-lg text-black border-2 border-teal-300 focus:outline-none w-full"
          />
        </form>

        {data.session.data.userId ? (
          <div className="flex gap-4">
            <form action="/logout" method="post">
              <button
                type="submit"
                className="bg-teal-500 px-4 py-2 rounded-lg text-white "
              >
                Logout
              </button>
            </form>
            <Link to="/account/username">
              <button className="bg-teal-500 px-4 py-2 rounded-lg text-white">
                Account
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex gap-4">
            <Link to="/login">
              <button className="bg-teal-500 px-4 py-2 rounded-lg text-white">
                Login
              </button>
            </Link>
            <Link to="/register">
              <button className="bg-teal-500 px-4 py-2 rounded-lg text-white">
                Register
              </button>
            </Link>
          </div>
        )}
      </nav>
      <main>{children}</main>
    </>
  );
}

<form action="/logout" method="post">
  <button
    type="submit"
    className="bg-teal-500 px-4 py-2 rounded-lg text-white "
  >
    Logout
  </button>
</form>;
