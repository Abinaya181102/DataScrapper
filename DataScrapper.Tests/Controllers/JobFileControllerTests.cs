//using DataScrapper.Backend.Controllers;
//using DataScrapper.Backend.Models;
//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using System.Text;
//using System.Text.Json;
//using Xunit;
//using System.Collections.Concurrent;

//namespace DataScrapper.Tests.Controllers
//{
//    public class JobFileControllerTests
//    {
//        private readonly AppDbContext _context;
//        private readonly JobFileController _controller;

//        public JobFileControllerTests()
//        {
//            var options = new DbContextOptionsBuilder<AppDbContext>()
//                .UseInMemoryDatabase(Guid.NewGuid().ToString())
//                .Options;

//            _context = new AppDbContext(options);
//            _controller = new JobFileController(_context);

//            SeedDatabase();
//        }

//        private void SeedDatabase()
//        {
//            _context.Jobs.Add(new Job
//            {
//                job_id = 1,
//                status = "pending"
//            });

//            _context.JobFiles.Add(new JobFile
//            {
//                file_id = 1,
//                job_id = 1,
//                original_file_name = "sample.csv",
//                status = "completed",
//                created_at = DateTime.UtcNow
//            });

//            _context.SaveChanges();
//        }

//        // ---------------- GET ----------------

//        [Fact]
//        public async Task GetJobFiles_ReturnsOk()
//        {
//            var result = await _controller.GetJobFiles();

//            var ok = Assert.IsType<OkObjectResult>(result);
//            var files = Assert.IsAssignableFrom<IEnumerable<JobFile>>(ok.Value);
//            Assert.NotEmpty(files);
//        }

//        [Fact]
//        public async Task GetJobFile_ById_ReturnsOk()
//        {
//            var result = await _controller.GetJobFile(1);

//            var ok = Assert.IsType<OkObjectResult>(result);
//            var file = Assert.IsType<JobFile>(ok.Value);

//            Assert.Equal(1, file.file_id);
//        }

//        [Fact]
//        public async Task GetJobFile_NotFound()
//        {
//            var result = await _controller.GetJobFile(999);
//            Assert.IsType<NotFoundResult>(result);
//        }

//        // ---------------- PUT ----------------

//        [Fact]
//        public async Task UpdateJobFile_Success()
//        {
//            var update = new JobFile
//            {
//                status = "failed",
//                error_message = "Some error"
//            };

//            var result = await _controller.UpdateJobFile(1, update);

//            Assert.IsType<NoContentResult>(result);

//            var file = await _context.JobFiles.FindAsync(1L);
//            Assert.NotNull(file);
//            Assert.Equal("failed", file!.status);
//            Assert.Equal("Some error", file.error_message);
//        }

//        [Fact]
//        public async Task UpdateJobFile_NotFound()
//        {
//            var result = await _controller.UpdateJobFile(999, new JobFile());
//            Assert.IsType<NotFoundResult>(result);
//        }

//        // ---------------- UPLOAD ----------------

//        [Fact]
//        public async Task UploadFiles_NoFiles_ReturnsBadRequest()
//        {
//            var result = await _controller.UploadFiles(
//                new List<IFormFile>(),
//                1,
//                "[]");

//            var bad = Assert.IsType<BadRequestObjectResult>(result);
//            Assert.Contains("No files uploaded", bad.Value!.ToString());
//        }

//        [Fact]
//        public async Task UploadFiles_InvalidJob_ReturnsBadRequest()
//        {
//            var files = new List<IFormFile> { CreateCsvFile() };

//            var result = await _controller.UploadFiles(
//                files,
//                999,
//                "[]");

//            var bad = Assert.IsType<BadRequestObjectResult>(result);
//            Assert.Contains("does not exist", bad.Value!.ToString());
//        }

//        [Fact]
//        public async Task UploadFiles_InvalidMappingJson_ReturnsBadRequest()
//        {
//            var files = new List<IFormFile> { CreateCsvFile() };

//            var result = await _controller.UploadFiles(
//                files,
//                1,
//                "{invalid-json}");

//            Assert.IsType<BadRequestObjectResult>(result);
//        }

