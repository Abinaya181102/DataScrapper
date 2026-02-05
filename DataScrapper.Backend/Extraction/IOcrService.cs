namespace DataScrapper.Backend.Extraction
{
    public interface IOcrService
    {
        Task<string> ExtractTextAsync(byte[] imageBytes);
    }
}
