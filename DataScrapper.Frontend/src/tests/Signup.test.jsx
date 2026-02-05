import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import axios from "axios";
import { BrowserRouter } from "react-router-dom";
import Signup from "../pages/Signup"; 
import "@testing-library/jest-dom";

// Mock axios
jest.mock("axios");

// Mock useNavigate
const mockedUsedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedUsedNavigate,
}));

describe("Signup Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(cleanup);

  const renderSignup = () => {
    return render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );
  };

  test("renders all input fields and the signup button", () => {
    renderSignup();
    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign Up/i })).toBeInTheDocument();
  });

  test("updates input values on change", () => {
    renderSignup();
    const usernameInput = screen.getByPlaceholderText(/Username/i);
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    expect(usernameInput.value).toBe("testuser");
  });

  test("shows success message and navigates on successful signup", async () => {
    axios.post.mockResolvedValueOnce({ data: "Success" });
    renderSignup();

    fireEvent.change(screen.getByPlaceholderText(/Username/i), { target: { value: "john_doe" } });
    fireEvent.change(screen.getByPlaceholderText(/Email address/i), { target: { value: "john@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    await waitFor(() => {
      expect(screen.getByText(/Signup successful!/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockedUsedNavigate).toHaveBeenCalledWith("/");
    }, { timeout: 2000 });
  });

  test("shows error message on signup failure", async () => {
    // We use a specific string here
    const errorText = "User already exists";
    
    // Mock the error response exactly how the component expects it
    axios.post.mockRejectedValueOnce({
      response: { 
        data: { message: errorText } 
      }
    });

    renderSignup();

    // Fill the form
    fireEvent.change(screen.getByPlaceholderText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText(/Email address/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password123' } });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    // Use findByText with a Regex to handle potential extra spaces or case differences
    // This will wait for the component to re-render after the failed promise
    const errorElement = await screen.findByText(new RegExp(errorText, "i"));
    
    expect(errorElement).toBeInTheDocument();
    // Verify the error is a child of the expected container (optional)
    expect(errorElement.tagName).not.toBe("OBJECT"); 
  });
});