using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace DataScrapper.Backend.Models
{
    [Table("jobFiles")]
    public class JobFile
    {
        [Key]
        public long file_id { get; set; }

        public long job_id { get; set; }

        public string? original_file_name { get; set; }

        public string? file_type { get; set; }

        public string? file_url { get; set; }

        public string? status { get; set; }

        public string? error_message { get; set; }

        public DateTime created_at { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        [ValidateNever]
        public Job? Jobs { get; set; }
    }
}
