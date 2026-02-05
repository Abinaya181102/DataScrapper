import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import axios from "axios";
import Dashboard from "../pages/Dashboard";
import "@testing-library/jest-dom";

// Mock axios
jest.mock("axios");

describe("Dashboard Component", () => {
  const mockUserId = "123";
  const mockUserJobs = [
    { id: 1, status: "completed" },
    { id: 2, status: "completed" },
    { id: 3, status: "pending" },
    { id: 4, status: "COMPLETED" }, // Check case sensitivity
  ];

  const mockDashboardStats = {
    totalJobs: 10,
    totalMappings: 5,
    successRate: 85,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock LocalStorage
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue(JSON.stringify({ user_id: mockUserId })),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Setup default successful responses for all 3 calls
    axios.get.mockImplementation((url) => {
      if (url.includes("/stats/dashboard")) {
        return Promise.resolve({ data: mockDashboardStats });
      }
      if (url.includes("/stats/success-rate")) {
        return Promise.resolve({ data: { successRate: 85 } });
      }
      if (url.includes(`/api/jobs/user/${mockUserId}`)) {
        return Promise.resolve({ data: mockUserJobs });
      }
      return Promise.resolve({ data: [] });
    });
  });

  test("renders dashboard header and welcome message", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome to DataScrapper/i)).toBeInTheDocument();
  });

  test("fetches stats and job files to display correct counts", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // 1. Check Files Processed (3 completed in mockUserJobs)
    const filesCount = await screen.findByText("3");
    expect(filesCount).toBeInTheDocument();

    // 2. Check Fields Mapped (from stats.totalMappings)
    expect(screen.getByText("5")).toBeInTheDocument();

    // 3. Check Active Jobs (from stats.totalJobs)
    expect(screen.getByText("10")).toBeInTheDocument();

    // 4. Check Success Rate
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  test("handles individual API errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
    // Fail only the dashboard stats call
    axios.get.mockImplementation((url) => {
      if (url.includes("/stats/dashboard")) {
        return Promise.reject(new Error("Dashboard Error"));
      }
      return Promise.resolve({ data: {} });
    });

    await act(async () => {
      render(<Dashboard />);
    });

    // Ensure the app doesn't crash and defaults to 0
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Dashboard stats error"), expect.any(Error));
    });

    // Total Mappings should default to 0
    const mappingCount = screen.queryByText("5");
    expect(mappingCount).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  test("renders all quick action cards", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    expect(screen.getByText("Upload Files")).toBeInTheDocument();
    expect(screen.getByText("Field Mapping")).toBeInTheDocument();
    expect(screen.getByText("View Logs")).toBeInTheDocument();
  });

  test("does not fetch jobs if user is not in localStorage", async () => {
    window.localStorage.getItem.mockReturnValue(null);

    await act(async () => {
      render(<Dashboard />);
    });

    // The user-specific jobs endpoint should not have been called
    const jobApiCalled = axios.get.mock.calls.some(call => call[0].includes("/api/jobs/user/"));
    expect(jobApiCalled).toBe(false);
  });
});