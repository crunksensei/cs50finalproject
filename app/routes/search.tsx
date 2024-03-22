// file: app/routes/search.js
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getSession } from "../utils/session.server";



type Game = {
  id: number;
  name: string;
  background_image: string;
  released: string;
  metacritic: number;
  platforms: { platform: { name: string } }[];
  genres: { name: string }[];
  esrb_rating: { name: string };
  rating: number;
  description_raw: string;
};

type LoaderData = {
  games: Game[];
  currentPage: number;
  totalPages: number;
  query: string;
};

export async function loader({ request }) {
  const session = await getSession(request.headers.get("Cookie"));
  const apikey = process.env.apikey;
  const url = new URL(request.url);
  const query = url.searchParams.get("query");
  const page = parseInt(url.searchParams.get("page") || "1", 10);

  const limit = 12;
  if (!query) {
    return json({ games: [] }); // Return empty if no query
  }

  const response = await fetch(
    `https://api.rawg.io/api/games?key=${apikey}&search=${query}&page=${page}&page_size=${limit}`
  );
  const data = await response.json();
  
  return json({
    games: data.results,
    currentPage: page,
    totalPages: Math.ceil(data.count / limit),
    query: query,
  });
}




export default function Index() {
  const { games, currentPage, totalPages, query } = useLoaderData<LoaderData>(); 
  return (
    <div className="bg-white py-6 sm:py-8 lg:py-12">
      <div className="mx-auto max-w-screen px-4 md:px-8">
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 xl:gap-8">
          {games.map((game: Game) => (
            <Link key={game.id} to={`/game/${game.id}/comments`}>
              <div
                key={game.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <img
                  src={game.background_image}
                  alt={game.name}
                  className="flex-none w-60 h-60 object-cover rounded-lg mr-4"
                />

                <div className="flex-grow mt-4">
                  <h3 className="text-lg font-semibold">{game.name}</h3>
                  {game.metacritic ? (
                    <p className="mt-2 text-sm">
                      Meta Critic Score: {game.metacritic}/100
                    </p>
                  ) : game.rating ? (
                    <p className="mt-2 text-sm">Rating: {game.rating}/5</p>
                  ) : null}

                  <div>{game.genres?.map((g) => g.name).join(", ")}</div>
                  <div>
                    {game.platforms?.map((p) => p.platform.name).join(", ")}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{game.released}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="flex items-center mt-8 justify-between">
          {currentPage > 1 && (
            <Link
              to={`?query=${encodeURIComponent(query)}&page=${currentPage - 1}`}
              className="px-4 py-2 rounded-lg text-center text-white border-2 bg-teal-500 border-teal-300 focus:outline-none w-1/4 justify-end"
            >
              Previous
            </Link>
          )}
          <span></span>
          {currentPage < totalPages && (
            <Link
              to={`?query=${encodeURIComponent(query)}&page=${currentPage + 1}`}
              className="px-4 py-2 rounded-lg text-center text-white border-2 bg-teal-500 border-teal-300 focus:outline-none w-1/4"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
