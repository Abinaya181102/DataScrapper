using Microsoft.EntityFrameworkCore;

namespace DataScrapper.Backend.Models
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Mapping> Mappings { get; set; }
        public DbSet<Job> Jobs { get; set; }
    }
}
