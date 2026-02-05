import React from "react";
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom";
import MappingPage from "../pages/Mapping";

jest.mock("axios");

const mockUser = { user_id: "123" };
const mockMappings = [
  {
    mappingId: 1,
    mappingName: "Invoice Template",
    description: "Standard invoice mapping",
    configJson: JSON.stringify(["Amount", "Date"]),
  },
];

describe("MappingPage Component", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: { getItem: jest.fn(() => JSON.stringify(mockUser)) },
      writable: true,
    });

    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: mockMappings });
    axios.post.mockResolvedValue({ data: { success: true } });
    axios.put.mockResolvedValue({ data: { success: true } });
  });

  afterEach(cleanup);

  test("displays the list of mappings", async () => {
    await act(async () => render(<MappingPage />));

    await waitFor(() => {
      expect(screen.getByText("Invoice Template")).toBeInTheDocument();
    });
  });

  test("handles empty mapping list", async () => {
    axios.get.mockResolvedValue({ data: [] });

    await act(async () => render(<MappingPage />));

    await waitFor(() => {
      expect(screen.getByText(/no mappings found/i)).toBeInTheDocument();
    });
  });

  test("handles edit mode", async () => {
    await act(async () => render(<MappingPage />));

    const editBtn = await screen.findByLabelText("edit-mapping-1");
    await act(async () => fireEvent.click(editBtn));

    expect(screen.getByLabelText("edit-mapping-title")).toBeInTheDocument();
  });

  test("adds a new field", async () => {
    await act(async () => render(<MappingPage />));
    const editBtn = await screen.findByLabelText("edit-mapping-1");
    await act(async () => fireEvent.click(editBtn));

    const addBtn = screen.getByLabelText("add-empty-field");
    await act(async () => fireEvent.click(addBtn));

    const inputs = screen.getAllByPlaceholderText("Enter field name");
    expect(inputs.length).toBe(3);
  });

  test("removes a field correctly", async () => {
    await act(async () => render(<MappingPage />));
    const editBtn = await screen.findByLabelText("edit-mapping-1");
    await act(async () => fireEvent.click(editBtn));

    const deleteBtn = screen.getByLabelText("delete-field-0");
    await act(async () => fireEvent.click(deleteBtn));

    expect(screen.queryByDisplayValue("Amount")).not.toBeInTheDocument();
  });

  test("saves edited mapping successfully", async () => {
    await act(async () => render(<MappingPage />));
    const editBtn = await screen.findByLabelText("edit-mapping-1");
    await act(async () => fireEvent.click(editBtn));

    const saveBtn = screen.getByLabelText("save-mapping");
    await act(async () => fireEvent.click(saveBtn));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining("/mapping/1"),
        expect.any(Object)
      );
    });
  });

  test("handles save error gracefully", async () => {
    axios.put.mockRejectedValueOnce(new Error("Network Error"));

    await act(async () => render(<MappingPage />));
    const editBtn = await screen.findByLabelText("edit-mapping-1");
    await act(async () => fireEvent.click(editBtn));

    const saveBtn = screen.getByLabelText("save-mapping");
    await act(async () => fireEvent.click(saveBtn));

    await waitFor(() => {
      expect(screen.getByText(/failed to save mapping/i)).toBeInTheDocument();
    });
  });

  test("handles fetch error gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network Error"));

    await act(async () => render(<MappingPage />));

    await waitFor(() => {
      expect(screen.getByText(/failed to load mappings/i)).toBeInTheDocument();
    });
  });

  test("adds multiple fields and removes the last one", async () => {
    await act(async () => render(<MappingPage />));
    const editBtn = await screen.findByLabelText("edit-mapping-1");
    await act(async () => fireEvent.click(editBtn));

    const addBtn = screen.getByLabelText("add-empty-field");
    await act(async () => {
      fireEvent.click(addBtn);
      fireEvent.click(addBtn);
    });

    let inputs = screen.getAllByPlaceholderText("Enter field name");
    expect(inputs.length).toBe(4);

    const deleteBtn = screen.getByLabelText("delete-field-3");
    await act(async () => fireEvent.click(deleteBtn));

    inputs = screen.getAllByPlaceholderText("Enter field name");
    expect(inputs.length).toBe(3);
  });
});
