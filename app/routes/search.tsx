// file: app/routes/search.js
import { json } from "@remix-run/node";

const apikey = process.env.apikey;

export async function loader({ request }) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query");

  if (!query) {
    return json({ games: [] }); // Return empty if no query
  }

  const response = await fetch(`https://api.rawg.io/api/games?key=${apikey}&search=${query}`);
  const { results } = await response.json();

  return json({ games: results });
}
