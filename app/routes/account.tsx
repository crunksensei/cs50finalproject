import { useState } from "react";
import { useActionData, useLoaderData } from "@remix-run/react";
import { json, LoaderFunction, redirect, ActionFunction } from "@remix-run/node";
import { getSession, generateHash, validatePasswordChange } from "../utils/session.server";
import { db } from "~/utils/db.server";


// Define a loader to fetch user data and reviewed games
export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    return redirect("/login");
  }
  const userId = session.get("userId");

  // Placeholder for fetching user info and reviewed games, replace with actual fetch calls
  const userInfo = await db.users.findFirst({
    where: { id: userId },
  }); 
  const reviewedGames = []; // Fetch reviewed games by the user

  return json({ userInfo, reviewedGames });
};

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "updateUsername") {
    // Handle username update
    const username = formData.get("username");
    // Perform your update logic here
    try {
      await db.user.update({
        where: { id: userId },
        data: { username },
      });
      return redirect('/success-username');
    } catch (error) {
      console.error('Error updating username:', error);
      return new Response("Error updating username", { status: 500 });
    }
  } else if (action === "updatePassword") {
    // Handle password update
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");
    const newHash = await generateHash(password);
    console.log('newhash hash', newHash)
    const validator = await validatePasswordChange( password, confirmPassword);
    if (validator.isValid == false) {
        return json({ errors: { message: validator.errors } }, { status: 400 });
    }
    if (validator.isValid == true){
     try {
      await db.users.update({
        where: { id: userId },
        data: { password: newHash },
      });
      return redirect('/success-password');
        return null
    } catch (error) {
      console.error('Error updating password:', error);
      return new Response("Error updating password", { status: 500 });
    }
}
  }

  // Default response for unknown action
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


export default function Account() {
  const { userInfo, reviewedGames } = useLoaderData();
  const [activeTab, setActiveTab] = useState('updateUsername');
  const actionData = useActionData();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
//   const handleSubmit = async (event) => {
//     event.preventDefault(); // Prevent the default form submission
  
//     const formData = new FormData(event.currentTarget); // Assuming your form has `ref={formRef}`
  
//     // Use fetch API to submit formData to the server without refreshing the page
//     const response = await fetch('/account', {
//       method: 'POST',
//       body: formData,
//     });
  
//     // Handle response
//     if (response.ok) {
//       // Update UI based on successful submission
//     } else {
//       // Handle errors
//     }
//   };

  return (    
    <div className="bg-white py-6 sm:py-8 lg:py-12">
      <div className="mx-auto max-w-screen-md px-4 md:px-8">
        <div className="mb-4 flex justify-center gap-12">
          <button onClick={() => setActiveTab('updateUsername')} className="px-4 py-2 bg-teal-500 text-white rounded-lg">
            Update Username
          </button>
          <button onClick={() => setActiveTab('updatePassword')} className="px-4 py-2 bg-teal-500 text-white rounded-lg">
            Update Password
          </button>
          <button onClick={() => setActiveTab('reviewedGames')} className="px-4 py-2 bg-teal-500 text-white rounded-lg">
            Reviewed Games
          </button>
        </div>
        {actionData?.errors && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <ul>
            {actionData.errors.message.map((error, index) => (
                <li key={index}>{error}</li>
            ))}
            </ul>
        </div>
        )}

        {activeTab === 'updateUsername' && (
          <form method="post" className="space-y-6 bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Current Username: {userInfo.username}</h1>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
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
        </form>
        
        )}
        {activeTab === 'updatePassword' && (
        
          <form method="post" className="space-y-6 bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              New Password:
            </label>
            <input
              type="password"
              name="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter new password"
              onChange={e => setPassword(e.target.value)}
            />
          </div>
        <PasswordComplexityMessage password={password} confirmPassword={confirmPassword} />
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Confirm Password:
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter new password"
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
          <PasswordComplexityMessage password={password} confirmPassword={confirmPassword} />
          <button
            name="action"
            value="updatePassword"            
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Update Password
          </button>
        </form>
        
        )}
        
        {activeTab === 'reviewedGames' && reviewedGames.length > 0 && (
          <div>
            <h1 className="text-xl font-semibold text-gray-900 mb-4">Reviewed Games</h1>
            <div className="space-y-4">
              {reviewedGames?.map((game, index) => (
                <div key={index} className="border-l-4 border-teal-500 pl-4 py-2 bg-gray-50 rounded">
                  <div className="font-semibold">{game.name}</div>
                  <div className="text-gray-700">{game.review}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(game.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



