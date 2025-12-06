namespace DataScrapper.Backend.Models
{
    public class Job
    {
        public long Job_Id { get; set; }
        public long User_Id { get; set; }
        public long Mapping_Id { get; set; }
        public string Status { get; set; }
        public int? Uploaded_File_Count { get; set; }
        public string Output_File_Url { get; set; }
        public string Error_Message { get; set; }
        public DateTime Created_At { get; set; }
        public DateTime? Completed_At { get; set; }
    }

}
