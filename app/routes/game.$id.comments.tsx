import {
  Form,
  useLoaderData,
  useNavigation,
  useParams,
  useFetcher,
  useActionData,
} from "@remix-run/react";
import { LoaderFunction, ActionFunctionArgs, redirect, json  } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { getSession, addComment } from "../utils/session.server";

type Comments = {
  id: string;
  text: string;
  username: string;
  gameid: string;
  timestamp: Date;
};

export async function action({ request, params }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    return redirect("/login");
  }
  const form = await request.formData();
  const comment = form.get("comment");
  const userId = session.get("userId");
  const regex = /[A-Za-z]/;
  if (
    !comment ||
    typeof comment != "string" ||
    !userId ||
    typeof userId != "string" ||
    !params.id ||
    typeof params.id != "string" ||
    !regex.test(comment)
  ) {
    return { error: "Please enter a valid comment." };
  }
  try {
    await addComment(comment as string, userId as string, params.id as string);
  } catch (e) {
    console.log(e);
    return { error: "Failed posting comment." };
  }
  return null;
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "30");
  const data: Comments[] = await db.comment.findMany({
    where: {
      gameid: params.id,
    },
    take: limit,
    orderBy: {
      timestamp: "desc",
    },
  });

  return data;
};

export default function Comments() {
  const params = useParams();
  const fetcher = useFetcher();
  const actionData = useActionData();
  const gameId = params.id;
  const data = useLoaderData<Comments[]>();
  const navigation = useNavigation();
  const limit = 30;
  const handleLoadMore = () => {
    const newLimit = limit + 30;
    if (fetcher.data == undefined || fetcher.data.length > newLimit) {
      fetcher.load(`/game/${gameId}/comments?limit=${newLimit}`);
    }
    //possibly have it autoload when the user scrolls to the bottom of the page or update every so often to show more comments if load more has been clicked or not
  };

  return (
    <div className="rounded-lg boarder p-3">
      <h1 className="text-xl font-semibold mb-5">Your Opinion</h1>
      <div>
      {actionData?.error && ( // Use optional chaining here
          <div className="bg-red-500 text-white p-3 rounded-lg">
            {actionData.error}
        </div>)}
        <Form method="POST">
          <textarea
            name="comment"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent default to stop from adding a new line
                e.currentTarget.form.requestSubmit(); // Submit the form
              }
            }}
            className="w-full border border-teal-500 rounded-lg p-2"
          ></textarea>
          <input type="hidden" name="id" value={data.id} />
          {navigation.state === "submitting" ? (
            <button
              type="submit"
              disabled
              className="bg-teal-800 px-4 py-2 rounded-lg text-white"
            >
              Loading...
            </button>
          ) : (
            <button
              type="submit"
              className="bg-teal-500 px-4 py-2 rounded-lg text-white"
            >
              Submit
            </button>
          )}
        </Form>
        <div className="space-y-4">
          {fetcher.data == undefined
            ? data.map((e, index) => (
                <div
                  key={index}
                  className="border-l-4 border-teal-500 pl-4 py-2 bg-gray-50 rounded"
                >
                  <div className="font-semibold">{e.username}</div>
                  <div className="text-gray-700">{e.text}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(e.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            : fetcher.data.map((e, index) => (
                <div
                  key={index}
                  className="border-l-4 border-teal-500 pl-4 py-2 bg-gray-50 rounded"
                >
                  <div className="font-semibold">{e.username}</div>
                  <div className="text-gray-700">{e.text}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(e.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
        </div>
        {data.length > 29 ? (
          <button
          onClick={handleLoadMore}
          className="mt-4 bg-teal-500 hover:bg-teal-600 px-4 py-2 rounded-lg text-white transition duration-150 ease-in-out"
        >
          Load More
        </button>
        ): null}        
      </div>
    </div>
  );
}
