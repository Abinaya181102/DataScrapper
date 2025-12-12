using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace DataScrapper.Backend.Models
{
    [Table("mappings")]
    public class Mapping
    {
        [Key]
        [Column("mapping_id")]
        public long MappingId { get; set; }

        [Column("mapping_name")]
        public string MappingName { get; set; }

        [Column("description")]
        public string Description { get; set; }

        [Column("config_json")]
        public string ConfigJson { get; set; }

        [Column("user_id")]
        public long UserId { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        // NAVIGATION (optional)
        [JsonIgnore]
        public User? Users { get; set; }

        [JsonIgnore]
        public ICollection<Job>? Jobs { get; set; }
    }
}
