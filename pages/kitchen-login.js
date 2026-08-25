// pages/kitchen-login.js
import { useState } from "react";
import { useRouter } from "next/router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../utils/firebaseConfig";
import { STAFF_EMAIL } from "../utils/kitchenAuth";

export default function KitchenLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, STAFF_EMAIL, password);
      router.push("/kitchen");
    } catch (e) {
      setError("Incorrect password.");
      setSubmitting(false);
    }
  };

  return (
    <div className="kitchen-login">
      <form className="kitchen-login__card" onSubmit={handleSubmit}>
        <div className="kitchen-login__header">Kitchen Staff Login</div>
        <div className="kitchen-login__body">
          <label className="kitchen-login__label">
            Staff Password
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="kitchen-login__input"
            />
          </label>
          {error && <div className="kitchen-login__error">{error}</div>}
          <button type="submit" disabled={submitting} className="kitchen-login__submit">
            {submitting ? "Signing In…" : "Sign In"}
          </button>
        </div>
      </form>

      <style jsx>{`
        .kitchen-login {
          min-height: 100vh;
          background: #f1f2f4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-body, "Inter", sans-serif);
        }
        .kitchen-login__card {
          background: #fff;
          width: 100%;
          max-width: 360px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }
        .kitchen-login__header {
          background: #e91e28;
          color: #fff;
          padding: 0.75rem 1rem;
          font-weight: bold;
        }
        .kitchen-login__body {
          padding: 20px;
          display: grid;
          gap: 14px;
        }
        .kitchen-login__label {
          display: grid;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #333;
        }
        .kitchen-login__input {
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 15px;
        }
        .kitchen-login__error {
          color: #b00020;
          font-size: 13px;
          font-weight: 600;
        }
        .kitchen-login__submit {
          background: #289c52;
          color: #fff;
          border: none;
          padding: 10px 14px;
          border-radius: 6px;
          font-weight: 700;
          cursor: pointer;
        }
        .kitchen-login__submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
