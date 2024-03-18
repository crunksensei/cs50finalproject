// app/routes/logout.tsx
import { redirect } from "@remix-run/node";
import { destroySession, getSession } from "~/utils/session.server";
import { db } from "../utils/db.server";

export const action = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));

  // Invalidate the session in the database if necessary
  // Assuming you have a token or session ID stored in your session to identify the DB record
  const token = session.get("token");
  console.log(token);
  if (token) {
    console.log("invalidating session");
    await db.session.update({
      where: { token: token },
      data: { isValid: false },
    });
  }
  console.log("destroying session");
  // Destroy the session cookie
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
};
