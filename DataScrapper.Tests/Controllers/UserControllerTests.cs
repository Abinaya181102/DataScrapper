//using Xunit;
//using Microsoft.AspNetCore.Mvc;
//using DataScrapper.Backend.Controllers;
//using DataScrapper.Backend.Models;
//using DataScrapper.Tests.Helpers;
//using Microsoft.EntityFrameworkCore;

//namespace DataScrapper.Tests.Controllers
//{
//    public class UserControllerTests
//    {
//        private UserController CreateController(AppDbContext context)
//        {
//            return new UserController(context);
//        }

//        // -----------------------------
//        // SIGNUP TEST CASES
//        // -----------------------------

//        [Fact]
//        public async Task Signup_ShouldCreateUser_WhenValid()
//        {
//            var context = TestDbContextFactory.Create();
//            var controller = CreateController(context);

//            var user = new User
//            {
//                email = "test@mail.com",
//                password_hash = "123456",
//                user_name = "Test User"
//            };

//            var result = await controller.Signup(user);

//            var ok = Assert.IsType<OkObjectResult>(result);
//            Assert.Equal(1, await context.Users.CountAsync());
//        }

//        [Fact]
//        public async Task Signup_ShouldFail_WhenEmailIsMissing()
//        {
//            var context = TestDbContextFactory.Create();
//            var controller = CreateController(context);

//            var user = new User
//            {
//                email = "",
//                password_hash = "123456"
//            };

//            var result = await controller.Signup(user);

//            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
//            Assert.Equal("Email and Password are required.", badRequest.Value);
//        }

//        [Fact]
//        public async Task Signup_ShouldFail_WhenPasswordIsMissing()
//        {
//            var context = TestDbContextFactory.Create();
//            var controller = CreateController(context);

//            var user = new User
//            {
//                email = "test@mail.com",
//                password_hash = ""
//            };

//            var result = await controller.Signup(user);

//            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
//            Assert.Equal("Email and Password are required.", badRequest.Value);
//        }

//        //[Fact]
//        //public async Task Signup_ShouldFail_WhenUserAlreadyExists()
//        //{
//        //    var context = TestDbContextFactory.Create();
//        //    context.Users.Add(new User
//        //    {
//        //        email = "test@mail.com",
//        //        password_hash = "123456"
//        //    });
//        //    await context.SaveChangesAsync();

//        //    var controller = CreateController(context);

//        //    var user = new User
//        //    {
//        //        email = "test@mail.com",
//        //        password_hash = "123456"
//        //    };

//        //    var result = await controller.Signup(user);

//        //    var badRequest = Assert.IsType<BadRequestObjectResult>(result);
//        //    Assert.Equal("User already exists.", badRequest.Value);
//        //}

//        // -----------------------------
//        // LOGIN TEST CASES
//        // -----------------------------

//        [Fact]
//        public async Task Login_ShouldReturnUser_WhenCredentialsAreValid()
//        {
//            var context = TestDbContextFactory.Create();
//            context.Users.Add(new User
//            {
//                email = "login@mail.com",
//                password_hash = "123456",
//                user_name = "Login"
//            });
//            await context.SaveChangesAsync();

//            var controller = CreateController(context);

//            var login = new Login
//            {
//                email = "login@mail.com",
//                password_hash = "123456"
//            };

//            var result = await controller.Login(login);

//            var ok = Assert.IsType<OkObjectResult>(result);

//            var user = ok.Value
//                .GetType()
//                .GetProperty("user_name")
//                ?.GetValue(ok.Value)
//                ?.ToString();

//            Assert.Equal("Login", user);

//        }

//        [Fact]
//        public async Task Login_ShouldFail_WhenUserDoesNotExist()
//        {
//            var context = TestDbContextFactory.Create();
//            var controller = CreateController(context);

//            var login = new Login
//            {
//                email = "nouser@mail.com",
//                password_hash = "123456"
//            };

//            var result = await controller.Login(login);

//            var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
//            Assert.Equal("Invalid email or password.", unauthorized.Value);
//        }

//        [Fact]
//        public async Task Login_ShouldFail_WhenLoginPayloadIsEmpty()
//        {
//            var context = TestDbContextFactory.Create();
//            var controller = CreateController(context);

//            var login = new Login
//            {
//                email = "",
//                password_hash = ""
//            };

//            var result = await controller.Login(login);

//            var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
//            Assert.Equal("Invalid email or password.", unauthorized.Value);
//        }
//    }
//}

