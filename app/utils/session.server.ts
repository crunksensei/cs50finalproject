import { createCookieSessionStorage } from "@remix-run/node";
import { db } from "~/utils/db.server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export function generateSecureToken() {
  return crypto.randomBytes(16).toString("hex");
}

// export the whole sessionStorage object
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "gameReviews", // use any name you want here
    sameSite: "lax", // this helps with CSRF
    path: "/", // remember to add this so the cookie will work in all routes
    httpOnly: true, // for security reasons, make this cookie http only
    secrets: ["s3cr3t"], // replace this with an actual secret
    secure: process.env.NODE_ENV === "production", // enable this in prod only
  },
});

export async function validateCredentials(
  email: string,
  inputPassword: string
): Promise<string | null> {
  if (
    !email ||
    email.length === 0 ||
    !inputPassword ||
    inputPassword.length < 6
  ) {
    return Promise.resolve(null);
  }
  const user = await db.users.findFirst({
    where: {
      email: email,
    },
  });
  if (!user || user == null) {
    return Promise.resolve(null);
  }

  const isMatch = await bcrypt.compare(inputPassword, user.password);
  if (isMatch) {
    return Promise.resolve(user.id);
  }

  return Promise.resolve(null);
}

export async function addComment(comment: string, userId: string, gameId: string) {
  const username = await db.users.findFirst({
    where: { id: userId },
  });
  if (!username) {
    throw new Error("User not found");
  }
  await db.comment.create({
    data: {
      text: comment,
      username: username.username,
      gameid: gameId,
    },
  });
}

export async function saveSessionToDatabase({ userId, expires, token }) {
  await db.session.create({
    data: {
      userId,
      expires,
      token,
    },
  });
}

export async function validateSessionToken(userId: string, token: string) {
  const session = await db.session.findFirst({
    where: { userId: userId },
  });
  if (
    session &&
    session.isValid &&
    session.token === token &&
    new Date(session.expires) > new Date()
  ) {
    if (!session.isValid) {
      return false;
    }
    // Session is valid
    return true;
  }
  if (session && session.isValid) {
    await db.session.update({
      where: { id: session.id },
      data: {
        isValid: false,
      },
    });
  }

  // Session is invalid
  return false;
}
export async function hashAndStore(
  username: string,
  email: string,
  password: string
) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, async (err, hash) => {
      if (err) {
        reject(err);
        return;
      }
      try {
        const newUser = await db.users.create({
          data: {
            username: username,
            email: email,
            password: hash,
          },
        });
        resolve(newUser.id);
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function generateHash(password: string){
  return bcrypt.hashSync(password, 10);
}

export async function validateRegister(
  email: string,
  username: string,
  password: string,
  confimPassword: string
) {
  if (
    email == null ||
    email.length === 0 ||
    username == null ||
    username.length === 0 ||
    password == null ||
    password.length === 0 ||
    confimPassword == null ||
    confimPassword.length === 0
  ) {
    return {
      isValid: false,
      errors: ["Please complete form fields."],
    };
  }
  const errors = [];
  const userExists = await db.users.findFirst({
    where: {
      OR: [{ email: email }, { username: username }],
    },
  });

  if (userExists) {
    if (userExists.email == email) {
      errors.push("Email exists");
    }
    if (userExists.username == username) {
      errors.push("Username exists");
    }
  }

  if (!/.{8,}/.test(password)) {
    // Corrected to 8 characters
    errors.push("Password must be at least 8 characters long.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number.");
  }
  if (password !== confimPassword) {
    errors.push("Passwords must match.");
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors: errors,
    };
  }
  return { isValid: true };
}

export async function validatePasswordChange(
  password: string,
  confimPassword: string
) {
  if (
    password == null ||
    password.length === 0 ||
    confimPassword == null ||
    confimPassword.length === 0
  ) {
    return {
      isValid: false,
      errors: ["Please complete form fields."],
    };
  }
  const errors = [];
  if (!/.{8,}/.test(password)) {
    // Corrected to 8 characters
    errors.push("Password must be at least 8 characters long.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number.");
  }
  if (password !== confimPassword) {
    errors.push("Passwords must match.");
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors: errors,
    };
  }
  return { isValid: true };
}

// you can also export the methods individually for your own usage
export const { getSession, commitSession, destroySession } = sessionStorage;

export type User = {
  email: string;
  token: string;
};
