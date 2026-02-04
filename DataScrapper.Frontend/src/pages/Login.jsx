
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("/api/user/login", {
        email: email,
        password_hash: password,
      });

      if (response.data.user_id) {
        localStorage.setItem("user", JSON.stringify(response.data));
        navigate("/dashboard");
      } else {
        setErrorMsg("Invalid login credentials");
      }
    } catch (err) {
      setErrorMsg("Login failed. Please check your details.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Please login to continue</p>

        {errorMsg && <p style={styles.error}>{errorMsg}</p>}

        <form onSubmit={handleLogin} style={{ width: "100%" }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account?{" "}
          <span style={styles.link} onClick={() => navigate("/signup")}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(to right, #eef2ff, #f8fafc)",
    padding: "20px",
  },

  card: {
    width: "360px",
    padding: "35px 30px",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow: "0 8px 25px rgba(0,0,0,0.10)",
    textAlign: "center",
  },

  title: {
    marginBottom: "8px",
    fontSize: "28px",
    fontWeight: "600",
    color: "#111827",
  },

  subtitle: {
    marginBottom: "20px",
    fontSize: "14px",
    color: "#6b7280",
  },

  input: {
    width: "90%",
    padding: "14px",
    margin: "10px 0",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    outline: "none",
    transition: "0.2s",
  },

  button: {
    width: "100%",
    padding: "14px",
    background: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "10px",
    transition: "0.3s ease",
  },

  link: {
    color: "#4F46E5",
    cursor: "pointer",
    fontWeight: "600",
  },

  footerText: {
    marginTop: "15px",
    fontSize: "14px",
    color: "#6b7280",
  },

  error: {
    color: "#dc2626",
    background: "#fee2e2",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "15px",
  },
};

export default Login;