using DataScrapper.Backend.Controllers;
using DataScrapper.Backend.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace DataScrapper.Tests.Controllers
{
    public class UserControllerTests
    {
        private readonly AppDbContext _context;
        private readonly UserController _controller;

        public UserControllerTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _controller = new UserController(_context);

            SeedUsers();
        }

        private void SeedUsers()
        {
            // Seed a test user with a known password
            var plainPassword = "password123";
            _context.Users.Add(new User
            {
                user_name = "Existing User",
                email = "existing@test.com",
                password_hash = BCrypt.Net.BCrypt.HashPassword(plainPassword),
                created_at = DateTime.UtcNow
            });

            _context.SaveChanges();
        }

        // ---------------- SIGNUP ----------------

        [Fact]
        public async Task Signup_MissingEmail_ReturnsBadRequest()
        {
            var user = new User
            {
                password_hash = "password"
            };

            var result = await _controller.Signup(user);

            var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequest.Value.Should().Be("Email and Password are required.");
        }

        [Fact]
        public async Task Signup_MissingPassword_ReturnsBadRequest()
        {
            var user = new User
            {
                email = "test@test.com"
            };

            var result = await _controller.Signup(user);

            var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequest.Value.Should().Be("Email and Password are required.");
        }

        [Fact]
        public async Task Signup_UserAlreadyExists_ReturnsBadRequest()
        {
            var user = new User
            {
                email = _context.Users.First().email,
                password_hash = "password123"
            };

            var result = await _controller.Signup(user);

            var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequest.Value.Should().Be("User already exists.");
        }

        [Fact]
        public async Task Signup_ValidUser_CreatesUserSuccessfully()
        {
            var beforeCall = DateTime.UtcNow;

            var user = new User
            {
                user_name = "New User",
                email = "newuser@test.com",
                password_hash = "12345678"
            };

            var result = await _controller.Signup(user);

            var afterCall = DateTime.UtcNow;

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().NotBeNull();

            _context.Users.Should().Contain(u => u.email == user.email);

            var createdUser = _context.Users.Single(u => u.email == user.email);

            createdUser.created_at.Should()
                .BeOnOrAfter(beforeCall)
                .And.BeOnOrBefore(afterCall);
        }

        [Fact]
        public async Task Signup_DuplicateEmailDifferentName_ReturnsBadRequest()
        {
            var user = new User
            {
                user_name = "Another Name",
                email = _context.Users.First().email,
                password_hash = "password123"
            };

            var result = await _controller.Signup(user);

            var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequest.Value.Should().Be("User already exists.");
        }

        [Fact]
        public async Task Signup_DbException_ReturnsInternalServerError()
        {
            var user = new User
            {
                user_name = "TestUser",
                email = "dbexception@test.com",
                password_hash = "password123"
            };

            // Simulate DB exception
            _context.Dispose();

            var result = await _controller.Signup(user);

            result.Should().BeOfType<ObjectResult>()
                .Which.StatusCode.Should().Be(500);
        }

        // ---------------- LOGIN ----------------

        [Fact]
        public async Task Login_InvalidCredentials_ReturnsUnauthorized()
        {
            var login = new Login
            {
                email = "wrong@test.com",
                password = "wrongpassword"
            };

            var result = await _controller.Login(login);

            var unauthorized = result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
            unauthorized.Value.Should().Be("Invalid email or password.");
        }

        [Fact]
        public async Task Login_ValidCredentials_ReturnsUserDetails()
        {
            var existingUser = _context.Users.First();
            var plainPassword = "password123";

            var login = new Login
            {
                email = existingUser.email,
                password = plainPassword
            };

            var result = await _controller.Login(login);

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().NotBeNull();

            okResult.Value.Should().BeEquivalentTo(new
            {
                user_id = existingUser.user_id,
                user_name = existingUser.user_name,
                email = existingUser.email
            });
        }

        [Fact]
        public async Task Login_NullLogin_ReturnsBadRequest()
        {
            Login login = null;

            var result = await _controller.Login(login);

            var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequest.Value.Should().Be("Login data is required.");
        }

        [Fact]
        public async Task Login_MissingEmailOrPassword_ReturnsBadRequest()
        {
            var login = new Login
            {
                email = "",
                password = ""
            };

            var result = await _controller.Login(login);

            var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequest.Value.Should().Be("Email and Password are required.");
        }
    }
}
