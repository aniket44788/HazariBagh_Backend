import express from "express";
import { upload } from "../../utils/multer.js";
import {
  addAddress,
  googleLogin,
  linkEmail,
  linkPhone,
  profile,
  sendOtp,
  updateProfile,
  verifyOtp,
} from "../../controllers/authcontrollers/authcontroller.js";
import { authMiddleware } from "../../middlewares/auth.js";

const userRouter = express.Router();

userRouter.post("/sendotp", sendOtp);
userRouter.post("/verifyotp", verifyOtp);
userRouter.post("/linkemail", authMiddleware, linkEmail);

userRouter.get("/profile", authMiddleware, profile);
userRouter.put(
  "/update-profile",
  upload.single("profile"),
  authMiddleware,
  updateProfile
);
userRouter.post("/linkphone", authMiddleware, linkPhone);

userRouter.post("/google-login", googleLogin);

userRouter.get("/testauth", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";

  res.send(`
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Google Sign-In Test</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body style="font-family: Arial; display:flex; flex-direction:column; gap:16px; padding:24px;">
  
  <h2>Google Sign-In Test Page</h2>

  <h4>Your GOOGLE CLIENT ID:</h4>
  <p>${clientId ? clientId : "❌ MISSING IN SERVER"}</p>

  <div id="g_id_signin"></div>

  <pre id="output" style="background:#f5f5f5;padding:12px;border-radius:6px;"></pre>

  <script>
    const clientId = "${clientId}";

    window.onload = () => {
      if (!clientId) {
        document.getElementById("output").innerText = "ERROR: GOOGLE_CLIENT_ID missing";
        return;
      }

      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });

      google.accounts.id.renderButton(
        document.getElementById("g_id_signin"),
        { theme: "outline", size: "large" }
      );
    };

    function handleCredentialResponse(response) {
      const idToken = response.credential;

      // FRONTEND CONSOLE PRINT
      console.log("ID TOKEN (Frontend Console):", idToken);

      showOutput("ID TOKEN RECEIVED:\\n" + idToken);

      // SEND TO BACKEND
      postIdToken(idToken);
    }

    async function postIdToken(idToken) {
      try {
        const res = await fetch('/user/google-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });

        const data = await res.json();

        console.log("BACKEND RESPONSE:", data);
        showOutput("BACKEND RESPONSE:\\n" + JSON.stringify(data, null, 2));

      } catch (err) {
        showOutput("ERROR SENDING TOKEN:\\n" + err.message);
      }
    }

    function showOutput(text) {
      document.getElementById("output").innerText = text;
    }
  </script>

</body>
</html>
`);
});

userRouter.post("/addaddress" , authMiddleware , addAddress  )



export default userRouter;
