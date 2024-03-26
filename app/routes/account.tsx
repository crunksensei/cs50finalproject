import { Link, Outlet } from "@remix-run/react";
import {
  json,
  LoaderFunction,
  redirect,
  ActionFunction,
} from "@remix-run/node";
import { getSession } from "../utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    return redirect("/login");
  }

  return json(session);
};

export default function Account() {
  return (
    <div className="bg-white py-6 sm:py-8 lg:py-12">
      <div className="mx-auto max-w-screen-md px-4 md:px-8">
        <div className="mb-4 flex justify-center gap-12">
          <Link
            prefetch="intent"
            to="/account/username"
            className="text-2xl font-semibold"
          >
            <button className="px-2 py-1 bg-teal-500 text-white text-sm md:px-4 md:py-2 md:text-base rounded-lg">
              Update Username
            </button>
          </Link>
          <Link
            prefetch="intent"
            to="/account/password"
            className="text-2xl font-semibold"
          >
            <button className="px-2 py-1 bg-teal-500 text-white text-sm md:px-4 md:py-2 md:text-base rounded-lg">
              Update Password
            </button>
          </Link>
          <Link
            prefetch="intent"
            to="/account/reviewed"
            className="text-2xl font-semibold"
          >
            <button className="px-2 py-1 bg-teal-500 text-white text-sm md:px-4 md:py-2 md:text-base rounded-lg">
              Reviewed Games
            </button>
          </Link>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
