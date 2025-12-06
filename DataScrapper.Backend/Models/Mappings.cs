namespace DataScrapper.Backend.Models
{
    public class Mapping
    {
        public long Mapping_Id { get; set; }
        public string Mapping_Name { get; set; }
        public string Description { get; set; }
        public string Config_Json { get; set; }
        public long User_Id { get; set; }
        public DateTime Created_At { get; set; }
        public DateTime Updated_At { get; set; }
    }
}
