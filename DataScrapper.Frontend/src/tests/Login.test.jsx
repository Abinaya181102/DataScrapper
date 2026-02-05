import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../pages/Login.jsx";
import axios from "axios";
import { BrowserRouter } from "react-router-dom";

jest.mock("axios");

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const renderLogin = () =>
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("renders login form correctly", () => {
    renderLogin();

    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  test("successful login navigates to dashboard", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        user_id: 1,
        email: "test@example.com",
      },
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:5229/api/user/login",
        {
          email: "test@example.com",
          password: "password123",
        }
      );
    });

    expect(localStorage.getItem("user")).toBeTruthy();
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  test("shows error message on invalid credentials", async () => {
    axios.post.mockResolvedValueOnce({
      data: {},
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "wrong@example.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(
      await screen.findByText("Invalid login credentials")
    ).toBeInTheDocument();
  });

  test("shows error message when API call fails", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network error"));

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(
      await screen.findByText("Login failed. Please check your details.")
    ).toBeInTheDocument();
  });

  test("navigates to signup page when Sign up is clicked", () => {
    renderLogin();

    fireEvent.click(screen.getByText("Sign up"));

    expect(mockNavigate).toHaveBeenCalledWith("/signup");
  });
});
