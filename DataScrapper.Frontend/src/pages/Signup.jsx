import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      await axios.post("http://localhost:5229/api/user/signup", {
        user_name: username,
        email: email,
        password_hash: password,
      });

      setMsg("Signup successful! Redirecting...");
      setTimeout(() => navigate("/"), 1500);

    } catch (err) {
      if (err.response?.data) setMsg(err.response.data);
      else setMsg("Signup failed. Try again.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Join us to continue</p>

        {msg && <p style={styles.message}>{msg}</p>}

        <form onSubmit={handleSignup} style={{ width: "100%" }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            required
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          <button type="submit" style={styles.button}>
            Sign Up
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account?{" "}
          <span style={styles.link} onClick={() => navigate("/")}>
            Login
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
    width: "450px",
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
    background: "#4F46E5",   // SAME AS LOGIN PAGE
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "10px",
    transition: "0.3s ease",
  },

  message: {
    color: "#10B981",
    background: "#D1FAE5",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "15px",
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
};

export default Signup;
