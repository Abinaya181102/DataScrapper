using Xunit;
using Microsoft.AspNetCore.Mvc;
using DataScrapper.Backend.Controllers;
using DataScrapper.Backend.Models;
using DataScrapper.Tests.Helpers;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace DataScrapper.Tests.Controllers
{
    public class MappingControllerTests
    {
        private MappingController CreateController(AppDbContext context)
        {
            return new MappingController(context);
        }

        // -----------------------------
        // GET: GetMappings
        // -----------------------------
        [Fact]
        public async Task GetMappings_ShouldReturnMappingsForUser()
        {
            var context = TestDbContextFactory.Create();
            context.Mappings.AddRange(
                new Mapping { MappingId = 1, UserId = 1, MappingName = "A", Description = "Desc A", ConfigJson = "{}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
                new Mapping { MappingId = 2, UserId = 1, MappingName = "B", Description = "Desc B", ConfigJson = "{}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
                new Mapping { MappingId = 3, UserId = 2, MappingName = "C", Description = "Desc C", ConfigJson = "{}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now }
            );
            await context.SaveChangesAsync();

            var controller = CreateController(context);

            var result = await controller.GetMappings(1);
            var ok = Assert.IsType<OkObjectResult>(result);
            var mappings = Assert.IsAssignableFrom<List<Mapping>>(ok.Value);

            Assert.Equal(2, mappings.Count);
            Assert.All(mappings, m => Assert.Equal(1, m.UserId));
        }


        [Fact]
        public async Task GetMappings_ShouldReturnEmptyList_WhenNoMappings()
        {
            var context = TestDbContextFactory.Create();
            var controller = CreateController(context);

            var result = await controller.GetMappings(99);
            var ok = Assert.IsType<OkObjectResult>(result);
            var mappings = Assert.IsAssignableFrom<List<Mapping>>(ok.Value);

            Assert.Empty(mappings);
        }

        // -----------------------------
        // POST: CreateMapping
        // -----------------------------
        [Fact]
        public async Task CreateMapping_ShouldAddMapping()
        {
            var context = TestDbContextFactory.Create();
            var controller = CreateController(context);

            var mapping = new Mapping
            {
                UserId = 1,
                MappingName = "Test Mapping",
                Description = "Test Description",
                ConfigJson = "{}"
            };

            var result = await controller.CreateMapping(mapping);

            var ok = Assert.IsType<OkObjectResult>(result);
            var value = ok.Value.GetType().GetProperty("MappingId").GetValue(ok.Value);

            Assert.Equal(1, await context.Mappings.CountAsync());
            Assert.Equal(mapping.MappingId, value);
        }

        // -----------------------------
        // PUT: UpdateMapping
        // -----------------------------
        [Fact]
        public async Task UpdateMapping_ShouldUpdate_WhenValid()
        {
            var context = TestDbContextFactory.Create();
            context.Mappings.Add(new Mapping
            {
                MappingId = 1,
                UserId = 1,
                MappingName = "Old Name",
                Description = "Old Desc",
                ConfigJson = "{}"
            });
            await context.SaveChangesAsync();

            var controller = CreateController(context);
            var updated = new Mapping
            {
                MappingName = "New Name",
                Description = "New Desc",
                ConfigJson = "{\"key\": \"value\"}"
            };

            var result = await controller.UpdateMapping(1, updated, 1);
            var ok = Assert.IsType<OkObjectResult>(result);

            var mapping = await context.Mappings.FirstAsync();
            Assert.Equal("New Name", mapping.MappingName);
            Assert.Equal("New Desc", mapping.Description);
            Assert.Equal("{\"key\": \"value\"}", mapping.ConfigJson);
        }

        [Fact]
        public async Task UpdateMapping_ShouldReturnNotFound_WhenMappingDoesNotExist()
        {
            var context = TestDbContextFactory.Create();
            var controller = CreateController(context);

            var updated = new Mapping { MappingName = "X" };

            var result = await controller.UpdateMapping(99, updated, 1);
            var notFound = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Mapping not found.", notFound.Value);
        }

        [Fact]
        public async Task UpdateMapping_ShouldReturnUnauthorized_WhenUserDoesNotOwnMapping()
        {
            var context = TestDbContextFactory.Create();
            context.Mappings.Add(new Mapping
            {
                MappingId = 1,
                UserId = 2,
                MappingName = "Other User",
                Description = "Desc",
                ConfigJson = "{}"
            });
            await context.SaveChangesAsync();

            var controller = CreateController(context);
            var updated = new Mapping { MappingName = "X" };

            var result = await controller.UpdateMapping(1, updated, 1);
            var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal("You cannot update another user’s mapping.", unauthorized.Value);
        }
    }
}
