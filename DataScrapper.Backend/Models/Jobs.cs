using DataScrapper.Backend.Models;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

public class Job
{
    // Auto PK
    [Key]
    public long job_id { get; set; }

    public long user_id { get; set; }
    public long mapping_id { get; set; }

    public string status { get; set; } = "pending";

    public int? uploaded_file_count { get; set; }

    public string? output_file_url { get; set; }
    public string? error_message { get; set; }

    public DateTime created_at { get; set; } = DateTime.Now;
    public DateTime? completed_at { get; set; }

    // ⛔ Tell ASP.NET NOT to validate navigation properties
    [JsonIgnore]
    [ValidateNever]
    public User? Users { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public Mapping? Mappings { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public ICollection<JobFile>? JobFiles { get; set; }
}
