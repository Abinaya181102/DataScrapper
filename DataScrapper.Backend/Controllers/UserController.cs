using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DataScrapper.Backend.Models;

namespace DataScrapper.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        // -----------------------------
        // POST: api/user/signup
        // -----------------------------
        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] User user)
        {
            if (string.IsNullOrWhiteSpace(user.email) || string.IsNullOrWhiteSpace(user.password_hash))
                return BadRequest("Email and Password are required.");

            bool exists = await _context.Users.AnyAsync(u => u.email == user.email);
            if (exists)
                return BadRequest("User already exists.");

            user.created_at = DateTime.Now;

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User created successfully", user.user_id });
        }

        // -----------------------------
        // POST: api/user/login
        // -----------------------------
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] Login login)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.email == login.email && u.password_hash == login.password_hash);

            if (user == null)
                return Unauthorized("Invalid email or password.");

            return Ok(new
            {
                user.user_id,
                user.user_name,
                user.email
            });
        }
    }
}
