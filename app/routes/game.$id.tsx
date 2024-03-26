import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import {
  Form,
  Outlet,
  useLoaderData,
  redirect,
  useNavigation,
} from "@remix-run/react";
import { getSession } from "../utils/session.server";
import sanitizeHtml from "sanitize-html";
import { db } from "~/utils/db.server";
import { Doughnut } from "react-chartjs-2";
import "chart.js/auto";

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
    return { game, ratings };
  } catch (error) {
    console.error("Error fetching game data:", error);
    throw new Response("Error fetching game data", { status: 500 });
  }
};

export const action: ActionFunction = async ({ request, params }) => {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("userId")) {
    return redirect("/login");
  }
  const formData = await request.formData();
  const gameName = formData.get("gameName");
  const rating = formData.get("rating");
  const userRating = await db.rating.findFirst({
    where: {
      gameId: params.id,
      userId: session.get("userId"),
    },
  });
  console.log(userRating);
  if (!rating) {
    return { error: "Failed to rate game" };
  }
  if (userRating && typeof rating == "string") {
    await db.rating.update({
      where: {
        id: userRating.id,
      },
      data: {
        score: rating,
        ratingDate: new Date(),
      },
    });
  }
  if (userRating == null && typeof rating == "string") {
    await db.rating.create({
      data: {
        gameId: params.id,
        score: rating as string,
        ratingDate: new Date(),
        userId: session.get("userId"),
        gameName: gameName,
      },
    });
  }
  return redirect(`/game/${params.id}/comments`);
};

export function RatingsDoughnutChart({ ratings }) {
  // Define the data for the Doughnut chart
  const data = {
    labels: Object.keys(ratings),
    datasets: [
      {
        label: "Ratings",
        data: Object.values(ratings),
        backgroundColor: [
          "rgba(0, 0, 255, 1)", // blue for MustPlay
          "rgba(0, 255, 0, 1)", // green for Great
          "rgba(255, 165, 0, 1)", // yellow for Average
          "rgba(255, 0, 0, 1)", // red for Skip
        ],
        borderColor: [
          "rgba(0, 0, 255, 1)",
          "rgba(0, 255, 0, 1)",
          "rgba(255, 165, 0, 1)",
          "rgba(255, 0, 0, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    responsive: true,
  };

  return (
    <div style={{ width: "300px", height: "300px" }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}

export default function GameId() {
  const loaderData = useLoaderData();
  const scoreCounts = loaderData.ratings.reduce((acc, { score }) => {
    acc[score] = (acc[score] || 0) + 1;
    return acc;
  }, {});
  const sanitizedDescription = sanitizeHtml(loaderData.game.description);
  const ratings = {
    MustPlay: scoreCounts?.MustPlay || 0,
    Great: scoreCounts?.Great || 0,
    Average: scoreCounts?.Average || 0,
    Skip: scoreCounts?.Skip || 0,
  };
  const navigation = useNavigation();
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
            <div className="w-full flex justify-center items-center p-8">
              <RatingsDoughnutChart ratings={ratings} />
            </div>
            <Form method="post">
              <input
                type="hidden"
                name="gameName"
                value={loaderData.game.name}
              />
              <div className="flex justify-center gap-2 mt-4">
                {navigation.state === "submitting" ? (
                  <button
                    type="submit"
                    disabled
                    className="bg-blue-500 px-4 py-2 rounded-lg text-white"
                  >
                    Loading...
                  </button>
                ) : (
                  <button
                    type="submit"
                    name="rating"
                    value="MustPlay"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Must Play
                  </button>
                )}
                {navigation.state === "submitting" ? (
                  <button
                    type="submit"
                    disabled
                    className="bg-green-500 px-4 py-2 rounded-lg text-white"
                  >
                    Loading...
                  </button>
                ) : (
                  <button
                    type="submit"
                    name="rating"
                    value="Great"
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Great
                  </button>
                )}
                {navigation.state === "submitting" ? (
                  <button
                    type="submit"
                    disabled
                    className="bg-yellow-400 px-4 py-2 rounded-lg text-white"
                  >
                    Loading...
                  </button>
                ) : (
                  <button
                    type="submit"
                    name="rating"
                    value="Average"
                    className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded"
                  >
                    Average
                  </button>
                )}
                {navigation.state === "submitting" ? (
                  <button
                    type="submit"
                    disabled
                    className="bg-red-500 px-4 py-2 rounded-lg text-white"
                  >
                    Loading...
                  </button>
                ) : (
                  <button
                    type="submit"
                    name="rating"
                    value="Skip"
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Skip
                  </button>
                )}
              </div>
            </Form>

            <div className="flex justify-between items-center mb-4">
              {loaderData.game.metacritic ? (
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                  Meta Critic Score: {loaderData.game.metacritic}/100
                </span>
              ) : (
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                  rating: {loaderData.game.rating}
                </span>
              )}

              <span className="text-sm text-gray-600">
                {loaderData.game.released}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h2 className="font-semibold">Genres</h2>
                <p>{loaderData.game.genres.map((g) => g.name).join(", ")}</p>

                <h2 className="font-semibold mt-4">Platforms</h2>
                <p>
                  {loaderData.game.platforms
                    .map((p) => p.platform.name)
                    .join(", ")}
                </p>

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