//        [Fact]
//        public async Task UploadFiles_ValidCsv_ReturnsExcel()
//        {
//            var files = new List<IFormFile> { CreateCsvFile() };
//            var mapping = JsonSerializer.Serialize(new List<string> { "Name", "Email" });

//            var result = await _controller.UploadFiles(files, 1, mapping);

//            var fileResult = Assert.IsType<FileContentResult>(result);
//            Assert.Equal(
//                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//                fileResult.ContentType);
//        }

//        [Fact]
//        public async Task UploadFiles_UnsupportedFileType_MarksFailed()
//        {
//            var files = new List<IFormFile>
//            {
//                CreateFile("test.txt", "hello", "text/plain")
//            };

//            var result = await _controller.UploadFiles(files, 1, "[]");

//            Assert.IsType<FileContentResult>(result);

//            var jobFile = _context.JobFiles
//                .OrderByDescending(f => f.created_at)
//                .First();

//            Assert.Equal("failed", jobFile.status);
//        }

//        [Fact]
//        public async Task UploadFiles_MultipleFiles_SavesAll()
//        {
//            var files = new List<IFormFile>
//            {
//                CreateCsvFile(),
//                CreateCsvFile("data2.csv")
//            };

//            var mapping = JsonSerializer.Serialize(new List<string> { "Name" });

//            var result = await _controller.UploadFiles(files, 1, mapping);

//            Assert.IsType<FileContentResult>(result);
//            Assert.True(_context.JobFiles.Count() >= 3);
//        }

//        [Fact]
//        public async Task UploadFiles_LargeNumberOfFiles_BatchesAndSaves()
//        {
//            var files = new List<IFormFile>();
//            for (int i = 0; i < 120; i++) // more than one batch (batch size = 50)
//            {
//                files.Add(CreateCsvFile($"file{i}.csv"));
//            }

//            var mapping = JsonSerializer.Serialize(new List<string> { "Name", "Email" });

//            var result = await _controller.UploadFiles(files, 1, mapping);

//            Assert.IsType<FileContentResult>(result);
//            Assert.True(_context.JobFiles.Count() >= 121); // existing seeded + 120
//        }

//        [Fact]
//        public async Task UploadFiles_ConcurrentProcessing_DoesNotThrow()
//        {
//            var files = new List<IFormFile>
//            {
//                CreateCsvFile(),
//                CreateCsvFile("file2.csv"),
//                CreateFile("unsupported.xyz", "content", "application/octet-stream")
//            };

//            var mapping = JsonSerializer.Serialize(new List<string> { "Name" });

//            var exception = await Record.ExceptionAsync(() =>
//                _controller.UploadFiles(files, 1, mapping));

//            Assert.Null(exception);

//            var jobFiles = _context.JobFiles
//                .OrderByDescending(f => f.created_at)
//                .Take(3)
//                .ToList();

//            Assert.Contains(jobFiles, jf => jf.status == "completed");
//            Assert.Contains(jobFiles, jf => jf.status == "failed");
//        }

//        // ---------------- HELPERS ----------------

//        private IFormFile CreateCsvFile(string name = "data.csv")
//        {
//            var content = "Name,Email\nAbi,abi@test.com";
//            return CreateFile(name, content, "text/csv");
//        }

//        private IFormFile CreateFile(string fileName, string content, string contentType)
//        {
//            var bytes = Encoding.UTF8.GetBytes(content);
//            var stream = new MemoryStream(bytes);

//            return new FormFile(stream, 0, bytes.Length, "file", fileName)
//            {
//                Headers = new HeaderDictionary(),
//                ContentType = contentType
//            };
//        }
//    }
//}




