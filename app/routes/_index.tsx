import type { LoaderFunction, MetaFunction, json } from "@remix-run/node";
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import { getSession } from "../utils/session.server";

const apikey = process.env.apikey;

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
};

export const meta: MetaFunction = () => {
  return [
    { title: "GameReviews" },
    { name: "description", content: "Welcome to CS50!" },
  ];
};

export const loader: LoaderFunction = async ({ request }): Promise<Game[]> => {
  const session = await getSession(request.headers.get("Cookie"));
  const urlParams = new URL(request.url).searchParams;
  const category = urlParams.get("category") || "trending";
  const year = new Date().getFullYear();

  let apiUrl = `https://api.rawg.io/api/games?key=${apikey}&ordering=-released`;
  if (category === "trending") {
    apiUrl = `https://api.rawg.io/api/games?key=${apikey}&dates=${year}-01-01,${
      year + 2
    }-12-31&ordering=-added`;
  } else if (category === "top_rated") {
    // Your existing code for 'recent' category
    apiUrl = `https://api.rawg.io/api/games?key=${apikey}&dates=${year}-01-01,${year}-12-31&ordering=-rating`;
  } else if (category === "updated") {
    // Your existing code for 'updated' category
    apiUrl = `https://api.rawg.io/api/games?key=${apikey}&dates=${year}-01-01,${year}-12-31&ordering=-updated`;
  }
  try {
    const nsfwKeywords = ["nsfw", "sexual content"];
    const response = await fetch(apiUrl);
    const data = await response.json();
    const filteredData = data.results.filter((game: Game) => {
      return (
        game.esrb_rating == null ||
        !nsfwKeywords.includes(game.esrb_rating.name)
      );
    });
    return filteredData.slice(0, 12);
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Response("Error fetching data", { status: 500 });
  }
};

export default function Index() {
  const data = useLoaderData<Game[]>();
  const fetcher = useFetcher();
  // Function to handle category change
  function handleCategoryChange(category: string) {
    fetcher.load(`/?category=${category}`);
  }
  return (
    <div className="bg-white py-6 sm:py-8 lg:py-12">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-8">
        <div className="mb-4 flex justify-center gap-4">
          <Link
            to="/?category=trending"
            className="px-4 py-2 bg-teal-500 text-white rounded-lg"
          >
            Top Trending
          </Link>
          <Link
            to="/?category=top_rated"
            className="px-4 py-2 bg-teal-500 text-white rounded-lg"
          >
            Top Rated This Year
          </Link>
          <Link
            to="/?category=updated"
            className="px-4 py-2 bg-teal-500 text-white rounded-lg"
          >
            Most Recently Updated
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-8">
          {data.map((game: Game) => (
            <div
              key={game.id}
              className="flex flex-col items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              <Link to={`game/${game.id}/comments`}>
                <img
                  src={game.background_image}
                  alt={game.name}
                  className="w-100 h-48 object-cover rounded-lg"
                />
                <div className="mt-4">
                  <h3 className="text-lg font-semibold">{game.name}</h3>
                  {game.metacritic ? (
                    <p className="mt-2 text-sm">
                      Meta Critic Score: {game.metacritic}/100
                    </p>
                  ) : game.rating ? (
                    <p className="mt-2 text-sm">Rating: {game.rating}/5</p>
                  ) : null}

                  <div>{game.genres.map((g) => g.name).join(", ")}</div>
                  <div>
                    {game.platforms.map((p) => p.platform.name).join(", ")}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{game.released}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
