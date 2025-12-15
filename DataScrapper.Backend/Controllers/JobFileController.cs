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
        public async Task<IActionResult> UploadFile([FromForm] IFormFile file, [FromForm] long job_id, [FromForm] string mappingJson)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            // Verify that the job exists
            var jobExists = await _context.Jobs.AnyAsync(j => j.job_id == job_id);
            if (!jobExists)
                return BadRequest($"Job with ID {job_id} does not exist.");

            // Save file temporarily
            var tempPath = Path.Combine(Path.GetTempPath(), file.FileName);
            using (var stream = new FileStream(tempPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Create JobFile record - only set job_id, do not assign Jobs navigation property
            var jobFile = new JobFile
            {
                job_id = job_id,
                original_file_name = file.FileName,
                file_type = Path.GetExtension(file.FileName).ToLower(),
                file_url = tempPath,
                status = "processing",
                created_at = DateTime.UtcNow
            };

            try
            {
                _context.JobFiles.Add(jobFile);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException dbEx)
            {
                return StatusCode(500, $"Database error while saving JobFile: {dbEx.InnerException?.Message ?? dbEx.Message}");
            }

            // Parse mapping JSON
            List<string> mappingFields;
            try
            {
                mappingFields = JsonSerializer.Deserialize<List<string>>(mappingJson) ?? new List<string>();
            }
            catch
            {
                return BadRequest("Invalid mapping JSON.");
            }

            // Extract data from file
            List<Dictionary<string, string>> extractedData = new List<Dictionary<string, string>>();
            try
            {
                switch (jobFile.file_type)
                {
                    case ".pdf":
                        extractedData = ExtractPdf(tempPath, mappingFields);
                        break;
                    case ".docx":
                        extractedData = ExtractWord(tempPath, mappingFields);
                        break;
                    case ".xlsx":
                        extractedData = ExtractExcel(tempPath, mappingFields);
                        break;
                    case ".csv":
                        extractedData = ExtractCsv(tempPath, mappingFields);
                        break;
                    default:
                        throw new Exception("Unsupported file type.");
                }

                jobFile.status = "completed";
            }
            catch (Exception ex)
            {
                jobFile.status = "failed";
                jobFile.error_message = ex.Message;
            }

            // Save final status
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException dbEx)
            {
                return StatusCode(500, $"Database error while updating JobFile status: {dbEx.InnerException?.Message ?? dbEx.Message}");
            }

            // Generate Excel for extracted fields
            var excelBytes = GenerateExcel(extractedData);

            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"{Path.GetFileNameWithoutExtension(file.FileName)}_Extracted.xlsx");
        }


        #region File Extractors

        private List<Dictionary<string, string>> ExtractPdf(string filePath, List<string> mappingFields)
        {
            var result = new List<Dictionary<string, string>>();

            // Load the PDF document
            using FileStream fs = new FileStream(filePath, FileMode.Open, FileAccess.Read);
            using PdfLoadedDocument pdfDocument = new PdfLoadedDocument(fs);

            // Extract text from all pages
            StringBuilder fullTextBuilder = new StringBuilder();
            foreach (PdfLoadedPage page in pdfDocument.Pages)
            {
                fullTextBuilder.AppendLine(page.ExtractText());
            }

            string fullText = fullTextBuilder.ToString();

            // Normalize whitespace
            fullText = Regex.Replace(fullText, @"\s+", " ").Trim();

            var data = new Dictionary<string, string>();

            foreach (var field in mappingFields)
            {
                string value = ExtractFieldValue(fullText, field);
                if (!string.IsNullOrWhiteSpace(value))
                    data[field] = value;
            }

            if (data.Count > 0)
                result.Add(data);

            return result;
        }
        private string ExtractFieldValue(string text, string fieldName)
        {
            if (string.IsNullOrWhiteSpace(text) || string.IsNullOrWhiteSpace(fieldName))
                return "";

            string pattern = $@"{Regex.Escape(fieldName)}\s*[:\-]?\s*(.+?)(?=\s+[A-Z][a-zA-Z ]{{2,}}|\s*$)";

            var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);

            if (match.Success)
                return match.Groups[1].Value.Trim();

            return "";
        }

        private List<Dictionary<string, string>> ExtractWord(string filePath, List<string> mappingFields)
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

            var table = body.Descendants<Table>().FirstOrDefault();
            if (table == null) return new();

            string lastMatchedField = null;

            foreach (var row in table.Elements<TableRow>().Skip(1)) // skip header row
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

            if (result.Values.All(string.IsNullOrEmpty))
                return new();

            return new List<Dictionary<string, string>> { result };
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