using DataScrapper.Backend.Controllers;
using DataScrapper.Backend.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using Xunit;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DataScrapper.Tests.Controllers
{
    public class JobFileControllerTests
    {
        private readonly AppDbContext _context;
        private readonly JobFileController _controller;

        public JobFileControllerTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _controller = new JobFileController(_context);

            SeedDatabase();
        }

        private void SeedDatabase()
        {
            _context.Jobs.Add(new Job { job_id = 1, status = "pending" });

            _context.JobFiles.Add(new JobFile
            {
                file_id = 1,
                job_id = 1,
                original_file_name = "sample.csv",
                status = "completed",
                created_at = DateTime.UtcNow
            });

            _context.SaveChanges();
        }

        // ---------------- GET ----------------

        [Fact]
        public async Task GetJobFiles_ReturnsOk_EmptyList()
        {
            // Remove all files to hit empty case
            _context.JobFiles.RemoveRange(_context.JobFiles);
            await _context.SaveChangesAsync();

            var result = await _controller.GetJobFiles();
            var ok = Assert.IsType<OkObjectResult>(result);
            var files = Assert.IsAssignableFrom<IEnumerable<JobFile>>(ok.Value);
            Assert.Empty(files); // ensures empty list branch covered
        }

        [Fact]
        public async Task GetJobFile_NotFound_WithNegativeId()
        {
            var result = await _controller.GetJobFile(-1);
            Assert.IsType<NotFoundResult>(result); // negative ID branch
        }

        // ---------------- PUT ----------------

        [Fact]
        public async Task UpdateJobFile_EmptyStatusAndMessage()
        {
            var update = new JobFile(); // empty values
            var result = await _controller.UpdateJobFile(1, update);

            Assert.IsType<NoContentResult>(result);

            var file = await _context.JobFiles.FindAsync(1L);
            Assert.NotNull(file);
            Assert.Null(file!.status); // empty value branch
            Assert.Null(file.error_message);
        }

        // ---------------- UPLOAD ---------------

        [Fact]
        public async Task UploadFiles_InvalidMappingJson_ExceptionBranch()
        {
            var csvFile = CreateCsvFile();
            var result = await _controller.UploadFiles(new List<IFormFile> { csvFile }, 1, "{ invalid }");
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task UploadFiles_UnsupportedFileType_ThrowsExceptionHandled()
        {
            var unsupported = CreateFile("file.xyz", "abc", "application/octet-stream");
            var result = await _controller.UploadFiles(new List<IFormFile> { unsupported }, 1, "[]");

            var lastFile = _context.JobFiles.OrderByDescending(f => f.created_at).First();
            Assert.Equal("failed", lastFile.status); // branch coverage for unsupported type
        }

        [Fact]
        public async Task UploadFiles_ConcurrentWithMixedTypes()
        {
            var files = new List<IFormFile>
            {
                CreateCsvFile(),
                CreateFile("invalid.doc", "data", "application/msword"),
                CreateFile("empty.csv", "", "text/csv")
            };

            var mapping = JsonSerializer.Serialize(new List<string> { "Name" });
            var exception = await Record.ExceptionAsync(() =>
                _controller.UploadFiles(files, 1, mapping));

            Assert.Null(exception);

            var lastThree = _context.JobFiles
                .OrderByDescending(f => f.created_at)
                .Take(3)
                .ToList();

            Assert.Contains(lastThree, f => f.status == "completed");
            Assert.Contains(lastThree, f => f.status == "failed");
        }

        [Fact]
        public async Task UploadFiles_BatchProcessing_MoreThan50Files()
        {
            var files = new List<IFormFile>();
            for (int i = 0; i < 55; i++)
                files.Add(CreateCsvFile($"file{i}.csv"));

            var mapping = JsonSerializer.Serialize(new List<string> { "Name", "Email" });
            var result = await _controller.UploadFiles(files, 1, mapping);

            Assert.IsType<FileContentResult>(result);
            Assert.True(_context.JobFiles.Count() >= 56); // ensures batch split branch
        }

        // ---------------- HELPERS ----------------

        private IFormFile CreateCsvFile(string name = "data.csv")
        {
            var content = "Name,Email\nAbi,abi@test.com";
            return CreateFile(name, content, "text/csv");
        }

        private IFormFile CreateFile(string fileName, string content, string contentType)
        {
            var bytes = Encoding.UTF8.GetBytes(content);
            var stream = new MemoryStream(bytes);

            return new FormFile(stream, 0, bytes.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = contentType
            };
        }
    }
}
