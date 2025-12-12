using CsvHelper;
using DataScrapper.Backend;
using DataScrapper.Backend.Models;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml; // EPPlus
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Xceed.Words.NET; // DocX
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

            using (PdfDocument pdf = PdfDocument.Open(filePath))
            {
                foreach (var page in pdf.GetPages())
                {
                    string text = page.Text;
                    var data = new Dictionary<string, string>();
                    foreach (var field in mappingFields)
                    {
                        if (text.Contains(field))
                            data[field] = ExtractFieldValue(text, field);
                    }
                    if (data.Count > 0)
                        result.Add(data);
                }
            }

            return result;
        }

        private List<Dictionary<string, string>> ExtractWord(string filePath, List<string> mappingFields)
        {
            var result = new List<Dictionary<string, string>>();
            using (var doc = DocX.Load(filePath))
            {
                string text = doc.Text;
                var data = new Dictionary<string, string>();
                foreach (var field in mappingFields)
                {
                    if (text.Contains(field))
                        data[field] = ExtractFieldValue(text, field);
                }
                if (data.Count > 0)
                    result.Add(data);
            }
            return result;
        }

        private List<Dictionary<string, string>> ExtractExcel(string filePath, List<string> mappingFields)
        {
            var result = new List<Dictionary<string, string>>();

            using (var package = new ExcelPackage(filePath))
            {
                var sheet = package.Workbook.Worksheets.First();
                int colCount = sheet.Dimension.End.Column;
                int rowCount = sheet.Dimension.End.Row;

                for (int row = 2; row <= rowCount; row++) // assuming first row header
                {
                    var data = new Dictionary<string, string>();
                    for (int col = 1; col <= colCount; col++)
                    {
                        var header = sheet.Cells[1, col].Text;
                        if (mappingFields.Contains(header))
                            data[header] = sheet.Cells[row, col].Text;
                    }
                    if (data.Count > 0)
                        result.Add(data);
                }
            }
            return result;
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

        private string ExtractFieldValue(string text, string fieldName)
        {
            if (string.IsNullOrEmpty(text) || string.IsNullOrEmpty(fieldName))
                return "";

            // Normalize whitespace: replace multiple spaces, tabs, newlines with a single space
            text = System.Text.RegularExpressions.Regex.Replace(text, @"\s+", " ");

            // Pattern: field name optionally followed by colon/dash, then capture value
            // Stops at two or more spaces (common table separator), end of text, or a pipe '|'
            string pattern = $@"{System.Text.RegularExpressions.Regex.Escape(fieldName)}\s*[:\-]?\s*(.+?)(?=\s{{2,}}|\||$)";

            var match = System.Text.RegularExpressions.Regex.Match(text, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            if (match.Success)
            {
                string value = match.Groups[1].Value.Trim();
                // Limit value length to avoid grabbing too much text accidentally
                if (value.Length > 200) value = value.Substring(0, 200).Trim();
                return value;
            }

            // Fallback: if fieldName is followed by a space, take next word or characters
            int index = text.IndexOf(fieldName, StringComparison.OrdinalIgnoreCase);
            if (index >= 0 && index + fieldName.Length < text.Length)
            {
                string remainder = text.Substring(index + fieldName.Length).TrimStart(':', '-', ' ');
                int end = remainder.IndexOfAny(new char[] { ' ', '|', '\n', '\r' });
                if (end > 0)
                    remainder = remainder.Substring(0, end).Trim();
                return remainder;
            }

            return ""; // Not found
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
