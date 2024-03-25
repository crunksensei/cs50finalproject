import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { getSession } from "../utils/session.server";
import sanitizeHtml from "sanitize-html";
import { db } from "~/utils/db.server";

type Game = {
  id: number;
  name: string;
  background_image: string;
  released: string;
  metacritic: number;
  rating: number;
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
    const ratings = await db.rating.findMany({
      where: {
        gameId: params.id,
      },
    });
    console.log(ratings)
    return {game, ratings};
  } catch (error) {
    console.error("Error fetching game data:", error);
    throw new Response("Error fetching game data", { status: 500 });
  }
};

export const action: ActionFunction = async ({ request, params }) => {


}


export default function GameId() {
  const loaderData = useLoaderData();
  console.log(loaderData.game.name)
  const sanitizedDescription = sanitizeHtml(loaderData.game.description)
  const ratings = { MustPlay: 0, Great: 0, Average: 0, Skip: 0 };
  const totalRatings = Object.values(ratings).reduce((acc, curr) => acc + curr, 0);

  const getPercentage = (count) => `${(count / totalRatings) * 100}%`;;

  return (
    <div className="min-h-screen bg-white p-10 w-full">
      <div className="flex justify-center">
        <img
          src={loaderData.game.background_image}
          alt={`Cover for ${loaderData.game.name}`}
          className="rounded-lg shadow-lg mb-8 w-full md:w-1/2 h-auto object-cover mx-auto"
        />
      </div>
      <div className="max-w-6x1 mx-auto shadow-lg rounded-lg overflow-hidden flex border-t-2">
        
        <div className="w-full md:w-1/2">
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-3">{loaderData.game.name}</h1>

            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 my-4 relative">
              <div className="bg-green-500 h-5 rounded-l-full absolute" style={{width: getPercentage(ratings.MustPlay)}}></div>
              <div className="bg-blue-500 h-5 absolute" style={{left: getPercentage(ratings.MustPlay), width: getPercentage(ratings.Great)}}></div>
              <div className="bg-yellow-500 h-5 absolute" style={{left: `calc(${getPercentage(ratings.MustPlay)} + ${getPercentage(ratings.Great)})`, width: getPercentage(ratings.Average)}}></div>
              <div className="bg-red-500 h-5 rounded-r-full absolute" style={{left: `calc(${getPercentage(ratings.MustPlay)} + ${getPercentage(ratings.Great)} + ${getPercentage(ratings.Average)})`, width: getPercentage(ratings.Skip)}}></div>
            </div>

            <div className="flex justify-center gap-2 mt-4">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" name="mustPlay">Must Play</button>
              <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" name="great">Great</button>
              <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded" name="average">Average</button>
              <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" name="skip">Skip</button>
            </div>



            <div className="flex justify-between items-center mb-4">
              {loaderData.game.metacritic ? (<span className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                Meta Critic Score: {loaderData.game.metacritic}/100
              </span>): (
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                rating: {loaderData.game.rating}
              </span>
              )}
              
              <span className="text-sm text-gray-600">{loaderData.game.released}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h2 className="font-semibold">Genres</h2>
                <p>{loaderData.game.genres.map((g) => g.name).join(", ")}</p>

                <h2 className="font-semibold mt-4">Platforms</h2>
                <p>{loaderData.game.platforms.map((p) => p.platform.name).join(", ")}</p>

                <h2 className="font-semibold mt-4">Publisher</h2>
                <p>{loaderData.game.publishers[0]?.name || "N/A"}</p>

                <h2 className="font-semibold mt-4">Tags</h2>
                <p>{loaderData.game.tags.map((t) => t.name).join(", ")}</p>
              </div>

              <div className="prose">
                <h2 className="font-semibold">Description</h2>
                {loaderData.game.description ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                  />
                ) : (
                  <p>{loaderData.game.description_raw}</p>
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
