// utils/auth.js
import {
  getSession,
  validateSessionToken,
  destroySession,
} from "./session.server";
import { redirect } from "@remix-run/node";
import { db } from "./db.server";

async function isAuthenticated(request) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  const token = session.get("token");
  const sessionId = session.get("id");
  if (!userId || !token || !(await validateSessionToken(userId, token))) {
    if (sessionId) {
      await db.session.update({
        where: { userId: userId },
        data: { isValid: false },
      });
    }
    await destroySession(session);
    throw redirect("/login");
  }
  // If everything checks out, the session is considered authenticated
  return true;
}

export default isAuthenticated;

// import isAuthenticated from '../utils/auth';
// import { getSession } from "../utils/session.server";

// try {
//   await isAuthenticated(request);
//   // Continue with loader logic...
// } catch (response) {
//   // isAuthenticated threw a Response, use it directly to redirect or respond
//   return response;
// }

// put in loader
// try {
//   // Await the isAuthenticated function to ensure it completes before proceeding
//   console.log("checking if authenticated")

//   await isAuthenticated(request);
//   console.log("i is authenticated")
// } catch (response) {
//   console.log("not authenticated")

//   // If isAuthenticated throws a Response object, return it directly to trigger a redirect
//   // Note: This assumes isAuthenticated is designed to throw a Response for redirection
//   throw response;
// }
