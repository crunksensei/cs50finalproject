import { Form, Link, useLoaderData } from "@remix-run/react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import {
  getSession,
  generateSecureToken,
  commitSession,
  validateCredentials,
} from "../utils/session.server";
import { db } from "../utils/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.has("userId")) {
    // Redirect to the home page if they are already signed in.
    return redirect("/");
  }

  const data = { error: session.get("error") };
  return json(data, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  const form = await request.formData();
  const email = form.get("email");
  const password = form.get("password");

  const userId = await validateCredentials(email, password);
  if (userId == null) {
    session.flash("error", "Invalid username/password");

    // Redirect back to the login page with errors.
    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  const token = generateSecureToken();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  session.set("userId", userId);
  session.set("token", token);

  const existingSession = await db.session.findFirst({
    where: { userId },
  });
  if (existingSession) {
    // If a session exists, update it with the new token and expiration
    await db.session.update({
      where: { id: existingSession.id },
      data: { token, expires, isValid: true },
    });
  } else {
    // If no session exists, create a new one
    await db.session.create({
      data: { userId, token, expires },
    });
  }

  // Login succeeded, send them to the home page.
  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session, { expires }),
    },
  });
}

export default function Login() {
  const loaderData = useLoaderData();
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          {/* Display the error message if it exists */}
          {loaderData?.error && (
            <div className="text-center text-red-500 font-bold text-2xl">
              {loaderData.error}
            </div>
          )}
        </div>
        <Form method="post" className="mt-8 space-y-6">
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-500 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:bg-teal-500"
            >
              Sign in
            </button>
            <Link to="/register">
              <button className="group relative w-full flex justify-center my-3 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-500 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:bg-teal-500">
                Register
              </button>
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
