import { useState } from "react";
import { useActionData, Form } from "@remix-run/react";
import {
  json,
  LoaderFunction,
  redirect,
  ActionFunction,
} from "@remix-run/node";
import {
  getSession,
  generateHash,
  validatePasswordChange,
} from "../utils/session.server";
import { db } from "~/utils/db.server";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    return redirect("/login");
  }

  return null;
};

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    return redirect("/login");
  }
  const userId = session.get("userId");
  const form = await request.formData();
  const password = form.get("password");
  const confirmPassword = form.get("confirmPassword");
  const newHash = await generateHash(password);
  const validator = await validatePasswordChange(password, confirmPassword);
  if (validator.isValid == false) {
    return json({ errors: { message: validator.errors } }, { status: 400 });
  }
  if (validator.isValid == true) {
    try {
      await db.users.update({
        where: { id: userId },
        data: { password: newHash },
      });
      return json({ success: "Password updated successfully!" });
    } catch (error) {
      console.error("Error updating password:", error);
      return new Response("Error updating password", { status: 500 });
    }
  }

  return new Response("Unknown action", { status: 400 });
};

function PasswordComplexityMessage({ password, confirmPassword }) {
  const hasLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword;

  if (!password) {
    return null;
  }

  return (
    <div className="text-sm mt-1">
      {!hasLength && <div>Password must be at least 8 characters.</div>}
      {!hasUppercase && <div>Include at least one uppercase letter.</div>}
      {!hasLowercase && <div>Include at least one lowercase letter.</div>}
      {!hasNumber && <div>Include at least one number.</div>}
      {!passwordsMatch && confirmPassword && <div>Passwords must match.</div>}
    </div>
  );
}

export default function AccountPassword() {
  const actionData = useActionData();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  return (
    <div>
      {actionData?.errors && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 my-2 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <ul>
            {actionData.errors.message.map((error, index) => (
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
        className="space-y-6 bg-white border-t shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <div>
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="password"
          >
            New Password:
          </label>
          <input
            type="password"
            name="password"
            id="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter new password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <PasswordComplexityMessage
          password={password}
          confirmPassword={confirmPassword}
        />
        <div>
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="password"
          >
            Confirm Password:
          </label>
          <input
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter new password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <PasswordComplexityMessage
          password={password}
          confirmPassword={confirmPassword}
        />
        <button
          name="action"
          value="updatePassword"
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Update Password
        </button>
      </Form>
    </div>
  );
}
