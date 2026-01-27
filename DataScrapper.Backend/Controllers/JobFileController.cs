using CsvHelper;
using DataScrapper.Backend;
using DataScrapper.Backend.Models;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml; // EPPlus
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Xceed.Words.NET; // DocX
using Syncfusion.Pdf.Parsing;
using Syncfusion.Pdf;

namespace DataScrapper.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobFileController : ControllerBase
    {
        private readonly AppDbContext _context;

        public JobFileController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/JobFile
        [HttpGet]
        public async Task<IActionResult> GetJobFiles()
        {
            var files = await _context.JobFiles.ToListAsync();
            return Ok(files);
        }

        // GET: api/JobFile/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetJobFile(long id)
        {
            var file = await _context.JobFiles.FindAsync(id);
            if (file == null) return NotFound();
            return Ok(file);
        }

        // PUT: api/JobFile/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJobFile(long id, [FromBody] JobFile updatedFile)
        {
            var file = await _context.JobFiles.FindAsync(id);
            if (file == null) return NotFound();

            file.status = updatedFile.status;
            file.error_message = updatedFile.error_message;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/JobFile/upload
        [HttpPost("upload")]
        public async Task<IActionResult> UploadFiles(
            [FromForm] List<IFormFile> files,
            [FromForm] long job_id,
            [FromForm] string mappingJson)
        {
            if (files == null || files.Count == 0)
                return BadRequest("No files uploaded.");

            var jobExists = await _context.Jobs.AnyAsync(j => j.job_id == job_id);
            if (!jobExists)
                return BadRequest($"Job with ID {job_id} does not exist.");

            // Parse mapping JSON
            List<string> mappingFields;
            try
            {
                mappingFields = JsonSerializer.Deserialize<List<string>>(mappingJson) ?? new();
            }
            catch
            {
                return BadRequest("Invalid mapping JSON.");
            }

            var combinedExtractedData = new List<Dictionary<string, string>>();

            foreach (var file in files)
            {
                if (file.Length == 0)
                    continue;

                var tempPath = Path.Combine(
                    Path.GetTempPath(),
                    $"{Guid.NewGuid()}_{file.FileName}"
                );

                using (var stream = new FileStream(tempPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var jobFile = new JobFile
                {
                    job_id = job_id,
                    original_file_name = file.FileName,
                    file_type = Path.GetExtension(file.FileName).ToLower(),
                    file_url = tempPath,
                    status = "processing",
                    created_at = DateTime.UtcNow
                };

                _context.JobFiles.Add(jobFile);
                await _context.SaveChangesAsync();

                try
                {
                    List<Dictionary<string, string>> extractedData = jobFile.file_type switch
                    {
                        ".pdf" => ExtractPdf(tempPath, mappingFields),
                        ".docx" => ExtractWord(tempPath, mappingFields),
                        ".xlsx" => ExtractExcel(tempPath, mappingFields),
                        ".csv" => ExtractCsv(tempPath, mappingFields),
                        _ => throw new Exception("Unsupported file type")
                    };

                    // Add source file name for traceability
                    foreach (var row in extractedData)
                    {
                        row["Source File"] = file.FileName;
                        combinedExtractedData.Add(row);
                    }

                    jobFile.status = "completed";
                }
                catch (Exception ex)
                {
                    jobFile.status = "failed";
                    jobFile.error_message = ex.Message;
                }

                await _context.SaveChangesAsync();
            }

            var excelBytes = GenerateExcel(combinedExtractedData);

            return File(
                excelBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Job_{job_id}_Extracted.xlsx"
            );
        }


        #region File Extractors

        //private List<Dictionary<string, string>> ExtractPdf(string filePath, List<string> mappingFields)
        //{
        //    var result = new List<Dictionary<string, string>>();
        //    if (mappingFields == null || mappingFields.Count == 0)
        //        return result;

        //    // Normalize mapping keys
        //    var normalizedMapping = mappingFields.ToDictionary(m => Normalize(m), m => m);
        //    var data = mappingFields.ToDictionary(f => f, _ => string.Empty);

        //    using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        //    using var pdfDocument = new PdfLoadedDocument(fs);

        //    foreach (PdfLoadedPage page in pdfDocument.Pages)
        //    {
        //        // Extract all text from page
        //        var text = page.ExtractText();

        //        // Split text into lines
        //        var lines = text.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
        //                        .Select(l => l.Trim())
        //                        .Where(l => !string.IsNullOrEmpty(l))
        //                        .ToList();

        //        for (int i = 0; i < lines.Count; i++)
        //        {
        //            string line = lines[i];
        //            string normalizedLine = Normalize(line);

        //            foreach (var map in normalizedMapping)
        //            {
        //                if (!string.IsNullOrEmpty(data[map.Value])) continue;

        //                // Case 1: Field: Value
        //                int colonIndex = line.IndexOf(':');
        //                if (colonIndex > 0 && normalizedLine.Contains(map.Key))
        //                {
        //                    data[map.Value] = line[(colonIndex + 1)..].Trim();
        //                }
        //                // Case 2: Field on one line, value on next line
        //                else if (normalizedLine.Contains(map.Key) && i + 1 < lines.Count)
        //                {
        //                    data[map.Value] = lines[i + 1].Trim();
        //                }
        //            }
        //        }
        //    }

        //    if (data.Values.All(string.IsNullOrEmpty))
        //        return new();

        //    result.Add(data);
        //    return result;
        //}

        private List<Dictionary<string, string?>> ExtractPdf(
    string filePath,
    List<string> mappingFields)
        {
            if (mappingFields == null || mappingFields.Count == 0)
                return new();

            // -----------------------------
            // Normalize mapping fields
            // -----------------------------
            var mappingList = mappingFields
                .Select(m => m.Trim())
                .Where(m => !string.IsNullOrEmpty(m))
                .ToList();

            var normalizedMapping = mappingList
                .ToDictionary(m => NormalizeKey(m), m => m);

            var result = mappingList
                .ToDictionary(m => m, _ => (string?)null);

            using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read);
            using var pdfDocument = new PdfLoadedDocument(fs);

            var allLines = new List<string>();

            // ==============================
            // 1️⃣ Collect ALL lines from ALL pages
            // ==============================
            foreach (PdfLoadedPage page in pdfDocument.Pages)
            {
                var text = page.ExtractText();

                var lines = text
                    .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(CleanText)
                    .Where(l => !string.IsNullOrWhiteSpace(l))
                    .ToList();

                allLines.AddRange(lines);
            }

            // ==============================
            // 2️⃣ Field : Value (same line)
            // ==============================
            foreach (var line in allLines)
            {
                var normalizedLine = NormalizeKey(line);

                foreach (var map in normalizedMapping)
                {
                    if (result[map.Value] != null)
                        continue;

                    var colonIndex = line.IndexOf(':');
                    if (colonIndex > 0 && normalizedLine.StartsWith(map.Key))
                    {
                        var value = line[(colonIndex + 1)..].Trim();
                        if (!string.IsNullOrWhiteSpace(value))
                        {
                            result[map.Value] = value;
                        }
                    }
                }
            }

            // ==============================
            // 3️⃣ Field line → next line value
            // ==============================
            for (int i = 0; i < allLines.Count - 1; i++)
            {
                var currentLine = allLines[i];
                var nextLine = allLines[i + 1];

                var currentNorm = NormalizeKey(currentLine);

                foreach (var map in normalizedMapping)
                {
                    if (result[map.Value] != null)
                        continue;

                    if (currentNorm == map.Key &&
                        !nextLine.Contains(":") &&
                        !string.IsNullOrWhiteSpace(nextLine))
                    {
                        result[map.Value] = nextLine.Trim();
                    }
                }
            }

            // ==============================
            // 4️⃣ TABLE HANDLING (GENERIC)
            // ==============================
            for (int i = 0; i < allLines.Count - 1; i++)
            {
                var headerCols = SplitColumns(allLines[i]);
                var valueCols = SplitColumns(allLines[i + 1]);

                // ------------------------------
                // CASE 1️⃣ LEFT → RIGHT TABLE
                // ------------------------------
                if (headerCols.Count == 2)
                {
                    var keyNorm = NormalizeKey(headerCols[0]);
                    var value = headerCols[1];

                    foreach (var map in normalizedMapping)
                    {
                        if (result[map.Value] != null)
                            continue;

                        if (keyNorm == map.Key || keyNorm.Contains(map.Key))
                        {
                            result[map.Value] =
                                string.IsNullOrWhiteSpace(value) ? null : value;
                            break;
                        }
                    }
                }

                // ------------------------------
                // CASE 2️⃣ HEADER → VALUE TABLE
                // ------------------------------
                if (IsHeaderRow(headerCols, valueCols))
                {
                    for (int c = 0; c < headerCols.Count && c < valueCols.Count; c++)
                    {
                        var headerNorm = NormalizeKey(headerCols[c]);
                        var value = valueCols[c];

                        foreach (var map in normalizedMapping)
                        {
                            if (result[map.Value] != null)
                                continue;

                            if (headerNorm == map.Key || headerNorm.Contains(map.Key))
                            {
                                result[map.Value] =
                                    string.IsNullOrWhiteSpace(value) ? null : value;
                                break;
                            }
                        }
                    }

                    break;
                }
            }

            // ==============================
            // 5️⃣ FINAL REGEX FALLBACK
            // ==============================
            foreach (var map in normalizedMapping)
            {
                if (result[map.Value] != null)
                    continue;

                var regex = new Regex(
                    $@"{Regex.Escape(map.Value)}\s*[:\-]?\s*(.+)",
                    RegexOptions.IgnoreCase);

                foreach (var line in allLines)
                {
                    var match = regex.Match(line);
                    if (match.Success)
                    {
                        result[map.Value] = match.Groups[1].Value.Trim();
                        break;
                    }
                }
            }

            // ==============================
            // 6️⃣ Ensure NULLs (Excel-safe)
            // ==============================
            foreach (var key in mappingList)
            {
                if (string.IsNullOrWhiteSpace(result[key]))
                {
                    result[key] = null;
                }
            }

            if (result.Values.All(v => v == null))
                return new();

            return new List<Dictionary<string, string?>> { result };
        }

        private List<string> SplitColumns(string line)
        {
            return Regex.Split(line, @"\s{2,}")
                .Select(CleanText)
                .Where(c => !string.IsNullOrWhiteSpace(c))
                .ToList();
        }

        private bool IsHeaderRow(List<string> headers, List<string> values)
        {
            if (headers.Count < 2 || headers.Count != values.Count)
                return false;

            bool headersLookLikeHeaders = headers.All(h =>
                h.Length <= 40 &&
                h.Any(char.IsLetter) &&
                !Regex.IsMatch(h, @"\d{3,}"));

            bool valuesLookLikeValues = values.Any(v =>
                v.Length > 15 ||
                Regex.IsMatch(v, @"\d") ||
                v.Contains("@"));

            return headersLookLikeHeaders && valuesLookLikeValues;
        }

        private bool IsMostlyHeaders(List<string> columns)
        {
            return columns.All(c =>
                c.Any(char.IsLetter) &&
                !Regex.IsMatch(c, @"\d"));
        }

        private List<Dictionary<string, string>> ExtractWord( string filePath, List<string> mappingFields)
        {
            if (mappingFields == null || mappingFields.Count == 0)
                return new();

            var mappingList = mappingFields
                .Select(m => m.Trim())
                .Where(m => !string.IsNullOrEmpty(m))
                .ToList();

            var normalizedMapping = mappingList
                .ToDictionary(m => NormalizeKey(m), m => m);

            var result = mappingList.ToDictionary(m => m, _ => string.Empty);

            using var doc = WordprocessingDocument.Open(filePath, false);
            var body = doc.MainDocumentPart?.Document?.Body;
            if (body == null) return new();

            // ==============================
            // 1️⃣ Primary extraction (WORKING)
            // ==============================
            foreach (var table in body.Descendants<Table>())
            {
                var rows = table.Elements<TableRow>().ToList();
                if (rows.Count < 2) continue;

                var firstRowCellCount = rows[0].Elements<TableCell>().Count();

                if (firstRowCellCount == 2)
                {
                    ExtractLeftRightTable(rows, normalizedMapping, result);
                }
            }

            // ==============================
            // 2️⃣ FALLBACK extraction
            // ==============================
            FallbackScanDocumentForMappings(body, normalizedMapping, result);

            if (result.Values.All(string.IsNullOrEmpty))
                return new();

            return new List<Dictionary<string, string>> { result };
        }


        // ================= HELPERS =================

        private void FallbackScanDocumentForMappings(
            Body body,
            Dictionary<string, string> normalizedMapping,
            Dictionary<string, string> result)
        {
            foreach (var table in body.Descendants<Table>())
            {
                var rows = table.Elements<TableRow>().ToList();
                if (rows.Count < 2)
                    continue;

                // Identify header row (first row with multiple non-empty cells)
                var headerRowIndex = -1;

                for (int r = 0; r < rows.Count; r++)
                {
                    var cells = rows[r].Elements<TableCell>()
                        .Select(c => CleanText(c.InnerText))
                        .Where(t => !string.IsNullOrWhiteSpace(t))
                        .ToList();

                    if (cells.Count >= 2)
                    {
                        headerRowIndex = r;
                        break;
                    }
                }

                if (headerRowIndex == -1 || headerRowIndex + 1 >= rows.Count)
                    continue;

                var headerCells = rows[headerRowIndex].Elements<TableCell>().ToList();

                // Find the FIRST data row below header that has real values
                TableRow dataRow = null;
                for (int r = headerRowIndex + 1; r < rows.Count; r++)
                {
                    var hasValue = rows[r].Elements<TableCell>()
                        .Any(c => !string.IsNullOrWhiteSpace(CleanText(c.InnerText)));

                    if (hasValue)
                    {
                        dataRow = rows[r];
                        break;
                    }
                }

                if (dataRow == null)
                    continue;

                var valueCells = dataRow.Elements<TableCell>().ToList();

                // Map header → value by COLUMN INDEX
                for (int c = 0; c < headerCells.Count && c < valueCells.Count; c++)
                {
                    var headerText = CleanText(headerCells[c].InnerText);
                    var normalizedHeader = NormalizeKey(headerText);

                    var valueText = CleanText(valueCells[c].InnerText);
                    if (string.IsNullOrWhiteSpace(valueText))
                        continue;

                    foreach (var map in normalizedMapping)
                    {
                        if (!string.IsNullOrEmpty(result[map.Value]))
                            continue;

                        if (normalizedHeader == map.Key ||
                            normalizedHeader.Contains(map.Key))
                        {
                            result[map.Value] = valueText;
                            break;
                        }
                    }
                }
            }

            // Paragraph fallback ONLY for fields still empty
            FallbackParagraphScan(body, normalizedMapping, result);
        }

        private void FallbackParagraphScan(
            Body body,
            Dictionary<string, string> normalizedMapping,
            Dictionary<string, string> result)
        {
            var paragraphs = body
                .Descendants<Paragraph>()
                .Select(p => CleanText(p.InnerText))
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .ToList();

            for (int i = 0; i < paragraphs.Count; i++)
            {
                var rawLine = paragraphs[i];
                var normalizedLine = NormalizeKey(rawLine);

                foreach (var map in normalizedMapping)
                {
                    if (!string.IsNullOrEmpty(result[map.Value]))
                        continue;

                    if (!(normalizedLine == map.Key || normalizedLine.StartsWith(map.Key)))
                        continue;

                    // RIGHT of colon
                    int colonIndex = rawLine.IndexOf(':');
                    if (colonIndex >= 0)
                    {
                        var rightValue = rawLine[(colonIndex + 1)..].Trim();
                        if (!string.IsNullOrWhiteSpace(rightValue))
                        {
                            result[map.Value] = rightValue;
                            break;
                        }
                    }
                    // BELOW paragraph
                    else if (i + 1 < paragraphs.Count)
                    {
                        var nextLine = paragraphs[i + 1];
                        if (nextLine.Contains(':'))
                            continue;

                        result[map.Value] = nextLine;
                        break;
                    }
                }
            }
        }


        private static string CleanText(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return string.Empty;
            text = text.Replace('\u00A0', ' ');
            text = Regex.Replace(text, @"\s+", " ");
            return text.Trim();
        }


        private void ExtractLeftRightTable( List<TableRow> rows, Dictionary<string, string> normalizedMapping, Dictionary<string, string> result)
        {
            string lastMatchedField = null;

            foreach (var row in rows.Skip(1))
            {
                var cells = row.Elements<TableCell>().ToList();
                if (cells.Count < 2) continue;

                var label = CleanCell(cells[0]);
                var value = string.Join(" ",
                    cells.Skip(1).Select(c => CleanCell(c))
                ).Trim();

                if (string.IsNullOrWhiteSpace(value)) continue;

                if (string.IsNullOrWhiteSpace(label) && lastMatchedField != null)
                {
                    result[lastMatchedField] =
                        (result[lastMatchedField] + " " + value).Trim();
                    continue;
                }

                var labelNorm = NormalizeKey(label);

                foreach (var map in normalizedMapping)
                {
                    if (labelNorm == map.Key || labelNorm.Contains(map.Key))
                    {
                        if (string.IsNullOrEmpty(result[map.Value]))
                        {
                            result[map.Value] = value;
                            lastMatchedField = map.Value;
                        }
                        break;
                    }
                }
            }
        }


        // ================= HELPERS =================

        private static string CleanCell(TableCell cell)
        {
            var txt = cell.InnerText ?? string.Empty;
            txt = txt.Replace('\u00A0', ' ');
            txt = Regex.Replace(txt, @"\s+", " ").Trim();
            return txt;
        }

        private static string NormalizeKey(string s)
        {
            if (string.IsNullOrWhiteSpace(s)) return string.Empty;
            s = s.Replace('\u00A0', ' ');
            s = Regex.Replace(s, @"\s+", " ");
            s = s.Trim().TrimEnd(':');
            s = s.ToLowerInvariant();
            s = Regex.Replace(s, @"[^a-z0-9\s]", "");
            return s.Trim();
        }

        private List<Dictionary<string, string>> ExtractExcel(string filePath, List<string> mappingFields)
        {
            var result = new List<Dictionary<string, string>>();

            using var package = new ExcelPackage(new FileInfo(filePath));
            var sheet = package.Workbook.Worksheets.First();

            int rows = sheet.Dimension.End.Row;
            int cols = sheet.Dimension.End.Column;


            // Normalize mapping fields
            var normalizedMappings = mappingFields.ToDictionary(
                m => Normalize(m),
                m => m
            );

            for (int col = 1; col <= cols; col++)
            {
                var header = sheet.Cells[1, col].Text;
            }

            for (int row = 2; row <= rows; row++)
            {
                var data = new Dictionary<string, string>();

                for (int col = 1; col <= cols; col++)
                {
                    var header = sheet.Cells[1, col].Text;
                    var value = sheet.Cells[row, col].Text;

                    var normalizedHeader = Normalize(header);

                    if (normalizedMappings.TryGetValue(normalizedHeader, out var originalKey))
                    {
                        data[originalKey] = value;
                    }
                }

                if (data.Count > 0)
                    result.Add(data);
            }
            return result;
        }

        private string Normalize(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return "";

            input = input.ToLowerInvariant();
            input = Regex.Replace(input, @"[\s_\-\.]", "");
            return input;
        }

        private List<Dictionary<string, string>> ExtractCsv(string filePath, List<string> mappingFields)
        {
            var result = new List<Dictionary<string, string>>();
            using (var reader = new StreamReader(filePath))
            using (var csv = new CsvReader(reader, CultureInfo.InvariantCulture))
            {
                var records = csv.GetRecords<dynamic>().ToList();
                foreach (var record in records)
                {
                    var dict = (IDictionary<string, object>)record;
                    var data = new Dictionary<string, string>();
                    foreach (var field in mappingFields)
                    {
                        if (dict.ContainsKey(field))
                            data[field] = dict[field]?.ToString();
                    }
                    if (data.Count > 0)
                        result.Add(data);
                }
            }
            return result;
        }


        #endregion

        #region Excel Generator

        private byte[] GenerateExcel(List<Dictionary<string, string>> extractedData)
    {
        // ✅ Set EPPlus non-commercial license before creating ExcelPackage
        ExcelPackage.License.SetNonCommercialPersonal("abi");

        using (var package = new ExcelPackage())
        {
            var ws = package.Workbook.Worksheets.Add("ExtractedData");

            if (extractedData.Count == 0)
            {
                ws.Cells[1, 1].Value = "No matching data found.";
            }
            else
            {
                var headers = extractedData.SelectMany(d => d.Keys).Distinct().ToList();
                for (int i = 0; i < headers.Count; i++)
                    ws.Cells[1, i + 1].Value = headers[i];

                for (int row = 0; row < extractedData.Count; row++)
                {
                    for (int col = 0; col < headers.Count; col++)
                    {
                        extractedData[row].TryGetValue(headers[col], out string value);
                        ws.Cells[row + 2, col + 1].Value = value;
                    }
                }
            }

            return package.GetAsByteArray();
        }
    }


    #endregion
}
}
