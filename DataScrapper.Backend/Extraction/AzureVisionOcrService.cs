using Azure.AI.Vision.ImageAnalysis;

namespace DataScrapper.Backend.Extraction
{
    public sealed class AzureVisionOcrService : IOcrService
    {
        private readonly ImageAnalysisClient _client;

        public AzureVisionOcrService(ImageAnalysisClient client)
        {
            _client = client;
        }

        public async Task<string> ExtractTextAsync(byte[] imageBytes)
        {
            var result = await _client.AnalyzeAsync(
                BinaryData.FromBytes(imageBytes),
                VisualFeatures.Read
            );

            return string.Join(
                "\n",
                result.Value.Read.Blocks
                    .SelectMany(b => b.Lines)
                    .Select(l => l.Text)
            );
        }
    }
}
