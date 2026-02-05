using WTable = DocumentFormat.OpenXml.Wordprocessing.Table;
using WTableRow = DocumentFormat.OpenXml.Wordprocessing.TableRow;
using WTableCell = DocumentFormat.OpenXml.Wordprocessing.TableCell;
using WParagraph = DocumentFormat.OpenXml.Wordprocessing.Paragraph;
using Body = DocumentFormat.OpenXml.Wordprocessing.Body;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
//using DocumentFormat.OpenXml.Drawing;
using System.Text.RegularExpressions;

namespace DataScrapper.Backend.Extraction
{
    public sealed class WordExtractionPipeline
    {
        private readonly List<string> _fields;
        private readonly Dictionary<string, string?> _result;
        private readonly IOcrService? _ocr;

        public WordExtractionPipeline(
            List<string> mappingFields,
            IOcrService? ocrService = null)
        {
            _fields = mappingFields;
            _result = mappingFields.ToDictionary(f => f, _ => (string?)null);
            _ocr = ocrService;
        }

        // ================= ENTRY =================
        public List<Dictionary<string, string>> Extract(string filePath)
        {
            return ExtractAsync(filePath).GetAwaiter().GetResult();
        }

        public async Task<List<Dictionary<string, string>>> ExtractAsync(string filePath)
        {
            using var doc = WordprocessingDocument.Open(filePath, false);
            var body = doc.MainDocumentPart?.Document?.Body;
            if (body == null)
                return BuildResult();

            ExtractFromTables(body);
            ExtractFromParagraphs(body);

            // 🔻 OCR LAST (only if still missing fields)
            if (_ocr != null && _result.Values.Any(v => v == null))
                await ExtractFromImagesAsync(doc);

            return BuildResult();
        }

        // ================= TABLES =================

        private void ExtractFromTables(Body body)
        {
            foreach (var table in body.Descendants<WTable>())
            {
                var rows = table.Elements<WTableRow>().ToList();
                if (!rows.Any()) continue;

                var headers = rows[0].Elements<WTableCell>()
                    .Select(c => Clean(c.InnerText))
                    .ToList();

                if (LooksLikeHeaderRow(headers))
                {
                    foreach (var row in rows.Skip(1))
                    {
                        var values = row.Elements<TableCell>()
                            .Select(c => Clean(c.InnerText))
                            .ToList();

                        if (values.All(string.IsNullOrWhiteSpace)) continue;

                        for (int i = 0; i < headers.Count && i < values.Count; i++)
                            AssignIfEmpty(headers[i], values[i]);

                        break;
                    }
                }

                foreach (var row in rows)
                {
                    var cells = row.Elements<TableCell>()
                        .Select(c => Clean(c.InnerText))
                        .Where(t => !string.IsNullOrWhiteSpace(t))
                        .ToList();

                    for (int i = 0; i < cells.Count - 1; i++)
                        AssignIfEmpty(cells[i], cells[i + 1]);
                }
            }
        }

        // ================= PARAGRAPHS =================

        private void ExtractFromParagraphs(Body body)
        {
            var lines = body.Descendants<Paragraph>()
                .Select(p => Clean(p.InnerText))
                .Where(l => !string.IsNullOrWhiteSpace(l))
                .ToList();

            foreach (var line in lines)
            {
                var idx = line.IndexOf(':');
                if (idx < 1) continue;

                AssignIfEmpty(line[..idx], line[(idx + 1)..]);
            }
        }

        // ================= OCR =================

        private async Task ExtractFromImagesAsync(WordprocessingDocument doc)
        {
            foreach (var imagePart in doc.MainDocumentPart!.ImageParts)
            {
                if (_result.Values.All(v => v != null))
                    return;

                using var ms = new MemoryStream();
                await imagePart.GetStream().CopyToAsync(ms);

                var text = await _ocr!.ExtractTextAsync(ms.ToArray());
                ExtractFromOcrText(text);
            }
        }

        private void ExtractFromOcrText(string text)
        {
            var lines = text.Split('\n')
                .Select(Clean)
                .Where(l => !string.IsNullOrWhiteSpace(l));

            foreach (var line in lines)
            {
                var idx = line.IndexOf(':');
                if (idx < 1) continue;

                AssignIfEmpty(line[..idx], line[(idx + 1)..]);
            }
        }

        // ================= CORE =================

        //private void AssignIfEmpty(string rawKey, string rawValue)
        //{
        //    if (string.IsNullOrWhiteSpace(rawKey) ||
        //        string.IsNullOrWhiteSpace(rawValue))
        //        return;

        //    var docKey = Normalize(rawKey);

        //    foreach (var field in _fields)
        //    {
        //        if (_result[field] != null) continue;

        //        if (docKey.Contains(Normalize(field)))
        //        {
        //            _result[field] = rawValue.Trim();
        //            return;
        //        }
        //    }
        //}

        private void AssignIfEmpty(string rawKey, string rawValue)
        {
            if (string.IsNullOrWhiteSpace(rawKey) ||
                string.IsNullOrWhiteSpace(rawValue))
                return;

            var docKey = Normalize(rawKey);

            foreach (var field in _fields)
            {
                if (_result[field] != null)
                    continue;

                var normalizedField = Normalize(field);

                // ✅ EXACT match only (case-insensitive, normalized)
                if (string.Equals(docKey, normalizedField, StringComparison.Ordinal))
                {
                    _result[field] = rawValue.Trim();
                    return;
                }
            }
        }


        // ================= OUTPUT =================

        private List<Dictionary<string, string>> BuildResult()
        {
            return new List<Dictionary<string, string>>
            {
                _fields.ToDictionary(
                    f => f,
                    f => _result[f] ?? string.Empty
                )
            };
        }

        // ================= HELPERS =================

        private static bool LooksLikeHeaderRow(List<string> cells)
        {
            return cells.Count >= 2 &&
                   cells.All(c =>
                       c.Any(char.IsLetter) &&
                       c.Length < 50 &&
                       !Regex.IsMatch(c, @"\d{3,}")
                   );
        }

        private static string Clean(string text)
        {
            text ??= "";
            text = text.Replace('\u00A0', ' ');
            return Regex.Replace(text, @"\s+", " ").Trim();
        }

        private static string Normalize(string s)
        {
            s ??= "";
            s = s.ToLowerInvariant();
            s = Regex.Replace(s, @"[^a-z0-9\s]", "");
            return Regex.Replace(s, @"\s+", " ").Trim();
        }
    }
}
