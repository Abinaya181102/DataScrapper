using Microsoft.EntityFrameworkCore;

namespace DataScrapper.Backend.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Mapping> Mappings { get; set; }
        public DbSet<Job> Jobs { get; set; }
        public DbSet<JobFile> JobFiles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // JobFile → Job
            modelBuilder.Entity<JobFile>()
                .HasKey(jf => jf.file_id);

            modelBuilder.Entity<JobFile>()
                .HasOne(jf => jf.Jobs)
                .WithMany(j => j.JobFiles)
                .HasForeignKey(jf => jf.job_id)
                .OnDelete(DeleteBehavior.Cascade);

            // Job → User
            modelBuilder.Entity<Job>()
                .HasOne(j => j.Users)
                .WithMany(u => u.Jobs)  // NOW THIS EXISTS
                .HasForeignKey(j => j.user_id)
                .OnDelete(DeleteBehavior.Restrict);

            // Job → Mapping
            modelBuilder.Entity<Job>()
                .HasOne(j => j.Mappings)
                .WithMany(m => m.Jobs)  // NOW THIS EXISTS
                .HasForeignKey(j => j.mapping_id)
                .OnDelete(DeleteBehavior.Restrict);
        }


    }
}
