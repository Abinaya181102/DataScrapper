using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DataScrapper.Backend.Models;
using BCrypt.Net;

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
            try
            {
                if (user == null || string.IsNullOrWhiteSpace(user.email) || string.IsNullOrWhiteSpace(user.password_hash))
                    return BadRequest("Email and Password are required.");

                bool exists = await _context.Users.AnyAsync(u => u.email == user.email);
                if (exists)
                    return BadRequest("User already exists.");

                // 🔐 Hash password
                user.password_hash = BCrypt.Net.BCrypt.HashPassword(user.password_hash);
                user.created_at = DateTime.UtcNow;

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Return created user info
                return Ok(new
                {
                    user.user_id,
                    user.user_name,
                    user.email
                });
            }
            catch
            {
                return StatusCode(500, "Internal server error");
            }
        }

        // -----------------------------
        // POST: api/user/login
        // -----------------------------
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] Login login)
        {
            if (login == null)
                return BadRequest("Login data is required.");

            if (string.IsNullOrWhiteSpace(login.email) || string.IsNullOrWhiteSpace(login.password))
                return BadRequest("Email and Password are required.");

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.email == login.email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(login.password, user.password_hash))
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
