import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getSession} from "../utils/session.server";


const apikey = "e7acb02f54c445d4a95223c5a5104f64"

const url = `https://api.rawg.io/api/games?key=${apikey}&ordering=-added&page_size=12`;

type Game = {
  id: number;
  name: string;
  background_image: string;
  released: string;
  metacritic: number;
  platforms: { platform: { name: string } }[];
  genres: { name: string }[];
};


export const meta: MetaFunction = () => {
  return [
    { title: "GameReviews" },
    { name: "description", content: "Welcome to CS50!" },
  ];
};

export const loader: LoaderFunction = async ({request}): Promise<Game[]> => {
  const session = await getSession(
    request.headers.get("Cookie")
  );
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw new Response("Error fetching data", { status: 500 });
  }
};



export default function Index() { 
  const data = useLoaderData<Game[]>();
 
  return (
    <div className="bg-white py-6 sm:py-8 lg:py-12">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-8">
        <div className="mb-10 md:mb-16">
          <h2 className="mb-4 text-center  text-2xl font-bold text-gray-800 md:mb-6 lg:text-3xl">
            Top Trending Games
          </h2>        
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-8">
          {data.map((game: Game) => (
            <div key={game.id} className="flex flex-col items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <Link to={`game/${game.id}/comments`}>
                <img src={game.background_image} alt={game.name} className="w-100 h-48 object-cover rounded-lg" />
                <div className="mt-4">
                  <h3 className="text-lg font-semibold">{game.name}</h3>
                  <p className="mt-2 text-sm">Meta Critic Score: {game.metacritic}/100</p>
                  <div>{game.genres.map(g => g.name).join(', ')}</div>
                  <div>{game.platforms.map(p => p.platform.name).join(', ')}</div>
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
