import { Form, useLoaderData } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { getSession } from "../utils/session.server";
import isAuthenticated from "../utils/auth.server";

type Comments = {
  id: string;
  text: string;
  userid: string;
  gameid: string;
  timestamp: string;
};

export const loader: LoaderFunction = async ({ params }) => {
  const data: Comments[] = await db.comment.findMany({
    where: {
      gameid: params.id,
    },
  });

  return data;
};

export default function Comments() {
  const data = useLoaderData<Comments[]>();

  return (
    <div className="rounded-lg boarder p-3">
      <h1 className="text-xl font-semibold mb-5">Your Opinion</h1>
      <div>
        <Form method="POST">
          <textarea
            name="comment"
            className="w-full border border-teal-500 rounded-lg p-2"
          ></textarea>
          <input type="hidden" name="id" value={data.id} />
          <button
            type="submit"
            className="bg-teal-500 px-4 py-2 rounded-lg text-white"
          >
            Submit
          </button>
        </Form>
        <div>
          {data.map((e, index) => (
            <div key={index}>{e.text}</div>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-y-3"></div>
      </div>
    </div>
  );
}
