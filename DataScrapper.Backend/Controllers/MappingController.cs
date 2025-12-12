using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DataScrapper.Backend.Models;

namespace DataScrapper.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MappingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MappingController(AppDbContext context)
        {
            _context = context;
        }

        // ---------------------------------------------
        // GET: api/mappings?userId=1
        // ---------------------------------------------
        [HttpGet]
        public async Task<IActionResult> GetMappings(long userId)
        {
            var mappings = await _context.Mappings
                .Where(m => m.UserId == userId)
                .ToListAsync();

            return Ok(mappings);
        }

        // ---------------------------------------------
        // POST: api/mappings   (create new mapping)
        // ---------------------------------------------
        [HttpPost]
        public async Task<IActionResult> CreateMapping([FromBody] Mapping mapping)
        {
            mapping.CreatedAt = DateTime.Now;
            mapping.UpdatedAt = DateTime.Now;

            _context.Mappings.Add(mapping);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Mapping created successfully", mapping.MappingId });
        }

        // ---------------------------------------------
        // PUT: api/mappings/{id}  (update mapping)
        // ---------------------------------------------
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMapping(long id, [FromBody] Mapping updated, long userId)
        {
            var mapping = await _context.Mappings.FirstOrDefaultAsync(m => m.MappingId == id);

            if (mapping == null)
                return NotFound("Mapping not found.");

            // Check if mapping belongs to this user
            if (mapping.UserId != userId)
                return Unauthorized("You cannot update another user’s mapping.");

            mapping.MappingName = updated.MappingName;
            mapping.Description = updated.Description;
            mapping.ConfigJson = updated.ConfigJson;
            mapping.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Mapping updated successfully" });
        }
    }
}
