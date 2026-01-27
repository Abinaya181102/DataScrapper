using Xunit;
using Microsoft.AspNetCore.Mvc;
using DataScrapper.Backend.Controllers;
using DataScrapper.Backend.Models;
using DataScrapper.Tests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace DataScrapper.Tests.Controllers
{
    public class UserControllerTests
    {
        private UserController CreateController(AppDbContext context)
        {
            return new UserController(context);
        }

        // -----------------------------
        // SIGNUP TEST CASES
        // -----------------------------

        [Fact]
        public async Task Signup_ShouldCreateUser_WhenValid()
        {
            var context = TestDbContextFactory.Create();
            var controller = CreateController(context);

            var user = new User
            {
                email = "test@mail.com",
                password_hash = "123456",
                user_name = "Test User"
            };

            var result = await controller.Signup(user);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(1, await context.Users.CountAsync());
        }

        [Fact]
        public async Task Signup_ShouldFail_WhenEmailIsMissing()
        {
            var context = TestDbContextFactory.Create();
            var controller = CreateController(context);

            var user = new User
            {
                email = "",
                password_hash = "123456"
            };

            var result = await controller.Signup(user);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Email and Password are required.", badRequest.Value);
        }

        [Fact]
        public async Task Signup_ShouldFail_WhenPasswordIsMissing()
        {
            var context = TestDbContextFactory.Create();
            var controller = CreateController(context);

            var user = new User
            {
                email = "test@mail.com",
                password_hash = ""
            };

            var result = await controller.Signup(user);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Email and Password are required.", badRequest.Value);
        }

        //[Fact]
        //public async Task Signup_ShouldFail_WhenUserAlreadyExists()
        //{
        //    var context = TestDbContextFactory.Create();
        //    context.Users.Add(new User
        //    {
        //        email = "test@mail.com",
        //        password_hash = "123456"
        //    });
        //    await context.SaveChangesAsync();

        //    var controller = CreateController(context);

        //    var user = new User
        //    {
        //        email = "test@mail.com",
        //        password_hash = "123456"
        //    };

        //    var result = await controller.Signup(user);

        //    var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        //    Assert.Equal("User already exists.", badRequest.Value);
        //}

        // -----------------------------
        // LOGIN TEST CASES
        // -----------------------------

        [Fact]
        public async Task Login_ShouldReturnUser_WhenCredentialsAreValid()
        {
            var context = TestDbContextFactory.Create();
            context.Users.Add(new User
            {
                email = "login@mail.com",
                password_hash = "123456",
                user_name = "Login"
            });
            await context.SaveChangesAsync();

            var controller = CreateController(context);

            var login = new Login
            {
                email = "login@mail.com",
                password_hash = "123456"
            };

            var result = await controller.Login(login);

            var ok = Assert.IsType<OkObjectResult>(result);

            var user = ok.Value
                .GetType()
                .GetProperty("user_name")
                ?.GetValue(ok.Value)
                ?.ToString();

            Assert.Equal("Login", user);

        }

        //[Fact]
        //public async Task Login_ShouldFail_WhenPasswordIsWrong()
        //{
        //    var context = TestDbContextFactory.Create();
        //    context.Users.Add(new User
        //    {
        //        email = "login@mail.com",
        //        password_hash = "123456"
        //    });
        //    await context.SaveChangesAsync();

        //    var controller = CreateController(context);

        //    var login = new Login
        //    {
        //        email = "login@mail.com",
        //        password_hash = "wrong"
        //    };

        //    var result = await controller.Login(login);

        //    var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
        //    Assert.Equal("Invalid email or password.", unauthorized.Value);
        //}

        [Fact]
        public async Task Login_ShouldFail_WhenUserDoesNotExist()
        {
            var context = TestDbContextFactory.Create();
            var controller = CreateController(context);

            var login = new Login
            {
                email = "nouser@mail.com",
                password_hash = "123456"
            };

            var result = await controller.Login(login);

            var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal("Invalid email or password.", unauthorized.Value);
        }

        [Fact]
        public async Task Login_ShouldFail_WhenLoginPayloadIsEmpty()
        {
            var context = TestDbContextFactory.Create();
            var controller = CreateController(context);

            var login = new Login
            {
                email = "",
                password_hash = ""
            };

            var result = await controller.Login(login);

            var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal("Invalid email or password.", unauthorized.Value);
        }
    }
}
