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
  useActionData,
} from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getSession } from "./utils/session.server";
import { useEffect, useState } from "react";

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

export async function action({
  request,
}: ActionFunctionArgs) {
  console.log('im here')
  const apikey = process.env.apikey;
  const [results, setResults] = useState([]);
  const urlParams = new URL(request.url).searchParams;
  const query = urlParams.get("query");
  console.log(urlParams)
  // console.log(results);
  if (query) {
    await fetch(
      `https://api.rawg.io/api/games?key=${apikey}&search=${query}`
    )
      .then((response) => response.json())
      .then((data) => setResults(data.results))
      .catch((error) => console.error("Failed to fetch games:", error));
  }
}


// function SearchResults() {
//   const apikey = process.env.apikey;
  
//   const [results, setResults] = useState([]);
//   useEffect(() => {
//     if (search) {
//       fetch(
//         `https://api.rawg.io/api/games?key=${apikey}&search=${urlParams}`
//       )
//         .then((response) => response.json())
//         .then((data) => setResults(data.results))
//         .catch((error) => console.error("Failed to fetch games:", error));
//     }
//   }, [search]);
//   console.log(search)
//   console.log(results)
//   if (!search) {
//     return null;
//   }
  
  // return (
  //   <div className="absolute bg-white border border-gray-200 mt-1 rounded-md overflow-hidden z-10">
  //     {results.map((game) => (
  //       <div key={game.id} className="p-2 hover:bg-gray-100">
  //         {game.name}
  //       </div>
  //     ))}
  //   </div>
  // );
// }

function Layout({ children }: { children: React.ReactNode }) {
  const actionData = useActionData();
  const data = useLoaderData();
  console.log(actionData)
  const [search, setSearch] = useState("");

  const fetcher = useFetcher();
  function handleCategoryChange(query: string) {
    fetcher.load(`/?category=${query}`);
  }
//  <SearchResults search={search} /> 

  return (
    <>
      <nav className="flex justify-between items-center px-10 py-5 w-full">
        <Link prefetch="intent" to="/" className="text-2xl font-semibold">
          Game Reviews <span className="text-teal-700">DB</span>
        </Link>
        <form action={`/?category=${search}`} method="get" className="flex items-center">
        <input
          type="search"
          name="query"
          placeholder="Search games"
          onChange={handleCategoryChange}
          className="px-4 py-2 rounded-lg text-black border-2 border-teal-300 focus:outline-none w-full"
        />
        </form>
        
        {data.session.data.userId ? (
          <form action="/logout" method="post">
            <button
              type="submit"
              className="bg-teal-500 px-4 py-2 rounded-lg text-white "
            >
              Logout
            </button>
          </form>
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

{/* <fetcher.Form action="/search" method="get" className="flex items-center">
<input
  type="search"
  name="query"
  placeholder="Search games"
  onChange={handleChange}
  className="px-4 py-2 rounded-lg text-black border-2 border-teal-300 focus:outline-none w-full"
/>
</fetcher.Form> */}




// <input
//           type="search"
//           name="query"
//           placeholder="Search games"
//           onChange={(e) => setSearch(e.target.value)}
//           className="px-4 py-2 rounded-lg text-black border-2 border-teal-300 focus:outline-none w-full"
//         />
//         <SearchResults search={search} />