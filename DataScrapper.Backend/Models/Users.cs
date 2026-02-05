using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace DataScrapper.Backend.Models
{
    public class User
    {
        [Key]
        public long user_id { get; set; }          // user_id (PK)

        public string user_name { get; set; }      // user_name
        public string email { get; set; }          // email
        public string password_hash { get; set; }  // password_hash
        public DateTime created_at { get; set; }   // created_at

        [JsonIgnore]
        public ICollection<Job>? Jobs { get; set; }
    }
}
