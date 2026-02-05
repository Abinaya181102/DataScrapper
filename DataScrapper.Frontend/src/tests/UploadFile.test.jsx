import React from "react";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom";
import UploadFile from "../pages/UploadFile";

jest.mock("axios");

const mockMappings = [
  { 
    mappingId: "m1", 
    mappingName: "Invoice Mapping", 
    configJson: JSON.stringify(["InvoiceNo", "Date"]) 
  }
];

describe("UploadFile Component Coverage Improvement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    axios.get.mockResolvedValue({ data: mockMappings });
    axios.post.mockImplementation((url) => {
      if (url.includes("/api/Jobs")) {
        return Promise.resolve({ data: { job_id: "job123" } });
      }
      return Promise.resolve({ data: new Blob() });
    });
    axios.put.mockResolvedValue({ data: {} });
    
    Storage.prototype.getItem = jest.fn(() => JSON.stringify({ user_id: "123" }));
    global.URL.createObjectURL = jest.fn(() => "mock-url");
  });

  afterEach(cleanup);

  const setup = async () => {
    let renderResult;
    await act(async () => {
      renderResult = render(<UploadFile />);
    });
    return renderResult;
  };

  test("handles API failure when fetching mappings", async () => {
    axios.get.mockRejectedValueOnce(new Error("Fetch failed"));
    await setup();
    expect(await screen.findByText(/Failed to load mappings/i)).toBeInTheDocument();
  });

  test("validates missing mapping or files before upload", async () => {
    const { container } = await setup();
    
    const fileInput = container.querySelector('input[type="file"]');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [new File([""], "test.pdf")] } });
    });

    const processBtn = screen.getByRole("button", { name: /Process Files/i });
    fireEvent.click(processBtn);
    
    expect(await screen.findByText(/Please select a mapping/i)).toBeInTheDocument();
  });

  test("handles full successful flow including preview and export", async () => {
    const { container } = await setup();
    
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByText("Invoice Mapping"));

    const fileInput = container.querySelector('input[type="file"]');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [new File([""], "test.pdf")] } });
    });

    fireEvent.click(screen.getByRole("button", { name: /Process Files/i }));

    expect(await screen.findByText(/Extracted Data Preview/i)).toBeInTheDocument();

    const exportBtn = screen.getByRole("button", { name: /Export/i });
    const linkClickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    
    fireEvent.click(exportBtn);
    expect(linkClickSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.queryByText(/Extracted Data Preview/i)).not.toBeInTheDocument();
    });
  });

  test("handles file removal from list", async () => {
    const { container } = await setup();
    const fileInput = container.querySelector('input[type="file"]');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [new File([""], "delete-me.pdf")] } });
    });

    expect(screen.getByText("delete-me.pdf")).toBeInTheDocument();
    
    // MUI CloseIcon is inside an IconButton
    const removeBtn = screen.getByTestId("CloseIcon").parentElement;
    fireEvent.click(removeBtn);

    expect(screen.queryByText("delete-me.pdf")).not.toBeInTheDocument();
  });
});