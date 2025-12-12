using Microsoft.EntityFrameworkCore;
using DataScrapper.Backend.Models;

var builder = WebApplication.CreateBuilder(args);

// Database connection
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add services
builder.Services.AddControllersWithViews();

// Allow CORS for frontend (React)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});


var app = builder.Build();

// Enable CORS
app.UseCors("AllowReactApp");

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles(); // needed to serve React build folder

app.UseRouting();

app.UseAuthorization();

// API routes
app.MapControllers();

// Fallback route for React
// Important: React handles its own routing (SPA)
app.MapFallbackToFile("index.html");

app.Run();

