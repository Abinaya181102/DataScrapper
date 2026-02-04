using Microsoft.EntityFrameworkCore;
using DataScrapper.Backend.Models;
using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://+:80");


// ------------------------------
// Wait for SQL Server
// ------------------------------
var maxRetries = 10;
var delay = TimeSpan.FromSeconds(5);

for (int i = 0; i < maxRetries; i++)
{
    try
    {
        using var connection = new SqlConnection(
            builder.Configuration.GetConnectionString("DefaultConnection"));
        connection.Open();
        Console.WriteLine("SQL Server is ready!");
        break;
    }
    catch
    {
        Console.WriteLine($"Waiting for SQL Server... Attempt {i + 1}");
        Thread.Sleep(delay);
    }
}

// ------------------------------
// EF Core
// ------------------------------
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ------------------------------
// API services
// ------------------------------
builder.Services.AddControllers();

// ------------------------------
// CORS
// ------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

app.UseCors("AllowReactApp");

app.UseRouting();
app.UseAuthorization();


app.MapControllers();

app.Run();
