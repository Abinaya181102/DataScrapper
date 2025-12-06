namespace DataScrapper.Backend.Models
{
    public class User
    {
        public long User_Id { get; set; }
        public string User_Name { get; set; }
        public string Email { get; set; }
        public string Password_Hash { get; set; }
        public DateTime Created_At { get; set; }
    }
}
