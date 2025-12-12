using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DataScrapper.Backend;
using DataScrapper.Backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace DataScrapper.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public JobsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Jobs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Job>>> GetJobs()
        {
            return await _context.Jobs
                .Include(j => j.JobFiles)
                .Include(j => j.Users)
                .Include(j => j.Mappings)
                .ToListAsync();
        }

        // GET: api/Jobs/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Job>> GetJob(long id)
        {
            var job = await _context.Jobs
                .Include(j => j.JobFiles)
                .Include(j => j.Users)
                .Include(j => j.Mappings)
                .FirstOrDefaultAsync(j => j.job_id == id);

            if (job == null)
            {
                return NotFound();
            }

            return job;
        }

        // POST: api/Jobs
        [HttpPost]
        public async Task<ActionResult<Job>> CreateJob([FromBody] Job job)
        {
            // Initialize default values
            job.status = job.status ?? "pending";
            job.created_at = job.created_at == default ? System.DateTime.Now : job.created_at;

            _context.Jobs.Add(job);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetJob), new { id = job.job_id }, job);
        }

        // PUT: api/Jobs/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJob(long id, [FromBody] Job updatedJob)
        {
            if (id != updatedJob.job_id)
            {
                return BadRequest("Job ID mismatch.");
            }

            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
            {
                return NotFound();
            }

            // Update fields
            job.status = updatedJob.status ?? job.status;
            job.output_file_url = updatedJob.output_file_url ?? job.output_file_url;
            job.uploaded_file_count = updatedJob.uploaded_file_count ?? job.uploaded_file_count;
            job.error_message = updatedJob.error_message ?? job.error_message;
            job.completed_at = updatedJob.completed_at ?? job.completed_at;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!JobExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        private bool JobExists(long id)
        {
            return _context.Jobs.Any(e => e.job_id == id);
        }
    }
}
