using Xunit;
using Microsoft.AspNetCore.Mvc;
using DataScrapper.Backend.Controllers;
using DataScrapper.Backend.Models;
using DataScrapper.Tests.Helpers;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System;

namespace DataScrapper.Tests.Controllers
{
    public class JobsControllerTests
    {
        private JobsController CreateController(AppDbContext context)
        {
            return new JobsController(context);
        }


        // -----------------------------
        // GET: GetJob by ID
        // -----------------------------


        [Fact]
        public async Task GetJob_ShouldReturnNotFound_WhenDoesNotExist()
        {
            var context = TestDbContextFactory.Create();
            var controller = CreateController(context);

            var result = await controller.GetJob(99);
            Assert.IsType<NotFoundResult>(result.Result);
        }

        // -----------------------------
        // GET: GetJobsByUserId

        [Fact]
        public async Task GetJobsByUserId_ShouldReturnNotFound_WhenNoJobs()
        {
            var context = TestDbContextFactory.Create();
            var controller = CreateController(context);

            var result = await controller.GetJobsByUserId(99);
            var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal("No jobs found for this user", notFound.Value);
        }

        // -----------------------------
        // POST: CreateJob
        // -----------------------------
        [Fact]
        public async Task CreateJob_ShouldAddJob()
        {
            var context = TestDbContextFactory.Create();
            var controller = CreateController(context);

            var job = new Job { user_id = 1 };

            var result = await controller.CreateJob(job);
            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var createdJob = Assert.IsType<Job>(created.Value);

            Assert.Equal("pending", createdJob.status);
            Assert.Equal(1, await context.Jobs.CountAsync());
        }


        [Fact]
        public async Task UpdateJob_ShouldReturnBadRequest_WhenIdMismatch()
        {
            var context = TestDbContextFactory.Create();
            var controller = CreateController(context);

            var updatedJob = new Job { job_id = 2, status = "completed" };
            var result = await controller.UpdateJob(1, updatedJob);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Job ID mismatch.", badRequest.Value);
        }

        [Fact]
        public async Task UpdateJob_ShouldReturnNotFound_WhenJobDoesNotExist()
        {
            var context = TestDbContextFactory.Create();
            var controller = CreateController(context);

            var updatedJob = new Job { job_id = 99, status = "completed" };
            var result = await controller.UpdateJob(99, updatedJob);

            Assert.IsType<NotFoundResult>(result);
        }
    }
}
