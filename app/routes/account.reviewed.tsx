import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData, redirect } from "@remix-run/react";
import { getSession } from "../utils/session.server";
import { db } from "~/utils/db.server";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    return redirect("/login");
  }

  const reviewed = await db.rating.findMany({
    where: {
      userId: session.get("userId"),
    },
  });
  return reviewed;
};

export default function ReviewedGames() {
  const reviews = useLoaderData();
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Reviewed Games</h1>
      <ul className="space-y-4">
        {reviews?.map((review) => (
          <li
            key={review.id}
            className="bg-white shadow overflow-hidden rounded-md px-6 py-4"
          >
            <h2 className="text-lg font-semibold">{review.gameName}</h2>
            <p>Score: {review.score}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
