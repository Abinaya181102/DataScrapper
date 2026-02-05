//using Xunit;
//using Microsoft.AspNetCore.Mvc;
//using DataScrapper.Backend.Controllers;
//using DataScrapper.Backend.Models;
//using DataScrapper.Tests.Helpers;
//using Microsoft.EntityFrameworkCore;
//using System.Collections.Generic;
//using System.Threading.Tasks;
//using System.Linq;
//using System;

//namespace DataScrapper.Tests.Controllers
//{
//    public class JobsControllerTests
//    {
//        private JobsController CreateController(AppDbContext context)
//        {
//            return new JobsController(context);
//        }


//        // -----------------------------
//        // GET: GetJob by ID
//        // -----------------------------


//        [Fact]
//        public async Task GetJob_ShouldReturnNotFound_WhenDoesNotExist()
//        {
//            var context = TestDbContextFactory.Create();
//            var controller = CreateController(context);

//            var result = await controller.GetJob(99);
//            Assert.IsType<NotFoundResult>(result.Result);
//        }

//        // -----------------------------
//        // GET: GetJobsByUserId

//        [Fact]
//        public async Task GetJobsByUserId_ShouldReturnNotFound_WhenNoJobs()
//        {
//            var context = TestDbContextFactory.Create();
//            var controller = CreateController(context);

//            var result = await controller.GetJobsByUserId(99);
//            var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
//            Assert.Equal("No jobs found for this user", notFound.Value);
//        }

//        // -----------------------------
//        // POST: CreateJob
//        // -----------------------------
//        [Fact]
//        public async Task CreateJob_ShouldAddJob()
//        {
//            var context = TestDbContextFactory.Create();
//            var controller = CreateController(context);

//            var job = new Job { user_id = 1 };

//            var result = await controller.CreateJob(job);
//            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
//            var createdJob = Assert.IsType<Job>(created.Value);

//            Assert.Equal("pending", createdJob.status);
//            Assert.Equal(1, await context.Jobs.CountAsync());
//        }


//        [Fact]
//        public async Task UpdateJob_ShouldReturnBadRequest_WhenIdMismatch()
//        {
//            var context = TestDbContextFactory.Create();
//            var controller = CreateController(context);

//            var updatedJob = new Job { job_id = 2, status = "completed" };
//            var result = await controller.UpdateJob(1, updatedJob);

//            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
//            Assert.Equal("Job ID mismatch.", badRequest.Value);
//        }

//        [Fact]
//        public async Task UpdateJob_ShouldReturnNotFound_WhenJobDoesNotExist()
//        {
//            var context = TestDbContextFactory.Create();
//            var controller = CreateController(context);

//            var updatedJob = new Job { job_id = 99, status = "completed" };
//            var result = await controller.UpdateJob(99, updatedJob);

//            Assert.IsType<NotFoundResult>(result);
//        }
//    }
//}

using DataScrapper.Backend.Controllers;
using DataScrapper.Backend.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace DataScrapper.Tests.Controllers
{
    public class JobsControllerTests
    {
        private readonly AppDbContext _context;
        private readonly JobsController _controller;

        public JobsControllerTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _controller = new JobsController(_context);

            SeedDatabase();
        }

        private void SeedDatabase()
        {
            _context.Jobs.AddRange(
                new Job { job_id = 1, user_id = 10, status = "pending" },
                new Job { job_id = 2, user_id = 10, status = "completed" },
                new Job { job_id = 3, user_id = 20, status = "pending" }
            );

            _context.SaveChanges();
        }

        // ---------------- GET ----------------


        [Fact]
        public async Task GetJob_ById_NotFound()
        {
            var result = await _controller.GetJob(long.MaxValue);

            result.Result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task GetJobsByUserId_NotFound()
        {
            var result = await _controller.GetJobsByUserId(long.MaxValue);

            var notFound = result.Result.Should().BeOfType<NotFoundObjectResult>().Subject;
            notFound.Value!.ToString().Should().Contain("No jobs found");
        }

        // ---------------- POST ----------------

        [Fact]
        public async Task CreateJob_SetsDefaultValues()
        {
            var job = new Job { user_id = 99 };

            var result = await _controller.CreateJob(job);

            var created = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
            var createdJob = created.Value.Should().BeOfType<Job>().Subject;

            createdJob.status.Should().Be("pending");
            createdJob.created_at.Should().BeCloseTo(DateTime.Now, TimeSpan.FromSeconds(5));
        }

        [Fact]
        public async Task CreateJob_PreservesProvidedValues()
        {
            var job = new Job { user_id = 50, status = "running" };

            var result = await _controller.CreateJob(job);

            var created = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
            var createdJob = created.Value.Should().BeOfType<Job>().Subject;

            createdJob.status.Should().Be(job.status);
        }

        // ---------------- PUT ----------------

        [Fact]
        public async Task UpdateJob_Success()
        {
            var existingJob = _context.Jobs.First();

            var update = new Job
            {
                job_id = existingJob.job_id,
                status = "completed",
                uploaded_file_count = 5
            };

            var result = await _controller.UpdateJob(existingJob.job_id, update);

            result.Should().BeOfType<NoContentResult>();

            var updatedJob = await _context.Jobs.FindAsync(existingJob.job_id);
            updatedJob.Should().NotBeNull();
            updatedJob!.status.Should().Be(update.status);
            updatedJob.uploaded_file_count.Should().Be(update.uploaded_file_count);
        }

        [Fact]
        public async Task UpdateJob_IdMismatch_ReturnsBadRequest()
        {
            var update = new Job { job_id = 999 };

            var result = await _controller.UpdateJob(1, update);

            var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequest.Value!.ToString().Should().Contain("Job ID mismatch");
        }

        [Fact]
        public async Task UpdateJob_NotFound()
        {
            var update = new Job { job_id = long.MaxValue };

            var result = await _controller.UpdateJob(update.job_id, update);

            result.Should().BeOfType<NotFoundResult>();
        }


        // ---------------- EDGE CASES ----------------

        [Fact]
        public async Task UpdateJob_NoChanges_DoesNotThrow()
        {
            var existingJob = _context.Jobs.First();

            var update = new Job { job_id = existingJob.job_id };

            Func<Task> act = async () => await _controller.UpdateJob(existingJob.job_id, update);

            await act.Should().NotThrowAsync();
        }

        [Fact]
        public async Task GetJobs_WhenNoneExist_ReturnsEmptyList()
        {
            var emptyController = new JobsController(
                new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
                    .UseInMemoryDatabase(Guid.NewGuid().ToString())
                    .Options));

            var result = await emptyController.GetJobs();

            result.Value.Should().BeEmpty();
        }
    }
}
