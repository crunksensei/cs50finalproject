import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { LoaderFunction, ActionFunctionArgs, redirect } from "@remix-run/node";
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

  const session = await getSession(
    request.headers.get("Cookie")
  );
  if (!session.has("userId")) {
    return redirect("/login");
  }
  const form = await request.formData();
  const comment = form.get("comment");  
  const userId = session.get("userId");
  console.log(comment, typeof comment)
  console.log(userId, typeof userId)
  console.log(params.id, typeof params.id)

  if (!comment || typeof comment != 'string' || !userId || typeof userId != 'string' || !params.id || typeof params.id != 'string') {
    throw new Response("Error posting comment", { status: 500 });
  }
  try{
    await addComment(comment as string, userId as string, params.id as string)
  }catch(e){
    console.log(e)
    throw new Response("User not found / server error", { status: 500 })
  }
  return null;
  // return redirect(`/game/${params.id}/comments`);
}


export const loader: LoaderFunction = async ({ request, params }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const url = new URL(request.url);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  
  const data: Comments[] = await db.comment.findMany({
    where: {
      gameid: params.id,
    },
    take: 30, // Number of comments to take
    skip: offset, // Skip the number of comments based on the offset
    orderBy: {
      timestamp: 'desc',
    },
  });

  return data;
};

export default function Comments() {
  const data = useLoaderData<Comments[]>();
  const navigation = useNavigation();

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
          {navigation.state === 'submitting' ? (
            <button
            type="submit"
            disabled
            className="bg-teal-800 px-4 py-2 rounded-lg text-white"
          >
            Loading...
          </button>
            ): (
              <button
            type="submit"
            className="bg-teal-500 px-4 py-2 rounded-lg text-white"
          >
            Submit
          </button>
            )}
        </Form>
        <div className="space-y-4">
        {data.map((e, index) => (
          <div key={index} className="border-l-4 border-teal-500 pl-4 py-2 bg-gray-50 rounded">
            <div className="font-semibold">{e.username}</div>
            <div className="text-gray-700">{e.text}</div>
            <div className="text-xs text-gray-500">{new Date(e.timestamp).toLocaleString()}</div>
          </div>
        ))}
      </div>
        <div className="mt-5 flex flex-col gap-y-3"></div>
      </div>
    </div>
  );
}
