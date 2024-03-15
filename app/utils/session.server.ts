// app/services/session.server.ts
import { createCookieSessionStorage } from "@remix-run/node";
import { db } from "~/utils/db.server"
import bcrypt from "bcryptjs";
import crypto from 'crypto';

// type SessionData = {
//   userId: string;
// };

export function generateSecureToken() {
  return crypto.randomBytes(16).toString('hex'); // Generates a 32-character hex string
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

export async function validateCredentials(email: string, inputPassword: string): Promise<string | null> {
  if (!email || email.length === 0 || !inputPassword || inputPassword.length < 6) {
    return Promise.resolve(null);
  }
  const user = await db.users.findFirst({
    where: {
      email: email,
    }
  })
  if (!user || user == null) {
    return Promise.resolve(null)
  }

  const isMatch = await bcrypt.compare(inputPassword, user.password);
  if (isMatch) {
    return Promise.resolve(user.id);
  }
 
return Promise.resolve(null)
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
  if (session && session.isValid && session.token === token && new Date(session.expires) > new Date()) {
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

export function checkPasswordComplexity(password) {
  const lengthRequirement = /.{6,}/; // At least 8 characters
  const uppercaseRequirement = /[A-Z]/; // At least one uppercase character
  const lowercaseRequirement = /[a-z]/; // At least one lowercase character
  const numberRequirement = /[0-9]/; // At least one number

  const isLongEnough = lengthRequirement.test(password);
  const hasUppercase = uppercaseRequirement.test(password);
  const hasLowercase = lowercaseRequirement.test(password);
  const hasNumber = numberRequirement.test(password);

  const isValid = isLongEnough && hasUppercase && hasLowercase && hasNumber ;

  return {
    isValid,
    errors: {
      length: !isLongEnough,
      uppercase: !hasUppercase,
      lowercase: !hasLowercase,
      number: !hasNumber,
    }
  };
}

export async function hashAndStore(username: string, email: string, password: string){
   bcrypt.hash(password, 10, async function(err, hash) {
    const newUser = await db.users.create({
        data: {
          username: username,
          email: email,
          password: hash,
        },
      });
      const userId = newUser.id;
      return userId;
  });
}




export async function validateRegister(email: string, password: string, confirmPassword: string, username: string) {
  if (!email || email.length === 0 || !password || password.length < 6 || password !== confirmPassword || !username || username.length === 0) {
    return Promise.resolve(false);
  }
  const userExists = await db.users.findFirst({
    where: {
      OR: [
        { email: email },
        { username: username }
      ],
    },
  });
  if (userExists) {
    return Promise.resolve(false);
  }
  return Promise.resolve(true);
}


// you can also export the methods individually for your own usage
export const { getSession, commitSession, destroySession } = sessionStorage;

export type User = {
    email: string;
    token: string;
    };