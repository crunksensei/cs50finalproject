import { useActionData, useLoaderData, Form } from "@remix-run/react";
import {
  LoaderFunction,
  redirect,
  ActionFunction,
  json,
} from "@remix-run/node";
import { getSession } from "../utils/session.server";
import { db } from "~/utils/db.server";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    return redirect("/login");
  }
  const userId = session.get("userId");
  const currentName = await db.users.findFirst({
    where: { id: userId },
  });

  return currentName;
};

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    return redirect("/login");
  }
  const userId = session.get("userId");
  const form = await request.formData();
  const newUsername = form.get("username");
  const errors = [];

  if (newUsername == null || newUsername.length === 0) {
    errors.push("Please enter a new username.");
    return { errors: errors };
  }

  const currentName = await db.users.findFirst({
    where: { id: userId },
  });

  const userExists = await db.users.findFirst({
    where: { username: newUsername },
  });
  if (newUsername == currentName?.username) {
    errors.push("Username cannot be the same as current username.");
    return { errors: errors };
  }

  if (newUsername == userExists?.username) {
    errors.push("Username exists");
    return { errors: errors };
  }
  if (errors.length > 0) {
    return {
      errors: errors,
    };
  }
  if (errors.length === 0) {
    try {
      await db.users.update({
        where: { id: userId },
        data: {
          username: newUsername.toLowerCase(),
        },
      });
      return json({ success: "Username updated successfully!" });
    } catch (error) {
      console.error("Error updating username:", error);
      return { errors: errors };
    }
  }
};

export default function Username() {
  const actionData = useActionData();
  const loaderData = useLoaderData();
  return (
    <>
      {actionData?.errors && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 my-2 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <ul>
            {actionData.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {actionData?.success && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded my-2 relative"
          role="alert"
        >
          <strong className="font-bold">Success: </strong>
          <span>{actionData.success}</span>
        </div>
      )}
      <Form
        method="post"
        className="space-y-6 bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          Current Username: {loaderData.username}
        </h1>
        <div>
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="username"
          >
            Username:
          </label>
          <input
            type="text"
            name="username"
            id="username"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="New Username"
          />
        </div>
        <button
          name="action"
          value="updateUsername"
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Update Username
        </button>
      </Form>
    </>
  );
}
