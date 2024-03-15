import type { LoaderFunction } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { getSession } from "../utils/session.server";




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
  };

  export const loader: LoaderFunction = async ({ params, request }) => {
    const session = await getSession(
      request.headers.get("Cookie")
    );
    const apikey = "e7acb02f54c445d4a95223c5a5104f64"
    const url = `https://api.rawg.io/api/games/${params.id}?key=${apikey}`;   
    try {
      const response = await fetch(url);
      const game: Game = await response.json();
      return game;
    } catch (error) {
      console.error('Error fetching game data:', error);
      throw new Response("Error fetching game data", { status: 500 });
    }
  };
  


export default function GameId() {
    const game = useLoaderData<Game>();

  return (
    <div className="min-h-screen p-10">
      <img 
      src={game.background_image}
      alt="" 
      className="w-48 h-48 object-cover rounded-lg" 
      />
    
    <h1 className="text-4xl font-bold text-center pt-5">{game.name}</h1>
    <div className="flex gap-x-10 mt-10">
      <div className="w-1/2 font-medium">
        <p className="mt-2 text-sm">Meta Critic Score: {game.metacritic}/100</p>
        <p>{game.genres.map(g => g.name).join(', ')}</p>
        <p>{game.platforms.map(p => p.platform.name).join(', ')}</p>
        <p>{game.description_raw}</p>
        <p>{game.publishers[0].name}</p>
        <p>{game.tags.map(t => t.name).join(', ')}</p>
        <p className="mt-2 text-sm text-gray-600">{game.released}</p>
      </div>
      
      <div className="w-1/2">
              <Outlet />
      </div>
    
    </div>
                    
           
       
    </div>
  );
}