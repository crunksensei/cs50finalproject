import type { LoaderFunction } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { getSession } from "../utils/session.server";
import sanitizeHtml from "sanitize-html";

type Game = {
  id: number;
  name: string;
  background_image: string;
  released: string;
  metacritic: number;
  platforms: { platform: { name: string } }[];
  genres: { name: string }[];
  description_raw: string;
  publishers: { name: string }[];
  tags: { name: string }[];
  description: string;
};

export const loader: LoaderFunction = async ({ params, request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const apikey = "e7acb02f54c445d4a95223c5a5104f64";
  const url = `https://api.rawg.io/api/games/${params.id}?key=${apikey}`;
  try {
    const response = await fetch(url);
    const game: Game = await response.json();
    return game;
  } catch (error) {
    console.error("Error fetching game data:", error);
    throw new Response("Error fetching game data", { status: 500 });
  }
};

export default function GameId() {
  const game = useLoaderData<Game>();
  const sanitizedDescription = sanitizeHtml(game.description);
  return (
    <div className="min-h-screen bg-white p-10 w-full">
      <div className="flex justify-center">
        <img
          src={game.background_image}
          alt={`Cover for ${game.name}`}
          className="rounded-lg shadow-lg mb-8 w-full md:w-1/2 h-auto object-cover mx-auto"
        />
      </div>
      <div className="max-w-6x1 mx-auto shadow-lg rounded-lg overflow-hidden flex border-t-2">
        
        <div className="w-full md:w-1/2">
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-3">{game.name}</h1>
            <div className="flex justify-between items-center mb-4">
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                Meta Critic Score: {game.metacritic}/100
              </span>
              <span className="text-sm text-gray-600">{game.released}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h2 className="font-semibold">Genres</h2>
                <p>{game.genres.map((g) => g.name).join(", ")}</p>

                <h2 className="font-semibold mt-4">Platforms</h2>
                <p>{game.platforms.map((p) => p.platform.name).join(", ")}</p>

                <h2 className="font-semibold mt-4">Publisher</h2>
                <p>{game.publishers[0]?.name || "N/A"}</p>

                <h2 className="font-semibold mt-4">Tags</h2>
                <p>{game.tags.map((t) => t.name).join(", ")}</p>
              </div>

              <div className="prose">
                <h2 className="font-semibold">Description</h2>
                {game.description ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                  />
                ) : (
                  <p>{game.description_raw}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 p-8 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
