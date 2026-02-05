using DataScrapper.Backend.Extraction;
using System.Drawing;
using Tesseract;

public sealed class TesseractOcrService : IOcrService
{
    private readonly string _tessDataPath;

    public TesseractOcrService(string tessDataPath)
    {
        _tessDataPath = tessDataPath;
    }

    public Task<string> ExtractTextAsync(byte[] imageBytes)
    {
        using var engine = new TesseractEngine(_tessDataPath, "eng", EngineMode.Default);
        using var ms = new MemoryStream(imageBytes);
        using var bmp = new Bitmap(ms);
        using var pix = PixConverter.ToPix(bmp);

        using var page = engine.Process(pix);
        return Task.FromResult(page.GetText());
    }
}
